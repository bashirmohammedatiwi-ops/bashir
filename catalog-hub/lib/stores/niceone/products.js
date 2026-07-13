import { cacheGet, cacheSet } from '../../core/cache.js';
import { findBarcodeIndexEntry, gtinEqual, upsertBarcodeIndex } from '../../core/barcode-index.js';
import {
  DEFAULT_TTL,
  DETAIL_TTL,
  LIST_TTL,
  barcodeFromImageUrl,
  categoryUrl,
  extractBarcode,
  fetchPageHtml,
  isValidEan,
  productIdFromRef,
  productUrl,
  searchUrl,
} from './client.js';
import { mapDetailProduct, mapListItem, toBarcodeHit } from './map.js';
import { parseItemListJsonLd, parseProductPage } from './parse.js';

function pageResult(items, { page, limit, total = 0 } = {}) {
  const safeTotal = total || items.length;
  return {
    items: items.slice(0, limit),
    page,
    pageSize: limit,
    total: safeTotal,
    hasMore: page * limit < safeTotal,
  };
}

function parsePrice(price = '') {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

async function fetchListingPage({ category = '', search = '', page = 1, lang = 'ar' } = {}) {
  const url = search
    ? searchUrl(search, { lang })
    : categoryUrl(category, { lang, page });
  const cacheKey = `niceone:list:${lang}:${category}:${search}:${page}`;
  const cached = cacheGet(cacheKey, LIST_TTL);
  if (cached) return cached;

  const html = await fetchPageHtml(url, { lang, ttl: LIST_TTL, cacheKey: `niceone:raw:${cacheKey}` });
  const { total, items } = parseItemListJsonLd(html);
  const out = {
    items: items.map((item) => mapListItem({
      ...item,
      nameAr: lang === 'ar' ? item.name : '',
      nameEn: lang === 'en' ? item.name : '',
      brandAr: lang === 'ar' ? item.brand : '',
      brandEn: lang === 'en' ? item.brand : '',
    })),
    total,
    page,
    pageSize: items.length || 30,
  };
  cacheSet(cacheKey, out, LIST_TTL);
  return out;
}

async function fetchListingMerged({ category = '', search = '', page = 1, limit = 30 } = {}) {
  const [arData, enData] = await Promise.all([
    fetchListingPage({ category, search, page, lang: 'ar' }),
    fetchListingPage({ category, search, page, lang: 'en' }).catch(() => ({ items: [], total: 0 })),
  ]);

  const enById = new Map(enData.items.map((item) => [String(item.id), item]));
  const merged = arData.items.map((item) => {
    const en = enById.get(String(item.id));
    return mapListItem({
      ...item,
      nameEn: en?.nameEn || en?.nameAr || item.nameEn || item.nameAr,
      brandEn: en?.brandEn || en?.brandAr || item.brandEn || item.brandAr,
      barcode: item.barcode || barcodeFromImageUrl(item.thumb || ''),
      productUrl: item.productUrl || productUrl(item.id),
    });
  });

  return pageResult(merged, {
    page,
    limit,
    total: Math.max(arData.total, enData.total, merged.length),
  });
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const category = String(categoryId || '').trim();
  if (!category || category === 'root') {
    return fetchListingMerged({ page, limit });
  }
  return fetchListingMerged({ category, page, limit });
}

export async function searchProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return pageResult([], { page, limit, total: 0 });
  return fetchListingMerged({ search: q, page, limit });
}

function rememberBarcodes(detail) {
  if (detail?.barcode) {
    upsertBarcodeIndex(detail.barcode, {
      store: 'niceone',
      productId: detail.id,
      brand: detail.brandAr || detail.brandEn || '',
    });
  }
  for (const shade of detail?.shades || []) {
    if (!shade.barcode) continue;
    upsertBarcodeIndex(shade.barcode, {
      store: 'niceone',
      productId: detail.id,
      brand: detail.brandAr || detail.brandEn || '',
      shadeName: shade.nameAr || shade.nameEn || '',
    });
  }
}

async function loadDetailBilingual(idOrSlug, { light = false } = {}) {
  const productId = productIdFromRef(idOrSlug);
  const slug = String(idOrSlug).includes('/') || String(idOrSlug).includes('-n')
    ? String(idOrSlug).replace(/^\/(ar|en)\//, '')
    : '';

  const arPath = slug || `product-n${productId}`;
  const [arHtml, enHtml] = await Promise.all([
    fetchPageHtml(arPath, { lang: 'ar', ttl: DETAIL_TTL, cacheKey: `niceone:detail:ar:${productId}` }),
    light
      ? Promise.resolve('')
      : fetchPageHtml(arPath, { lang: 'en', ttl: DETAIL_TTL, cacheKey: `niceone:detail:en:${productId}` }).catch(() => ''),
  ]);

  const ar = parseProductPage(arHtml, { lang: 'ar', productId });
  const en = enHtml ? parseProductPage(enHtml, { lang: 'en', productId }) : null;
  if (!ar && !en) return null;

  const shades = (ar?.shades || []).map((shade, index) => {
    const enShade = en?.shades?.[index];
    return {
      ...shade,
      nameEn: enShade?.nameEn || enShade?.nameAr || shade.nameEn || shade.nameAr,
      optionGroupEn: enShade?.optionGroupEn || enShade?.optionGroupAr || shade.optionGroupEn || shade.optionGroupAr,
    };
  });

  const images = [...new Set([...(ar?.images || []), ...(en?.images || [])])];
  const detail = mapDetailProduct({
    id: ar?.id || en?.id || productId,
    slug: ar?.slug || en?.slug || slug,
    nameAr: ar?.nameAr || en?.nameAr || '',
    nameEn: en?.nameEn || ar?.nameEn || '',
    brandAr: ar?.brandAr || en?.brandAr || '',
    brandEn: en?.brandEn || ar?.brandEn || '',
    descriptionAr: ar?.descriptionAr || '',
    descriptionEn: en?.descriptionEn || '',
    sku: ar?.sku || en?.sku || '',
    barcode: extractBarcode(ar?.barcode || en?.barcode || ''),
    thumb: images[0] || ar?.thumb || en?.thumb || '',
    images,
    price: ar?.price || en?.price || '',
    inStock: ar?.inStock ?? en?.inStock ?? true,
    hasOptions: (ar?.hasOptions || en?.hasOptions || shades.length > 0),
    shades,
    shadeCount: shades.length,
    rating: ar?.rating || en?.rating || 0,
    reviewCount: ar?.reviewCount || en?.reviewCount || 0,
    category: ar?.category || en?.category || '',
    productUrl: ar?.productUrl || productUrl(slug || productId, { lang: 'ar' }),
    productUrlEn: en?.productUrl || productUrl(slug || productId, { lang: 'en' }),
  });

  rememberBarcodes(detail);
  return detail;
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = productIdFromRef(id);
  if (!pid) return null;

  const cacheKey = `niceone:mapped:detail:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const detail = await loadDetailBilingual(id, { light }).catch(() => null);
  if (detail) cacheSet(cacheKey, detail, DETAIL_TTL);
  return detail;
}

function detailMatchesBarcode(detail, digits) {
  if (!detail) return false;
  if (detail.barcode && gtinEqual(detail.barcode, digits)) return true;
  return (detail.shades || []).some((shade) => shade.barcode && gtinEqual(shade.barcode, digits));
}

function shadeNameForBarcode(detail, digits) {
  const shade = (detail?.shades || []).find((s) => s.barcode && gtinEqual(s.barcode, digits));
  return shade?.nameAr || shade?.nameEn || '';
}

async function searchBarcodeViaSite(digits) {
  const { items } = await fetchListingMerged({ search: digits, page: 1, limit: 12 });
  if (!items.length) return [];

  const hits = [];
  const seen = new Set();
  const needDetail = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const thumbBc = barcodeFromImageUrl(item.thumb || '');
    if (gtinEqual(thumbBc, digits) || gtinEqual(item.barcode, digits)) {
      needDetail.unshift(item);
    } else {
      needDetail.push(item);
    }
    if (needDetail.length >= 4) break;
  }

  for (const item of needDetail.slice(0, 3)) {
    if (hits.length >= 3) break;
    const thumbBc = barcodeFromImageUrl(item.thumb || '');
    if (gtinEqual(thumbBc, digits) || gtinEqual(item.barcode, digits)) {
      const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
      if (detail && detailMatchesBarcode(detail, digits)) {
        hits.push(toBarcodeHit(detail, digits, { shadeName: shadeNameForBarcode(detail, digits) }));
        break;
      }
      if (detail) {
        hits.push(toBarcodeHit(detail, digits, { shadeName: shadeNameForBarcode(detail, digits) }));
        break;
      }
    }
  }

  if (hits.length) return hits;

  const verified = await Promise.all(
    needDetail.slice(0, 3).map((item) => fetchProductDetail(item.id, { light: false }).catch(() => null)),
  );
  for (const detail of verified) {
    if (!detail || !detailMatchesBarcode(detail, digits)) continue;
    hits.push(toBarcodeHit(detail, digits, { shadeName: shadeNameForBarcode(detail, digits) }));
    break;
  }

  return hits;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits || !isValidEan(digits)) return [];

  const cached = findBarcodeIndexEntry(digits);
  if (cached?.store === 'niceone' && cached.productId) {
    const detail = await fetchProductDetail(cached.productId, { light: false }).catch(() => null);
    if (detailMatchesBarcode(detail, digits)) {
      return [toBarcodeHit(detail, digits, {
        shadeName: cached.shadeName || shadeNameForBarcode(detail, digits),
      })];
    }
  }

  return searchBarcodeViaSite(digits);
}

export function sortProductsClient(items = [], sort = 'default') {
  const list = [...items];
  if (sort === 'price_asc') {
    list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  } else if (sort === 'name') {
    list.sort((a, b) => String(a.nameAr || a.nameEn).localeCompare(String(b.nameAr || b.nameEn), 'ar'));
  }
  return list;
}

export async function countProducts() {
  const { total } = await fetchListingPage({ category: 'makeup', page: 1, lang: 'ar' });
  return total;
}

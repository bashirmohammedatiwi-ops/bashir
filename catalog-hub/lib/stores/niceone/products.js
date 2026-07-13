import { cacheGet, cacheSet } from '../../core/cache.js';
import { findBarcodeIndexEntry, gtinEqual, upsertBarcodeIndex } from '../../core/barcode-index.js';
import { lookupBarcodeProductMeta } from '../../core/barcode-meta.js';
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

  let html = '';
  try {
    html = await fetchPageHtml(url, { lang, ttl: LIST_TTL, cacheKey: `niceone:raw:${cacheKey}` });
  } catch (err) {
    if (/NiceOne 404/.test(String(err?.message || ''))) {
      return { items: [], total: 0, page, pageSize: 0 };
    }
    throw err;
  }

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
  const main = extractBarcode(detail?.barcode || '');
  if (main) {
    upsertBarcodeIndex(main, {
      store: 'niceone',
      productId: detail.id,
      brand: detail.brandAr || detail.brandEn || '',
    });
  }
  for (const shade of detail?.shades || []) {
    const bc = extractBarcode(shade.barcode || '');
    if (!bc) continue;
    upsertBarcodeIndex(bc, {
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

function metaSearchQueries(meta = {}) {
  const brand = String(meta.brand || '').trim();
  const title = String(meta.title || '').trim();
  const shortTitle = title.split(/[*|,]/)[0].trim();
  const queries = [
    [brand, shortTitle].filter(Boolean).join(' '),
    [brand, title].filter(Boolean).join(' ').slice(0, 80),
    brand,
    shortTitle.slice(0, 60),
  ].map((q) => q.trim()).filter((q) => q.length >= 3);
  return [...new Set(queries)];
}

async function searchBarcodeViaListing(query, digits) {
  const { items } = await fetchListingMerged({ search: query, page: 1, limit: 12 });
  if (!items.length) return [];

  const candidates = [];
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const thumbBc = barcodeFromImageUrl(item.thumb || '');
    const priority = (gtinEqual(thumbBc, digits) || gtinEqual(item.barcode, digits)) ? 0 : 1;
    candidates.push({ item, priority });
    if (candidates.length >= 8) break;
  }
  candidates.sort((a, b) => a.priority - b.priority);

  const details = await Promise.all(
    candidates.slice(0, 5).map(({ item }) => fetchProductDetail(item.id, { light: false }).catch(() => null)),
  );
  for (const detail of details) {
    if (!detail || !detailMatchesBarcode(detail, digits)) continue;
    return [toBarcodeHit(detail, digits, { shadeName: shadeNameForBarcode(detail, digits) })];
  }
  return [];
}

async function searchBarcodeViaSite(digits) {
  const queries = [digits];
  if (digits.length === 13 && digits.startsWith('0')) {
    queries.push(digits.slice(1));
  }
  if (digits.length === 12) {
    queries.push(`0${digits}`);
  }

  for (const query of queries) {
    const hits = await searchBarcodeViaListing(query, digits);
    if (hits.length) return hits;
  }

  const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  if (!meta?.brand && !meta?.title) return [];

  for (const query of metaSearchQueries(meta)) {
    const hits = await searchBarcodeViaListing(query, digits);
    if (hits.length) return hits;
  }
  return [];
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

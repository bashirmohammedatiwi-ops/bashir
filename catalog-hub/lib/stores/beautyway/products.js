import {
  fetchShopHtml,
  fetchProductHtml,
  isValidEan,
  extractBarcode,
} from './client.js';
import {
  parseListingHtml,
  parseListingTotal,
  parseProductDetailHtml,
  BEAUTYWAY_PER_PAGE,
} from './parse.js';
import { mapListItem, mapDetailProduct, toBarcodeHit } from './map.js';
import { collectImageUrls } from '../../core/images.js';
import {
  findBarcodeIndexEntry,
  gtinEqual,
  upsertBarcodeIndex,
} from '../../core/barcode-index.js';
import { lookupBarcodeProductMeta, buildMetaHintQueries, isUsableBarcodeMeta } from '../../core/barcode-meta.js';

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

function drupalPagesForWindow({ page = 1, limit = 30 } = {}) {
  const globalOffset = (Math.max(1, page) - 1) * limit;
  const firstDrupalPage = Math.floor(globalOffset / BEAUTYWAY_PER_PAGE) + 1;
  const skipInFirst = globalOffset % BEAUTYWAY_PER_PAGE;
  const needed = skipInFirst + limit;
  const drupalPageCount = Math.ceil(needed / BEAUTYWAY_PER_PAGE);
  return { firstDrupalPage, skipInFirst, drupalPageCount };
}

async function fetchShopPagesMerged({ category = '', search = '', firstDrupalPage = 1, drupalPageCount = 1 } = {}) {
  const pageNums = Array.from({ length: drupalPageCount }, (_, i) => firstDrupalPage + i);
  const htmlPages = await Promise.all(pageNums.map(async (drupalPage) => {
    const [arHtml, enHtml] = await Promise.all([
      fetchShopHtml({ lang: 'ar', category, search, page: drupalPage }),
      fetchShopHtml({ lang: 'en', category, search, page: drupalPage }).catch(() => ''),
    ]);
    return { drupalPage, arHtml, enHtml };
  }));

  const seen = new Set();
  const merged = [];
  let total = 0;

  for (const { arHtml, enHtml } of htmlPages) {
    total = Math.max(total, parseListingTotal(arHtml), parseListingTotal(enHtml));
    const arItems = parseListingHtml(arHtml);
    const enItems = parseListingHtml(enHtml);
    const enByKey = new Map(enItems.map((i) => [i.id, i]));

    for (const item of arItems) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const en = enByKey.get(item.id);
      merged.push(mapListItem({
        ...item,
        nameEn: en?.nameEn || item.nameEn,
        brandEn: en?.brandEn || item.brandEn,
        href: item.href || en?.href,
        barcode: item.barcode || en?.barcode || '',
      }));
    }
  }

  return { merged, total };
}

async function fetchListingMerged({ category = '', search = '', page = 1, limit = 30 } = {}) {
  const { firstDrupalPage, skipInFirst, drupalPageCount } = drupalPagesForWindow({ page, limit });
  const { merged, total } = await fetchShopPagesMerged({
    category,
    search,
    firstDrupalPage,
    drupalPageCount,
  });

  const items = merged.slice(skipInFirst, skipInFirst + limit);
  return pageResult(items, { page, limit, total });
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

async function loadDetailBilingual(idOrSlug, { light = false } = {}) {
  const [arHtml, enHtml] = await Promise.all([
    fetchProductHtml(idOrSlug, { lang: 'ar' }),
    light ? Promise.resolve('') : fetchProductHtml(idOrSlug, { lang: 'en' }).catch(() => ''),
  ]);

  const ar = parseProductDetailHtml(arHtml, { lang: 'ar', fallbackId: idOrSlug });
  const en = enHtml ? parseProductDetailHtml(enHtml, { lang: 'en', fallbackId: ar.id || idOrSlug }) : null;
  const images = collectImageUrls(ar.images, en?.images);

  const detail = mapDetailProduct({
    ...ar,
    nameEn: en?.nameEn || ar.nameEn,
    brandEn: en?.brandEn || ar.brandEn,
    descriptionEn: en?.descriptionEn || '',
    productUrlEn: en?.productUrl || undefined,
    thumb: images[0] || ar.thumb,
    images,
  });

  if (detail.barcode) {
    upsertBarcodeIndex(detail.barcode, {
      store: 'beautyway',
      productId: detail.id,
      brand: detail.brandAr || detail.brandEn,
    });
  }

  return detail;
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = String(id || '').trim();
  if (!pid) return null;
  try {
    return await loadDetailBilingual(pid, { light });
  } catch {
    return null;
  }
}

function rememberBarcodeMatch(digits, item) {
  upsertBarcodeIndex(digits, {
    store: 'beautyway',
    productId: String(item.id || ''),
    brand: item.brandAr || item.brandEn || '',
  });
}

async function searchBarcodeViaShop(digits) {
  const { items = [] } = await fetchListingMerged({ search: digits, page: 1, limit: 24 });
  if (!items.length) return [];

  const prioritized = [
    ...items.filter((item) => item.barcode && gtinEqual(item.barcode, digits)),
    ...items.filter((item) => !item.barcode || !gtinEqual(item.barcode, digits)),
  ];

  const hits = [];
  const seen = new Set();
  let attempts = 0;

  for (const item of prioritized) {
    if (hits.length >= 3 || attempts >= 8) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    attempts += 1;

    const detail = await fetchProductDetail(item.id, { light: false }).catch(() => null);
    if (!detail?.barcode || !gtinEqual(detail.barcode, digits)) continue;

    rememberBarcodeMatch(digits, detail);
    hits.push(toBarcodeHit(detail, digits));
  }

  return hits;
}

async function searchBarcodeViaMeta(digits) {
  const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  if (!meta || !isUsableBarcodeMeta(meta)) return [];

  const queries = buildMetaHintQueries(meta).slice(0, 3);
  for (const q of queries) {
    const { items = [] } = await searchProducts(q, { page: 1, limit: 20 });
    for (const item of items) {
      const detail = await fetchProductDetail(item.id, { light: false }).catch(() => null);
      if (!detail?.barcode || !gtinEqual(detail.barcode, digits)) continue;
      rememberBarcodeMatch(digits, detail);
      return [toBarcodeHit(detail, digits)];
    }
  }
  return [];
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits || !isValidEan(digits)) return [];

  const cached = findBarcodeIndexEntry(digits);
  if (cached?.store === 'beautyway' && cached.productId) {
    const detail = await fetchProductDetail(cached.productId, { light: false }).catch(() => null);
    if (detail?.barcode && gtinEqual(detail.barcode, digits)) {
      return [toBarcodeHit(detail, digits)];
    }
  }

  const shopHits = await searchBarcodeViaShop(digits);
  if (shopHits.length) return shopHits;

  return searchBarcodeViaMeta(digits);
}

export function sortProductsClient(items = [], sort = '') {
  const list = [...items];
  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => Number(String(a.price).replace(/\D/g, '')) - Number(String(b.price).replace(/\D/g, '')));
    case 'price_desc':
      return list.sort((a, b) => Number(String(b.price).replace(/\D/g, '')) - Number(String(a.price).replace(/\D/g, '')));
    case 'name':
      return list.sort((a, b) => String(a.nameAr || a.nameEn).localeCompare(String(b.nameAr || b.nameEn), 'ar'));
    default:
      return list;
  }
}

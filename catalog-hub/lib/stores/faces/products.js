import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  DEFAULT_TTL,
  fetchListingHtml,
  extractBarcode,
  fetchProductVariation,
  normalizePid,
  resolveProductPid,
  stripHtml,
} from './client.js';
import { parseListingHtml, parseListingTotal } from './parse.js';
import { mergeListingLocales } from './merge.js';
import { mapDetailProduct } from './map.js';
import { lookupBarcodeProductMeta, buildMetaHintQueries } from '../../core/barcode-meta.js';

function pageResult(items, { page, limit, total = 0 } = {}) {
  const sliced = items.slice(0, limit);
  const safeTotal = total || items.length;
  return {
    items: sliced,
    page,
    pageSize: limit,
    total: safeTotal,
    hasMore: page * limit < safeTotal,
  };
}

async function enrichListingEnglish(items = [], { concurrency = 8 } = {}) {
  const out = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      const item = items[i];
      if (item.nameEn && item.nameEn !== item.nameAr && item.brandEn) {
        out[i] = item;
        continue;
      }
      let en = await fetchProductVariation(item.id, { lang: 'en' }).catch(() => null);
      const resolvedId = en?.masterId
        ? await resolveProductPid(en.masterId, { lang: 'en' })
        : await resolveProductPid(item.id, { lang: 'en' });
      if (!en && resolvedId && resolvedId !== item.id) {
        en = await fetchProductVariation(resolvedId, { lang: 'en' }).catch(() => null);
      }
      out[i] = {
        ...item,
        id: String(en?.masterId || en?.id || resolvedId || item.id),
        nameEn: stripHtml(en?.productName) || item.nameEn || item.nameAr,
        brandEn: stripHtml(en?.brand) || item.brandEn || item.brandAr,
        productUrlEn: en?.selectedProductUrl
          ? `https://www.faces.ae/en${en.selectedProductUrl}`
          : item.productUrlEn || item.productUrl,
      };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()),
  );
  return out;
}

async function fetchListingMerged({ q = '', cgid = '', page = 1, limit = 30 } = {}) {
  const cacheKey = `faces:list:merged:${q || cgid}:${page}:${limit}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const [arHtml, enHtml] = await Promise.all([
    fetchListingHtml({ lang: 'ar', q, cgid, page, limit }).catch(() => ''),
    fetchListingHtml({ lang: 'en', q, cgid, page, limit }).catch(() => ''),
  ]);

  const arItems = parseListingHtml(arHtml, { lang: 'ar' });
  const enItems = parseListingHtml(enHtml, { lang: 'en' });
  const merged = mergeListingLocales(arItems, enItems);
  const enriched = await enrichListingEnglish(merged);
  const total = Math.max(
    parseListingTotal(arHtml),
    parseListingTotal(enHtml),
    enriched.length,
  );

  const out = pageResult(enriched, { page, limit, total });
  cacheSet(cacheKey, out);
  return out;
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const cgid = String(categoryId || '').trim();
  if (!cgid || cgid === 'root') {
    return fetchListingMerged({ page, limit });
  }
  return fetchListingMerged({ cgid, page, limit });
}

export async function searchProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return pageResult([], { page, limit, total: 0 });
  return fetchListingMerged({ q, page, limit });
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = await resolveProductPid(id);
  if (!pid) return null;
  return mapDetailProduct(pid, { light });
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits) return [];

  const tryIds = [...new Set([digits, digits.replace(/^0+/, '')].filter(Boolean))];

  for (const pid of tryIds) {
    const resolved = await resolveProductPid(pid);
    const hit = await fetchProductVariation(resolved, { lang: 'ar' }).catch(() => null);
    if (!hit) continue;
    const detail = await mapDetailProduct(resolved, { light: false });
    if (!detail) continue;
    const shade = (detail.shades || []).find((s) => s.barcode === digits);
    if (shade || detail.barcode === digits || extractBarcode(hit) === digits) {
      return [toBarcodeHit(detail, digits, shade)];
    }
  }

  const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  const queries = meta ? buildMetaHintQueries(meta).slice(0, 4) : [];
  const searchQueries = [...new Set([digits, ...queries].filter(Boolean))];

  for (const q of searchQueries) {
    const listing = await fetchListingMerged({ q, page: 1, limit: 12 });
    for (const item of listing.items.slice(0, 10)) {
      const detail = await mapDetailProduct(item.id, { light: false }).catch(() => null);
      if (!detail) continue;
      const shade = (detail.shades || []).find((s) => s.barcode === digits);
      if (shade || detail.barcode === digits) {
        return [toBarcodeHit(detail, digits, shade)];
      }
    }
  }

  return [];
}

function toBarcodeHit(detail, digits, shade) {
  return {
    id: detail.id,
    nameAr: detail.nameAr,
    nameEn: detail.nameEn,
    brandAr: detail.brandAr,
    brandEn: detail.brandEn,
    thumb: shade?.image || shade?.swatchImage || detail.thumb,
    price: shade?.price || detail.price,
    barcode: shade?.barcode || detail.barcode || digits,
    shadeName: shade?.nameAr || shade?.nameEn || '',
    matchType: 'ean',
  };
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

function parsePrice(price = '') {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

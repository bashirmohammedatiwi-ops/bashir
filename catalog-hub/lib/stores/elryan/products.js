import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  DEFAULT_TTL,
  DETAIL_SOURCE,
  LIST_SOURCE,
  extractBarcodeFromSku,
  hitsOf,
  searchBoth,
  searchIndex,
  totalOf,
} from './client.js';
import { mapDetailProduct, mapListProduct } from './map.js';

const VISIBLE = [2, 3, 4];

function activeFilters(extra = []) {
  return [
    { term: { status: 1 } },
    { terms: { visibility: VISIBLE } },
    ...extra,
  ];
}

function listBody({ from = 0, size = 30, filters = [], sort = null } = {}) {
  const body = {
    from,
    size: Math.min(size, 60),
    track_total_hits: true,
    query: { bool: { filter: activeFilters(filters) } },
    _source: LIST_SOURCE,
  };
  if (sort) body.sort = sort;
  return body;
}

function queryScript(query = '') {
  const q = String(query || '');
  const latin = (q.match(/[A-Za-z]/g) || []).length;
  const arabic = (q.match(/[\u0600-\u06FF]/g) || []).length;
  if (latin && !arabic) return 'latin';
  if (arabic && !latin) return 'arabic';
  return 'mixed';
}

function searchBody(query, { from = 0, size = 30, categoryId = '', lang = 'ar' } = {}) {
  const q = String(query || '').trim();
  const filters = [];
  if (categoryId) filters.push({ term: { category_ids: Number(categoryId) || categoryId } });

  const script = queryScript(q);
  // لا تستخدم fuzziness مع كلمات لاتينية على الفهرس العربي — تنتج تطابقات خاطئة
  const useFuzzy = script === 'arabic' && q.length >= 4;

  return {
    from,
    size: Math.min(size, 60),
    track_total_hits: true,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ['name^5', 'sku^4', 'brand_details.title^3', 'description'],
              type: 'best_fields',
              operator: 'and',
              ...(useFuzzy ? { fuzziness: 'AUTO' } : {}),
            },
          },
        ],
        filter: activeFilters(filters),
        // استعلامات لاتينية على الفهرس العربي: اطلب حداً أدنى للنقاط لتجاهل الضوضاء
        ...(lang === 'ar' && script === 'latin' ? { minimum_should_match: undefined } : {}),
      },
    },
    min_score: lang === 'ar' && script === 'latin' ? 5 : undefined,
    _source: LIST_SOURCE,
  };
}

/** دمج نتائج AR/EN — اللغة المطابقة لنص البحث أولاً للدقة */
function mergeHits(arResult, enResult, { limit = 30, prefer = 'ar' } = {}) {
  const arHits = hitsOf(arResult);
  const enHits = hitsOf(enResult);
  const enById = new Map(enHits.map((h) => [String(h._source?.id), h._source]));
  const arById = new Map(arHits.map((h) => [String(h._source?.id), h._source]));

  const primary = prefer === 'en' ? enHits : arHits;
  const secondary = prefer === 'en' ? arHits : enHits;

  const seen = new Set();
  const items = [];

  for (const hit of [...primary, ...secondary]) {
    const src = hit?._source;
    if (!src || items.length >= limit) break;
    const id = String(src.id);
    if (seen.has(id)) continue;
    seen.add(id);
    const product = mapListProduct(
      arById.get(id) || null,
      enById.get(id) || null,
    );
    if (product?.id) items.push(product);
  }

  return {
    items,
    total: Math.max(totalOf(arResult), totalOf(enResult)),
  };
}

function needsArabicName(p) {
  const ar = String(p.nameAr || '').trim();
  const en = String(p.nameEn || '').trim();
  if (!ar) return true;
  // الاسم العربي ما زال إنجليزياً (بحث لاتيني قبل الإثراء)
  if (en && ar === en) return true;
  if (/[A-Za-z]/.test(ar) && !/[\u0600-\u06FF]/.test(ar)) return true;
  return false;
}

async function enrichMissingLanguage(items, { prefer = 'en' } = {}) {
  const missing = items.filter((p) => (prefer === 'en' ? !p.nameEn : needsArabicName(p)));
  if (!missing.length) return items;

  const ids = missing.map((p) => Number(p.id)).filter(Boolean);
  if (!ids.length) return items;

  const result = await searchIndex(prefer, 'product', {
    size: Math.min(ids.length, 60),
    query: { terms: { id: ids } },
    _source: ['id', 'name', 'brand_details', 'url_path'],
  }, { ttl: DEFAULT_TTL }).catch(() => null);

  const byId = new Map(hitsOf(result).map((h) => [String(h._source?.id), h._source]));
  return items.map((p) => {
    const other = byId.get(p.id);
    if (!other) return p;
    if (prefer === 'en') {
      return {
        ...p,
        nameEn: String(other.name || '').trim() || p.nameEn,
        brandEn: String(other.brand_details?.title || '').trim() || p.brandEn,
      };
    }
    const arName = String(other.name || '').trim();
    return {
      ...p,
      nameAr: arName || p.nameAr,
      brandAr: String(other.brand_details?.title || '').trim() || p.brandAr,
    };
  });
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const id = String(categoryId || '').trim();
  if (!id) return { items: [], page, pageSize: limit, total: 0, hasMore: false };

  const from = (Math.max(1, page) - 1) * limit;
  const body = listBody({
    from,
    size: limit,
    filters: [{ term: { category_ids: Number(id) || id } }],
    sort: [{ updated_at: 'desc' }],
  }); // size = page size

  const ar = await searchIndex('ar', 'product', body, {
    ttl: DEFAULT_TTL,
    cacheKey: `elryan:cat:${id}:${page}:${limit}`,
  });

  let items = hitsOf(ar).map((h) => mapListProduct(h._source, null)).filter(Boolean);
  items = await enrichMissingLanguage(items, { prefer: 'en' });

  const total = totalOf(ar);
  return {
    items,
    page,
    pageSize: limit,
    total,
    hasMore: from + items.length < total,
  };
}

async function listAllProducts({ page = 1, limit = 30 } = {}) {
  const from = (Math.max(1, page) - 1) * limit;
  const body = listBody({ from, size: limit, sort: [{ updated_at: 'desc' }] });
  const ar = await searchIndex('ar', 'product', body, {
    ttl: DEFAULT_TTL,
    cacheKey: `elryan:all:${page}:${limit}`,
  });
  let items = hitsOf(ar).map((h) => mapListProduct(h._source, null)).filter(Boolean);
  items = await enrichMissingLanguage(items, { prefer: 'en' });
  const total = totalOf(ar);
  return {
    items,
    page,
    pageSize: limit,
    total,
    hasMore: from + items.length < total,
  };
}

export async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const q = String(query || '').trim();
  if (!q) {
    if (categoryId) return listCategoryProducts(categoryId, { page, limit });
    return listAllProducts({ page, limit });
  }

  const from = (Math.max(1, page) - 1) * limit;
  const script = queryScript(q);
  const prefer = script === 'latin' ? 'en' : 'ar';

  const [ar, en] = await Promise.all([
    // استعلام لاتيني على الفهرس العربي غالباً ضوضاء — تخطَّه إلا للاستعلامات المختلطة/العربية
    script === 'latin'
      ? Promise.resolve(null)
      : searchIndex('ar', 'product', searchBody(q, { from, size: limit, categoryId, lang: 'ar' }), {
        ttl: DEFAULT_TTL / 2,
      }).catch(() => null),
    searchIndex('en', 'product', searchBody(q, { from, size: limit, categoryId, lang: 'en' }), {
      ttl: DEFAULT_TTL / 2,
    }).catch(() => null),
  ]);

  // إن كان البحث عربياً فقط وفشل الإنجليزي، لا بأس؛ وإن كان لاتينياً نعتمد الإنجليزي
  let { items, total } = mergeHits(ar, en, { limit, prefer });
  items = await enrichMissingLanguage(items, { prefer: 'en' });
  items = await enrichMissingLanguage(items, { prefer: 'ar' });

  return {
    items,
    page,
    pageSize: limit,
    total,
    hasMore: items.length >= limit || from + items.length < total,
  };
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = String(id || '').trim();
  if (!pid) return null;

  const cacheKey = `elryan:product:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const body = {
    size: 1,
    query: { term: { id: Number(pid) || pid } },
    _source: light ? LIST_SOURCE : DETAIL_SOURCE,
  };

  const { ar, en } = await searchBoth('product', body, { ttl: DEFAULT_TTL });
  const arSrc = hitsOf(ar)[0]?._source || null;
  const enSrc = hitsOf(en)[0]?._source || null;
  if (!arSrc && !enSrc) return null;

  const detail = mapDetailProduct(arSrc || enSrc, arSrc && enSrc ? enSrc : null);
  cacheSet(cacheKey, detail);
  return detail;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  // SKU في الريان يبدأ بالباركود: 3145891269406-xxxxx
  const body = {
    size: 8,
    query: {
      bool: {
        should: [
          { prefix: { sku: digits } },
          { wildcard: { sku: `${digits}*` } },
          { term: { sku: digits } },
        ],
        minimum_should_match: 1,
        filter: activeFilters(),
      },
    },
    _source: LIST_SOURCE,
  };

  const { ar, en } = await searchBoth('product', body, { ttl: DEFAULT_TTL });
  let { items } = mergeHits(ar, en, { limit: 8 });
  items = await enrichMissingLanguage(items, { prefer: 'en' });

  const exact = items.filter((p) => extractBarcodeFromSku(p.sku) === digits || p.sku === digits);
  const hits = exact.length ? exact : items.slice(0, 3);

  return hits.map((item) => ({
    ...item,
    barcode: digits,
    matchType: exact.some((e) => e.id === item.id) ? 'sku' : 'keyword',
  }));
}

export function sortProductsClient(items = [], sort = 'default') {
  const list = [...items];
  const priceOf = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
  if (sort === 'price_asc') list.sort((a, b) => priceOf(a) - priceOf(b));
  else if (sort === 'price_desc') list.sort((a, b) => priceOf(b) - priceOf(a));
  else if (sort === 'name') list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
  return list;
}

import { cacheGet, cacheSet } from '../../core/cache.js';
import { DEFAULT_TTL, DETAIL_TTL, khatonFetch } from './client.js';
import { mapDetailProduct, mapListProduct, toBarcodeHit } from './map.js';

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

async function fetchProductPage({ page = 1, limit = 30, categoryId = '', search = '', barcode = '' } = {}) {
  const perPage = Math.min(Math.max(limit, 1), 50);
  const params = { page, per_page: perPage };
  if (categoryId) params.category_id = categoryId;
  if (search) params.search = search;
  if (barcode) params.barcode = barcode;

  const cacheKey = `khaton:products:${JSON.stringify(params)}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const [arData, enData] = await Promise.all([
    khatonFetch('/products', { params, ttl: DEFAULT_TTL, cacheKey: `${cacheKey}:ar`, lang: 'ar' }),
    khatonFetch('/products', { params, ttl: DEFAULT_TTL, cacheKey: `${cacheKey}:en`, lang: 'en' }),
  ]);
  const enById = new Map((enData.data || []).map((p) => [String(p.id), p]));
  const out = {
    items: (arData.data || []).map((p) => mapListProduct(p, enById.get(String(p.id)))),
    total: Number(arData.meta?.total || arData.data?.length || 0),
    page: Number(arData.meta?.current_page || page),
    pageSize: perPage,
  };
  cacheSet(cacheKey, out, DEFAULT_TTL);
  return out;
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const category = String(categoryId || '').trim();
  const { items, total, pageSize } = await fetchProductPage({
    page,
    limit,
    categoryId: category && category !== 'root' ? category : '',
  });
  return pageResult(items, { page, limit: pageSize, total });
}

export async function searchProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  const { items, total, pageSize } = await fetchProductPage({ page, limit, search: q });
  return pageResult(items, { page, limit: pageSize, total });
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = String(id || '').trim();
  if (!pid) return null;

  const cacheKey = `khaton:detail:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const [arData, enData] = await Promise.all([
    khatonFetch(`/products/${encodeURIComponent(pid)}`, {
      ttl: DETAIL_TTL,
      cacheKey: `khaton:raw:detail:${pid}:ar`,
      lang: 'ar',
    }),
    light
      ? null
      : khatonFetch(`/products/${encodeURIComponent(pid)}`, {
        ttl: DETAIL_TTL,
        cacheKey: `khaton:raw:detail:${pid}:en`,
        lang: 'en',
      }),
  ]);
  const product = arData.data;
  if (!product?.id) return null;

  const mapped = mapDetailProduct(product, { rawEn: enData?.data, light });
  cacheSet(cacheKey, mapped, DETAIL_TTL);
  return mapped;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  const { items } = await fetchProductPage({ barcode: digits, page: 1, limit: 5 });
  if (!items.length) {
    const fallback = await fetchProductPage({ search: digits, page: 1, limit: 5 });
    if (!fallback.items.length) return [];
    const detail = await fetchProductDetail(fallback.items[0].id);
    if (!detail) return [];
    const shade = (detail.shades || []).find((s) => String(s.barcode || '') === digits);
    return [toBarcodeHit(detail, digits, { shadeName: shade?.nameEn || shade?.nameAr || '' })];
  }

  const detail = await fetchProductDetail(items[0].id);
  if (!detail) return [toBarcodeHit(items[0], digits)];

  const shade = (detail.shades || []).find((s) => String(s.barcode || '') === digits);
  return [toBarcodeHit(detail, digits, { shadeName: shade?.nameEn || shade?.nameAr || '' })];
}

export function sortProductsClient(items = [], sort = 'default') {
  const list = [...items];
  if (sort === 'price_asc') {
    list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  } else if (sort === 'name') {
    list.sort((a, b) => (a.nameAr || a.nameEn || '').localeCompare(b.nameAr || b.nameEn || '', 'ar'));
  }
  return list;
}

export async function countProducts() {
  const data = await khatonFetch('/products', {
    params: { page: 1, per_page: 1 },
    ttl: DEFAULT_TTL,
    cacheKey: 'khaton:products:count',
  });
  return Number(data.meta?.total || 0);
}

import { cacheGet, cacheSet } from '../../core/cache.js';
import { DEFAULT_TTL, DETAIL_TTL, waheteterFetch } from './client.js';
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

async function fetchProductPage({ page = 1, limit = 30, categoryId = '', search = '', sku = '' } = {}) {
  const perPage = Math.min(Math.max(limit, 1), 100);
  const params = { page, per_page: perPage };
  if (categoryId) params.category = categoryId;
  if (search) params.search = search;
  if (sku) params.sku = sku;

  const cacheKey = `waheteter:products:${JSON.stringify(params)}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const { data, meta } = await waheteterFetch('/products', {
    params,
    ttl: DEFAULT_TTL,
    cacheKey: `waheteter:raw:${cacheKey}`,
  });
  const rows = Array.isArray(data) ? data : [];
  const out = {
    items: rows.map(mapListProduct),
    total: meta.total || rows.length,
    page: Number(page),
    pageSize: perPage,
  };
  cacheSet(cacheKey, out, DEFAULT_TTL);
  return out;
}

async function fetchVariationRows(product = {}) {
  const stubs = Array.isArray(product.variations) ? product.variations : [];
  if (!stubs.length) return product.type === 'simple' ? [product] : [];

  const rows = await Promise.all(stubs.map(async (stub) => {
    const vid = String(stub?.id || '').trim();
    if (!vid) return null;
    try {
      const { data } = await waheteterFetch(`/products/${encodeURIComponent(vid)}`, {
        ttl: DETAIL_TTL,
        cacheKey: `waheteter:var:${vid}`,
      });
      return data?.id ? data : null;
    } catch {
      return null;
    }
  }));
  return rows.filter(Boolean);
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

  const cacheKey = `waheteter:detail:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  let product;
  try {
    const { data } = await waheteterFetch(`/products/${encodeURIComponent(pid)}`, {
      ttl: DETAIL_TTL,
      cacheKey: `waheteter:raw:detail:${pid}`,
    });
    product = data;
  } catch {
    return null;
  }
  if (!product?.id) return null;

  if (product.type === 'variation' && product.parent) {
    return fetchProductDetail(String(product.parent), { light });
  }

  const variationRows = light ? [] : await fetchVariationRows(product);
  const mapped = mapDetailProduct(product, variationRows, { light });
  cacheSet(cacheKey, mapped, DETAIL_TTL);
  return mapped;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  const { data } = await waheteterFetch('/products', {
    params: { sku: digits, per_page: 5 },
    ttl: DEFAULT_TTL,
    cacheKey: `waheteter:sku:${digits}`,
  });
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return [];

  const row = rows[0];
  const parentId = Number(row.parent || 0) > 0 ? String(row.parent) : String(row.id);
  const detail = await fetchProductDetail(parentId);
  if (!detail) {
    return [toBarcodeHit(mapListProduct(row), digits, { shadeName: variationLabel(row) })];
  }

  const shade = (detail.shades || []).find((s) => String(s.barcode || '') === digits);
  return [toBarcodeHit(detail, digits, {
    shadeName: shade?.nameAr || shade?.nameEn || row.variation || '',
  })];
}

function variationLabel(row = {}) {
  const attrs = row.attributes || [];
  if (attrs.length) {
    return attrs.map((a) => String(a.value || a.name || '').trim()).filter(Boolean).join(' · ');
  }
  return String(row.variation || '').trim();
}

export async function countProducts() {
  const { meta } = await waheteterFetch('/products', {
    params: { per_page: 1, page: 1 },
    ttl: DEFAULT_TTL,
    cacheKey: 'waheteter:products:count',
  });
  return meta.total || 0;
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

import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  DEFAULT_TTL,
  DETAIL_TTL,
  fetchProductJs,
  rememberHandle,
  resolveHandle,
  searchHtmlMeta,
  shopifyFetch,
  variantBarcode,
} from './client.js';
import {
  findOrisdiBarcode,
  indexOrisdiProduct,
  isOrisdiIndexFresh,
  orisdiBarcodeIndexStats,
  upsertOrisdiBarcode,
} from './barcode-index.js';
import { mapDetailProduct, mapListProduct, toBarcodeHit } from './map.js';

const PRODUCTS_PER_PAGE = 250;
let indexBuildPromise = null;

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

async function fetchProductsPage({ page = 1, limit = 30, collectionHandle = '', search = '' } = {}) {
  const perPage = Math.min(Math.max(limit, 1), PRODUCTS_PER_PAGE);
  const params = { limit: perPage, page };
  let path = '/products.json';
  if (collectionHandle) {
    path = `/collections/${encodeURIComponent(collectionHandle)}/products.json`;
  }

  const cacheKey = `orisdi:list:${path}:${JSON.stringify(params)}:${search}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const data = await shopifyFetch(path, { params, ttl: DEFAULT_TTL, cacheKey: `orisdi:raw:${path}:${page}` });
  let products = data.products || [];

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter((p) => {
      const title = String(p.title || '').toLowerCase();
      const vendor = String(p.vendor || '').toLowerCase();
      const tags = (p.tags || []).join(' ').toLowerCase();
      const skus = (p.variants || []).map((v) => String(v.sku || '')).join(' ');
      return title.includes(q) || vendor.includes(q) || tags.includes(q) || skus.includes(q);
    });
  }

  for (const p of products) indexOrisdiProduct(p);

  const out = {
    items: products.map(mapListProduct),
    total: products.length,
    page,
    pageSize: perPage,
  };
  cacheSet(cacheKey, out, DEFAULT_TTL);
  return out;
}

async function resolveProductHandle(id) {
  const raw = String(id || '').trim();
  if (!raw) return '';
  if (!/^\d+$/.test(raw)) return raw;

  const cached = resolveHandle(raw);
  if (cached) return cached;

  for (let page = 1; page <= 40; page += 1) {
    const data = await shopifyFetch('/products.json', {
      params: { limit: PRODUCTS_PER_PAGE, page },
      ttl: DEFAULT_TTL,
      cacheKey: `orisdi:scan:${page}`,
    });
    const products = data.products || [];
    if (!products.length) break;
    for (const p of products) {
      rememberHandle(p.id, p.handle);
      indexOrisdiProduct(p);
      if (String(p.id) === raw) return String(p.handle || '');
    }
    if (products.length < PRODUCTS_PER_PAGE) break;
  }
  return '';
}

async function buildBarcodeIndex() {
  if (indexBuildPromise) return indexBuildPromise;
  indexBuildPromise = (async () => {
    let productCount = 0;
    for (let page = 1; page <= 40; page += 1) {
      const data = await shopifyFetch('/products.json', {
        params: { limit: PRODUCTS_PER_PAGE, page },
        ttl: 0,
      });
      const products = data.products || [];
      if (!products.length) break;
      for (const p of products) {
        indexOrisdiProduct(p);
        rememberHandle(p.id, p.handle);
        productCount += 1;
      }
      if (products.length < PRODUCTS_PER_PAGE) break;
    }
    return productCount;
  })().finally(() => {
    indexBuildPromise = null;
  });
  return indexBuildPromise;
}

export async function countProducts() {
  let lo = 1;
  let hi = 40;
  let lastGood = 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const data = await shopifyFetch('/products.json', {
      params: { limit: PRODUCTS_PER_PAGE, page: mid },
      ttl: DEFAULT_TTL,
      cacheKey: `orisdi:count-probe:${mid}`,
    });
    if ((data.products || []).length > 0) {
      lastGood = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const last = await shopifyFetch('/products.json', {
    params: { limit: PRODUCTS_PER_PAGE, page: lastGood },
    ttl: DEFAULT_TTL,
    cacheKey: `orisdi:count-last:${lastGood}`,
  });
  return (lastGood - 1) * PRODUCTS_PER_PAGE + (last.products || []).length;
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const category = String(categoryId || '').trim();
  if (!category || category === 'root') {
    const data = await shopifyFetch('/products.json', {
      params: { limit: Math.min(limit, PRODUCTS_PER_PAGE), page },
      ttl: DEFAULT_TTL,
      cacheKey: `orisdi:all:${page}:${limit}`,
    });
    const items = (data.products || []).map(mapListProduct);
    for (const p of data.products || []) indexOrisdiProduct(p);
    const total = await countProducts().catch(() => items.length);
    return pageResult(items, { page, limit, total });
  }

  const { items } = await fetchProductsPage({ page, limit, collectionHandle: category });
  return pageResult(items, { page, limit, total: items.length });
}

export async function searchProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return pageResult([], { page, limit, total: 0 });

  const meta = await searchHtmlMeta(q);
  const hits = meta?.products || [];
  if (hits.length) {
    const items = [];
    for (const hit of hits.slice(0, limit)) {
      const handle = String(hit.handle || '').trim();
      if (!handle) continue;
      const ar = await fetchProductJs(handle, { lang: 'ar' });
      if (ar) items.push(mapListProduct(ar));
    }
    return pageResult(items, { page, limit, total: items.length });
  }

  const { items } = await fetchProductsPage({ page, limit, search: q });
  return pageResult(items, { page, limit, total: items.length });
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const handle = await resolveProductHandle(id);
  if (!handle) return null;

  const cacheKey = `orisdi:detail:${handle}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const [arProduct, enProduct] = await Promise.all([
    fetchProductJs(handle, { lang: 'ar' }),
    light ? null : fetchProductJs(handle, { lang: 'en' }),
  ]);
  if (!arProduct?.id) return null;

  rememberHandle(arProduct.id, arProduct.handle);
  indexOrisdiProduct(arProduct);

  const mapped = mapDetailProduct(arProduct, enProduct, { light });
  cacheSet(cacheKey, mapped, DETAIL_TTL);
  return mapped;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  const indexStats = orisdiBarcodeIndexStats();

  if (!isOrisdiIndexFresh()) {
    buildBarcodeIndex().catch(() => {});
  }

  let hit = findOrisdiBarcode(digits);
  if (!hit) {
    const meta = await searchHtmlMeta(digits);
    const product = meta?.products?.[0];
    if (product?.handle) {
      const variant = (product.variants || []).find((v) => variantBarcode(v) === digits)
        || product.variants?.[0];
      hit = upsertOrisdiBarcode(digits, {
        productId: String(product.id || ''),
        handle: String(product.handle || ''),
        variantId: String(variant?.id || ''),
        shadeName: String(variant?.public_title || variant?.title || '').trim(),
      });
    }
  }

  if (!hit?.handle && !hit?.productId) {
    // لا ننتظر إعادة بناء الفهرس الكامل إذا كان موجوداً — يمنع مهلة 30+ ثانية على الهاتف
    if ((indexStats.barcodes || 0) < 500) {
      await buildBarcodeIndex().catch(() => {});
      hit = findOrisdiBarcode(digits);
    } else {
      buildBarcodeIndex().catch(() => {});
    }
  }

  if (!hit) return [];

  const detail = await fetchProductDetail(hit.handle || hit.productId);
  if (!detail) return [];

  const shade = (detail.shades || []).find((s) => String(s.barcode || '') === digits);
  return [toBarcodeHit(detail, digits, { shadeName: shade?.nameEn || shade?.nameAr || hit.shadeName || '' })];
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

export { orisdiBarcodeIndexStats };

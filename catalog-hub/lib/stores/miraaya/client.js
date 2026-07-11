import { cacheGet, cacheSet } from '../../core/cache.js';

const MAGENTO = 'https://magadmin.miraaya.com';
const GRAPHQL = `${MAGENTO}/graphql`;
const REST = `${MAGENTO}/rest/V1`;
const SITE = 'https://miraaya.com';

const ALGOLIA_APP = '9YKTK4F5EB';
const ALGOLIA_KEY = 'd6a6b0bdbba4ff746ad0e67286f0347e';
const ALGOLIA_INDEX = {
  ar: 'production_ar_products',
  en: 'production_default_products',
};

export const DEFAULT_TTL = 10 * 60 * 1000;
export const DETAIL_TTL = 20 * 60 * 1000;
export const LIST_TTL = 8 * 60 * 1000;

function storeHeader(lang = 'ar') {
  return lang === 'ar' ? 'ar' : 'default';
}

export function normalizeSku(sku = '') {
  return String(sku || '').trim();
}

export function extractBarcode(sku = '') {
  const digits = String(sku || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(digits) ? digits : '';
}

export function absMediaUrl(path = '') {
  const p = String(path || '').trim();
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return `${MAGENTO}/media/catalog/product${p.startsWith('/') ? p : `/${p}`}`;
}

export function productPageUrl(urlKey = '', lang = 'ar') {
  const key = String(urlKey || '').trim();
  if (!key) return `${SITE}/${lang}/`;
  return `${SITE}/${lang}/products/${key}`;
}

export function formatIqdPrice(value = 0, currency = 'IQD') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  const formatted = Math.round(n).toLocaleString('ar-IQ');
  return currency === 'IQD' ? `${formatted} د.ع` : `${formatted} ${currency}`;
}

export function priceFromRange(range = {}) {
  const min = range?.minimum_price || {};
  const final = Number(min.final_price?.value ?? min.regular_price?.value ?? 0);
  const currency = min.final_price?.currency || min.regular_price?.currency || 'IQD';
  return formatIqdPrice(final, currency);
}

export async function miraayaGraphql(query, {
  lang = 'ar',
  variables = {},
  ttl = DEFAULT_TTL,
  cacheKey = '',
} = {}) {
  const key = cacheKey || (ttl > 0 ? `miraaya:gql:${lang}:${query}:${JSON.stringify(variables)}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Store: storeHeader(lang),
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(25_000),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.[0]?.message || `GraphQL ${res.status}`;
    throw new Error(`Miraaya ${msg}`);
  }

  if (key) cacheSet(key, json.data);
  return json.data;
}

export async function miraayaRest(path, { ttl = DEFAULT_TTL, cacheKey = '' } = {}) {
  const key = cacheKey || (ttl > 0 ? `miraaya:rest:${path}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const url = `${REST}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 404) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof body === 'object' ? JSON.stringify(body).slice(0, 160) : String(body).slice(0, 160);
    throw new Error(`Miraaya REST ${res.status}: ${msg}`);
  }

  if (key) cacheSet(key, body);
  return body;
}

export async function fetchProductRest(sku, { ttl = DETAIL_TTL } = {}) {
  const id = encodeURIComponent(normalizeSku(sku));
  if (!id) return null;
  return miraayaRest(`/products/${id}`, { ttl, cacheKey: `miraaya:product:${id}` });
}

export function restAttr(product = {}, code = '') {
  const hit = (product.custom_attributes || []).find((a) => a.attribute_code === code);
  return hit ? String(hit.value || '').trim() : '';
}

export function restBrand(product = {}) {
  return restAttr(product, 'brand') || restAttr(product, 'manufacturer');
}

export function restUrlKey(product = {}) {
  return restAttr(product, 'url_key') || '';
}

export function restGallery(product = {}) {
  const urls = (product.media_gallery_entries || [])
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((e) => absMediaUrl(e.file))
    .filter(Boolean);
  const main = absMediaUrl(product.media_gallery_entries?.[0]?.file || '');
  return [...new Set([main, ...urls].filter(Boolean))];
}

export async function algoliaSearch(query = '', {
  lang = 'ar',
  page = 0,
  limit = 30,
  ttl = LIST_TTL,
} = {}) {
  const q = String(query || '').trim();
  const index = ALGOLIA_INDEX[lang] || ALGOLIA_INDEX.ar;
  const cacheKey = `miraaya:algolia:${lang}:${q}:${page}:${limit}`;
  const cached = cacheGet(cacheKey, ttl);
  if (cached) return cached;

  const params = new URLSearchParams({
    query: q,
    hitsPerPage: String(Math.min(limit, 48)),
    page: String(Math.max(0, page)),
  });

  const res = await fetch(`https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${index}/query`, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP,
      'X-Algolia-API-Key': ALGOLIA_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ params: params.toString() }),
    signal: AbortSignal.timeout(20_000),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Miraaya Algolia ${res.status}`);

  const out = {
    hits: json.hits || [],
    total: Number(json.nbHits || 0),
    page: Number(json.page || 0),
    pageSize: Number(json.hitsPerPage || limit),
  };
  cacheSet(cacheKey, out);
  return out;
}

export function algoliaSkus(hit = {}) {
  const raw = hit.sku;
  if (Array.isArray(raw)) return raw.map((s) => String(s));
  if (raw) return [String(raw)];
  return [];
}

export function algoliaPrimarySku(hit = {}) {
  const skus = algoliaSkus(hit);
  if (hit.type_id === 'configurable') {
    return skus.find((s) => !extractBarcode(s)) || skus[0] || '';
  }
  return skus.find((s) => extractBarcode(s)) || skus[0] || '';
}

export {
  MAGENTO,
  SITE,
  ALGOLIA_INDEX,
};

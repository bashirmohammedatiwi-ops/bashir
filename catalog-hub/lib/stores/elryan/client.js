import { cacheGet, cacheSet } from '../../core/cache.js';

const API_BASE = 'https://www.elryan.com/api/catalog';
const IMG_BASE = 'https://www.elryan.com/img/500/500/resize/catalog/product';
const SITE = 'https://www.elryan.com';

export const ELRYAN_INDEX = {
  ar: 'vue_storefront_magento_ar',
  en: 'vue_storefront_magento_en',
};

export const DEFAULT_TTL = 10 * 60 * 1000;
export const TREE_TTL = 60 * 60 * 1000;

const LIST_SOURCE = [
  'id', 'sku', 'name', 'price', 'final_price', 'special_price', 'iqd_price',
  'image', 'thumbnail', 'small_image', 'brand', 'brand_details',
  'category', 'category_ids', 'url_path', 'url_key', 'slug',
  'stock', 'status', 'visibility', 'type_id', 'configurable_children',
];

const DETAIL_SOURCE = [
  ...LIST_SOURCE,
  'description', 'short_description', 'media_gallery', 'attributes_metadata',
];

export function absImage(path = '') {
  const p = String(path || '').trim();
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return `${IMG_BASE}${p.startsWith('/') ? p : `/${p}`}`;
}

export function productUrl(urlPath = '', lang = 'ar') {
  const path = String(urlPath || '').replace(/^\//, '');
  if (!path) return `${SITE}/${lang}/`;
  return `${SITE}/${lang}/${path}`;
}

export function extractBarcodeFromSku(sku = '') {
  const m = String(sku || '').match(/^(\d{8,14})(?:-|$)/);
  return m?.[1] || '';
}

export function formatIqdPrice(product = {}) {
  const n = Number(product.iqd_price ?? product.final_price ?? product.price ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  // iqd_price عادة بالدينار؛ price بالدولار
  const amount = product.iqd_price != null ? n : Math.round(n * 1540);
  return `${Math.round(amount).toLocaleString('ar-IQ')} د.ع`;
}

async function esSearch(index, type, body, { ttl = 0, cacheKey = '' } = {}) {
  const key = cacheKey || (ttl > 0 ? `elryan:es:${index}:${type}:${JSON.stringify(body)}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const url = `${API_BASE}/${index}/${type}/_search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'catalog-hub/2.0',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || data.code >= 400) {
    const msg = data?.result?.reason || data?.result || data?.error?.reason || `Elryan ES ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg).slice(0, 160));
  }
  if (key) cacheSet(key, data);
  return data;
}

export async function searchIndex(lang, type, body, opts = {}) {
  const index = ELRYAN_INDEX[lang] || ELRYAN_INDEX.ar;
  return esSearch(index, type, body, opts);
}

/** بحث متوازٍ عربي + إنجليزي — للأداء والدقة ثنائية اللغة */
export async function searchBoth(type, bodyFactory, opts = {}) {
  const [ar, en] = await Promise.all([
    searchIndex('ar', type, typeof bodyFactory === 'function' ? bodyFactory('ar') : bodyFactory, opts).catch(() => null),
    searchIndex('en', type, typeof bodyFactory === 'function' ? bodyFactory('en') : bodyFactory, opts).catch(() => null),
  ]);
  return { ar, en };
}

export function hitsOf(result) {
  return result?.hits?.hits || [];
}

export function totalOf(result) {
  const t = result?.hits?.total;
  if (typeof t === 'number') return t;
  return Number(t?.value || 0);
}

export { LIST_SOURCE, DETAIL_SOURCE, SITE, IMG_BASE, API_BASE };

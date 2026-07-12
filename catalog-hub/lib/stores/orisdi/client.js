import { cacheGet, cacheSet } from '../../core/cache.js';

export const SITE = 'https://orisdi.com';
export const DEFAULT_TTL = 10 * 60 * 1000;
export const DETAIL_TTL = 30 * 60 * 1000;
const UA = 'catalog-hub/2.0 (orisdi)';

import { upgradeImageUrl } from '../../core/images.js';

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  let out = u;
  if (!out.startsWith('http')) {
    if (out.startsWith('//')) out = `https:${out}`;
    else if (out.startsWith('/')) out = `${SITE}${out}`;
    else out = u;
  }
  return upgradeImageUrl(out);
}

export function stripHtml(html = '') {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shopify يُرجع السعر بالسنتات */
export function formatOrisdiPrice(cents, { compareAt = null } = {}) {
  const n = Number(cents);
  if (!Number.isFinite(n) || n <= 0) return '';
  const formatted = (n / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const orig = Number(compareAt);
  if (Number.isFinite(orig) && orig > n) {
    const was = (orig / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${formatted} (was $${was})`;
  }
  return `$${formatted}`;
}

export function variantBarcode(variant = {}) {
  const barcode = String(variant.barcode || '').replace(/\D/g, '');
  if (barcode.length >= 8) return barcode;
  const sku = String(variant.sku || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(sku) ? sku : '';
}

export function productUrl(handle = '') {
  const h = String(handle || '').trim();
  return h ? `${SITE}/products/${encodeURIComponent(h)}` : '';
}

export function rememberHandle(productId, handle, { ttl = DETAIL_TTL * 6 } = {}) {
  const id = String(productId || '').trim();
  const h = String(handle || '').trim();
  if (!id || !h) return;
  cacheSet(`orisdi:id2handle:${id}`, h, ttl);
  cacheSet(`orisdi:handle2id:${h}`, id, ttl);
}

export function resolveHandle(productId = '') {
  const raw = String(productId || '').trim();
  if (!raw) return '';
  if (!/^\d+$/.test(raw)) return raw;
  return cacheGet(`orisdi:id2handle:${raw}`, DETAIL_TTL * 6) || '';
}

export async function shopifyFetch(path, { lang = 'ar', params = {}, ttl = 0, cacheKey = '' } = {}) {
  const prefix = lang === 'en' ? '/en' : '';
  const key = cacheKey || (ttl > 0 ? `orisdi:${lang}:${path}:${JSON.stringify(params)}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const url = new URL(`${SITE}${prefix}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
      'Accept-Language': lang === 'en' ? 'en-US,en;q=0.9' : 'ar-IQ,ar;q=0.9',
    },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Orisdi ${res.status}`);
  }
  if (key) cacheSet(key, data, ttl);
  return data;
}

export async function fetchProductJs(handle, { lang = 'ar' } = {}) {
  const h = String(handle || '').trim();
  if (!h) return null;
  const prefix = lang === 'en' ? '/en' : '';
  const cacheKey = `orisdi:js:${lang}:${h}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const url = `${SITE}${prefix}/products/${encodeURIComponent(h)}.js`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (data) cacheSet(cacheKey, data, DETAIL_TTL);
  return data;
}

export async function searchHtmlMeta(query = '') {
  const q = String(query || '').trim();
  if (!q) return null;
  const cacheKey = `orisdi:search:${q}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const url = `${SITE}/search?q=${encodeURIComponent(q)}&type=product`;
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': UA,
      'Accept-Language': 'ar-IQ,ar;q=0.9',
    },
    signal: AbortSignal.timeout(12_000),
  });
  const html = await res.text();
  const match = html.match(/var meta = (\{[\s\S]*?\});\s*\n/);
  if (!match) return null;
  try {
    const meta = JSON.parse(match[1]);
    cacheSet(cacheKey, meta, DEFAULT_TTL);
    return meta;
  } catch {
    return null;
  }
}

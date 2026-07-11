import { cacheGet, cacheSet } from '../../core/cache.js';

export const API_BASE = 'https://khaton.beauty/api/v1';
export const SITE = 'https://khaton.beauty';
export const DEFAULT_TTL = 10 * 60 * 1000;
export const DETAIL_TTL = 20 * 60 * 1000;
const UA = 'catalog-hub/2.0 (khaton)';

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${SITE}${u}`;
  return u;
}

/** الأسعار بالهللة (÷100 = ر.س) */
export function formatKhatonPrice(amount, { original = null } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '';
  const cur = 'ر.س';
  const formatted = (n / 100).toLocaleString('ar-SA', { maximumFractionDigits: 2 });
  const orig = Number(original);
  if (Number.isFinite(orig) && orig > n) {
    const was = (orig / 100).toLocaleString('ar-SA', { maximumFractionDigits: 2 });
    return `${formatted} ${cur} (كان ${was} ${cur})`;
  }
  return `${formatted} ${cur}`;
}

export function extractBarcodeFromSku(sku = '') {
  const raw = String(sku || '').trim();
  const m = raw.match(/-(\d{8,14})$/);
  return m?.[1] || raw.replace(/\D/g, '');
}

export function productUrl(id = '') {
  const pid = String(id || '').trim();
  return pid ? `${SITE}/product/${pid}` : '';
}

export async function khatonFetch(path, { params = {}, ttl = 0, cacheKey = '', lang = '' } = {}) {
  const langTag = lang ? `:lang=${lang}` : '';
  const key = cacheKey || (ttl > 0 ? `khaton:${path}:${JSON.stringify(params)}${langTag}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  const headers = { Accept: 'application/json', 'User-Agent': UA };
  if (lang) headers.lang = lang;

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Khaton API ${res.status}`;
    throw new Error(msg);
  }
  if (key) cacheSet(key, data);
  return data;
}

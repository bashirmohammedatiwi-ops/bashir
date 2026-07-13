import { cacheGet, cacheSet } from '../../core/cache.js';
import { upgradeImageUrl } from '../../core/images.js';

export const SITE = 'https://niceonesa.com';
export const DEFAULT_TTL = 10 * 60 * 1000;
export const LIST_TTL = 8 * 60 * 1000;
export const DETAIL_TTL = 20 * 60 * 1000;
export const CATEGORY_TTL = 30 * 60 * 1000;

const UA = 'catalog-hub/2.0 (niceone)';

export function langPath(lang = 'ar') {
  return lang === 'en' ? '/en' : '/ar';
}

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  let out = u;
  if (!out.startsWith('http')) {
    if (out.startsWith('//')) out = `https:${out}`;
    else if (out.startsWith('/')) out = `${SITE}${out}`;
  }
  out = out
    .replace(/-(\d+)x(\d+)(?=\.(png|jpe?g|webp))/i, '')
    .replace(/\?format=(png|auto)/i, '?format=auto');
  return upgradeImageUrl(out);
}

export function productIdFromRef(idOrSlug = '') {
  const raw = String(idOrSlug || '').trim().replace(/^\/+|\/+$/g, '');
  const fromSlug = raw.match(/-n(\d+)$/i)?.[1];
  if (fromSlug) return fromSlug;
  if (/^\d+$/.test(raw)) return raw;
  return raw;
}

export function slugFromUrl(url = '') {
  const path = String(url || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/(ar|en)\//, '')
    .split('?')[0]
    .replace(/\/$/, '');
  return path;
}

export function productUrl(idOrSlug = '', { lang = 'ar' } = {}) {
  const raw = String(idOrSlug || '').trim();
  if (!raw) return `${SITE}${langPath(lang)}/`;
  if (raw.startsWith('http')) return raw;
  if (raw.includes('/') || raw.includes('-n')) {
    return `${SITE}${langPath(lang)}/${raw.replace(/^\/(ar|en)\//, '')}`;
  }
  return `${SITE}${langPath(lang)}/product-n${raw}`;
}

export function categoryUrl(categoryPath = '', { lang = 'ar', page = 1 } = {}) {
  const path = String(categoryPath || '').trim().replace(/^\/+|\/+$/g, '');
  const base = path ? `${SITE}${langPath(lang)}/${path}` : `${SITE}${langPath(lang)}/`;
  if (page > 1) return `${base}?page=${page}`;
  return base;
}

export function searchUrl(query = '', { lang = 'ar' } = {}) {
  const q = String(query || '').trim();
  return `${SITE}${langPath(lang)}/search/?q=${encodeURIComponent(q)}`;
}

export function formatSarPrice(value = '', { original = null } = {}) {
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) {
    const text = String(value || '').trim();
    return text || '';
  }
  const cur = 'ر.س';
  const formatted = n.toLocaleString('ar-SA', { maximumFractionDigits: 2 });
  const orig = Number(original);
  if (Number.isFinite(orig) && orig > n) {
    const was = orig.toLocaleString('ar-SA', { maximumFractionDigits: 2 });
    return `${formatted} ${cur} (كان ${was} ${cur})`;
  }
  return `${formatted} ${cur}`;
}

export function isValidEan(digits = '') {
  const d = String(digits || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(d);
}

export function extractBarcode(raw = '') {
  const d = String(raw || '').replace(/\D/g, '');
  return isValidEan(d) ? d : '';
}

export function barcodeFromImageUrl(url = '') {
  const file = String(url || '').split('/').pop()?.split('?')[0] || '';
  const matches = file.match(/\d{8,14}/g) || [];
  if (!matches.length) return '';

  const ean13 = matches.filter((m) => m.length === 13);
  if (ean13.length) return ean13[ean13.length - 1];

  const ean12 = matches.filter((m) => m.length === 12);
  if (ean12.length) return ean12[ean12.length - 1];

  for (const m of [...matches].reverse()) {
    if (!isValidEan(m)) continue;
    if (m.length === 10 && /^1[67]\d{8}$/.test(m)) continue;
    return m;
  }
  return '';
}

export async function niceoneFetch(url, { ttl = DEFAULT_TTL, cacheKey = '' } = {}) {
  const key = cacheKey || (ttl > 0 ? `niceone:${url}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9',
      'User-Agent': UA,
      'Accept-Language': 'ar,en;q=0.9',
    },
    signal: AbortSignal.timeout(25_000),
    redirect: 'follow',
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`NiceOne ${res.status}: ${body.slice(0, 160)}`);
  }

  if (key) cacheSet(key, body);
  return body;
}

export async function fetchPageHtml(pathOrUrl, { lang = 'ar', ttl = DEFAULT_TTL, cacheKey = '' } = {}) {
  const raw = String(pathOrUrl || '').trim();
  const url = raw.startsWith('http')
    ? raw
    : `${SITE}${langPath(lang)}/${raw.replace(/^\/(ar|en)\//, '').replace(/^\/+/, '')}`;
  return niceoneFetch(url, {
    ttl,
    cacheKey: cacheKey || `niceone:page:${lang}:${url}`,
  });
}

export function parseNuxtPayload(html = '') {
  const m = String(html || '').match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

export function revivePayloadNode(payload, index, seen = new Set()) {
  if (!Array.isArray(payload)) return null;
  if (index < 0 || index >= payload.length || seen.has(index)) return null;
  seen.add(index);
  const value = payload[index];
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'number' ? revivePayloadNode(payload, item, seen) : item));
  }
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = typeof val === 'number' ? revivePayloadNode(payload, val, seen) : val;
  }
  return out;
}

export function findProductNodeIndex(payload, productId = '') {
  const target = String(productId || '').trim();
  if (!Array.isArray(payload) || !target) return -1;
  for (let i = 0; i < payload.length; i += 1) {
    const row = payload[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    if (!('id' in row) || !('name' in row)) continue;
    const idVal = payload[row.id];
    if (String(idVal) === target) return i;
  }
  return -1;
}

export function findCategoriesArrayIndex(payload) {
  if (!Array.isArray(payload)) return -1;
  for (let i = 0; i < payload.length; i += 1) {
    const row = payload[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    if (!('categories' in row)) continue;
    const cats = row.categories;
    if (typeof cats !== 'number' || !Array.isArray(payload[cats])) continue;
    const first = payload[payload[cats][0]];
    if (first && typeof first === 'object' && first.seo_name && first.category_id) return cats;
  }
  return -1;
}

import { cacheGet, cacheSet } from '../../core/cache.js';
import { upgradeImageUrl } from '../../core/images.js';

export const SITE = 'https://www.beautyway-iq.com';
export const DEFAULT_TTL = 10 * 60 * 1000;
export const LIST_TTL = 8 * 60 * 1000;
export const DETAIL_TTL = 20 * 60 * 1000;

const UA = 'catalog-hub/2.0 (beautyway)';

export function decodeHtml(text = '') {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function stripHtml(html = '') {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function absUrl(path = '') {
  const p = String(path || '').trim();
  if (!p) return '';
  if (p.startsWith('http')) return upgradeImageUrl(p);
  return upgradeImageUrl(`${SITE}${p.startsWith('/') ? p : `/${p}`}`);
}

export function langPrefix(lang = 'ar') {
  return lang === 'en' ? '/en' : '';
}

export function shopUrl({ lang = 'ar', category = '', brand = '', search = '', page = 1 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', String(category));
  if (brand) params.set('brand', String(brand));
  if (search) params.set('search', String(search));
  if (page > 1) params.set('page', String(page - 1));
  const qs = params.toString();
  return `${SITE}${langPrefix(lang)}/shop${qs ? `?${qs}` : ''}`;
}

export function productUrl(idOrSlug = '', { lang = 'ar' } = {}) {
  const raw = String(idOrSlug || '').trim();
  if (!raw) return `${SITE}${langPrefix(lang)}/shop`;
  if (/^\d+$/.test(raw)) return `${SITE}${langPrefix(lang)}/node/${raw}`;
  const slug = raw.replace(/^\/+/, '').replace(/^(ar|en)\//, '');
  return `${SITE}${langPrefix(lang)}/${slug}`;
}

export function formatIqdPrice(value = '') {
  const digits = String(value || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n.toLocaleString('en-US')} دينار`;
}

export function isValidEan(digits = '') {
  const d = String(digits || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(d);
}

export function extractBarcode(raw = '') {
  const d = String(raw || '').replace(/\D/g, '');
  return isValidEan(d) ? d : '';
}

export async function beautywayFetch(url, { ttl = DEFAULT_TTL, cacheKey = '' } = {}) {
  const key = cacheKey || (ttl > 0 ? `beautyway:${url}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': UA,
      'Accept-Language': 'ar,en;q=0.9',
    },
    signal: AbortSignal.timeout(25_000),
    redirect: 'follow',
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`BeautyWay ${res.status}: ${body.slice(0, 120)}`);
  }

  if (key) cacheSet(key, body);
  return body;
}

export async function fetchShopHtml(opts = {}) {
  const url = shopUrl(opts);
  return beautywayFetch(url, {
    ttl: LIST_TTL,
    cacheKey: `beautyway:shop:${url}`,
  });
}

export async function fetchProductHtml(idOrSlug, { lang = 'ar' } = {}) {
  const url = productUrl(idOrSlug, { lang });
  return beautywayFetch(url, {
    ttl: DETAIL_TTL,
    cacheKey: `beautyway:detail:${lang}:${url}`,
  });
}

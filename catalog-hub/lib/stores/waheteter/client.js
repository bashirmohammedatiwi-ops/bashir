import { cacheGet, cacheSet } from '../../core/cache.js';

export const SITE = 'https://waheteter.com';
export const API_BASE = `${SITE}/wp-json/wc/store/v1`;
export const DEFAULT_TTL = 10 * 60 * 1000;
export const DETAIL_TTL = 20 * 60 * 1000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BROWSER_HEADERS = {
  Accept: 'application/json, text/html, */*',
  'Accept-Language': 'ar,en;q=0.9',
  Referer: `${SITE}/`,
  Origin: SITE,
  'User-Agent': UA,
};

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${SITE}${u}`;
  return u;
}

export function stripHtml(html = '') {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatWaheteterPrice(prices = {}) {
  const amount = Number(prices.price ?? prices.regular_price);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const minor = Number(prices.currency_minor_unit ?? 0);
  const value = minor > 0 ? amount / (10 ** minor) : amount;
  const suffix = String(prices.currency_suffix || prices.currency_symbol || 'د.ل').trim();
  const formatted = value.toLocaleString('ar-LY', { maximumFractionDigits: minor > 0 ? 2 : 0 });
  const regular = Number(prices.regular_price);
  const sale = Number(prices.sale_price);
  if (Number.isFinite(regular) && Number.isFinite(sale) && sale > 0 && sale < regular) {
    const wasMinor = minor > 0 ? regular / (10 ** minor) : regular;
    const was = wasMinor.toLocaleString('ar-LY', { maximumFractionDigits: minor > 0 ? 2 : 0 });
    return `${formatted} ${suffix} (كان ${was} ${suffix})`;
  }
  return `${formatted} ${suffix}`.trim();
}

export function productUrl(slug = '', id = '') {
  const s = String(slug || '').trim();
  if (s) return `${SITE}/product/${s}/`;
  const pid = String(id || '').trim();
  return pid ? `${SITE}/?p=${pid}` : '';
}

export function variantBarcode(row = {}) {
  const sku = String(row.sku || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(sku) ? sku : '';
}

function buildApiUrls(path, params = {}) {
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  const urls = [];

  const jsonUrl = new URL(`${API_BASE}${apiPath}`);
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    jsonUrl.searchParams.set(k, String(v));
  }
  urls.push(jsonUrl);

  for (const base of [`${SITE}/`, `${SITE}/index.php`]) {
    const restUrl = new URL(base);
    const restParams = new URLSearchParams(restUrl.search);
    restParams.set('rest_route', `/wc/store/v1${apiPath}`);
    for (const [k, v] of Object.entries(params)) {
      if (v == null || v === '') continue;
      restParams.set(k, String(v));
    }
    restUrl.search = restParams.toString();
    urls.push(restUrl);
  }

  return urls;
}

async function fetchJsonUrl(url) {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(15_000),
    redirect: 'follow',
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function fetchHtml(pathOrUrl, { ttl = 0, cacheKey = '' } = {}) {
  const key = cacheKey || (ttl > 0 ? `waheteter:html:${pathOrUrl}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const url = String(pathOrUrl || '').startsWith('http')
    ? String(pathOrUrl)
    : new URL(pathOrUrl, SITE).toString();

  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, Accept: 'text/html,application/xhtml+xml, */*' },
    signal: AbortSignal.timeout(15_000),
    redirect: 'follow',
  });
  const html = await res.text();
  if (!res.ok) throw new Error(`Waheteter HTML ${res.status}`);
  if (key) cacheSet(key, html, ttl);
  return html;
}

export async function waheteterFetch(path, { params = {}, ttl = 0, cacheKey = '' } = {}) {
  const key = cacheKey || (ttl > 0 ? `waheteter:${path}:${JSON.stringify(params)}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  let lastError = null;
  for (const url of buildApiUrls(path, params)) {
    try {
      const { res, data } = await fetchJsonUrl(url);
      if (res.status === 403 || res.status === 401) {
        lastError = new Error(`Waheteter API ${res.status}`);
        continue;
      }
      if (!res.ok) {
        const msg = data?.message || `Waheteter API ${res.status}`;
        throw new Error(msg);
      }

      const out = {
        data,
        meta: {
          total: Number(res.headers.get('x-wp-total') || 0),
          totalPages: Number(res.headers.get('x-wp-totalpages') || 0),
        },
      };
      if (key) cacheSet(key, out, ttl);
      return out;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Waheteter API failed');
}

export function searchHtmlUrl(query = '') {
  const q = String(query || '').trim();
  const url = new URL(SITE);
  url.searchParams.set('post_type', 'product');
  url.searchParams.set('s', q);
  return url.toString();
}

import { cacheGet, cacheSet } from '../../core/cache.js';

const SITE = 'https://www.faces.ae';
const STORE = 'Sites-Faces_AE-Site';

export const DEFAULT_TTL = 10 * 60 * 1000;
export const DETAIL_TTL = 20 * 60 * 1000;
export const LIST_TTL = 8 * 60 * 1000;

const LOCALES = {
  ar: 'ar_AE',
  en: 'en_AE',
};

function localePath(lang = 'ar') {
  return LOCALES[lang] || LOCALES.ar;
}

function storefrontBase(lang = 'ar') {
  return `${SITE}/on/demandware.store/${STORE}/${localePath(lang)}`;
}

function decodeHtml(text = '') {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripHtml(html = '') {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function absUrl(path = '') {
  const p = String(path || '').trim();
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return `${SITE}${p.startsWith('/') ? p : `/${p}`}`;
}

export function productPageUrl(path = '', lang = 'ar') {
  const p = String(path || '').trim();
  if (!p) return `${SITE}/${lang}/`;
  if (p.startsWith('http')) return p;
  if (p.startsWith(`/${lang}/`)) return `${SITE}${p}`;
  if (p.startsWith('/ar/') || p.startsWith('/en/')) return `${SITE}${p}`;
  return `${SITE}/${lang}${p.startsWith('/') ? p : `/${p}`}`;
}

export function formatAedPrice(product = {}) {
  const sales = product?.price?.sales;
  if (sales?.formatted) {
    const plain = decodeHtml(sales.formatted).replace(/&#x2066;|&#x2069;/g, '').trim();
    if (plain) return plain;
  }
  const value = Number(sales?.value ?? product?.price ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '';
  return `${Math.round(value).toLocaleString('ar-AE')} درهم`;
}

export function normalizePid(pid = '') {
  return String(pid || '').trim();
}

/** يحاول تصحيح حساسية الأحرف لمعرّفات SFCC (PM_CHANEL ≠ pm_CHANEL). */
export async function resolveProductPid(pid = '', { lang = 'ar' } = {}) {
  const id = normalizePid(pid);
  if (!id) return '';

  const candidates = [...new Set([
    id,
    id.replace(/^pm_/i, 'PM_'),
    id.replace(/^PM_/, 'pm_'),
    id.replace(/^pm/i, 'PM'),
    id.replace(/^PM/, 'pm'),
  ].filter(Boolean))];

  for (const candidate of candidates) {
    const product = await fetchProductVariation(candidate, { lang, ttl: 0 }).catch(() => null);
    if (product?.id) return String(product.id);
  }
  return id;
}

export async function facesFetch(path, {
  lang = 'ar',
  params = {},
  ttl = DEFAULT_TTL,
  cacheKey = '',
  headers = {},
} = {}) {
  const key = cacheKey || (ttl > 0 ? `faces:${lang}:${path}:${JSON.stringify(params)}` : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const url = new URL(`${storefrontBase(lang)}/${path.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json, text/html;q=0.9',
      'User-Agent': 'catalog-hub/2.0',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    },
    signal: AbortSignal.timeout(20_000),
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const msg = typeof body === 'object' ? JSON.stringify(body).slice(0, 160) : String(body).slice(0, 160);
    throw new Error(`Faces ${res.status}: ${msg}`);
  }

  if (key) cacheSet(key, body);
  return body;
}

export async function fetchProductVariation(pid, { lang = 'ar', ttl = DETAIL_TTL } = {}) {
  const id = normalizePid(pid);
  if (!id) return null;
  const data = await facesFetch('Product-Variation', {
    lang,
    params: { pid: id, quantity: 1 },
    ttl,
    cacheKey: `faces:var:${lang}:${id}`,
  });
  return data?.product || null;
}

export async function fetchVariationUrl(url, { lang = 'ar', ttl = DETAIL_TTL } = {}) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http')) {
    const res = await fetch(raw, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'catalog-hub/2.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => null);
    return data?.product || null;
  }
  const path = raw.replace(storefrontBase(lang), '').replace(/^\//, '');
  const data = await facesFetch(path, { lang, ttl, cacheKey: `faces:varurl:${lang}:${path}` });
  return data?.product || null;
}

const SEARCH_PERMALINK_CACHE = new Map();

function decodePermalink(raw = '') {
  return String(raw || '').replace(/&amp;/g, '&').trim();
}

function paramsFromPermalink(permalink = '') {
  const link = decodePermalink(permalink);
  if (!link) return null;
  try {
    const url = link.startsWith('http') ? new URL(link) : new URL(link, SITE);
    const params = Object.fromEntries(url.searchParams.entries());
    delete params.start;
    delete params.sz;
    const brand = url.pathname.match(/\/brands\/([^/?]+)/i)?.[1];
    if (brand && !params.cgid) params.cgid = brand;
    return Object.keys(params).length ? params : null;
  } catch {
    return null;
  }
}

function rememberSearchPermalink(lang, q, permalink = '') {
  const params = paramsFromPermalink(permalink);
  if (!params) return null;
  const key = `${lang}:${String(q || '').trim().toLowerCase()}`;
  SEARCH_PERMALINK_CACHE.set(key, params);
  return params;
}

function getSearchPermalinkParams(lang, q) {
  const key = `${lang}:${String(q || '').trim().toLowerCase()}`;
  return SEARCH_PERMALINK_CACHE.get(key) || null;
}

export async function fetchListingHtml({
  lang = 'ar',
  q = '',
  cgid = '',
  page = 1,
  limit = 30,
} = {}) {
  const safePage = Math.max(1, page);
  const sz = Math.min(Math.max(1, limit), 48);
  const start = (safePage - 1) * sz;
  const query = String(q || '').trim();
  const category = String(cgid || '').trim();
  const cacheKey = `faces:list:${lang}:${query || category}:${safePage}:${sz}`;

  // أقسام SFCC: Search-UpdateGrid يحترم start/sz (Search-Show يعيد الصفحة الأولى دائماً).
  if (category) {
    return facesFetch('Search-UpdateGrid', {
      lang,
      params: { cgid: category, start, sz },
      ttl: LIST_TTL,
      cacheKey,
    });
  }

  if (!query) {
    return facesFetch('Search-Show', {
      lang,
      params: { start, sz },
      ttl: LIST_TTL,
      cacheKey,
    });
  }

  let gridParams = safePage > 1 ? getSearchPermalinkParams(lang, query) : null;
  if (!gridParams) {
    const firstHtml = await facesFetch('Search-Show', {
      lang,
      params: { q: query, start: 0, sz },
      ttl: LIST_TTL,
      cacheKey: `faces:list:first:${lang}:${query}:${sz}`,
    });
    const permalink = String(firstHtml || '').match(/class="permalink"[^>]*value="([^"]+)"/i)?.[1] || '';
    gridParams = rememberSearchPermalink(lang, query, permalink);
    if (!gridParams || safePage === 1) return firstHtml;
  }

  return facesFetch('Search-UpdateGrid', {
    lang,
    params: { ...gridParams, start, sz },
    ttl: LIST_TTL,
    cacheKey,
  });
}

export function imageFromProduct(product = {}) {
  const images = product?.images || {};
  const pick = (entry) => {
    if (!entry) return '';
    if (Array.isArray(entry)) return absUrl(entry[0]?.url || entry[0]?.absUrl || '');
    if (typeof entry === 'string') return absUrl(entry);
    return absUrl(entry.url || entry.absUrl || '');
  };
  return pick(images.large) || pick(images['hi-res']) || pick(images.small) || '';
}

export function galleryFromProduct(product = {}) {
  const images = product?.images || {};
  const urls = [];
  for (const key of ['large', 'hi-res', 'small']) {
    const entry = images[key];
    if (Array.isArray(entry)) {
      for (const item of entry) urls.push(absUrl(item?.url || item?.absUrl || ''));
    } else if (entry) {
      urls.push(absUrl(entry.url || entry.absUrl || entry));
    }
  }
  return [...new Set(urls.filter(Boolean))];
}

export function extractBarcode(product = {}) {
  const ean = String(product?.EAN || product?.ean || product?.akeneoVariant || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(ean) ? ean : '';
}

export {
  stripHtml,
  decodeHtml,
  SITE,
  LOCALES,
};

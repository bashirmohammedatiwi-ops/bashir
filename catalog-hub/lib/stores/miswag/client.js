/**
 * Miswag API client — https://miswag.com
 * مصدر البيانات: ganesh-lama.miswag.com + Typesense
 */
import crypto from 'crypto';
import { cacheGet, cacheSet } from '../../core/cache.js';

export const SITE = 'https://miswag.com';
const API_BASE = 'https://ganesh-lama.miswag.com';
const CLIENT_ID = process.env.MISWAG_CLIENT_ID || '4';
const HANDSHAKE_ENV = process.env.MISWAG_HANDSHAKE_ENV || 'prod';

const AUTH_TTL = 50 * 60 * 1000;
const SEARCH_CFG_TTL = 30 * 60 * 1000;
const DETAIL_TTL = 10 * 60 * 1000;

let authToken = null;
let authTokenAt = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function parseTitle(title) {
  if (!title) return { ar: '', en: '' };
  if (typeof title === 'string') return { ar: title.trim(), en: title.trim() };
  return {
    ar: String(title.AR || title.ar || '').trim(),
    en: String(title.EN || title.en || '').trim(),
  };
}

export function formatPrice(price = {}) {
  if (typeof price === 'string' || typeof price === 'number') {
    const n = Number(price);
    return Number.isFinite(n) ? `${Math.round(n).toLocaleString('ar-IQ')} د.ع` : String(price);
  }
  const value = price.value ?? price.original_value;
  if (value == null || value === '') return '';
  const n = Number(value);
  const cur = price.currency === 'IQD' ? 'د.ع' : (price.currency || 'د.ع');
  const formatted = Number.isFinite(n) ? Math.round(n).toLocaleString('ar-IQ') : String(value);
  const orig = price.original_value && Number(price.original_value) > Number(value)
    ? ` (كان ${Math.round(Number(price.original_value)).toLocaleString('ar-IQ')} ${cur})`
    : '';
  return `${formatted} ${cur}${orig}`;
}

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return u;
}

async function getAuthToken() {
  if (authToken && Date.now() - authTokenAt < AUTH_TTL) return authToken;
  const deviceId = Buffer.from(`${CLIENT_ID}|${crypto.randomUUID()}|${HANDSHAKE_ENV}`).toString('base64');
  const res = await fetch(`${API_BASE}/auth/v1/public/anonymous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Device-Id': deviceId,
      'Client-Id': CLIENT_ID,
      'Accept-Language': 'ar',
    },
    body: '',
  });
  const data = await res.json();
  const token = data?.data?.token;
  if (!token) throw new Error(data?.message || 'Miswag auth failed');
  authToken = token;
  authTokenAt = Date.now();
  return token;
}

export async function miswagFetch(path, { params = {}, retries = 2 } = {}) {
  const token = await getAuthToken();
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': CLIENT_ID,
        'Accept-Language': 'ar',
        Accept: 'application/json',
      },
    });
    if (res.status === 401 && attempt < retries) {
      authToken = null;
      await getAuthToken();
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      if (attempt < retries && res.status >= 500) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      throw new Error(data.message || data.error || `Miswag ${res.status}`);
    }
    return data.data ?? data;
  }
  throw new Error('Miswag request failed');
}

async function getSearchConfig() {
  const cached = cacheGet('miswag:typesense:cfg', SEARCH_CFG_TTL);
  if (cached) return cached;

  if (process.env.MISWAG_TYPESENSE_HOST && process.env.MISWAG_TYPESENSE_API_KEY) {
    const cfg = {
      host: process.env.MISWAG_TYPESENSE_HOST,
      apiKey: process.env.MISWAG_TYPESENSE_API_KEY,
      index: process.env.MISWAG_TYPESENSE_INDEX || 'miswag-items-search',
      preset: process.env.MISWAG_TYPESENSE_PRESET || 'miswag-items-search',
    };
    return cacheSet('miswag:typesense:cfg', cfg);
  }

  for (const pageUrl of [`${SITE}/`, `${SITE}/l1-categories/beauty`, `${SITE}/search?q=test`]) {
    try {
      const res = await fetch(pageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/2.0)', Accept: 'text/html' },
      });
      const html = await res.text();
      const host = html.match(/typesenseHost:"([^"]+)"/)?.[1]
        || html.match(/PUBLIC_TYPESENSE_HOST:"([^"]+)"/)?.[1];
      const apiKey = html.match(/typesenseSearchOnly:"([^"]+)"/)?.[1]
        || html.match(/PUBLIC_TYPESENSE_SEARCH_ONLY:"([^"]+)"/)?.[1];
      const preset = html.match(/searchPreset:"([^"]+)"/)?.[1] || 'miswag-items-search';
      if (host && apiKey) {
        return cacheSet('miswag:typesense:cfg', { host, apiKey, index: 'miswag-items-search', preset });
      }
    } catch { /* next */ }
  }
  throw new Error('Miswag Typesense config not found');
}

export async function typesenseMultiSearch(searches = []) {
  if (!searches.length) return [];
  const cfg = await getSearchConfig();
  const url = new URL(`https://${cfg.host}/multi_search`);
  url.searchParams.set('x-typesense-api-key', cfg.apiKey);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Accept: 'application/json',
      Referer: `${SITE}/`,
      'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/2.0)',
    },
    body: JSON.stringify({
      searches: searches.map((s) => ({ collection: cfg.index, ...s })),
    }),
  });
  if (!res.ok) throw new Error(`Typesense ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function typesenseSearch(query, {
  page = 1,
  perPage = 30,
  filterBy = '',
  sortBy = '',
  strict = false,
} = {}) {
  const q = String(query || '').trim() || '*';
  const cfg = await getSearchConfig();
  const search = { q, per_page: perPage, page, enable_overrides: true };
  if (q === '*') {
    search.query_by = 'title_AR';
  } else if (cfg.preset && !strict && !filterBy) {
    search.preset = cfg.preset;
  } else {
    search.query_by = 'title_AR,title_EN,brand,keywords,barcode';
    search.num_typos = 2;
    if (strict) {
      search.num_typos = 1;
      search.drop_tokens_threshold = 0;
      search.prioritize_exact_match = true;
    }
  }
  if (filterBy) search.filter_by = filterBy;
  if (sortBy) search.sort_by = sortBy;

  const [result = {}] = await typesenseMultiSearch([search]);
  return { hits: result.hits || [], found: result.found || 0, error: result.error };
}

export { DETAIL_TTL, cacheGet, cacheSet };

import { cacheGet, cacheSet } from '../../core/cache.js';

const API_BASE = 'https://api.salla.dev/store/v1';
const DEFAULT_TTL = 10 * 60 * 1000;

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return u;
}

export function formatSallaPrice(product = {}) {
  const amount = product.sale_price ?? product.price ?? product.starting_price;
  if (amount == null || amount === '') return '';
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  const cur = product.currency === 'USD' ? '$' : 'ر.س';
  const formatted = n.toLocaleString('ar-SA', { maximumFractionDigits: 2 });
  const regular = Number(product.regular_price);
  const onSale = product.is_on_sale && Number.isFinite(regular) && regular > n;
  const was = onSale ? ` (كان ${regular.toLocaleString('ar-SA')} ${cur})` : '';
  return `${formatted} ${cur}${was}`;
}

export function createSallaClient(storeIdentifier, { cachePrefix = 'salla' } = {}) {
  const storeId = String(storeIdentifier || '').trim();
  if (!storeId) throw new Error('Salla store identifier required');

  async function sallaFetch(path, { params = {}, ttl = 0 } = {}) {
    const cacheKey = ttl > 0
      ? `${cachePrefix}:${path}:${JSON.stringify(params)}`
      : '';
    if (cacheKey) {
      const cached = cacheGet(cacheKey, ttl);
      if (cached) return cached;
    }

    const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(params)) {
      if (value == null || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Store-Identifier': storeId,
      },
      signal: AbortSignal.timeout(8_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const msg = data?.error?.message || data?.message || `Salla API ${res.status}`;
      throw new Error(msg);
    }
    if (cacheKey) cacheSet(cacheKey, data);
    return data;
  }

  return { sallaFetch, storeIdentifier: storeId, cachePrefix };
}

export { API_BASE, DEFAULT_TTL };

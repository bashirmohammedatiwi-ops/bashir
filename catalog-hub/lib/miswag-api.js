/**
 * Miswag (مسواگ) — Iraq e-commerce catalog API
 * https://miswag.com/l1-categories/beauty
 */
import crypto from 'crypto';
import {
  findBarcodeLookup,
  lookupBarcodeProductMeta,
  buildMetaHintQueries,
  scoreStoreHintMatch,
} from './barcodes.js';

const API_BASE = 'https://ganesh-lama.miswag.com';
export const SITE = 'https://miswag.com';
export const BEAUTY_L1 = 'beauty';

const CLIENT_ID = process.env.MISWAG_CLIENT_ID || '4';
const HANDSHAKE_ENV = process.env.MISWAG_HANDSHAKE_ENV || 'prod';

let authToken = null;
let authTokenAt = 0;
const AUTH_TTL_MS = 50 * 60 * 1000;

let searchConfig = null;
let searchConfigAt = 0;
const SEARCH_CONFIG_TTL_MS = 30 * 60 * 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseTitle(title) {
  if (!title) return { ar: '', en: '' };
  if (typeof title === 'string') return { ar: title.trim(), en: title.trim() };
  return {
    ar: String(title.AR || title.ar || '').trim(),
    en: String(title.EN || title.en || '').trim(),
  };
}

export function formatMiswagPrice(price = {}) {
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
  if (authToken && Date.now() - authTokenAt < AUTH_TTL_MS) return authToken;

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

async function miswagFetch(path, { params = {}, method = 'GET', body = null, retries = 2 } = {}) {
  const token = await getAuthToken();
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': CLIENT_ID,
        'Accept-Language': 'ar',
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && attempt < retries) {
      authToken = null;
      await getAuthToken();
      continue;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const msg = data.message || data.error || `Miswag API ${res.status}`;
      if (attempt < retries && res.status >= 500) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw new Error(msg);
    }
    return data.data ?? data;
  }
  throw new Error('Miswag request failed');
}

async function getSearchConfig() {
  if (searchConfig && Date.now() - searchConfigAt < SEARCH_CONFIG_TTL_MS) return searchConfig;

  if (process.env.MISWAG_TYPESENSE_HOST && process.env.MISWAG_TYPESENSE_API_KEY) {
    searchConfig = {
      host: process.env.MISWAG_TYPESENSE_HOST,
      apiKey: process.env.MISWAG_TYPESENSE_API_KEY,
      index: process.env.MISWAG_TYPESENSE_INDEX || 'miswag-items-search',
      preset: process.env.MISWAG_TYPESENSE_PRESET || 'miswag-items-search',
    };
    searchConfigAt = Date.now();
    return searchConfig;
  }

  for (const pageUrl of [
    `${SITE}/l1-categories/beauty`,
    `${SITE}/search?q=test`,
    'https://search.miswag.com/searchanything?q=test&lang=ar',
  ]) {
    try {
      const res = await fetch(pageUrl, {
        headers: { 'User-Agent': 'catalog-hub/1.0', Accept: 'text/html' },
      });
      const html = await res.text();
      const host = html.match(/typesenseHost:"([^"]+)"/)?.[1]
        || html.match(/PUBLIC_TYPESENSE_HOST:"([^"]+)"/)?.[1];
      const apiKey = html.match(/typesenseSearchOnly:"([^"]+)"/)?.[1]
        || html.match(/PUBLIC_TYPESENSE_SEARCH_ONLY:"([^"]+)"/)?.[1];
      const preset = html.match(/searchPreset:"([^"]+)"/)?.[1] || 'miswag-items-search';
      if (host && apiKey) {
        searchConfig = { host, apiKey, index: 'miswag-items-search', preset };
        searchConfigAt = Date.now();
        return searchConfig;
      }
    } catch { /* next source */ }
  }

  throw new Error('Miswag Typesense config not found');
}

async function typesenseSearch(query, { page = 1, perPage = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return { hits: [], found: 0 };

  const cfg = await getSearchConfig();
  const url = new URL(`https://${cfg.host}/multi_search`);
  url.searchParams.set('x-typesense-api-key', cfg.apiKey);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Accept: 'application/json, text/plain, */*',
      Referer: `${SITE}/`,
      'User-Agent': 'Mozilla/5.0 (compatible; catalog-hub/1.0)',
    },
    body: JSON.stringify({
      searches: [{
        collection: cfg.index,
        q,
        preset: cfg.preset,
        per_page: perPage,
        page,
        enable_overrides: true,
      }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  const result = data.results?.[0] || {};
  if (result.error || result.code) {
    return { hits: [], found: 0, error: result.error || result.message };
  }
  if (!res.ok) {
    return { hits: [], found: 0, error: data.message || `Typesense ${res.status}` };
  }

  return { hits: result.hits || [], found: result.found || 0 };
}

function mapTypesenseHit(doc = {}, matchedBarcode = '') {
  const nameAr = String(doc.title_AR || doc.title || '').trim();
  const nameEn = String(doc.title_EN || doc.title || nameAr).trim();
  return {
    id: String(doc.id || doc.alias || doc.product_id || doc.item_id || ''),
    name: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    manufacturer: String(doc.brand || doc.facet_brand || '').trim(),
    manufacturerEn: String(doc.brand || doc.facet_brand || '').trim(),
    thumb: absImage(doc.image || doc.image_url || doc.thumb),
    price: formatMiswagPrice({
      value: doc.price_value ?? doc.price_numeric_value,
      original_value: doc.price_original_value,
      currency: doc.price_currency || 'IQD',
    }),
    barcode: matchedBarcode || '',
    sku: String(doc.alias || doc.id || ''),
    productUrl: doc.url || (doc.id ? `${SITE}/products/${doc.id}` : ''),
    category: [
      doc.l1_division_ar,
      doc.l2_division_ar,
      doc.l3_division_ar,
    ].filter(Boolean).join(' › ') || String(doc.category || '').trim(),
    brandAlias: String(doc.brand_alias || doc.vendor_alias || '').trim(),
    source: 'typesense',
  };
}

function mapListItem(item = {}) {
  const title = parseTitle(item.title);
  return {
    id: String(item.id || item.action?.id || ''),
    name: title.ar || title.en || '',
    nameEn: title.en || title.ar || '',
    manufacturer: String(item.brand || '').trim(),
    manufacturerEn: String(item.brand || '').trim(),
    thumb: absImage(item.image),
    price: formatMiswagPrice(item.price),
    barcode: '',
    sku: String(item.slug || item.id || ''),
    productUrl: item.url || (item.id ? `${SITE}/products/${item.id}` : ''),
    category: String(item.category || '').trim(),
    brandAlias: String(item.brand_alias || '').trim(),
    source: 'list',
  };
}

function scoreTextMatch(item, query) {
  const q = String(query || '').toLowerCase();
  const hay = `${item.name} ${item.nameEn} ${item.manufacturer} ${item.barcode} ${item.id}`.toLowerCase();
  if (hay.includes(q)) return 10;
  const words = q.split(/\s+/).filter(Boolean);
  return words.filter((w) => hay.includes(w)).length;
}

async function fallbackTextSearch(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return { items: [], total: 0, page, pageSize: limit };

  const data = await miswagFetch('/content/v1/items/', {
    params: { category: BEAUTY_L1, limit: Math.min(limit * 3, 48) },
  });
  const raw = (data.content || []).map(mapListItem);
  const ranked = raw
    .map((item) => ({ item, score: scoreTextMatch(item, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);

  const start = (page - 1) * limit;
  return {
    items: ranked.slice(start, start + limit),
    total: ranked.length,
    page,
    pageSize: limit,
    fallback: true,
  };
}

export async function searchProducts(query, page = 1, limit = 30) {
  const q = String(query || '').trim();
  if (!q) return { items: [], total: 0, page, pageSize: limit };

  if (/^\d{10,12}$/.test(q)) {
    try {
      const detail = await fetchProductDetail(q);
      if (detail?.id) {
        return { items: [normalizeProductSummary(detail)], total: 1, page: 1, pageSize: limit };
      }
    } catch { /* continue */ }
  }

  try {
    const ts = await typesenseSearch(q, { page, perPage: limit });
    if (ts.hits?.length) {
      return {
        items: ts.hits.map((h) => mapTypesenseHit(h.document || h)),
        total: ts.found || ts.hits.length,
        page,
        pageSize: limit,
      };
    }
  } catch {
    /* Typesense unavailable — fallback below */
  }

  return fallbackTextSearch(q, { page, limit });
}

function collectBlocks(blocks = [], out = []) {
  for (const b of blocks) {
    out.push(b);
    if (Array.isArray(b.content)) collectBlocks(b.content, out);
  }
  return out;
}

function extractGalleryImages(blocks = []) {
  const gallery = blocks.find((b) => b.type === 'gallery');
  return (gallery?.content || [])
    .map((x) => absImage(x.url))
    .filter(Boolean);
}

export async function fetchProductDetail(id) {
  const pid = String(id || '').trim();
  if (!pid) return null;

  const [detail, variations] = await Promise.all([
    miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}`),
    miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`).catch(() => null),
  ]);

  const meta = detail?.info?.meta || {};
  const blocks = collectBlocks(detail?.content || []);
  const images = extractGalleryImages(blocks);
  if (meta.image_url && !images.includes(absImage(meta.image_url))) {
    images.unshift(absImage(meta.image_url));
  }

  const varInfo = variations?.info || {};
  const shades = (varInfo.variations || []).map((v) => ({
    name: String(v.title || '').trim(),
    nameEn: String(v.title || '').trim(),
    barcode: '',
    image: absImage(v.image),
    hex: v.color || undefined,
    sku: String(v.id || ''),
    price: formatMiswagPrice(v.price),
    optionId: String(v.id || ''),
  }));

  const nameParts = String(meta.name || '').split(/\s+/);
  const brand = String(meta.brand || '').trim();

  return {
    id: String(meta.product_id || pid),
    sku: String(meta.product_id || pid),
    name: parseTitle({ AR: meta.name, EN: meta.name }).ar || meta.name || '',
    nameEn: parseTitle({ AR: meta.name, EN: meta.name }).en || meta.name || '',
    manufacturer: brand,
    manufacturerEn: brand,
    description: String(meta.description || '').trim(),
    descriptionEn: String(meta.description || '').trim(),
    price: formatMiswagPrice({ value: meta.price, original_value: meta.original_price, currency: meta.currency || 'IQD' }),
    thumb: images[0] || absImage(meta.image_url),
    images,
    shades,
    shadeCount: shades.length,
    barcode: '',
    productUrl: meta.url || meta.share_link || `${SITE}/products/${meta.product_id || pid}`,
    category: String(meta.category || '').trim(),
    categoryEn: String(meta.category || '').trim(),
    inStock: detail?.info?.size?.is_available !== false,
    raw: { detail, variations },
  };
}

export function normalizeProductSummary(product = {}) {
  return {
    id: String(product.id || ''),
    name: product.name || '',
    nameEn: product.nameEn || product.name || '',
    manufacturer: product.manufacturer || product.brand || '',
    manufacturerEn: product.manufacturerEn || product.manufacturer || '',
    thumb: absImage(product.thumb || product.image),
    price: product.price || '',
    barcode: product.barcode || '',
    sku: product.sku || product.id || '',
    productUrl: product.productUrl || product.url || '',
    category: product.category || '',
    categoryEn: product.categoryEn || product.category || '',
    shadeCount: product.shadeCount || product.shades?.length || 0,
  };
}

export function normalizeProductDetail(product = {}) {
  const summary = normalizeProductSummary(product);
  return {
    ...summary,
    description: product.description || '',
    descriptionEn: product.descriptionEn || product.description || '',
    images: (product.images || []).length ? product.images : (summary.thumb ? [summary.thumb] : []),
    shades: product.shades || [],
    shadeCount: product.shadeCount ?? (product.shades?.length || 0),
    hasShades: (product.shades?.length || 0) > 0,
  };
}

export async function fetchCategoryTree() {
  const data = await miswagFetch('/content/v1/l1_categories/tree');
  const roots = data.content || [];
  const leaves = [];

  function walk(node, path = []) {
    const name = node.name || node.alias || '';
    const alias = node.alias || String(node.id || '');
    const entry = {
      id: alias,
      slug: alias,
      name,
      nameEn: name,
      path: [...path, name].join(' › '),
      icon: absImage(node.icon),
      isLeaf: !node.l2_divisions?.length,
      children: [],
    };
    if (entry.isLeaf) leaves.push(entry);
    for (const child of node.l2_divisions || []) {
      const sub = {
        id: child.alias || String(child.id),
        slug: child.alias || String(child.id),
        name: child.name || '',
        nameEn: child.name || '',
        path: [...path, name, child.name].filter(Boolean).join(' › '),
        isLeaf: true,
        children: [],
      };
      entry.children.push(sub);
      leaves.push(sub);
    }
    return entry;
  }

  const tree = roots.map((n) => walk(n, []));
  return { tree, leaves };
}

export async function fetchCategoryProducts(categoryAlias, { page = 1, limit = 30, cursor = '' } = {}) {
  const alias = String(categoryAlias || BEAUTY_L1).trim() || BEAUTY_L1;
  const data = await miswagFetch(`/content/v1/l1_categories/${encodeURIComponent(alias)}`, {
    params: cursor ? { cursor } : {},
  });

  const gridItems = [];
  for (const block of data.content || []) {
    if (block.type === 'grid-products') gridItems.push(...(block.content || []));
  }

  if (gridItems.length) {
    return {
      items: gridItems.map(mapListItem),
      page,
      pageSize: limit,
      hasMore: Boolean(data.pagination?.cursor),
      cursor: data.pagination?.cursor || null,
    };
  }

  const list = await miswagFetch('/content/v1/items/', {
    params: { category: alias, limit: Math.min(limit, 48) },
  });
  const items = (list.content || []).map(mapListItem);
  return {
    items: items.slice(0, limit),
    page,
    pageSize: limit,
    hasMore: items.length >= limit,
    cursor: list.pagination?.cursor || null,
  };
}

export async function fetchBrands({ query = '', cursor = '', limit = 30 } = {}) {
  const data = await miswagFetch('/content/v1/brands', {
    params: { query, cursor, limit },
  });
  return {
    brands: (data.content || []).map((b) => ({
      id: String(b.alias || b.id),
      name: b.name || '',
      nameEn: b.name || '',
      thumb: absImage(b.image),
      alias: b.alias || '',
    })),
    cursor: data.pagination?.cursor || null,
  };
}

function barcodeMatches(value, barcode) {
  const a = String(value || '').replace(/\D/g, '');
  const b = String(barcode || '').replace(/\D/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 8 && b.length >= 8 && (a.endsWith(b) || b.endsWith(a))) return true;
  return false;
}

function pushUnique(results, seen, hit) {
  const key = `${hit.id}:${hit.barcode}:${hit.sku}`;
  if (seen.has(key)) return;
  seen.add(key);
  results.push(hit);
}

function extractShadeHints(title = '', shade = '') {
  const parts = [];
  const t = String(title || '').trim();
  const s = String(shade || '').trim();
  if (s && s !== 'Default Title') parts.push(s);
  const dash = t.split(/[-–—]/).pop()?.trim();
  if (dash && dash.length >= 3 && dash !== t) parts.push(dash);
  const words = t.split(/\s+/).filter((w) => w.length >= 4);
  return [...new Set([...parts, ...words.slice(-3)])].filter(Boolean);
}

function rankMiswagHintMatch(item, meta = {}) {
  let score = 0;
  const hay = `${item.name} ${item.nameEn} ${item.manufacturer}`.toLowerCase();
  const brand = String(meta.brand || '').toLowerCase();
  if (brand && (hay.includes(brand) || brand.includes(item.manufacturer?.toLowerCase() || ''))) score += 8;

  const titleWords = String(meta.title || '').toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
  score += titleWords.filter((w) => hay.includes(w)).length * 2;

  for (const shade of extractShadeHints(meta.title, meta.shade)) {
    if (hay.includes(shade.toLowerCase())) score += 12;
  }
  return score;
}

async function searchMiswagByMetaHints(meta, digits, { limit = 12 } = {}) {
  if (!meta?.brand && !meta?.title) return [];

  const queries = buildMetaHintQueries(meta);
  const results = [];
  const seen = new Set();
  const scored = [];

  for (const q of queries) {
    try {
      const ts = await typesenseSearch(q, { page: 1, perPage: 20 });
      for (const hit of ts.hits || []) {
        const doc = hit.document || hit;
        const mapped = mapTypesenseHit(doc, digits);
        const score = scoreStoreHintMatch(mapped, meta) + rankMiswagHintMatch(mapped, meta);
        if (score < 8) continue;
        scored.push({ mapped, score });
      }
    } catch { /* next query */ }
  }

  scored.sort((a, b) => b.score - a.score);
  for (const { mapped, score } of scored) {
    pushUnique(results, seen, {
      ...mapped,
      matchType: 'hint',
      matchScore: score,
      source: meta.source || 'meta-hint',
    });
    if (results.length >= limit) break;
  }
  return results;
}

export async function searchProductsByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  const results = [];
  const seen = new Set();

  // (0) فهرس يدوي محلي — مع التحقق من metadata
  const manual = findBarcodeLookup(digits);
  if (manual?.productId && (manual.store === 'miswag' || !manual.store)) {
    try {
      const detail = await fetchProductDetail(manual.productId);
      if (detail?.id) {
        const summary = normalizeProductSummary(detail);
        const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
        const score = meta ? scoreStoreHintMatch(summary, meta) : 20;
        if (!meta || score >= 8) {
          pushUnique(results, seen, {
            ...summary,
            barcode: digits,
            matchType: manual.matchType || 'lookup',
            source: 'barcode-lookup',
          });
          if (results.length) return results;
        }
      }
    } catch { /* continue */ }
  }

  // (1) Typesense — باركود كنص (قد يظهر في keywords/description/variations)
  try {
    const ts = await typesenseSearch(digits, { page: 1, perPage: 12 });
    for (const hit of ts.hits || []) {
      const doc = hit.document || hit;
      pushUnique(results, seen, mapTypesenseHit(doc, digits));
    }
    if (results.length) return results;
  } catch { /* continue */ }

  // (1b) بحث موسّع في حقول keywords/description/variations
  try {
    const cfg = await getSearchConfig();
    const url = new URL(`https://${cfg.host}/multi_search`);
    url.searchParams.set('x-typesense-api-key', cfg.apiKey);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Referer: `${SITE}/`,
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        searches: [{
          collection: cfg.index,
          q: digits,
          query_by: 'keywords,description,variations,alias,title_AR,title_EN,brand',
          per_page: 12,
          page: 1,
        }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    for (const hit of data.results?.[0]?.hits || []) {
      const doc = hit.document || hit;
      const hay = JSON.stringify(doc).replace(/\D/g, '');
      if (hay.includes(digits)) {
        pushUnique(results, seen, mapTypesenseHit(doc, digits));
      }
    }
    if (results.length) return results;
  } catch { /* continue */ }

  // (2) إذا كان الباركود يشبه معرّف منتج مسواگ (10 أرقام)
  if (/^\d{10}$/.test(digits)) {
    try {
      const detail = await fetchProductDetail(digits);
      if (detail?.id) {
        pushUnique(results, seen, { ...normalizeProductSummary(detail), barcode: digits, source: 'id' });
        if (results.length) return results;
      }
    } catch { /* continue */ }
  }

  // (3) metadata موحّد (UPC + Shopify + OBF + بحث ويب) → Typesense
  const meta = await lookupBarcodeProductMeta(digits);
  if (meta?.brand || meta?.title) {
    const hinted = await searchMiswagByMetaHints(meta, digits);
    for (const hit of hinted) pushUnique(results, seen, hit);
    if (results.length) return results.slice(0, 12);
  }

  return results.slice(0, 12);
}

export function sortProductsClient(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
  const nameOf = (p) => (p.name || p.nameEn || '').trim();
  return [...products].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const diff = priceOf(a) - priceOf(b);
      return sort === 'price_asc' ? diff : -diff;
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      const diff = nameOf(a).localeCompare(nameOf(b), 'ar', { sensitivity: 'base' });
      return sort === 'name_asc' ? diff : -diff;
    }
    return 0;
  });
}

/**
 * Miswag (مسواگ) — Iraq e-commerce catalog API
 * https://miswag.com/l1-categories/beauty
 */
import crypto from 'crypto';
import {
  findBarcodeLookup,
  upsertBarcodeLookup,
  lookupBarcodeProductMeta,
  buildMetaHintQueries,
  buildMetaFromSearchHits,
  scoreStoreHintMatch,
  parseBarcodeMetaFields,
  productLineConflicts,
  normalizeBarcodeMeta,
} from './barcodes.js';
import { searchUnifiedByStore } from './unified-barcode-index.js';
import { verifyBarcodeOnProduct } from './core/match.js';
import { fromLegacyProduct } from './core/product.js';

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

/**
 * مساعد عام لـ Typesense multi_search.
 * يقبل مصفوفة من كائنات البحث (بدون collection) ويعيد مصفوفة النتائج.
 */
async function typesenseMultiSearch(searches = []) {
  if (!searches.length) return [];
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
      searches: searches.map((s) => ({ collection: cfg.index, ...s })),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Typesense ${res.status}`);
  }

  const data = await res.json().catch(() => ({}));
  return data.results || [];
}

async function typesenseSearch(query, {
  page = 1,
  perPage = 30,
  filterBy = '',
  sortBy = '',
  queryBy = '',
  strict = false,
} = {}) {
  const q = String(query || '').trim() || '*';

  const cfg = await getSearchConfig();
  const search = {
    q,
    per_page: perPage,
    page,
    enable_overrides: true,
  };
  if (q === '*') {
    search.query_by = queryBy || 'title_AR';
  } else if (cfg.preset && !strict) {
    search.preset = cfg.preset;
    if (queryBy) search.query_by = queryBy;
  } else {
    search.query_by = queryBy || 'title_AR,title_EN,brand,keywords';
    if (strict) {
      search.num_typos = 1;
      search.drop_tokens_threshold = 0;
      search.prioritize_exact_match = true;
    }
  }
  if (filterBy) search.filter_by = filterBy;
  if (sortBy) search.sort_by = sortBy;

  const [result = {}] = await typesenseMultiSearch([search]);
  if (result.error || result.code) {
    return { hits: [], found: 0, error: result.error || result.message };
  }
  return { hits: result.hits || [], found: result.found || 0 };
}

const DIVISION_ALIAS_FIELDS = [
  'l1_division_alias',
  'l2_division_alias',
  'l3_division_alias',
  'l4_division_alias',
];

const BEAUTY_FILTER = 'l1_division_alias:=beauty';

/** يبني مرشّح Typesense يطابق alias التصنيف في أي مستوى. */
function buildCategoryFilter(alias) {
  const a = String(alias || '').trim();
  if (!a || a === BEAUTY_L1) return BEAUTY_FILTER;
  const escaped = a.replace(/`/g, '');
  return `${BEAUTY_FILTER} && (${DIVISION_ALIAS_FIELDS.map((f) => `${f}:=\`${escaped}\``).join(' || ')})`;
}

function dedupeProductsById(items = []) {
  const seen = new Set();
  return items.filter((p) => {
    const id = String(p?.id || '').trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** يدمج نتائج البحث المتكررة (نفس الاسم، معرّفات درجات مختلفة في Typesense). */
function dedupeSearchResults(items = []) {
  const byId = dedupeProductsById(items);
  const seenNames = new Set();
  return byId.filter((p) => {
    const key = String(p?.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) return true;
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
}

function isDefaultVariationTitle(title = '') {
  const s = String(title || '').trim().toLowerCase();
  return !s || s === 'default' || s === 'افتراضي';
}

function extractBarcodeFromTypesenseDoc(doc = {}) {
  const found = new Set();
  const tryParse = (vars) => {
    let arr = vars;
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr); } catch { return; }
    }
    if (!Array.isArray(arr)) return;
    for (const v of arr) {
      for (const key of ['barcode', 'ean', 'upc', 'gtin', 'sku']) {
        const val = String(v?.[key] || '').replace(/\D/g, '');
        if (val.length >= 8 && val.length <= 14) found.add(val);
      }
    }
  };
  tryParse(doc.variations);
  return [...found];
}

function mapMiswagColorVariation(v, optionGroup = '') {
  return {
    name: String(v.title || '').trim(),
    nameEn: String(v.title || '').trim(),
    barcode: '',
    image: absImage(v.image),
    hex: v.color || undefined,
    sku: String(v.id || ''),
    price: formatMiswagPrice(v.price),
    optionId: String(v.id || ''),
    optionGroup,
    inStock: v.is_available !== false,
  };
}

function buildShadesFromVarInfo(varInfo = {}) {
  const optionGroup = String(varInfo.variation_title || 'الألوان').trim();
  const colors = (varInfo.variations || []).map((v) => mapMiswagColorVariation(v, optionGroup));
  const sizes = varInfo.sizes || [];
  const realColors = colors.filter((c) => !isDefaultVariationTitle(c.name));

  if (realColors.length) return realColors;

  if (colors.length === 1 && sizes.length > 1) {
    const sizeGroup = String(varInfo.size_title || 'الحجم').trim();
    const base = colors[0];
    return sizes.map((s) => ({
      name: String(s.title || s.id || '').trim(),
      nameEn: String(s.title || s.id || '').trim(),
      barcode: '',
      image: base.image,
      hex: base.hex,
      sku: String(s.id || base.sku || ''),
      price: base.price,
      optionId: `${base.optionId || base.sku}-${s.id}`,
      optionGroup: sizeGroup,
      inStock: s.is_available !== false,
    }));
  }

  return colors;
}

async function fetchAllVariations(pid) {
  const allVariations = [];
  const sizeMap = new Map();
  let varInfo = {};
  let cursor = null;
  let pages = 0;

  do {
    const params = cursor ? { cursor } : {};
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, { params }).catch(() => null);
    if (!chunk) break;
    const info = chunk.info || chunk;
    varInfo = { ...varInfo, ...info, variation_title: info.variation_title || varInfo.variation_title, size_title: info.size_title || varInfo.size_title };
    for (const v of info.variations || []) allVariations.push(v);
    for (const s of info.sizes || []) sizeMap.set(String(s.id), s);
    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 20);

  return {
    ...varInfo,
    variations: allVariations,
    sizes: [...sizeMap.values()],
  };
}

function mapTypesenseHit(doc = {}, matchedBarcode = '') {
  const nameAr = String(doc.title_AR || doc.title || '').trim();
  const nameEn = String(doc.title_EN || doc.title || nameAr).trim();
  const id = String(doc.id || doc.product_id || doc.item_id || '');
  const ratingCount = Number(doc.rating_count) || 0;
  const variationCount = countVariations(doc.variations);
  const docBarcodes = extractBarcodeFromTypesenseDoc(doc);
  const barcode = matchedBarcode || docBarcodes[0] || '';

  return {
    id,
    name: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    manufacturer: String(doc.brand || doc.facet_brand || '').trim(),
    manufacturerEn: String(doc.brand || doc.facet_brand || '').trim(),
    thumb: absImage(doc.image || doc.image_url || doc.thumb),
    price: formatMiswagPrice({
      value: doc.price_numeric_value ?? doc.price_value,
      original_value: doc.price_original_value,
      currency: doc.price_currency || 'IQD',
    }),
    barcode,
    sku: String(doc.alias || doc.id || ''),
    productUrl: doc.url || (id ? `${SITE}/products/${id}` : ''),
    category: [
      doc.l1_division_ar,
      doc.l2_division_ar,
      doc.l3_division_ar,
      doc.l4_division_ar,
    ].filter(Boolean).join(' › ') || String(doc.category || '').trim(),
    categoryEn: [
      doc.l1_division_en,
      doc.l2_division_en,
      doc.l3_division_en,
      doc.l4_division_en,
    ].filter(Boolean).join(' › '),
    brandAlias: String(doc.brand_alias || doc.vendor_alias || '').trim(),
    rating: Number(doc.rating) || 0,
    ratingCount,
    isOnSale: doc.is_on_sale === true || doc.is_on_sale === 'true',
    inStock: doc.availability !== false && doc.availability !== 'false',
    shadeCount: variationCount,
    source: 'typesense',
  };
}

function countVariations(variations) {
  if (!variations) return 0;
  if (Array.isArray(variations)) return variations.length;
  try {
    const arr = JSON.parse(variations);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/** بحث احتياطي مرن عبر Typesense (بدون preset، حقول أوسع) عند فشل البحث الأساسي. */
async function fallbackTextSearch(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return { items: [], total: 0, page, pageSize: limit };

  try {
    const [result = {}] = await typesenseMultiSearch([{
      q,
      query_by: 'title_AR,title_EN,brand,keywords',
      per_page: limit,
      page,
      filter_by: BEAUTY_FILTER,
      num_typos: 1,
      drop_tokens_threshold: 0,
    }]);
    const hits = result.hits || [];
    const items = dedupeSearchResults(hits.map((h) => mapTypesenseHit(h.document || h)));
    return {
      items,
      total: result.found || items.length,
      page,
      pageSize: limit,
      fallback: true,
    };
  } catch {
    return { items: [], total: 0, page, pageSize: limit, fallback: true };
  }
}

export async function searchProducts(query, page = 1, limit = 30) {
  const q = String(query || '').trim();
  if (!q) return { items: [], total: 0, page, pageSize: limit };

  // باركود (8–14 رقم): استخدم بحث الباركود الدقيق بدل البحث النصي
  if (/^\d{8,14}$/.test(q)) {
    try {
      const hits = await searchProductsByBarcode(q);
      if (hits.length) {
        return {
          items: hits.map((h) => ({
            ...normalizeProductSummary(h),
            shadeName: h.shadeName || '',
            matchType: h.matchType || '',
          })),
          total: hits.length,
          page: 1,
          pageSize: limit,
        };
      }
    } catch { /* continue to text search */ }

    // معرّف منتج مسواگ مباشر (10 أرقام)
    if (/^\d{10}$/.test(q)) {
      try {
        const detail = await fetchProductDetail(q);
        if (detail?.id) {
          return { items: [normalizeProductSummary(detail)], total: 1, page: 1, pageSize: limit };
        }
      } catch { /* continue */ }
    }

    // لا تُرجع نتائج نصية عشوائية لاستعلام رقمي يشبه الباركود
    return { items: [], total: 0, page, pageSize: limit };
  }

  try {
    const ts = await typesenseSearch(q, {
      page,
      perPage: limit,
      filterBy: BEAUTY_FILTER,
      strict: true,
    });
    if (ts.hits?.length) {
      const items = dedupeSearchResults(ts.hits.map((h) => mapTypesenseHit(h.document || h)));
      return {
        items,
        total: ts.found || items.length,
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

  const [detail, varInfo] = await Promise.all([
    miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}`),
    fetchAllVariations(pid).catch(() => ({})),
  ]);

  const meta = detail?.info?.meta || {};
  const blocks = collectBlocks(detail?.content || []);
  const images = extractGalleryImages(blocks);
  if (meta.image_url && !images.includes(absImage(meta.image_url))) {
    images.unshift(absImage(meta.image_url));
  }

  const shades = buildShadesFromVarInfo(varInfo);
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
    hasOptions: shades.length > 1 || (varInfo.sizes?.length > 1),
    barcode: '',
    productUrl: meta.url || meta.share_link || `${SITE}/products/${meta.product_id || pid}`,
    category: String(meta.category || '').trim(),
    categoryEn: String(meta.category || '').trim(),
    inStock: detail?.info?.size?.is_available !== false,
    raw: { detail, variations: varInfo },
  };
}

export function normalizeProductSummary(product = {}) {
  const shadeCount = product.shadeCount || product.shades?.length || 0;
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
    shadeCount,
    hasOptions: product.hasOptions ?? shadeCount > 1,
  };
}

export function normalizeProductDetail(product = {}) {
  const summary = normalizeProductSummary(product);
  const shades = product.shades || [];
  return {
    ...summary,
    description: product.description || '',
    descriptionEn: product.descriptionEn || product.description || '',
    images: (product.images || []).length ? product.images : (summary.thumb ? [summary.thumb] : []),
    shades,
    shadeCount: product.shadeCount ?? shades.length,
    hasOptions: product.hasOptions ?? shades.length > 0,
    hasShades: shades.length > 0,
  };
}

let categoryTreeCache = null;
let categoryTreeCacheAt = 0;
const CATEGORY_TREE_TTL_MS = 30 * 60 * 1000;

/** يجلب تصنيفات L2 ضمن "beauty" من واجهة المحتوى (أسماء عربية دقيقة). */
async function fetchBeautyL2FromContent() {
  try {
    const data = await miswagFetch('/content/v1/l1_categories/tree');
    const roots = data.content || [];
    const beauty = roots.find((r) => (r.alias || '').toLowerCase() === BEAUTY_L1);
    return (beauty?.l2_divisions || [])
      .filter((d) => d.alias)
      .map((d) => ({ alias: String(d.alias), nameAr: String(d.name || '').trim() }));
  } catch {
    return [];
  }
}

/** بديل: يستخرج تصنيفات L2 من Typesense عند تعذّر واجهة المحتوى. */
async function fetchBeautyL2FromTypesense() {
  const { hits } = await typesenseSearch('*', {
    perPage: 250,
    filterBy: 'l1_division_alias:=beauty',
    queryBy: 'title_AR',
  });
  const map = new Map();
  for (const h of hits) {
    const d = h.document || h;
    const alias = String(d.l2_division_alias || '').trim();
    if (alias && !map.has(alias)) {
      map.set(alias, { alias, nameAr: String(d.l2_division_ar || alias).trim() });
    }
  }
  return [...map.values()];
}

export async function fetchCategoryTree() {
  if (categoryTreeCache && Date.now() - categoryTreeCacheAt < CATEGORY_TREE_TTL_MS) {
    return categoryTreeCache;
  }

  let l2List = await fetchBeautyL2FromContent();
  if (!l2List.length) l2List = await fetchBeautyL2FromTypesense();

  // جلب أبناء L3 لكل L2 دفعة واحدة عبر group_by (أسماء AR/EN + أعداد دقيقة)
  let l3Results = [];
  try {
    l3Results = await typesenseMultiSearch(
      l2List.map((l2) => ({
        q: '*',
        query_by: 'title_AR',
        filter_by: `l1_division_alias:=beauty && l2_division_alias:=\`${l2.alias}\``,
        per_page: 250,
        group_by: 'l3_division_alias',
        group_limit: 1,
        include_fields: 'l2_division_ar,l2_division_en,l3_division_alias,l3_division_ar,l3_division_en',
      })),
    );
  } catch { /* tree without L3 children */ }

  const tree = l2List.map((l2, i) => {
    const result = l3Results[i] || {};
    const groups = result.grouped_hits || [];
    let nameAr = l2.nameAr;
    let nameEn = l2.alias;

    const children = [];
    for (const g of groups) {
      const doc = g.hits?.[0]?.document || {};
      if (doc.l2_division_ar) nameAr = doc.l2_division_ar;
      if (doc.l2_division_en) nameEn = doc.l2_division_en;
      const childAlias = String(g.group_key?.[0] || doc.l3_division_alias || '').trim();
      if (!childAlias) continue;
      // تخطّي التصنيفات بدون اسم حقيقي (alias رقمي خام)
      const childNameAr = String(doc.l3_division_ar || '').trim();
      if (!childNameAr || /^\d+$/.test(childAlias)) continue;
      children.push({
        id: childAlias,
        slug: childAlias,
        name: childNameAr,
        nameEn: String(doc.l3_division_en || childAlias).trim(),
        level: 3,
        productCount: g.found || null,
        isLeaf: true,
        children: [],
      });
    }

    children.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
    const totalCount = children.reduce((sum, c) => sum + (c.productCount || 0), 0) || null;

    return {
      id: l2.alias,
      slug: l2.alias,
      name: nameAr || l2.alias,
      nameEn: nameEn || l2.alias,
      level: 2,
      productCount: totalCount,
      isLeaf: children.length === 0,
      children,
    };
  });

  const leaves = [];
  for (const node of tree) {
    if (node.children.length) leaves.push(...node.children);
    else leaves.push(node);
  }

  categoryTreeCache = { tree, leaves };
  categoryTreeCacheAt = Date.now();
  return categoryTreeCache;
}

const CATEGORY_SORT_MAP = {
  default: 'rating_count:desc,rating:desc',
  price_asc: 'price_numeric_value:asc',
  price_desc: 'price_numeric_value:desc',
  newest: 'created_at:desc',
};

export async function fetchCategoryProducts(categoryAlias, { page = 1, limit = 30, sort = 'default' } = {}) {
  const alias = String(categoryAlias || BEAUTY_L1).trim() || BEAUTY_L1;
  const perPage = Math.min(Math.max(limit, 1), 60);
  const sortBy = CATEGORY_SORT_MAP[sort] || CATEGORY_SORT_MAP.default;

  const { hits, found, error } = await typesenseSearch('*', {
    page,
    perPage,
    filterBy: buildCategoryFilter(alias),
    sortBy,
    queryBy: 'title_AR',
  });

  if (error) throw new Error(`Miswag category fetch failed: ${error}`);

  const items = hits.map((h) => mapTypesenseHit(h.document || h));
  const hasMore = page * perPage < found;

  return { items, page, pageSize: perPage, hasMore, total: found, cursor: null };
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

async function confirmMiswagBarcodeHit(productId, digits, meta = null) {
  const detail = await fetchProductDetail(String(productId));
  if (!detail?.id) return null;
  const unified = fromLegacyProduct(detail);
  const check = verifyBarcodeOnProduct(unified, digits);
  if (check.ok) {
    return {
      ...normalizeProductSummary(detail),
      barcode: digits,
      shadeName: check.shadeName,
      matchType: check.matchType,
      matchScore: 28,
      source: 'verified',
    };
  }

  const hay = JSON.stringify(detail.raw?.variations || detail).replace(/\D/g, '');
  const stripped = digits.replace(/^0+/, '');
  const inRaw = hay.includes(digits) || (stripped.length >= 8 && hay.includes(stripped));

  if (meta?.shade || meta?.title || meta?.brand) {
    const hinted = await resolveMiswagShadeVariationHit(
      { ...normalizeProductSummary(detail), barcode: digits },
      meta,
      digits,
    );
    if (hinted?.matchType === 'shade') {
      return {
        ...hinted,
        matchScore: Math.max(Number(hinted.matchScore) || 0, 35),
        source: hinted.source || 'meta-verified',
      };
    }

    const summary = normalizeProductSummary(detail);
    const matchScore = scoreStoreHintMatch(summary, meta) + rankMiswagHintMatch(summary, meta);
    if (matchScore >= 35) {
      return {
        ...summary,
        barcode: digits,
        matchType: 'product',
        matchScore,
        source: 'meta-verified',
      };
    }
  }

  if (inRaw) {
    return {
      ...normalizeProductSummary(detail),
      barcode: digits,
      matchType: 'product',
      matchScore: 22,
      source: 'verified-raw',
    };
  }

  return null;
}

async function verifyTypesenseBarcodeHits(hits, digits, resolveMeta) {
  const verified = [];
  const meta = await resolveMeta().catch(() => null);
  for (const hit of hits.slice(0, 5)) {
    const doc = hit.document || hit;
    const id = String(doc.id || doc.product_id || doc.item_id || '');
    if (!id) continue;
    try {
      const entry = await confirmMiswagBarcodeHit(id, digits, meta);
      if (entry) verified.push(entry);
    } catch { /* skip */ }
  }
  return verified;
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

function shadeNamesMatch(a = '', b = '') {
  const na = String(a || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  const nb = String(b || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function resolveMiswagShadeVariationHit(hit, meta, digits) {
  const parsed = parseBarcodeMetaFields(meta);
  if (!parsed.shade || !hit?.id) return hit;

  const tryResolve = async (productId) => {
    const detail = await fetchProductDetail(productId);
    const shades = detail?.shades || [];
    if (!shades.length) return null;

    const direct = shades.find((s) => shadeNamesMatch(s.name, parsed.shade));
    if (direct) {
      return {
        ...hit,
        id: String(direct.optionId || direct.sku || productId),
        shadeName: direct.name,
        barcode: digits,
        matchType: 'shade',
        shadeCount: 1,
        source: hit.source || meta.source || 'shade-resolve',
      };
    }

    const parentId = String(detail.sku || detail.id || productId);
    for (const s of shades) {
      const sid = String(s.optionId || s.sku || '');
      if (sid && sid === String(hit.id) && shadeNamesMatch(s.name, parsed.shade)) {
        return {
          ...hit,
          id: sid,
          shadeName: s.name,
          barcode: digits,
          matchType: 'shade',
          shadeCount: 1,
          source: hit.source || meta.source || 'shade-resolve',
        };
      }
    }

    return null;
  };

  try {
    const resolved = await tryResolve(hit.id);
    if (resolved) return resolved;

    const parentGuess = String(hit.sku || hit.id);
    if (parentGuess !== String(hit.id)) {
      const alt = await tryResolve(parentGuess);
      if (alt) return alt;
    }
  } catch { /* keep base hit */ }

  return hit;
}

function rankMiswagHintMatch(item, meta = {}) {
  let score = 0;
  const parsed = parseBarcodeMetaFields(meta);
  const hay = `${item.name} ${item.nameEn} ${item.manufacturer} ${item.shadeName || ''}`.toLowerCase();

  if (parsed.shade && hay.includes(parsed.shade.toLowerCase())) score += 25;
  if (parsed.shade && shadeNamesMatch(item.shadeName, parsed.shade)) score += 35;

  for (const hint of extractShadeHints(meta.title, meta.shade)) {
    if (hay.includes(hint.toLowerCase())) score += 10;
  }

  for (const word of parsed.productWords) {
    if (word.length >= 4 && hay.includes(word.toLowerCase())) score += 6;
  }
  if (productLineConflicts(hay, parsed.productLine)) score -= 40;

  return score;
}

function pickBestMiswagHintResults(scored, meta, { limit = 12 } = {}) {
  if (!scored.length) return [];

  const parsed = parseBarcodeMetaFields(meta);
  const top = scored[0];
  const second = scored[1];
  const margin = second ? top.score - second.score : top.score;

  if (parsed.shade && top.score >= 30 && margin >= 10) {
    return [{
      ...top.mapped,
      matchType: 'hint',
      matchScore: top.score,
      source: meta.source || 'meta-hint',
    }];
  }

  if (top.score >= 50 && margin >= 18) {
    return [{
      ...top.mapped,
      matchType: 'hint',
      matchScore: top.score,
      source: meta.source || 'meta-hint',
    }];
  }

  const results = [];
  const seen = new Set();
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

async function searchMiswagByMetaHints(meta, digits, { limit = 12 } = {}) {
  if (!meta?.brand && !meta?.title) return [];

  const queries = buildMetaHintQueries(meta);
  const scored = [];
  const seenIds = new Set();

  for (const q of queries) {
    try {
      const ts = await typesenseSearch(q, { page: 1, perPage: 20 });
      for (const hit of ts.hits || []) {
        const doc = hit.document || hit;
        const mapped = mapTypesenseHit(doc, digits);
        const idKey = String(mapped.id || '');
        if (!idKey || seenIds.has(idKey)) continue;
        seenIds.add(idKey);

        const score = scoreStoreHintMatch(mapped, meta) + rankMiswagHintMatch(mapped, meta);
        if (score < 10) continue;
        scored.push({ mapped, score });
      }
    } catch { /* next query */ }
  }

  scored.sort((a, b) => b.score - a.score);
  const parsed = parseBarcodeMetaFields(meta);

  if (parsed.shade && scored.length) {
    for (const { mapped, score } of scored.slice(0, 8)) {
      const resolved = await resolveMiswagShadeVariationHit(
        { ...mapped, matchType: 'hint', matchScore: score, source: meta.source || 'meta-hint' },
        meta,
        digits,
      );
      if (resolved.matchType === 'shade') {
        return [resolved];
      }
    }
  }

  return pickBestMiswagHintResults(scored, meta, { limit });
}

export async function searchProductsByBarcode(barcode, { getMeta, hintHits = [], upcMeta = null } = {}) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  const resolveMeta = async () => {
    if (getMeta) {
      const shared = await getMeta().catch(() => null);
      if (shared?.brand || shared?.title) return shared;
    }
    if (upcMeta?.brand || upcMeta?.title) {
      return normalizeBarcodeMeta({
        ean: digits,
        brand: upcMeta.brand || '',
        title: upcMeta.title || '',
        shade: upcMeta.shade || '',
        source: upcMeta.source || 'upc',
      });
    }
    const fromHits = buildMetaFromSearchHits(hintHits);
    if (fromHits) return fromHits;
    return lookupBarcodeProductMeta(digits);
  };

  const results = [];
  const seen = new Set();

  const learn = (list) => {
    const top = list.find((h) => {
      const mt = String(h.matchType || '').toLowerCase();
      const src = String(h.source || '').toLowerCase();
      return (
        (mt === 'product' || mt === 'shade' || mt === 'lookup')
        && mt !== 'hint'
        && !src.includes('meta-hint')
        && (Number(h.matchScore) || 0) >= 20
      );
    });
    if (top?.id) {
      try {
        upsertBarcodeLookup(digits, {
          store: 'miswag',
          productId: String(top.id),
          name: top.name || '',
          shadeName: top.shadeName || '',
          matchType: top.matchType || 'lookup',
        });
      } catch { /* الحفظ اختياري */ }
    }
    return list;
  };

  const metaEarly = await resolveMeta().catch(() => null);

  // (0b) فهرس يدوي محلي — مع التحقق
  const manual = findBarcodeLookup(digits);
  if (manual?.productId && (manual.store === 'miswag' || !manual.store)) {
    try {
      const entry = await confirmMiswagBarcodeHit(manual.productId, digits, { ...metaEarly, shade: manual.shadeName });
      if (entry) {
        if (manual.shadeName && !entry.shadeName) entry.shadeName = manual.shadeName;
        pushUnique(results, seen, entry);
        if (results.length) return learn(results);
      }
    } catch { /* continue */ }
  }

  // (1) metadata → Typesense (المسار الأسرع لمسواگ — الباركود غالباً غير مفهرس)
  if (metaEarly?.brand || metaEarly?.title) {
    const hinted = await searchMiswagByMetaHints(metaEarly, digits);
    for (const hit of hinted) {
      try {
        const confirmed = await confirmMiswagBarcodeHit(hit.id, digits, metaEarly);
        pushUnique(results, seen, confirmed || hit);
      } catch {
        pushUnique(results, seen, hit);
      }
    }
    if (results.length) return learn(results.slice(0, 12));
  }

  // (0a) فهرس باركود موحّد — محاولة واحدة فقط
  const unifiedHits = searchUnifiedByStore(digits, 'miswag');
  if (unifiedHits.length && !results.length) {
    for (const indexed of unifiedHits.slice(0, 1)) {
      try {
        const entry = await confirmMiswagBarcodeHit(
          String(indexed.id || indexed.productId || ''),
          digits,
          metaEarly,
        );
        if (entry) pushUnique(results, seen, entry);
      } catch { /* skip stale index */ }
    }
    if (results.length) return learn(results);
  }

  // (2) Typesense مباشر + تحقق
  try {
    const ts = await typesenseSearch(digits, { page: 1, perPage: 5 });
    const verified = await verifyTypesenseBarcodeHits(ts.hits || [], digits, resolveMeta);
    for (const entry of verified) pushUnique(results, seen, entry);
    if (results.length) return learn(results);
  } catch { /* continue */ }

  // (2b) بحث موسّع في variations
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
          query_by: 'variations,alias,title_AR,title_EN,brand',
          per_page: 5,
          page: 1,
        }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const candidates = (data.results?.[0]?.hits || []).filter((hit) => {
      const doc = hit.document || hit;
      const hay = JSON.stringify(doc).replace(/\D/g, '');
      return hay.includes(digits);
    });
    const verified = await verifyTypesenseBarcodeHits(candidates, digits, resolveMeta);
    for (const entry of verified) pushUnique(results, seen, entry);
    if (results.length) return learn(results);
  } catch { /* continue */ }

  // (3) معرّف منتج مسواگ (10 أرقام)
  if (/^\d{10}$/.test(digits)) {
    try {
      const detail = await fetchProductDetail(digits);
      if (detail?.id) {
        pushUnique(results, seen, { ...normalizeProductSummary(detail), barcode: digits, source: 'id' });
        if (results.length) return learn(results);
      }
    } catch { /* continue */ }
  }

  // (4) إعادة محاولة التلميحات بعد جلب metadata كامل
  if (!results.length) {
    const meta = metaEarly || await resolveMeta().catch(() => null);
    if (meta?.brand || meta?.title) {
      const hinted = await searchMiswagByMetaHints(meta, digits);
      for (const hit of hinted) pushUnique(results, seen, hit);
    }
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

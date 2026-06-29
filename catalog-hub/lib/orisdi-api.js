/**
 * Orisdi (أورزدي) — Iraq Shopify storefront
 * https://orisdi.com
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookupBarcodeProductMeta, resolveStoreHintMatches } from './barcodes.js';

export const SITE = 'https://orisdi.com';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEED_CACHE_FILE = path.join(__dirname, '..', 'data', 'orisdi-feed-index.json');

const BEAUTY_COLLECTIONS = [
  { handle: 'makeup', name: 'مكياج', nameEn: 'Makeup' },
  { handle: 'beauty', name: 'تجميل', nameEn: 'Beauty' },
  { handle: 'عطور', name: 'عطور', nameEn: 'Perfumes' },
];

const DEFAULT_HEADERS = {
  Accept: 'application/json, text/html;q=0.9',
  'Accept-Language': 'ar',
  'User-Agent': 'catalog-hub/1.0',
};

const idHandleCache = new Map();

/** Shopify Storefront API — عام على صفحات Orisdi، يبحث SKU مباشرة */
const STOREFRONT_TOKEN = 'e7020593fd60b631b300feacd9a58426';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function barcodeQueryVariants(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  const out = new Set([digits]);
  const stripped = digits.replace(/^0+/, '') || digits;
  out.add(stripped);
  if (digits.length === 13 && digits.startsWith('0')) out.add(digits.slice(1));
  if (stripped.length <= 12) out.add(stripped.padStart(12, '0'));
  if (stripped.length <= 13) out.add(stripped.padStart(13, '0'));
  return [...out].filter((v) => v.length >= 8 && v.length <= 14);
}

export function isEan(value) {
  const s = String(value ?? '').trim();
  return s && s !== 'null' && /^\d{8,14}$/.test(s);
}

export function extractVariantBarcode(variant = {}) {
  for (const raw of [variant.barcode, variant.sku]) {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (isEan(digits)) return digits;
  }
  return '';
}

export function barcodeMatches(value, barcode) {
  const a = String(value || '').replace(/\D/g, '');
  const b = String(barcode || '').replace(/\D/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  const na = a.replace(/^0+/, '') || a;
  const nb = b.replace(/^0+/, '') || b;
  return na === nb;
}

export function formatOrisdiPrice(amount, compareAt = null) {
  if (amount === undefined || amount === null || amount === '') return '';
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  const base = `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cmp = compareAt != null && Number(compareAt) > n
    ? ` (كان $${Number(compareAt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    : '';
  return `${base}${cmp}`;
}

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return u;
}

function splitTitle(title = '', vendor = '') {
  const raw = String(title || '').trim();
  if (!raw) return { ar: '', en: '' };
  const parts = raw.split(/\s+\|\s+/);
  if (parts.length >= 2) {
    return { ar: parts[0].trim(), en: parts.slice(1).join(' | ').trim() };
  }
  const latin = raw.match(/[A-Za-z][A-Za-z0-9\s&.'\-]+/g);
  if (latin?.length) {
    const en = latin.join(' ').trim();
    const ar = raw.replace(en, '').replace(/\s+/g, ' ').trim();
    if (ar && en) return { ar, en };
  }
  return { ar: raw, en: raw };
}

async function shopifyJson(path, params = {}, { retries = 2 } = {}) {
  const url = new URL(`${SITE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (res.status === 429 && attempt < retries) {
      await sleep(500 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Orisdi ${res.status}: ${path}`);
    return res.json();
  }
  throw new Error(`Orisdi request failed: ${path}`);
}

async function shopifyHtml(path, params = {}) {
  const url = new URL(`${SITE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) throw new Error(`Orisdi ${res.status}: ${path}`);
  return res.text();
}

function parseSearchHandles(html = '') {
  const handles = new Set();
  const re = /href="\/products\/([^"?]+)/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      handles.add(decodeURIComponent(m[1]));
    } catch {
      handles.add(m[1]);
    }
  }
  return [...handles];
}

function rememberHandle(product) {
  if (product?.id && product?.handle) {
    idHandleCache.set(String(product.id), product.handle);
  }
}

function mapRawProduct(product, { matchType = 'product', matchedVariant = null, category = '' } = {}) {
  rememberHandle(product);
  const { ar, en } = splitTitle(product.title, product.vendor);
  const variants = product.variants || [];
  const variant = matchedVariant || variants[0] || {};
  const barcode = extractVariantBarcode(variant);
  const prices = variants.map((v) => Number(v.price)).filter(Number.isFinite);
  const minPrice = prices.length ? Math.min(...prices) : Number(variant.price);
  const maxPrice = prices.length ? Math.max(...prices) : minPrice;
  const price = minPrice === maxPrice
    ? formatOrisdiPrice(minPrice, variant.compare_at_price)
    : `${formatOrisdiPrice(minPrice)} – ${formatOrisdiPrice(maxPrice)}`;
  const images = (product.images || []).map((img) => absImage(img.src)).filter(Boolean);

  return {
    id: String(product.id),
    handle: product.handle,
    name: ar || product.title,
    nameEn: en || product.title,
    manufacturer: product.vendor || '',
    manufacturerEn: product.vendor || '',
    price,
    thumb: images[0] || '',
    images,
    barcode,
    sku: variant.sku || String(product.id),
    category,
    categoryEn: category,
    productType: product.product_type || '',
    shadeCount: variants.length > 1 ? variants.length : 0,
    matchType,
    source: 'live',
    productUrl: `${SITE}/products/${product.handle}`,
    _raw: product,
  };
}

export function normalizeProductSummary(product, meta = {}) {
  if (!product) return null;
  if (product._raw) return mapRawProduct(product._raw, { ...meta, matchType: product.matchType });
  return mapRawProduct(product, meta);
}

export function normalizeProductDetail(product) {
  const raw = product?._raw || product;
  if (!raw?.id) return null;

  rememberHandle(raw);
  const summary = mapRawProduct(raw);
  const variants = raw.variants || [];
  const images = (raw.images || []).map((img) => absImage(img.src)).filter(Boolean);
  const shades = variants.length > 1 || (variants[0] && variants[0].title !== 'Default Title')
    ? variants.map((v) => ({
        name: v.title === 'Default Title' ? summary.name : v.title,
        nameEn: v.title === 'Default Title' ? summary.nameEn : v.title,
        barcode: extractVariantBarcode(v),
        sku: v.sku || '',
        price: formatOrisdiPrice(v.price, v.compare_at_price),
        image: absImage(v.featured_image?.src) || images[0] || '',
        available: v.available !== false,
      }))
    : [];

  const body = String(raw.body_html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    ...summary,
    description: body,
    descriptionEn: body,
    images,
    shades,
    shadeCount: shades.length,
    hasShades: shades.length > 0,
    productUrl: `${SITE}/products/${raw.handle}`,
  };
}

/* ─────────────────────────────────────────────────────────────
 * فهرس التغذية الكامل (Full feed index)
 * يبني خريطة باركود/SKU → منتج من products.json كاملاً.
 * هذا هو المسار الموثوق للبحث — بحث Shopify النصي لا يفهرس الباركود/SKU.
 * ───────────────────────────────────────────────────────────── */

const FEED_TTL_MS = 6 * 60 * 60 * 1000; // 6 ساعات
const FEED_MAX_PAGES = 80;

let feedIndex = null; // { byBarcode: Map, byId: Map, builtAt }
let feedBuildPromise = null;

function feedBarcodeKeys(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) return [];
  const keys = new Set([digits]);
  const stripped = digits.replace(/^0+/, '') || digits;
  keys.add(stripped);
  if (digits.length === 13 && digits.startsWith('0')) keys.add(digits.slice(1));
  if (stripped.length <= 12) keys.add(stripped.padStart(12, '0'));
  if (stripped.length <= 13) keys.add(stripped.padStart(13, '0'));
  if (stripped.length <= 14) keys.add(stripped.padStart(14, '0'));
  return [...keys];
}

function indexProductInMaps(byBarcode, byId, product) {
  if (!product?.id) return;
  byId.set(String(product.id), product);
  for (const variant of product.variants || []) {
    for (const raw of [variant.barcode, variant.sku]) {
      for (const key of feedBarcodeKeys(raw)) {
        if (!byBarcode.has(key)) byBarcode.set(key, []);
        const list = byBarcode.get(key);
        if (!list.some((entry) => entry.product.id === product.id && entry.variantId === variant.id)) {
          list.push({ product, variant, variantId: variant.id });
        }
      }
    }
  }
}

function slimProduct(p) {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    product_type: p.product_type,
    body_html: p.body_html,
    images: (p.images || []).map((img) => ({ src: img.src })),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      title: v.title,
      barcode: v.barcode,
      sku: v.sku,
      price: v.price,
      compare_at_price: v.compare_at_price,
      available: v.available,
      featured_image: v.featured_image ? { src: v.featured_image.src } : null,
    })),
  };
}

function serializeFeedIndex(index) {
  const products = [...index.byId.values()].map(slimProduct);
  return JSON.stringify({ builtAt: index.builtAt, products });
}

function loadFeedFromDisk() {
  try {
    const raw = JSON.parse(fs.readFileSync(FEED_CACHE_FILE, 'utf8'));
    if (!raw?.products?.length) return null;
    const byBarcode = new Map();
    const byId = new Map();
    for (const product of raw.products) {
      indexProductInMaps(byBarcode, byId, product);
      rememberHandle(product);
    }
    return { byBarcode, byId, builtAt: raw.builtAt || 0 };
  } catch {
    return null;
  }
}

function saveFeedToDisk(index) {
  try {
    fs.mkdirSync(path.dirname(FEED_CACHE_FILE), { recursive: true });
    fs.writeFileSync(FEED_CACHE_FILE, serializeFeedIndex(index));
  } catch { /* optional persistence */ }
}

async function buildFeedIndex() {
  const byBarcode = new Map();
  const byId = new Map();
  let count = 0;

  for (let page = 1; page <= FEED_MAX_PAGES; page++) {
    let data;
    try {
      data = await shopifyJson('/products.json', { limit: 250, page });
    } catch {
      if (page === 1) throw new Error('Orisdi feed unavailable');
      break;
    }
    const products = data.products || [];
    if (!products.length) break;
    for (const product of products) {
      indexProductInMaps(byBarcode, byId, product);
      rememberHandle(product);
      count++;
    }
    if (products.length < 250) break;
  }

  const index = { byBarcode, byId, builtAt: Date.now() };
  if (count > 0) saveFeedToDisk(index);
  return index;
}

async function getFeedIndex({ allowStale = true } = {}) {
  const fresh = feedIndex && Date.now() - feedIndex.builtAt < FEED_TTL_MS;
  if (fresh) return feedIndex;

  // حمّل من القرص أولاً إن لم يكن في الذاكرة (إقلاع سريع)
  if (!feedIndex) {
    const disk = loadFeedFromDisk();
    if (disk) {
      feedIndex = disk;
      if (Date.now() - disk.builtAt < FEED_TTL_MS) return feedIndex;
    }
  }

  // إعادة بناء — مع منع البناء المتزامن المتعدد
  if (!feedBuildPromise) {
    feedBuildPromise = buildFeedIndex()
      .then((idx) => { feedIndex = idx; return idx; })
      .catch((err) => {
        if (feedIndex && allowStale) return feedIndex; // استخدم القديم عند الفشل
        throw err;
      })
      .finally(() => { feedBuildPromise = null; });
  }

  // إذا لدينا فهرس قديم نعيده فوراً ونحدّث بالخلفية
  if (feedIndex && allowStale) {
    void feedBuildPromise.catch(() => {});
    return feedIndex;
  }

  return feedBuildPromise;
}

/** تحديث فهرس Orisdi مسبقاً (يُستدعى عند الإقلاع) */
export function warmupOrisdiFeed() {
  getFeedIndex({ allowStale: true }).catch(() => {});
}

function lookupFeedByBarcode(index, barcode) {
  for (const key of feedBarcodeKeys(barcode)) {
    const entries = index.byBarcode.get(key);
    if (entries?.length) return entries;
  }
  return [];
}

function mergeProductIntoFeedIndex(product) {
  if (!feedIndex || !product?.id) return;
  indexProductInMaps(feedIndex.byBarcode, feedIndex.byId, product);
  rememberHandle(product);
}

async function storefrontGraphql(query, variables = {}) {
  const res = await fetch(`${SITE}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      ...DEFAULT_HEADERS,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Orisdi GraphQL ${res.status}`);
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

function graphqlNodeToRaw(node) {
  const id = String(node.id || '').replace('gid://shopify/Product/', '');
  return {
    id,
    handle: node.handle,
    title: node.title,
    vendor: node.vendor || '',
    product_type: node.productType || '',
    body_html: node.descriptionHtml || '',
    images: (node.images?.edges || []).map((e) => ({ src: e.node?.url })),
    variants: (node.variants?.edges || []).map((e) => {
      const v = e.node || {};
      return {
        id: String(v.id || '').replace('gid://shopify/ProductVariant/', ''),
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        price: v.price?.amount,
        compare_at_price: v.compareAtPrice?.amount,
        available: v.availableForSale,
        featured_image: v.image?.url ? { src: v.image.url } : null,
      };
    }),
  };
}

async function searchViaStorefrontGraphql(barcode) {
  const found = [];
  const seenIds = new Set();
  for (const q of barcodeQueryVariants(barcode)) {
    let data;
    try {
      data = await storefrontGraphql(
        `query OrisdiBarcode($q: String!) {
          products(first: 8, query: $q) {
            edges {
              node {
                id title handle vendor productType descriptionHtml
                images(first: 10) { edges { node { url } } }
                variants(first: 25) {
                  edges {
                    node {
                      id title sku barcode availableForSale
                      price { amount } compareAtPrice { amount }
                      image { url }
                    }
                  }
                }
              }
            }
          }
        }`,
        { q },
      );
    } catch {
      continue;
    }
    for (const edge of data?.products?.edges || []) {
      const raw = graphqlNodeToRaw(edge.node);
      if (!raw.id || seenIds.has(raw.id)) continue;
      seenIds.add(raw.id);
      found.push(raw);
    }
    if (found.length) break;
  }
  return found;
}

export async function fetchProductByHandle(handle) {
  const data = await shopifyJson(`/products/${encodeURIComponent(handle)}.json`);
  return data.product || null;
}

export async function fetchProductById(id, { handle, barcode } = {}) {
  const key = String(id || '').trim();
  if (!key) return null;

  if (handle) {
    const product = await fetchProductByHandle(handle);
    if (product && String(product.id) === key) return product;
  }

  const cachedHandle = idHandleCache.get(key);
  if (cachedHandle) {
    const product = await fetchProductByHandle(cachedHandle);
    if (product && String(product.id) === key) return product;
  }

  if (barcode) {
    const hits = await searchProductsByBarcode(barcode);
    const found = hits.find((h) => String(h.id) === key);
    if (found?._raw) return found._raw;
  }

  try {
    const index = await getFeedIndex({ allowStale: true });
    const found = index.byId.get(key);
    if (found) return found;
  } catch { /* fall through */ }

  for (let page = 1; page <= 80; page++) {
    const data = await shopifyJson('/products.json', { limit: 250, page });
    const products = data.products || [];
    const found = products.find((p) => String(p.id) === key);
    if (found) {
      rememberHandle(found);
      return found;
    }
    if (products.length < 250) break;
  }

  return null;
}

export async function fetchProductDetail(id, opts = {}) {
  const raw = await fetchProductById(id, opts);
  return raw ? normalizeProductDetail(raw) : null;
}

function collectBarcodeMatches(product, barcode) {
  const matches = [];
  for (const variant of product.variants || []) {
    const bc = extractVariantBarcode(variant);
    if (!barcodeMatches(bc, barcode) && !barcodeMatches(variant.sku, barcode)) continue;
    matches.push(mapRawProduct(product, {
      matchType: (product.variants || []).length > 1 ? 'shade' : 'product',
      matchedVariant: variant,
    }));
  }
  return matches;
}

export async function searchProductsByBarcode(barcode, { getMeta } = {}) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  const results = [];
  const seen = new Set();

  const pushHit = (hit) => {
    const key = `${hit.id}:${hit.barcode}:${hit.sku}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(hit);
  };

  // (1) المسار الأساسي الموثوق: فهرس التغذية الكامل (باركود/SKU)
  try {
    const index = await getFeedIndex({ allowStale: true });
    const entries = lookupFeedByBarcode(index, digits);
    for (const { product, variant } of entries) {
      pushHit(mapRawProduct(product, {
        matchType: (product.variants || []).length > 1 ? 'shade' : 'product',
        matchedVariant: variant,
      }));
    }
    if (results.length) return results;
  } catch { /* fall through */ }

  // (2) احتياطي مباشر: Shopify GraphQL — يلتقط منتجات جديدة قبل تحديث الفهرس
  try {
    const gqlProducts = await searchViaStorefrontGraphql(digits);
    for (const product of gqlProducts) {
      mergeProductIntoFeedIndex(product);
      for (const hit of collectBarcodeMatches(product, digits)) {
        pushHit(hit);
      }
    }
    if (results.length) return results;
  } catch { /* fall through */ }

  // (3) احتياطي: بحث Shopify النصي (نادراً ما يطابق الباركود)
  for (const q of barcodeQueryVariants(digits)) {
    let html = '';
    try {
      html = await shopifyHtml('/search', { q, type: 'product' });
    } catch {
      continue;
    }

    const handles = parseSearchHandles(html);
    const fetched = await Promise.allSettled(
      handles.slice(0, 8).map((h) => fetchProductByHandle(h)),
    );

    for (const outcome of fetched) {
      if (outcome.status !== 'fulfilled' || !outcome.value) continue;
      for (const hit of collectBarcodeMatches(outcome.value, digits)) {
        pushHit(hit);
      }
    }
    if (results.length) return results;
  }

  const meta = await (getMeta ? getMeta() : lookupBarcodeProductMeta(digits)).catch(() => null);
  if (meta?.brand || meta?.title) {
    const hinted = await resolveStoreHintMatches({
      meta,
      searchFn: async (q) => (await searchProducts(q, 1, 16)).items || [],
      fetchDetailFn: (item) => fetchProductDetail(item.id, { slug: item.slug }),
      toShadeHit: (item, _detail, shade) => ({
        ...item,
        barcode: digits,
        shadeName: shade.name,
        matchType: 'shade',
        source: meta.source || 'meta-hint',
        matchScore: 999,
      }),
      toHit: (item, score) => ({
        ...item,
        barcode: digits,
        matchType: 'hint',
        source: meta.source || 'meta-hint',
        matchScore: score,
      }),
    });
    for (const h of hinted) {
      const key = `${h.id}:hint`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(h);
    }
  }

  return results.slice(0, 12);
}

export async function fetchCategoryTree() {
  const leaves = BEAUTY_COLLECTIONS.map((c) => ({
    id: c.handle,
    slug: c.handle,
    name: c.name,
    nameEn: c.nameEn,
    path: c.name,
    isLeaf: true,
    children: [],
  }));
  const tree = leaves.map((leaf) => ({ ...leaf, children: [] }));
  return { tree, leaves };
}

export async function fetchCategoryProducts(collectionHandle, { page = 1, limit = 30 } = {}) {
  const handle = String(collectionHandle || 'makeup').trim() || 'makeup';
  const data = await shopifyJson(`/collections/${encodeURIComponent(handle)}/products.json`, {
    limit: Math.min(limit, 250),
    page,
  });
  const meta = BEAUTY_COLLECTIONS.find((c) => c.handle === handle) || { name: handle, nameEn: handle };
  const items = (data.products || []).map((p) =>
    normalizeProductSummary(p, { category: meta.name, categoryEn: meta.nameEn }),
  );
  return {
    items,
    page,
    pageSize: limit,
    hasMore: (data.products || []).length >= Math.min(limit, 250),
  };
}

export async function searchProducts(query, page = 1, limit = 30) {
  const q = String(query || '').trim();
  if (!q) return { items: [], page, pageSize: limit, hasMore: false };

  const html = await shopifyHtml('/search', { q, type: 'product' });
  const handles = parseSearchHandles(html);
  const start = (page - 1) * limit;
  const slice = handles.slice(start, start + limit);
  const fetched = await Promise.allSettled(slice.map((h) => fetchProductByHandle(h)));

  const items = [];
  for (const outcome of fetched) {
    if (outcome.status !== 'fulfilled' || !outcome.value) continue;
    items.push(normalizeProductSummary(outcome.value, { category: `بحث: ${q}` }));
  }

  return {
    items,
    page,
    pageSize: limit,
    hasMore: start + limit < handles.length,
    total: handles.length,
  };
}

export function sortProductsClient(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (p) => {
    const m = String(p.price || '').match(/[\d,.]+/);
    return m ? Number(m[0].replace(/,/g, '')) : 0;
  };
  const nameOf = (p) => (p.name || p.nameEn || '').trim();
  return [...products].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const diff = priceOf(a) - priceOf(b);
      return sort === 'price_asc' ? diff : -diff;
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      const cmp = nameOf(a).localeCompare(nameOf(b), 'ar');
      return sort === 'name_asc' ? cmp : -cmp;
    }
    return 0;
  });
}

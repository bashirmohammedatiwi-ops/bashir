/**
 * نجد العذية — Salla storefront
 * https://najdalatheyah.com
 */
import { lookupBarcodeProductMeta, resolveStoreHintMatches } from './barcodes.js';

export const SITE = 'https://najdalatheyah.com';

const STORE_ID = process.env.NAJD_STORE_ID || '69454220';
const SALLA_API = 'https://api.salla.dev/store/v1';
const SALLA_SOURCE_SEARCH = 'search';

let categoryCache = null;
let categoryCacheAt = 0;
const CATEGORY_TTL_MS = 30 * 60 * 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

export function barcodeMatches(value, barcode) {
  const a = String(value || '').replace(/\D/g, '');
  const b = String(barcode || '').replace(/\D/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  const na = a.replace(/^0+/, '') || a;
  const nb = b.replace(/^0+/, '') || b;
  return na === nb;
}

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return u;
}

function splitTitle(title = '') {
  const raw = String(title || '').trim();
  if (!raw) return { ar: '', en: '' };
  const latin = raw.match(/[A-Za-z][A-Za-z0-9\s&.'\-()]+/g);
  if (latin?.length) {
    const en = latin.join(' ').trim();
    const ar = raw.replace(en, '').replace(/\s+/g, ' ').trim();
    if (ar && en) return { ar, en };
  }
  return { ar: raw, en: raw };
}

export function formatNajdPrice(amount, currency = 'SAR') {
  if (amount === undefined || amount === null || amount === '') return '';
  const n = Number(String(amount).replace(/,/g, ''));
  if (!Number.isFinite(n)) return String(amount);
  const sym = currency === 'SAR' ? 'ر.س' : currency;
  return `${n.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${sym}`;
}

function sallaHeaders(lang = 'ar') {
  return {
    'User-Agent': 'Mozilla/5.0 (compatible; catalog-hub/1.0)',
    Accept: 'application/json',
    'Store-Identifier': STORE_ID,
    's-store-identifier': STORE_ID,
    's-source': 'twilight',
    's-lang': lang,
    'Accept-Language': lang,
    Referer: `${SITE}/`,
  };
}

async function sallaFetch(pathOrUrl, { lang = 'ar', retries = 2 } = {}) {
  const url = String(pathOrUrl || '').startsWith('http')
    ? pathOrUrl
    : `${SALLA_API}/${pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: sallaHeaders(lang) });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      if (attempt < retries && res.status >= 500) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw new Error(`Najd API ${res.status}`);
    }
    const data = await res.json();
    if (!data.success && data.status >= 400) {
      if (attempt < retries && data.status >= 500) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw new Error(data.error?.message || data.data?.message || `Najd API ${data.status}`);
    }
    return data;
  }
  throw new Error('Najd request failed');
}

function buildProductsQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') q.set(key, String(value));
  }
  return q.toString();
}

async function fetchProductPage(queryParams, { page = 1, limit = 30, lang = 'ar' } = {}) {
  const perPage = Math.min(Math.max(limit, 1), 50);
  const params = { ...queryParams, per_page: String(perPage) };
  let url = `${SALLA_API}/products?${buildProductsQuery(params)}`;

  let data = null;
  for (let current = 1; current <= page; current++) {
    data = await sallaFetch(url, { lang });
    if (current === page) break;
    url = data.cursor?.next;
    if (!url) {
      return { data: { data: [] }, page, pageSize: perPage, hasMore: false };
    }
  }

  return {
    data,
    page,
    pageSize: perPage,
    hasMore: !!(data?.data?.length >= perPage && data?.cursor?.next),
  };
}

function findCategoryNode(nodes = [], id = '') {
  const key = String(id || '').trim();
  if (!key) return null;
  for (const node of nodes) {
    if (String(node.id) === key || String(node.slug) === key) return node;
    const child = findCategoryNode(node.children || [], key);
    if (child) return child;
  }
  return null;
}

async function resolveCategoryId(categoryId) {
  const key = String(categoryId || '').trim();
  if (!key) return '';
  if (/^\d+$/.test(key)) return key;
  const { tree, leaves } = await fetchCategoryTree();
  const node = findCategoryNode(tree, key) || leaves.find((c) => c.id === key || c.slug === key);
  return node?.id && /^\d+$/.test(String(node.id)) ? String(node.id) : '';
}

async function resolveCategorySearchKeyword(categoryId) {
  const id = String(categoryId || '').trim();
  if (!id) return '';
  const { tree, leaves } = await fetchCategoryTree();
  const node = findCategoryNode(tree, id) || leaves.find((c) => c.id === id);
  return node?.name || node?.nameEn || id;
}

function extractBarcodeFromSku(raw) {
  const gtin = String(raw?.gtin || '').replace(/\D/g, '');
  if (/^\d{8,14}$/.test(gtin)) return gtin;
  const sku = String(raw?.sku || '').replace(/\D/g, '');
  if (/^\d{8,14}$/.test(sku)) return sku;
  return '';
}

function mapRawProduct(raw) {
  if (!raw?.id) return null;
  const titles = splitTitle(raw.name || '');
  const brandName = String(raw.brand?.name || '').trim();
  const brandSplit = splitTitle(brandName);
  const thumb = absImage(raw.image?.url || raw.original_image || '');

  const barcode = extractBarcodeFromSku(raw);
  const sku = String(raw.sku || raw.id || '').trim();

  const priceAmount = raw.price?.amount ?? raw.price ?? raw.regular_price?.amount ?? raw.regular_price;
  const currency = raw.currency || raw.base_currency_price?.currency || 'SAR';

  return {
    id: String(raw.id),
    name: titles.ar || raw.name || '',
    nameEn: titles.en || titles.ar || raw.name || '',
    manufacturer: brandSplit.ar || brandName,
    manufacturerEn: brandSplit.en || brandName,
    price: formatNajdPrice(priceAmount, currency),
    priceRaw: Number(priceAmount) || 0,
    regularPrice: formatNajdPrice(raw.regular_price?.amount ?? raw.regular_price, currency),
    thumb,
    barcode,
    sku,
    gtin: String(raw.gtin || '').trim(),
    mpn: String(raw.mpn || '').trim(),
    category: raw.category?.name || '',
    productUrl: raw.url || `${SITE}/p${raw.id}`,
    status: raw.status || '',
    isOnSale: !!raw.is_on_sale,
    hasOptions: !!raw.has_options,
    rating: raw.rating?.count ? Number(raw.rating.rating) : null,
    description: stripHtml(raw.description || '').slice(0, 4000),
    weight: raw.weight || '',
    isAvailable: raw.is_available !== false,
    _raw: raw,
  };
}

export function normalizeProductSummary(product, meta = {}) {
  if (!product) return null;
  return {
    ...product,
    category: product.category || meta.name || '',
    categoryEn: product.categoryEn || meta.nameEn || meta.name || '',
  };
}

export function normalizeProductDetail(product) {
  if (!product?.id) return null;
  const images = [];
  const addImg = (url) => {
    const u = absImage(url);
    if (u && !images.includes(u)) images.push(u);
  };

  addImg(product.thumb);
  addImg(product._raw?.original_image);
  addImg(product._raw?.image?.url);
  if (product._raw?.images?.length) {
    for (const img of product._raw.images) {
      addImg(img?.url || img);
    }
  }

  const shades = [];
  if (product._raw?.options?.length) {
    for (const opt of product._raw.options) {
      for (const val of opt.values || []) {
        shades.push({
          name: val.name || opt.name || '',
          nameEn: val.name || opt.name || '',
          barcode: String(val.barcode || val.sku || '').replace(/\D/g, ''),
          sku: val.sku || '',
          price: formatNajdPrice(val.price?.amount ?? val.price),
          image: absImage(val.image?.url || val.image || ''),
          available: val.is_available !== false,
        });
      }
    }
  }
  if (product._raw?.skus?.length) {
    for (const s of product._raw.skus) {
      shades.push({
        name: s.name || s.option_name || '',
        nameEn: s.name || s.option_name || '',
        barcode: String(s.barcode || s.sku || '').replace(/\D/g, ''),
        sku: s.sku || '',
        price: formatNajdPrice(s.price?.amount ?? s.price),
        image: absImage(s.image?.url || s.image || ''),
        available: s.is_available !== false,
      });
    }
  }

  return {
    ...product,
    images,
    shades,
    shadeCount: shades.length,
    hasShades: shades.length > 0,
    description: product.description || stripHtml(product._raw?.description || ''),
    descriptionEn: product.description || '',
    productUrl: product.productUrl || `${SITE}/p${product.id}`,
  };
}

async function fetchAllCategories(lang = 'ar') {
  const data = await sallaFetch('categories', { lang });
  return (data.data || []).filter((c) => c.id_ != null);
}

async function fetchCategoryDetail(id_, lang = 'ar') {
  const data = await sallaFetch(`categories/${id_}`, { lang });
  return data.data || null;
}

function mapCategoryNode(cat, { parentPath = '' } = {}) {
  const id = String(cat.id_ ?? cat.id ?? '');
  const nameAr = String(cat.name || '').trim();
  const path = parentPath ? `${parentPath} › ${nameAr}` : nameAr;

  const children = (cat.sub_categories || [])
    .filter((sub) => sub.id_ != null)
    .map((sub) => mapCategoryNode(sub, { parentPath: path }));

  return {
    id,
    slug: id,
    name: nameAr,
    nameEn: nameAr,
    path,
    pathEn: path,
    isLeaf: !children.length,
    productCount: cat.items ?? null,
    children,
  };
}

export async function fetchCategoryTree() {
  if (categoryCache && Date.now() - categoryCacheAt < CATEGORY_TTL_MS) {
    return categoryCache;
  }

  const arCats = await fetchAllCategories('ar');

  const enriched = await Promise.all(
    arCats.map(async (cat) => {
      if (cat.sub_categories?.length) return cat;
      try {
        const detail = await fetchCategoryDetail(cat.id_, 'ar');
        if (detail?.sub_categories?.length) return detail;
      } catch { /* leaf */ }
      return cat;
    }),
  );

  const tree = enriched
    .filter((c) => c.name && c.id_ != null)
    .map((cat) => mapCategoryNode(cat));

  const leaves = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.isLeaf) leaves.push(n);
      else if (n.children?.length) walk(n.children);
      else leaves.push(n);
    }
  };
  walk(tree);

  categoryCache = { tree, leaves };
  categoryCacheAt = Date.now();
  return categoryCache;
}

async function findProductById(id) {
  const key = String(id).trim();
  if (!key) return null;

  try {
    const data = await sallaFetch(`products/${encodeURIComponent(key)}/details`, { lang: 'ar' });
    if (data.data?.id) return data.data;
  } catch { /* fallback */ }

  const data = await sallaFetch(
    `products?keyword=${encodeURIComponent(key)}&per_page=20&source=${SALLA_SOURCE_SEARCH}`,
    { lang: 'ar' },
  );
  return (data.data || []).find((p) => String(p.id) === key) || null;
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const catId = await resolveCategoryId(categoryId);
  const queryParams = catId
    ? { category_id: catId }
    : { keyword: await resolveCategorySearchKeyword(categoryId), source: SALLA_SOURCE_SEARCH };

  const { data, pageSize, hasMore } = await fetchProductPage(queryParams, { page, limit, lang: 'ar' });

  const items = (data.data || []).map((p) => mapRawProduct(p)).filter(Boolean);

  return { items, page, pageSize, hasMore };
}

export async function searchProducts(query, page = 1, limit = 30) {
  const q = String(query || '').trim();
  if (!q) return { items: [], page, pageSize: limit, hasMore: false };

  const queryParams = { keyword: q, source: SALLA_SOURCE_SEARCH };
  const { data, pageSize, hasMore } = await fetchProductPage(queryParams, { page, limit, lang: 'ar' });

  const items = (data.data || []).map((p) => mapRawProduct(p)).filter(Boolean);

  return { items, page, pageSize, hasMore };
}

export async function fetchProductDetail(id, { barcode = '' } = {}) {
  const raw = await findProductById(id);
  if (!raw) return null;

  const mapped = mapRawProduct(raw);
  if (!mapped) return null;

  const detail = normalizeProductDetail(mapped);
  if (barcode && !detail.barcode) detail.barcode = String(barcode).replace(/\D/g, '');
  if (!detail.barcode && detail.sku) {
    const fromSku = String(detail.sku).replace(/\D/g, '');
    if (/^\d{8,14}$/.test(fromSku)) detail.barcode = fromSku;
  }
  return detail;
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

  for (const q of barcodeQueryVariants(digits)) {
    try {
      const data = await sallaFetch(
        `products?keyword=${encodeURIComponent(q)}&per_page=24&source=${SALLA_SOURCE_SEARCH}`,
        { lang: 'ar' },
      );
      for (const raw of data.data || []) {
        const sku = String(raw.sku || '').replace(/\D/g, '');
        const gtin = String(raw.gtin || '').replace(/\D/g, '');
        if (!barcodeMatches(sku, digits) && !barcodeMatches(gtin, digits)) continue;
        const mapped = mapRawProduct(raw);
        if (mapped) {
          pushHit({
            ...mapped,
            barcode: digits,
            matchType: 'product',
            source: 'live',
          });
        }
      }
      if (results.length) return results;
    } catch { /* next variant */ }
  }

  const meta = await (getMeta ? getMeta() : lookupBarcodeProductMeta(digits)).catch(() => null);
  if (meta?.brand || meta?.title) {
    const hinted = await resolveStoreHintMatches({
      meta,
      searchFn: async (q) => (await searchProducts(q, 1, 20)).items || [],
      fetchDetailFn: (item) => fetchProductDetail(item.id),
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
    for (const h of hinted) pushHit(h);
  }

  return results.slice(0, 12);
}

export function sortProductsClient(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (p) => Number(p.priceRaw ?? String(p.price || '').replace(/[^\d.]/g, '')) || 0;
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

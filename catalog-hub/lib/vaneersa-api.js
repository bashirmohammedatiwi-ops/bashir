/**
 * Vaneersa (ڤانير) — Salla storefront
 * https://vaneersa.com/ar · https://vaneersa.com/en
 */
import { lookupBarcodeProductMeta, resolveStoreHintMatches } from './barcodes.js';

export const SITE = 'https://vaneersa.com';
export const SITE_AR = `${SITE}/ar`;
export const SITE_EN = `${SITE}/en`;

const STORE_ID = process.env.VANEERSA_STORE_ID || '1109203104';
const SALLA_API = 'https://api.salla.dev/store/v1';
const SALLA_SOURCE_SEARCH = 'search';

let categoryCache = null;
let categoryCacheAt = 0;
const CATEGORY_TTL_MS = 30 * 60 * 1000;

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
  const parts = raw.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return { ar: parts[0].trim(), en: parts.slice(1).join(' - ').trim() };
  }
  const latin = raw.match(/[A-Za-z][A-Za-z0-9\s&.'\-]+/g);
  if (latin?.length) {
    const en = latin.join(' ').trim();
    const ar = raw.replace(en, '').replace(/\s+/g, ' ').trim();
    if (ar && en) return { ar, en };
  }
  return { ar: raw, en: raw };
}

export function formatVaneersaPrice(amount, currency = 'SAR') {
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
    Referer: `${SITE}/${lang}/`,
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
      throw new Error(`Vaneersa API ${res.status}`);
    }
    const data = await res.json();
    if (!data.success && data.status >= 400) {
      if (attempt < retries && data.status >= 500) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw new Error(data.error?.message || data.data?.message || `Vaneersa API ${data.status}`);
    }
    return data;
  }
  throw new Error('Vaneersa request failed');
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

async function resolveCategorySearchKeyword(categoryId) {
  const id = String(categoryId || '').trim();
  if (!id) return '';
  const { tree, leaves } = await fetchCategoryTree();
  const node = findCategoryNode(tree, id) || leaves.find((c) => c.id === id);
  return node?.name || node?.nameEn || id;
}

async function attachEnglishNames(items, queryParams, { page = 1, limit = 30 } = {}) {
  try {
    const { data } = await fetchProductPage(queryParams, { page, limit, lang: 'en' });
    const nameEnMap = new Map(
      (data?.data || []).map((p) => [String(p.id), String(p.name || '').trim()]),
    );
    return items.map((item) => ({
      ...item,
      nameEn: nameEnMap.get(String(item.id)) || item.nameEn || item.name,
    }));
  } catch {
    return items;
  }
}

function mapRawProduct(raw, { lang = 'ar', nameEnMap = null } = {}) {
  if (!raw?.id) return null;
  const titles = splitTitle(raw.name || '');
  const brandName = String(raw.brand?.name || '').trim();
  const brandSplit = splitTitle(brandName);
  const enName = nameEnMap?.get(String(raw.id)) || titles.en || raw.name || '';
  const thumb = absImage(raw.image?.url || raw.original_image || '');

  const barcode = String(raw.gtin || raw.sku || '').replace(/\D/g, '');
  const sku = String(raw.sku || raw.id || '').trim();

  return {
    id: String(raw.id),
    name: titles.ar || raw.name || '',
    nameEn: enName,
    manufacturer: brandSplit.ar || brandName,
    manufacturerEn: brandSplit.en || brandName,
    price: formatVaneersaPrice(raw.price?.amount ?? raw.price, raw.currency || 'SAR'),
    priceRaw: Number(raw.price?.amount ?? raw.price) || 0,
    regularPrice: formatVaneersaPrice(raw.regular_price?.amount ?? raw.regular_price, raw.currency || 'SAR'),
    thumb,
    barcode: /^\d{8,14}$/.test(barcode) ? barcode : '',
    sku,
    gtin: String(raw.gtin || '').trim(),
    mpn: String(raw.mpn || '').trim(),
    category: raw.category?.name || '',
    productUrl: raw.url || `${SITE_AR}/p${raw.id}`,
    productUrlEn: (raw.url || '').replace('/ar/', '/en/') || `${SITE_EN}/p${raw.id}`,
    status: raw.status || '',
    isOnSale: !!raw.is_on_sale,
    hasOptions: !!raw.has_options,
    rating: raw.rating?.count ? Number(raw.rating.rating) : null,
    description: String(raw.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000),
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
  if (product.thumb) images.push(product.thumb);
  if (product._raw?.images?.length) {
    for (const img of product._raw.images) {
      const u = absImage(img?.url || img);
      if (u && !images.includes(u)) images.push(u);
    }
  }

  const shades = [];
  if (product._raw?.skus?.length) {
    for (const s of product._raw.skus) {
      shades.push({
        name: s.name || s.option_name || '',
        nameEn: s.name || s.option_name || '',
        barcode: String(s.barcode || s.sku || '').replace(/\D/g, ''),
        sku: s.sku || '',
        price: formatVaneersaPrice(s.price?.amount ?? s.price),
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
    description: product.description || '',
    descriptionEn: product.description || '',
    productUrl: product.productUrl || `${SITE_AR}/p${product.id}`,
    productUrlEn: product.productUrlEn || `${SITE_EN}/p${product.id}`,
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

function mapCategoryNode(cat, { nameEnMap = null, parentPath = '' } = {}) {
  const id = String(cat.id_ ?? cat.id ?? '');
  const nameAr = String(cat.name || '').trim();
  const nameEn = nameEnMap?.get(id) || nameAr;
  const path = parentPath ? `${parentPath} › ${nameAr}` : nameAr;
  const pathEn = parentPath ? `${parentPath} › ${nameEn}` : nameEn;

  const children = (cat.sub_categories || []).map((sub) =>
    mapCategoryNode(sub, { nameEnMap, parentPath: path }),
  );

  return {
    id,
    slug: id,
    name: nameAr,
    nameEn,
    path,
    pathEn,
    isLeaf: !children.length,
    productCount: cat.items ?? null,
    children,
  };
}

export async function fetchCategoryTree() {
  if (categoryCache && Date.now() - categoryCacheAt < CATEGORY_TTL_MS) {
    return categoryCache;
  }

  const [arCats, enCats] = await Promise.all([
    fetchAllCategories('ar'),
    fetchAllCategories('en').catch(() => []),
  ]);

  const nameEnMap = new Map(
    enCats.map((c) => [String(c.id_ ?? c.id), String(c.name || '').trim()]),
  );

  const enriched = await Promise.all(
    arCats.map(async (cat) => {
      if (cat.sub_categories?.length) return cat;
      try {
        const detail = await fetchCategoryDetail(cat.id_, 'ar');
        if (detail?.sub_categories?.length) {
          const enDetail = await fetchCategoryDetail(cat.id_, 'en').catch(() => null);
          const enSubMap = new Map(
            (enDetail?.sub_categories || []).map((s) => [String(s.id_), String(s.name || '').trim()]),
          );
          return {
            ...detail,
            sub_categories: (detail.sub_categories || []).map((sub) => ({
              ...sub,
              nameEn: enSubMap.get(String(sub.id_)) || sub.name,
            })),
          };
        }
      } catch { /* leaf category */ }
      return cat;
    }),
  );

  const subNameEnMap = new Map();
  for (const cat of enriched) {
    for (const sub of cat.sub_categories || []) {
      subNameEnMap.set(String(sub.id_), sub.nameEn || nameEnMap.get(String(sub.id_)) || sub.name);
    }
  }
  const mergedNameEnMap = new Map([...nameEnMap, ...subNameEnMap]);

  const tree = enriched.map((cat) => mapCategoryNode(cat, { nameEnMap: mergedNameEnMap }));

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

async function findProductById(id, { lang = 'ar' } = {}) {
  const key = String(id).trim();
  if (!key) return null;

  try {
    const data = await sallaFetch(`products/${encodeURIComponent(key)}/details`, { lang });
    if (data.data?.id) return data.data;
  } catch { /* fallback below */ }

  const data = await sallaFetch(
    `products?keyword=${encodeURIComponent(key)}&per_page=20&source=${SALLA_SOURCE_SEARCH}`,
    { lang },
  );
  return (data.data || []).find((p) => String(p.id) === key) || null;
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const keyword = await resolveCategorySearchKeyword(categoryId);
  const queryParams = { keyword, source: SALLA_SOURCE_SEARCH };
  const { data, pageSize, hasMore } = await fetchProductPage(queryParams, { page, limit, lang: 'ar' });

  let items = (data.data || [])
    .map((p) => mapRawProduct(p))
    .filter(Boolean);

  if (items.length) {
    items = await attachEnglishNames(items, queryParams, { page, limit });
  }

  return { items, page, pageSize, hasMore };
}

export async function searchProducts(query, page = 1, limit = 30) {
  const q = String(query || '').trim();
  if (!q) return { items: [], page, pageSize: limit, hasMore: false };

  const queryParams = { keyword: q, source: SALLA_SOURCE_SEARCH };
  const { data, pageSize, hasMore } = await fetchProductPage(queryParams, { page, limit, lang: 'ar' });

  let items = (data.data || [])
    .map((p) => mapRawProduct(p))
    .filter(Boolean);

  if (items.length) {
    items = await attachEnglishNames(items, queryParams, { page, limit });
  }

  return { items, page, pageSize, hasMore };
}

export async function fetchProductDetail(id, { lang = 'ar', barcode = '' } = {}) {
  const raw = await findProductById(id, { lang: 'ar' });
  if (!raw) return null;

  let nameEnMap = null;
  try {
    const enRaw = await findProductById(id, { lang: 'en' });
    if (enRaw?.name) nameEnMap = new Map([[String(raw.id), enRaw.name]]);
  } catch { /* optional */ }

  const mapped = mapRawProduct(raw, { nameEnMap });
  if (!mapped) return null;

  const detail = normalizeProductDetail(mapped);
  if (barcode && !detail.barcode) detail.barcode = String(barcode).replace(/\D/g, '');
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
        `products?keyword=${encodeURIComponent(q)}&per_page=20&source=${SALLA_SOURCE_SEARCH}`,
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
      searchFn: async (q) => (await searchProducts(q, 1, 16)).items || [],
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

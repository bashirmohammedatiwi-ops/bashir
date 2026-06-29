/**
 * Beauty Way (بيوتي وي) — Drupal storefront
 * https://www.beautyway-iq.com/
 */
import { lookupBarcodeProductMeta, buildMetaHintQueries, scoreStoreHintMatch } from './barcodes.js';

export const SITE = 'https://www.beautyway-iq.com';

const DEFAULT_HEADERS = {
  Accept: 'text/html,application/xhtml+xml;q=0.9',
  'Accept-Language': 'ar,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (compatible; catalog-hub/1.0)',
};

const FALLBACK_CATEGORIES = [
  { id: '6', name: 'عطور', nameEn: 'Perfumes' },
  { id: '35', name: 'مكياج', nameEn: 'Makeup' },
  { id: '19', name: 'مزيل عرق', nameEn: 'Deodorant' },
  { id: '28', name: 'العناية بالوجه', nameEn: 'Face Care' },
  { id: '29', name: 'العناية بالجسم', nameEn: 'Body Care' },
  { id: '22', name: 'العناية بالشعر', nameEn: 'Hair Care' },
  { id: '18', name: 'شامبو ومكيف', nameEn: 'Shampoo & Conditioner' },
  { id: '30', name: 'شور جسم', nameEn: 'Body Wash' },
  { id: '38', name: 'عناية بالفم', nameEn: 'Oral Care' },
  { id: '55', name: 'صابون', nameEn: 'Soap' },
  { id: '21', name: 'صبغات للشعر', nameEn: 'Hair Color' },
  { id: '180', name: 'صبغات شعر سلكي', nameEn: 'Silky Hair Color' },
  { id: '84', name: 'صبغات خالية من الأمونيا', nameEn: 'Ammonia-Free Color' },
  { id: '148', name: 'معطر جو', nameEn: 'Air Freshener' },
  { id: '149', name: 'منظفات', nameEn: 'Cleaners' },
];

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

export function isEan(value) {
  const s = String(value ?? '').trim();
  return s && s !== 'null' && /^\d{8,14}$/.test(s);
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

export function formatBeautywayPrice(amount) {
  if (amount === undefined || amount === null || amount === '') return '';
  const raw = String(amount).replace(/,/g, '');
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${amount} د.ع`;
  return `${Math.round(n).toLocaleString('ar-IQ')} د.ع`;
}

export function absImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${SITE}${u}`;
  return u;
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

async function fetchHtml(path, params = {}, { retries = 2 } = {}) {
  const url = new URL(`${SITE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(400 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Beauty Way ${res.status}: ${url.pathname}`);
    return res.text();
  }
  throw new Error(`Beauty Way request failed: ${path}`);
}

export function parseListingProducts(html = '', meta = {}) {
  const products = [];
  const blocks = html.split(/<div class="product_item/g).slice(1);
  for (const block of blocks) {
    const id = block.match(/product_id="(\d+)"/)?.[1];
    const barcode = block.match(/product_barcode="(\d+)"/)?.[1] || '';
    const url = block.match(/href="(https:\/\/www\.beautyway-iq\.com\/[^"?#]+)"/)?.[1]
      || block.match(/href="(\/[^"?#]+)"/)?.[1];
    const title = block.match(/<h5[^>]*>\s*<a[^>]+>([^<]+)/)?.[1]?.trim();
    const img = block.match(/<img[^>]+src="([^"]+)"/)?.[1];
    const price = block.match(/([0-9,]+)\s*(?:<[^>]+>\s*)*دينار/)?.[1];
    if (!id || !url) continue;
    const slug = url.startsWith('http') ? url.replace(SITE, '') : url;
    const productUrl = url.startsWith('http') ? url : `${SITE}${url}`;
    const { ar, en } = splitTitle(title || '');
    products.push({
      id: String(id),
      slug: slug.replace(/^\//, ''),
      name: ar || title || '',
      nameEn: en || title || '',
      manufacturer: '',
      manufacturerEn: '',
      price: formatBeautywayPrice(price),
      thumb: absImage(img),
      barcode,
      sku: String(id),
      category: meta.name || '',
      categoryEn: meta.nameEn || meta.name || '',
      productUrl,
      matchType: 'product',
      source: 'live',
    });
  }
  return products;
}

export function parseProductDetailHtml(html = '', productUrl = '') {
  const id = html.match(/product_id="(\d+)"/)?.[1]
    || html.match(/name="product_id"\s+value="(\d+)"/)?.[1];
  const barcode = html.match(/product_barcode="(\d+)"/)?.[1]
    || html.match(/باركود[\s\S]{0,80}?(\d{8,14})/)?.[1]
    || '';
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1] || '';
  const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] || '';
  const { ar, en } = splitTitle(ogTitle);

  let brand = '';
  for (const row of html.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const text = stripHtml(row);
    if (text.includes('الماركة')) brand = text.replace(/.*الماركة\s*/u, '').trim();
    if (text.includes('باركود') && !barcode) {
      const bc = text.match(/(\d{8,14})/);
      if (bc) brand = brand || '';
    }
  }
  if (!brand) {
    brand = html.match(/الماركة[\s\S]{0,120}?<td[^>]*>([^<]+)/)?.[1]?.trim() || '';
  }

  let priceRaw = html.match(/السعر[\s\S]{0,200}?([0-9,]+)\s*دينار/)?.[1]
    || html.match(/([0-9,]+)\s*دينار/)?.[1];

  const slugMatch = productUrl.match(/beautyway-iq\.com\/([^/?#]+)/);
  const slug = slugMatch?.[1] || '';

  const bodyMatch = html.match(/class="[^"]*page_content[^"]*"[\s\S]{0,4000}/i);
  const description = bodyMatch ? stripHtml(bodyMatch[0]).slice(0, 2000) : '';

  return {
    id: String(id || ''),
    slug,
    name: ar || ogTitle,
    nameEn: en || ogTitle,
    manufacturer: brand,
    manufacturerEn: brand,
    price: formatBeautywayPrice(priceRaw),
    thumb: absImage(ogImage),
    images: ogImage ? [absImage(ogImage)] : [],
    barcode,
    sku: String(id || ''),
    description,
    descriptionEn: description,
    productUrl: productUrl || (slug ? `${SITE}/${slug}` : SITE),
    shadeCount: 0,
    shades: [],
    hasShades: false,
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
  return {
    ...product,
    images: product.images?.length ? product.images : (product.thumb ? [product.thumb] : []),
    shades: product.shades || [],
    shadeCount: product.shadeCount || 0,
    hasShades: !!product.hasShades,
  };
}

async function getCategories() {
  if (categoryCache && Date.now() - categoryCacheAt < CATEGORY_TTL_MS) return categoryCache;
  try {
    const html = await fetchHtml('/');
    const cats = [];
    const re = /shop\?category=(\d+)"[^>]*><b>([^<]+)/g;
    let m;
    while ((m = re.exec(html))) {
      cats.push({ id: m[1], name: m[2].trim(), nameEn: m[2].trim() });
    }
    categoryCache = cats.length ? cats : FALLBACK_CATEGORIES;
  } catch {
    categoryCache = FALLBACK_CATEGORIES;
  }
  categoryCacheAt = Date.now();
  return categoryCache;
}

function listingHasMore(html, page, pageSize = 12) {
  const count = (html.match(/product_item/g) || []).length;
  if (!count) return false;
  if (count < pageSize) return false;
  return html.includes(`page=${page + 1}`) || html.includes(`page=${page + 1}&`);
}

export async function fetchCategoryTree() {
  const leaves = await getCategories();
  const tree = leaves.map((c) => ({
    id: c.id,
    slug: c.id,
    name: c.name,
    nameEn: c.nameEn,
    path: c.name,
    isLeaf: true,
    children: [],
  }));
  return { tree, leaves: tree };
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const cats = await getCategories();
  const meta = cats.find((c) => c.id === String(categoryId)) || { name: String(categoryId), nameEn: String(categoryId) };
  const html = await fetchHtml('/shop', { category: categoryId, page });
  const items = parseListingProducts(html, meta);
  return {
    items: items.slice(0, limit),
    page,
    pageSize: limit,
    hasMore: listingHasMore(html, page),
  };
}

export async function searchProducts(query, page = 1, limit = 30) {
  const q = String(query || '').trim();
  if (!q) return { items: [], page, pageSize: limit, hasMore: false };

  const html = await fetchHtml('/shop', { keys: q, page });
  let items = parseListingProducts(html, { name: `بحث: ${q}`, nameEn: `Search: ${q}` });
  const ql = q.toLowerCase();
  items = items.filter((p) =>
    `${p.name} ${p.nameEn} ${p.manufacturer} ${p.barcode}`.toLowerCase().includes(ql)
    || (isEan(q.replace(/\D/g, '')) && barcodeMatches(p.barcode, q)),
  );
  return {
    items: items.slice(0, limit),
    page,
    pageSize: limit,
    hasMore: listingHasMore(html, page) && items.length >= limit,
  };
}

async function fetchListingPage(categoryId, page, meta) {
  const html = await fetchHtml('/shop', { category: categoryId, page });
  return parseListingProducts(html, meta);
}

async function scanListingsForBarcode(barcode, { maxPagesPerCategory = 4, deadlineMs = 11_000 } = {}) {
  const digits = String(barcode || '').replace(/\D/g, '');
  const variants = barcodeQueryVariants(digits);
  const started = Date.now();
  const matches = [];
  const seen = new Set();

  const collect = (items = []) => {
    for (const item of items) {
      const ok = variants.some((v) => barcodeMatches(item.barcode, v));
      if (!ok) continue;
      const key = `${item.id}:${item.barcode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push(item);
    }
  };

  try {
    const homeHtml = await fetchHtml('/');
    collect(parseListingProducts(homeHtml, { name: 'الرئيسية', nameEn: 'Home' }));
    if (matches.length) return matches;
  } catch { /* optional */ }

  const cats = await getCategories();
  const priority = ['6', '35', '28', '29', '22', '19'];
  const ordered = [
    ...cats.filter((c) => priority.includes(c.id)),
    ...cats.filter((c) => !priority.includes(c.id)),
  ];

  for (let page = 1; page <= maxPagesPerCategory; page++) {
    if (Date.now() - started > deadlineMs) break;

    const batch = ordered.map((cat) =>
      fetchListingPage(cat.id, page, cat).catch(() => []),
    );
    const pages = await Promise.all(batch);

    for (const items of pages) {
      collect(items);
    }
    if (matches.length) return matches;
  }

  return matches;
}

export async function fetchProductById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  const html = await fetchHtml(`/node/${encodeURIComponent(key)}`);
  const detail = parseProductDetailHtml(html, `${SITE}/node/${key}`);
  return detail.id ? detail : null;
}

export async function fetchProductBySlug(slug) {
  const s = String(slug || '').trim().replace(/^\//, '');
  if (!s) return null;
  const html = await fetchHtml(`/${encodeURIComponent(s)}`);
  const detail = parseProductDetailHtml(html, `${SITE}/${s}`);
  return detail.id ? detail : null;
}

export async function fetchProductDetail(id, { slug } = {}) {
  if (slug) {
    const bySlug = await fetchProductBySlug(slug);
    if (bySlug?.id) return normalizeProductDetail(bySlug);
  }
  const raw = await fetchProductById(id);
  return raw ? normalizeProductDetail(raw) : null;
}

export async function searchProductsByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  const results = await scanListingsForBarcode(digits);
  if (results.length) return results.slice(0, 12);

  const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  if (meta?.brand || meta?.title) {
    const queries = buildMetaHintQueries(meta);
    const verified = [];
    for (const q of queries) {
      const hinted = await searchProducts(q, 1, 16);
      for (const item of hinted.items || []) {
        const score = scoreStoreHintMatch(item, meta);
        if (score < 8) continue;
        try {
          const detail = await fetchProductDetail(item.id, { slug: item.slug });
          if (detail) {
            verified.push({
              ...item,
              ...detail,
              barcode: digits,
              matchType: 'hint',
              source: meta.source || 'meta-hint',
              matchScore: score,
            });
          }
        } catch { /* skip */ }
      }
      if (verified.length) return verified.slice(0, 12);
    }
  }

  return [];
}

export function sortProductsClient(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (p) => Number(String(p.price || '').replace(/[^\d]/g, '')) || 0;
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

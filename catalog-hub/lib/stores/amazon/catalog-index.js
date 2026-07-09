import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(__dirname, '..', '..', '..', 'data', 'amazon-beauty-index.json');

let indexCache = null;
let indexDirty = false;
let persistTimer = null;

function emptyIndex() {
  return {
    meta: {
      updatedAt: 0,
      crawledAt: 0,
      productCount: 0,
      status: 'idle',
      progress: {
        done: 0,
        total: 0,
        lastNode: '',
        lastKeyword: '',
        lastSort: '',
        lastPage: 0,
        errors: 0,
        added: 0,
      },
      message: '',
    },
    products: {},
    crawlCursor: 0,
  };
}

export function loadAmazonIndex({ force = false } = {}) {
  if (indexCache && !force) return indexCache;
  try {
    const raw = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    indexCache = {
      ...emptyIndex(),
      ...raw,
      meta: { ...emptyIndex().meta, ...(raw.meta || {}) },
      products: raw.products || {},
      crawlCursor: Number(raw.crawlCursor || 0),
    };
  } catch {
    indexCache = emptyIndex();
  }
  return indexCache;
}

function flushAmazonIndex() {
  if (!indexDirty || !indexCache) return;
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  indexCache.meta = {
    ...indexCache.meta,
    updatedAt: Date.now(),
    productCount: Object.keys(indexCache.products).length,
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexCache));
  indexDirty = false;
}

function persistAmazonIndex() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      flushAmazonIndex();
    } catch { /* غير قاتل */ }
  }, 800);
  persistTimer.unref?.();
}

process.once('beforeExit', () => {
  try {
    flushAmazonIndex();
  } catch { /* ignore */ }
});

export function getAmazonIndexStats() {
  const index = loadAmazonIndex();
  return {
    productCount: Object.keys(index.products).length,
    status: index.meta.status || 'idle',
    crawledAt: index.meta.crawledAt || 0,
    updatedAt: index.meta.updatedAt || 0,
    progress: index.meta.progress || {},
    message: index.meta.message || '',
  };
}

export function setAmazonCrawlMeta(patch = {}) {
  const index = loadAmazonIndex();
  index.meta = {
    ...index.meta,
    ...patch,
    progress: { ...index.meta.progress, ...(patch.progress || {}) },
  };
  indexDirty = true;
  persistAmazonIndex();
  return index.meta;
}

export function setAmazonCrawlCursor(cursor = 0) {
  const index = loadAmazonIndex();
  index.crawlCursor = Math.max(0, Number(cursor) || 0);
  indexDirty = true;
  persistAmazonIndex();
}

export function getAmazonCrawlCursor() {
  return Number(loadAmazonIndex().crawlCursor || 0);
}

/** حفظ/تحديث منتجات قائمة من PA-API */
export function upsertAmazonProducts(items = [], { categoryId = '' } = {}) {
  if (!items.length) return 0;
  const index = loadAmazonIndex();
  let added = 0;
  const now = Date.now();
  const cat = String(categoryId || '').trim();

  for (const item of items) {
    const id = String(item?.id || item?.ASIN || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(id)) continue;

    const prev = index.products[id];
    const categoryIds = new Set([
      ...(prev?.categoryIds || []),
      ...(item.categoryIds || []),
      ...(cat ? [cat] : []),
    ].filter(Boolean));

    const barcodes = [...new Set([
      ...(prev?.barcodes || []),
      ...(item.barcodes || []),
      item.barcode,
      prev?.barcode,
    ].map((b) => String(b || '').replace(/\D/g, '')).filter((b) => b.length >= 8 && b.length <= 14))];

    const next = {
      id,
      nameAr: item.nameAr || prev?.nameAr || item.nameEn || '',
      nameEn: item.nameEn || prev?.nameEn || item.nameAr || '',
      brandAr: item.brandAr || prev?.brandAr || '',
      brandEn: item.brandEn || prev?.brandEn || item.brandAr || '',
      thumb: item.thumb || prev?.thumb || '',
      price: item.price || prev?.price || '',
      barcode: item.barcode || prev?.barcode || barcodes[0] || '',
      barcodes,
      sku: item.sku || prev?.sku || id,
      category: item.category || prev?.category || '',
      categoryIds: [...categoryIds],
      shadeCount: item.shadeCount ?? prev?.shadeCount ?? null,
      url: item.url || prev?.url || `https://www.amazon.com/dp/${id}`,
      updatedAt: now,
    };

    if (!prev) added += 1;
    index.products[id] = next;
  }

  index.meta.productCount = Object.keys(index.products).length;
  indexDirty = true;
  persistAmazonIndex();
  return added;
}

function matchesQuery(product, query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [
    product.nameAr,
    product.nameEn,
    product.brandAr,
    product.brandEn,
    product.barcode,
    product.sku,
    product.category,
    product.id,
  ].join(' ').toLowerCase();
  return q.split(/\s+/).every((token) => hay.includes(token));
}

function inCategory(product, categoryId = '') {
  const cat = String(categoryId || '').trim();
  if (!cat || cat === '3760911') return true;
  return (product.categoryIds || []).includes(cat);
}

export function queryAmazonIndex({
  query = '',
  categoryId = '',
  page = 1,
  limit = 30,
} = {}) {
  const index = loadAmazonIndex();
  const all = Object.values(index.products)
    .filter((p) => inCategory(p, categoryId) && matchesQuery(p, query))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const pageSize = Math.max(1, Math.min(60, Number(limit) || 30));
  const pageNum = Math.max(1, Number(page) || 1);
  const start = (pageNum - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  return {
    items,
    page: pageNum,
    pageSize,
    total: all.length,
    hasMore: start + pageSize < all.length,
    source: 'index',
  };
}

export function findAmazonByBarcode(digits = '') {
  const code = String(digits || '').replace(/\D/g, '');
  if (code.length < 8) return null;
  const variants = new Set([
    code,
    code.replace(/^0+/, '') || code,
    code.length === 12 ? `0${code}` : '',
    code.length === 13 && code.startsWith('0') ? code.slice(1) : '',
  ].filter(Boolean));

  const index = loadAmazonIndex();
  for (const product of Object.values(index.products)) {
    const pool = [
      product.barcode,
      product.sku,
      ...(product.barcodes || []),
    ].map((b) => String(b || '').replace(/\D/g, '')).filter(Boolean);
    if (pool.some((b) => variants.has(b))) return product;
  }
  return null;
}

export function flushAmazonIndexNow() {
  flushAmazonIndex();
}

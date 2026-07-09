import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findBarcodesForProduct, findBarcodeIndexEntry, gtinEqual, loadBarcodeIndex } from '../../core/barcode-index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(__dirname, '..', '..', '..', 'data', 'miswag-catalog-index.json');

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
        category: '',
        page: 0,
        added: 0,
        errors: 0,
      },
      message: '',
    },
    products: {},
    crawlCursor: 0,
    barcodeHarvestCursor: 0,
  };
}

export function loadMiswagIndex({ force = false } = {}) {
  if (indexCache && !force) return indexCache;
  try {
    const raw = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    indexCache = {
      ...emptyIndex(),
      ...raw,
      meta: { ...emptyIndex().meta, ...(raw.meta || {}) },
      products: raw.products || {},
      crawlCursor: Number(raw.crawlCursor || 0),
      barcodeHarvestCursor: Number(raw.barcodeHarvestCursor || 0),
    };
  } catch {
    indexCache = emptyIndex();
  }
  return indexCache;
}

function flushMiswagIndex() {
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

function persistMiswagIndex() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      flushMiswagIndex();
    } catch { /* غير قاتل */ }
  }, 600);
  persistTimer.unref?.();
}

process.once('beforeExit', () => {
  try {
    flushMiswagIndex();
  } catch { /* ignore */ }
});

export function getMiswagIndexStats() {
  const index = loadMiswagIndex();
  return {
    productCount: Object.keys(index.products).length,
    status: index.meta.status || 'idle',
    crawledAt: index.meta.crawledAt || 0,
    updatedAt: index.meta.updatedAt || 0,
    progress: index.meta.progress || {},
    message: index.meta.message || '',
  };
}

export function isMiswagCatalogWarm(minProducts = 50) {
  return getMiswagIndexStats().productCount >= minProducts;
}

export function setMiswagCrawlMeta(patch = {}) {
  const index = loadMiswagIndex();
  index.meta = {
    ...index.meta,
    ...patch,
    progress: { ...index.meta.progress, ...(patch.progress || {}) },
    barcodeHarvest: {
      ...(index.meta.barcodeHarvest || {}),
      ...(patch.barcodeHarvest || {}),
    },
  };
  indexDirty = true;
  persistMiswagIndex();
  return index.meta;
}

export function setMiswagCrawlCursor(cursor = 0) {
  const index = loadMiswagIndex();
  index.crawlCursor = Math.max(0, Number(cursor) || 0);
  indexDirty = true;
  persistMiswagIndex();
}

export function getMiswagCrawlCursor() {
  return Number(loadMiswagIndex().crawlCursor || 0);
}

function mergeBarcodes(productId, prev = []) {
  const fromGlobal = findBarcodesForProduct('miswag', productId)
    .map((r) => String(r.barcode || '').replace(/\D/g, ''))
    .filter((b) => b.length >= 8);
  return [...new Set([...prev, ...fromGlobal])];
}

/** حفظ منتجات من Typesense — بيانات فقط، الصور روابط URL */
export function upsertMiswagProducts(items = [], { categoryId = '' } = {}) {
  if (!items.length) return 0;
  const index = loadMiswagIndex();
  let added = 0;
  const now = Date.now();
  const cat = String(categoryId || '').trim();

  for (const item of items) {
    const id = String(item?.id || '').trim();
    if (!id) continue;

    const prev = index.products[id];
    const categoryIds = new Set([
      ...(prev?.categoryIds || []),
      ...(item.categoryIds || []),
      ...(cat ? [cat] : []),
      item.l1_alias,
      item.l2_alias,
      item.l3_alias,
    ].filter(Boolean));

    const barcodes = mergeBarcodes(id, [
      ...(prev?.barcodes || []),
      ...(item.barcodes || []),
      item.barcode,
    ].map((b) => String(b || '').replace(/\D/g, '')).filter((b) => b.length >= 8 && b.length <= 14));

    const next = {
      id,
      nameAr: item.nameAr || prev?.nameAr || '',
      nameEn: item.nameEn || prev?.nameEn || '',
      brandAr: item.brandAr || prev?.brandAr || '',
      brandEn: item.brandEn || prev?.brandEn || '',
      thumb: item.thumb || prev?.thumb || '',
      price: item.price || prev?.price || '',
      sku: item.sku || prev?.sku || id,
      productUrl: item.productUrl || prev?.productUrl || `https://miswag.com/products/${id}`,
      category: item.category || prev?.category || '',
      l1_alias: item.l1_alias || prev?.l1_alias || '',
      l2_alias: item.l2_alias || prev?.l2_alias || '',
      l3_alias: item.l3_alias || prev?.l3_alias || '',
      categoryIds: [...categoryIds],
      shadeCount: item.shadeCount ?? prev?.shadeCount ?? 0,
      hasOptions: item.hasOptions ?? prev?.hasOptions ?? false,
      inStock: item.inStock ?? prev?.inStock ?? true,
      barcodes,
      barcode: barcodes[0] || prev?.barcode || '',
      updatedAt: now,
    };

    if (!prev) added += 1;
    index.products[id] = next;
  }

  index.meta.productCount = Object.keys(index.products).length;
  indexDirty = true;
  persistMiswagIndex();
  return added;
}

const DIVISION_FIELDS = ['l1_alias', 'l2_alias', 'l3_alias', 'l4_alias'];

/** توحيد أشكال الحروف العربية + مرادفات ماركات شائعة */
const BRAND_QUERY_ALIASES = {
  مايبلين: 'maybelline',
  ميبيلين: 'maybelline',
  مايبيلين: 'maybelline',
  لوريال: 'loreal',
  لوريا: 'loreal',
  نيكس: 'nyx',
  ريفولون: 'revlon',
  ماكسفاكتور: 'max factor',
  ماكس: 'max factor',
};

function normalizeArabicSearch(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ڤ/g, 'ف')
    .replace(/گ/g, 'ك')
    .replace(/[^\w\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandSearchTokens(query = '') {
  const raw = String(query || '').trim().toLowerCase();
  const norm = normalizeArabicSearch(raw);
  const tokens = new Set();
  for (const part of [raw, norm]) {
    for (const token of part.split(/\s+/).filter((t) => t.length >= 2)) {
      tokens.add(token);
      const alias = BRAND_QUERY_ALIASES[token] || BRAND_QUERY_ALIASES[normalizeArabicSearch(token)];
      if (alias) tokens.add(alias);
    }
  }
  return [...tokens];
}

function inCategory(product, categoryId = '') {
  const cat = String(categoryId || '').trim();
  if (!cat) return true;
  if ((product.categoryIds || []).includes(cat)) return true;
  return DIVISION_FIELDS.some((f) => String(product[f] || '') === cat);
}

function matchesQuery(product, query = '') {
  const q = String(query || '').trim();
  if (!q) return true;
  const hay = normalizeArabicSearch([
    product.nameAr,
    product.nameEn,
    product.brandAr,
    product.brandEn,
    product.category,
    product.sku,
    product.id,
    ...(product.barcodes || []),
  ].join(' '));
  const hayLatin = [
    product.nameEn,
    product.brandEn,
    product.brandAr,
    product.sku,
  ].join(' ').toLowerCase();
  const tokens = expandSearchTokens(q);
  if (!tokens.length) {
    const needle = normalizeArabicSearch(q);
    return hay.includes(needle) || hayLatin.includes(q.toLowerCase());
  }
  return tokens.some((token) => {
    const norm = normalizeArabicSearch(token);
    return hay.includes(norm) || hayLatin.includes(token);
  });
}

export function queryMiswagIndex({
  query = '',
  categoryId = '',
  page = 1,
  limit = 30,
} = {}) {
  const index = loadMiswagIndex();
  const all = Object.values(index.products)
    .filter((p) => inCategory(p, categoryId) && matchesQuery(p, query))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const pageSize = Math.max(1, Math.min(60, Number(limit) || 30));
  const pageNum = Math.max(1, Number(page) || 1);
  const start = (pageNum - 1) * pageSize;
  const items = all.slice(start, start + pageSize).map(stubToListItem);

  return {
    items,
    page: pageNum,
    pageSize,
    total: all.length,
    hasMore: start + pageSize < all.length,
    source: 'index',
  };
}

export function stubToListItem(p = {}) {
  const barcodes = [
    p.barcode,
    ...(p.barcodes || []),
    ...findBarcodesForProduct('miswag', p.id).map((r) => r.barcode),
  ].map((b) => String(b || '').replace(/\D/g, '')).filter((b) => b.length >= 8);
  const barcode = barcodes[0] || '';
  return {
    id: p.id,
    nameAr: p.nameAr || '',
    nameEn: p.nameEn || '',
    brandAr: p.brandAr || '',
    brandEn: p.brandEn || '',
    thumb: p.thumb || '',
    price: p.price || '',
    sku: p.sku || p.id,
    productUrl: p.productUrl || '',
    category: p.category || '',
    barcode,
    shadeCount: p.shadeCount || 0,
    hasOptions: p.hasOptions === true,
    inStock: p.inStock !== false,
  };
}

export function stubToBarcodeHit(p = {}, { digits = '', matchType = 'index', shadeName = '' } = {}) {
  return {
    id: p.id,
    nameAr: p.nameAr || '',
    nameEn: p.nameEn || '',
    brandAr: p.brandAr || '',
    brandEn: p.brandEn || '',
    thumb: p.thumb || '',
    price: p.price || '',
    shadeCount: p.shadeCount || 0,
    hasOptions: p.hasOptions === true,
    shadeName,
    barcode: digits || p.barcode || '',
    matchType,
  };
}

export function getMiswagProduct(id) {
  const pid = String(id || '').trim();
  if (!pid) return null;
  return loadMiswagIndex().products[pid] || null;
}

export function findMiswagById(id) {
  return getMiswagProduct(id);
}

function stubFromBarcodeEntry(entry, digits = '') {
  const id = String(entry?.productId || '').trim();
  if (!id) return null;
  const code = String(digits || entry?.barcode || '').replace(/\D/g, '');
  return {
    id,
    nameAr: entry.name || entry.nameAr || '',
    nameEn: entry.nameEn || '',
    brandAr: entry.brand || entry.brandAr || '',
    brandEn: entry.brandEn || entry.brand || '',
    thumb: entry.thumb || '',
    price: entry.price || '',
    sku: id,
    productUrl: `https://miswag.com/products/${id}`,
    category: entry.category || '',
    shadeCount: Number(entry.shadeCount || 0),
    hasOptions: false,
    inStock: true,
    barcodes: code ? [code] : [],
    barcode: code,
    updatedAt: Date.now(),
  };
}

/** دمج باركودات barcode-index.json في منتجات الفهرس المحلي */
export function enrichMiswagCatalogFromBarcodeIndex() {
  const index = loadMiswagIndex();
  const { entries = {} } = loadBarcodeIndex();
  let touched = 0;

  for (const row of Object.values(entries)) {
    if (row?.store !== 'miswag') continue;
    const productId = String(row.productId || '').trim();
    const code = String(row.barcode || '').replace(/\D/g, '');
    if (!productId || code.length < 8) continue;

    const prev = index.products[productId];
    if (!prev) continue;

    const barcodes = mergeBarcodes(productId, [
      ...(prev.barcodes || []),
      prev.barcode,
      code,
    ].filter(Boolean));

    if (barcodes.length === (prev.barcodes || []).length && prev.barcode === barcodes[0]) continue;

    index.products[productId] = {
      ...prev,
      barcodes,
      barcode: barcodes[0] || prev.barcode || '',
      updatedAt: Date.now(),
    };
    touched += 1;
  }

  if (touched) {
    indexDirty = true;
    persistMiswagIndex();
  }
  return touched;
}

export function findMiswagByBarcode(digits = '') {
  const code = String(digits || '').replace(/\D/g, '');
  if (code.length < 8) return null;

  const index = loadMiswagIndex();
  for (const product of Object.values(index.products)) {
    const pool = [
      product.barcode,
      ...(product.barcodes || []),
    ].filter(Boolean);
    if (pool.some((b) => gtinEqual(b, code))) return product;
  }

  const entry = findBarcodeIndexEntry(code);
  if (entry?.productId) {
    const hit = index.products[String(entry.productId)];
    if (hit) return hit;
    return stubFromBarcodeEntry(entry, code);
  }

  return null;
}

export function flushMiswagIndexNow() {
  flushMiswagIndex();
}

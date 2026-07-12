import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gtinEqual, gtinKey } from '../../core/barcode-index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(__dirname, '..', '..', '..', 'data', 'waheteter-barcode-index.json');

let cache = null;
let dirty = false;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    cache = { entries: {}, products: {}, meta: { builtAt: 0, productCount: 0, barcodes: 0 } };
  }
  if (!cache.entries) cache.entries = {};
  if (!cache.products) cache.products = {};
  if (!cache.meta) cache.meta = {};
  return cache;
}

function save() {
  if (!dirty || !cache) return;
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  cache.meta = {
    ...cache.meta,
    builtAt: Date.now(),
    barcodes: Object.keys(cache.entries).length,
    productCount: Object.keys(cache.products).length,
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(cache));
  dirty = false;
}

export function findWaheteterBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return null;
  const { entries } = load();
  const key = gtinKey(digits);
  if (entries[key]) return { key, ...entries[key] };
  for (const [k, row] of Object.entries(entries)) {
    if (gtinEqual(k, digits) || gtinEqual(row?.barcode, digits)) return { key: k, ...row };
  }
  return null;
}

export function getWaheteterProductSnapshot(productId = '') {
  const pid = String(productId || '').trim();
  if (!pid) return null;
  const { products } = load();
  return products[pid] || null;
}

export function upsertWaheteterBarcode(barcode, row = {}) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  const index = load();
  const key = gtinKey(digits);
  index.entries[key] = {
    ...index.entries[key],
    ...row,
    barcode: digits,
    store: 'waheteter',
    updatedAt: Date.now(),
  };
  dirty = true;
  save();
  return index.entries[key];
}

export function upsertWaheteterProduct(productId, snapshot = {}) {
  const pid = String(productId || '').trim();
  if (!pid || !snapshot?.id) return null;
  const index = load();
  index.products[pid] = { ...snapshot, id: pid, updatedAt: Date.now() };
  dirty = true;
  save();
  return index.products[pid];
}

export function searchWaheteterProducts(query = '', { limit = 30 } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const { products } = load();
  const out = [];
  for (const product of Object.values(products)) {
    const hay = [
      product.nameAr,
      product.nameEn,
      product.brandAr,
      product.brandEn,
      product.barcode,
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) continue;
    out.push(product);
    if (out.length >= limit) break;
  }
  return out;
}

export function waheteterBarcodeIndexStats() {
  const { entries, products, meta } = load();
  return {
    barcodes: Object.keys(entries).length,
    products: Object.keys(products).length,
    builtAt: meta?.builtAt || 0,
    productCount: meta?.productCount || Object.keys(products).length,
  };
}

export function isWaheteterIndexFresh({ minBarcodes = 500 } = {}) {
  const { entries, meta } = load();
  return Object.keys(entries).length >= minBarcodes && Boolean(meta?.builtAt);
}

export function rememberWaheteterDetail(detail = {}) {
  if (!detail?.id) return;
  upsertWaheteterProduct(detail.id, detail);
  for (const shade of detail.shades || []) {
    const barcode = String(shade.barcode || '').replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(barcode)) continue;
    upsertWaheteterBarcode(barcode, {
      productId: String(detail.id),
      variationId: String(shade.id || ''),
      slug: String(detail.productUrl || '').split('/product/')[1]?.replace(/\/$/, '') || '',
      shadeName: shade.nameAr || shade.nameEn || '',
    });
  }
  const topBarcode = String(detail.barcode || '').replace(/\D/g, '');
  if (/^\d{8,14}$/.test(topBarcode)) {
    upsertWaheteterBarcode(topBarcode, {
      productId: String(detail.id),
      variationId: '',
      slug: String(detail.productUrl || '').split('/product/')[1]?.replace(/\/$/, '') || '',
      shadeName: '',
    });
  }
}

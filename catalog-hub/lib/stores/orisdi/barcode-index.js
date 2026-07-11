import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gtinEqual, gtinKey } from '../../core/barcode-index.js';
import { variantBarcode } from './client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(__dirname, '..', '..', '..', 'data', 'orisdi-barcode-index.json');

let cache = null;
let dirty = false;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    cache = { entries: {}, meta: { builtAt: 0, productCount: 0 } };
  }
  if (!cache.entries) cache = { entries: {}, meta: cache.meta || {} };
  return cache;
}

function save() {
  if (!dirty || !cache) return;
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  cache.meta = { ...cache.meta, builtAt: Date.now() };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(cache, null, 2));
  dirty = false;
}

export function findOrisdiBarcode(barcode) {
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

export function upsertOrisdiBarcode(barcode, row = {}) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  const index = load();
  const key = gtinKey(digits);
  index.entries[key] = {
    ...index.entries[key],
    ...row,
    barcode: digits,
    store: 'orisdi',
    updatedAt: Date.now(),
  };
  dirty = true;
  save();
  return index.entries[key];
}

export function indexOrisdiProduct(product = {}) {
  const productId = String(product.id || '');
  const handle = String(product.handle || '');
  if (!productId || !handle) return 0;
  let count = 0;
  for (const variant of product.variants || []) {
    const barcode = variantBarcode(variant);
    if (!barcode) continue;
    upsertOrisdiBarcode(barcode, {
      productId,
      handle,
      variantId: String(variant.id || ''),
      shadeName: String(variant.title || variant.public_title || '').trim(),
    });
    count += 1;
  }
  return count;
}

export function orisdiBarcodeIndexStats() {
  const { entries, meta } = load();
  return {
    barcodes: Object.keys(entries).length,
    builtAt: meta?.builtAt || 0,
    productCount: meta?.productCount || 0,
  };
}

export function isOrisdiIndexFresh({ maxAgeMs = 24 * 60 * 60 * 1000 } = {}) {
  const { meta, entries } = load();
  const count = Object.keys(entries).length;
  if (count < 1000) return false;
  return Boolean(meta?.builtAt && Date.now() - meta.builtAt < maxAgeMs);
}

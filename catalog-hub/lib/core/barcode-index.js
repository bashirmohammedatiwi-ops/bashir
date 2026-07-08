import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(__dirname, '..', '..', 'data', 'barcode-index.json');

let indexCache = null;
let indexDirty = false;

export function gtinKey(digits = '') {
  let d = String(digits).replace(/\D/g, '');
  if (d.length === 12) d = `0${d}`;
  return d.padStart(14, '0');
}

export function gtinEqual(a, b) {
  return gtinKey(a) === gtinKey(b);
}

export function loadBarcodeIndex({ force = false } = {}) {
  if (indexCache && !force) return indexCache;
  try {
    const raw = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    indexCache = raw.entries ? raw : { entries: raw, meta: { updatedAt: 0 } };
  } catch {
    indexCache = { entries: {}, meta: { updatedAt: 0 } };
  }
  if (!indexCache.entries) indexCache = { entries: indexCache, meta: {} };
  return indexCache;
}

function persistBarcodeIndex() {
  if (!indexDirty || !indexCache) return;
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  indexCache.meta = { ...indexCache.meta, updatedAt: Date.now() };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexCache, null, 2));
  indexDirty = false;
}

export function findBarcodeIndexEntry(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return null;
  const { entries } = loadBarcodeIndex();
  const key = gtinKey(digits);
  if (entries[key]) return { key, ...entries[key] };
  for (const [k, row] of Object.entries(entries)) {
    if (gtinEqual(k, digits) || gtinEqual(row?.barcode, digits)) return { key: k, ...row };
  }
  return null;
}

export function findBarcodesForProduct(store, productId) {
  const pid = String(productId || '').trim();
  if (!pid) return [];
  const { entries } = loadBarcodeIndex();
  return Object.entries(entries)
    .filter(([, row]) => String(row?.store || 'miswag') === store && String(row?.productId || '') === pid)
    .map(([key, row]) => ({ key, ...row }));
}

export function upsertBarcodeIndex(barcode, fields = {}) {
  const digits = String(barcode || fields.barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const index = loadBarcodeIndex();
  const key = gtinKey(digits);
  index.entries[key] = {
    ...index.entries[key],
    ...fields,
    barcode: digits,
    updatedAt: Date.now(),
  };
  indexDirty = true;
  persistBarcodeIndex();
  return index.entries[key];
}

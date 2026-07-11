import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(__dirname, '..', '..', 'data', 'barcode-index.json');

let indexCache = null;
let indexDirty = false;
let persistTimer = null;

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

function flushBarcodeIndex() {
  if (!indexDirty || !indexCache) return;
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  indexCache.meta = { ...indexCache.meta, updatedAt: Date.now() };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexCache, null, 2));
  indexDirty = false;
}

// كتابة مؤجلة — المسح المتوازي يفهرس عشرات الباركودات، كتابة واحدة تكفي
function persistBarcodeIndex() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      flushBarcodeIndex();
    } catch { /* غير قاتل */ }
  }, 400);
  persistTimer.unref?.();
}

process.once('beforeExit', () => {
  try {
    flushBarcodeIndex();
  } catch { /* ignore */ }
});

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

/** باركودات مفهرسة تشارك نفس بادئة شركة GS1 — تكشف ماركة باركود جديد لنفس الشركة */
export function findBarcodeIndexSiblings(barcode, { limit = 8 } = {}) {
  const key = gtinKey(barcode);
  if (!/^\d{14}$/.test(key)) return [];
  const { entries } = loadBarcodeIndex();

  for (const prefixLen of [10, 9, 8]) {
    const prefix = key.slice(0, prefixLen);
    const siblings = Object.entries(entries)
      .filter(([k]) => k !== key && k.startsWith(prefix))
      .map(([k, row]) => ({ key: k, ...row }))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (siblings.length) return siblings.slice(0, limit);
  }
  return [];
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
  const index = loadBarcodeIndex();
  const entry = applyUpsert(index, barcode, fields);
  persistBarcodeIndex();
  return entry;
}

/** بحث O(1) بالمفتاح المعياري فقط */
export function hasBarcodeIndexEntry(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return false;
  const { entries } = loadBarcodeIndex();
  return Boolean(entries[gtinKey(digits)]);
}

function applyUpsert(index, barcode, fields = {}) {
  const digits = String(barcode || fields.barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const key = gtinKey(digits);
  index.entries[key] = {
    ...index.entries[key],
    ...fields,
    barcode: digits,
    updatedAt: Date.now(),
  };
  indexDirty = true;
  return index.entries[key];
}

/** إدخال دفعة باركودات بكتابة قرص واحدة — يُستخدم أثناء مسح الماركات */
export function bulkUpsertBarcodeIndex(rows = []) {
  if (!rows.length) return 0;
  const index = loadBarcodeIndex();
  let count = 0;
  for (const { barcode, ...fields } of rows) {
    if (applyUpsert(index, barcode, fields)) count += 1;
  }
  persistBarcodeIndex();
  return count;
}

/** إصدار حصاد مسواگ — يُرفع عند تحسين منطق الجمع */
export const MISWAG_HARVEST_VERSION = 3;

export function isMiswagBarcodeHarvestDone(productId) {
  const pid = String(productId || '').trim();
  if (!pid) return false;
  const { meta } = loadBarcodeIndex();
  const row = meta?.miswagHarvest?.[pid];
  return Boolean(row && row.version >= MISWAG_HARVEST_VERSION);
}

export function markMiswagBarcodeHarvestDone(productId, { barcodeCount = 0 } = {}) {
  const pid = String(productId || '').trim();
  if (!pid) return;
  const index = loadBarcodeIndex();
  if (!index.meta) index.meta = {};
  if (!index.meta.miswagHarvest) index.meta.miswagHarvest = {};
  index.meta.miswagHarvest[pid] = {
    version: MISWAG_HARVEST_VERSION,
    at: Date.now(),
    barcodeCount,
  };
  indexDirty = true;
  persistBarcodeIndex();
}

export function countMiswagBarcodeIndexEntries() {
  const { entries } = loadBarcodeIndex();
  return Object.values(entries).filter((r) => String(r?.store || '') === 'miswag').length;
}

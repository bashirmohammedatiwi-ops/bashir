/**
 * فهرس باركود موحّد في الذاكرة — بحث O(1) عبر كل المتاجر من ملفات data/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadBarcodeIndex,
  loadBarcodeLookup,
  upsertBarcodeLookup,
  invalidateBarcodeRamIndex,
} from './barcodes.js';
import { loadFacesBarcodeIndex } from './faces-api.js';
import { publicPath } from './public-prefix.js';

const STORE_LABELS = {
  niceone: 'Nice One',
  vanilla: 'Vanilla Cosmetics',
  elryan: 'الريان Elryan',
  miraaya: 'ميرايا Miraaya',
  faces: 'وجوه FACES',
  amazon: 'Amazon Cosmetics',
  miswag: 'مسواگ Miswag',
  orisdi: 'أورزدي Orisdi',
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const VANILLA_CACHE_FILE = path.join(__dirname, '..', 'data', 'vanilla-barcode-cache.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'barcode-cache.json');

let unifiedIndex = null;
let unifiedBuiltAt = 0;

export function gtinKey(digits = '') {
  let d = String(digits).replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 12) d = `0${d}`;
  return d.padStart(14, '0');
}

function hit(store, fields = {}) {
  const label = STORE_LABELS[store] || store;
  const storePath = publicPath(`/${store}/`);
  return {
    store,
    storeLabel: label,
    storePath,
    openUrl: `${storePath}?product=${encodeURIComponent(fields.id || '')}`,
    matchType: 'product',
    source: 'local-index',
    ...fields,
  };
}

function addToMap(map, barcode, entry) {
  if (!barcode) return;
  const key = gtinKey(barcode);
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  const list = map.get(key);
  const dedupeKey = `${entry.store}:${entry.id || ''}:${entry.shadeName || ''}`;
  if (list.some((x) => `${x.store}:${x.id || ''}:${x.shadeName || ''}` === dedupeKey)) return;
  list.push(entry);
}

function isMetadataCacheKey(cacheKey = '') {
  const key = String(cacheKey || '');
  return key.startsWith('upc_barcode|') || key.startsWith('meta|');
}

function loadVanillaCache() {
  try {
    return JSON.parse(fs.readFileSync(VANILLA_CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function loadDiskCacheEntries() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function buildUnifiedBarcodeIndex({ force = false } = {}) {
  if (unifiedIndex && !force) return unifiedIndex;

  const map = new Map();

  for (const entry of Object.values(loadBarcodeLookup())) {
    if (!entry?.barcode) continue;
    const store = entry.store || 'niceone';
    addToMap(map, entry.barcode, hit(store, {
      id: entry.productId || entry.id || '',
      name: entry.name || '',
      nameEn: entry.nameEn || '',
      manufacturer: entry.manufacturer || entry.brandAr || '',
      manufacturerEn: entry.manufacturerEn || entry.brandEn || '',
      thumb: entry.thumb || '',
      barcode: entry.barcode,
      shadeName: entry.shadeName || '',
      sku: entry.sku || '',
      matchType: entry.matchType || 'product',
      source: entry.source || 'lookup',
    }));
  }

  for (const entry of Object.values(loadBarcodeIndex().products || {})) {
    if (entry.productEan) {
      addToMap(map, entry.productEan, hit('niceone', {
        id: entry.id,
        name: entry.name,
        manufacturer: entry.manufacturer || '',
        barcode: entry.productEan,
        matchType: 'product',
        source: 'index',
      }));
    }
    for (const shade of entry.shades || []) {
      if (!shade.ean) continue;
      addToMap(map, shade.ean, hit('niceone', {
        id: entry.id,
        name: entry.name,
        manufacturer: entry.manufacturer || '',
        barcode: shade.ean,
        shadeName: shade.name,
        sku: shade.sku || '',
        matchType: 'shade',
        source: 'index',
      }));
    }
  }

  for (const [cacheKey, entry] of Object.entries(loadDiskCacheEntries())) {
    if (!entry?.ean) continue;
    if (isMetadataCacheKey(cacheKey)) continue;
    const parts = String(cacheKey).split('|');
    if (parts.length < 2) continue;
    addToMap(map, entry.ean, hit('niceone', {
      id: '',
      name: parts[1] || '',
      manufacturer: parts[0] || '',
      shadeName: parts[2] || '',
      barcode: entry.ean,
      matchType: parts[2] ? 'shade' : 'product',
      source: 'cache',
    }));
  }

  const facesIndex = loadFacesBarcodeIndex();
  for (const entry of Object.values(facesIndex.barcodes || {})) {
    if (!entry?.ean && !entry?.pid) continue;
    const bc = entry.ean || '';
    if (!bc) continue;
    addToMap(map, bc, hit('faces', {
      id: entry.pid,
      name: entry.nameAr || entry.nameEn || '',
      nameEn: entry.nameEn || '',
      manufacturer: entry.brandAr || '',
      manufacturerEn: entry.brandEn || '',
      thumb: entry.thumb || '',
      barcode: bc,
      shadeName: entry.shadeName || '',
      matchType: entry.shadeName ? 'shade' : 'product',
      source: 'faces-index',
    }));
  }

  for (const row of Object.values(loadVanillaCache())) {
    if (!row?.ean) continue;
    addToMap(map, row.ean, hit('vanilla', {
      id: row.productId || '',
      name: row.name || '',
      manufacturer: row.brand || '',
      thumb: row.thumb || '',
      barcode: row.ean,
      sku: row.sku || '',
      matchType: row.shadeName ? 'shade' : 'product',
      shadeName: row.shadeName || '',
      source: 'vanilla-cache',
    }));
  }

  if (fs.existsSync(LOCAL_PRODUCTS_FILE)) {
    try {
      const list = JSON.parse(fs.readFileSync(LOCAL_PRODUCTS_FILE, 'utf8'));
      if (Array.isArray(list)) {
        for (const p of list) {
          const bc = String(p.isbn || p.sku || '').replace(/\D/g, '');
          if (bc.length < 8) continue;
          addToMap(map, bc, hit('niceone', {
            id: String(p.id),
            name: p.en_name || p.name || '',
            manufacturer: p.manufacturer || '',
            thumb: p.thumb || '',
            barcode: bc,
            sku: p.sku || '',
            matchType: 'product',
            source: 'local-file',
          }));
        }
      }
    } catch {
      /* optional */
    }
  }

  unifiedIndex = map;
  unifiedBuiltAt = Date.now();
  invalidateBarcodeRamIndex();
  return map;
}

export function searchUnifiedBarcodeIndex(barcode) {
  const map = buildUnifiedBarcodeIndex();
  const key = gtinKey(barcode);
  if (!key) return [];
  const direct = map.get(key) || [];
  if (direct.length) return direct.filter(isUsableCatalogHit);

  const variants = new Set([key]);
  const stripped = key.replace(/^0+/, '') || key;
  variants.add(stripped.padStart(14, '0'));
  if (key.length === 14 && key.startsWith('0')) variants.add(key.slice(1).padStart(14, '0'));

  const out = [];
  const seen = new Set();
  for (const v of variants) {
    for (const entry of map.get(v) || []) {
      if (!isUsableCatalogHit(entry)) continue;
      const k = `${entry.store}:${entry.id}:${entry.shadeName || ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(entry);
    }
  }
  return out;
}

/** استبعاد نتائج الفهرس الوهمية (مثل upc_barcode بدون productId) */
export function isUsableCatalogHit(h) {
  if (!h?.store) return false;
  const id = String(h.id || '').trim();
  const sku = String(h.sku || '').trim();
  const name = String(h.name || '').trim();
  const nameEn = String(h.nameEn || '').trim();
  const thumb = String(h.thumb || '').trim();
  const manufacturer = String(h.manufacturer || h.brandAr || '').trim().toLowerCase();
  const barcode = String(h.barcode || '').replace(/\D/g, '');

  if (manufacturer === 'upc_barcode') return false;
  if (!id && !sku) return false;
  if (!id && name && barcode && name.replace(/\D/g, '') === barcode) return false;
  if (h.store === 'amazon' && !name && !nameEn && !thumb) return false;
  return true;
}

export function searchUnifiedByStore(barcode, store) {
  return searchUnifiedBarcodeIndex(barcode).filter((h) => h.store === store);
}

export function rememberBarcodeSearchHits(hits = []) {
  if (!hits.length) return;
  let changed = false;
  for (const h of hits) {
    if (!h?.barcode || !h?.store || !h?.id) continue;
    upsertBarcodeLookup(h.barcode, {
      store: h.store,
      productId: String(h.id),
      id: String(h.id),
      name: h.name || '',
      nameEn: h.nameEn || '',
      manufacturer: h.manufacturer || h.brandAr || '',
      manufacturerEn: h.manufacturerEn || h.brandEn || '',
      thumb: h.thumb || '',
      shadeName: h.shadeName || '',
      sku: h.sku || '',
      matchType: h.matchType || 'product',
      source: h.source || 'search',
    });
    changed = true;
  }
  if (changed) buildUnifiedBarcodeIndex({ force: true });
}

export function getUnifiedIndexStats() {
  const map = buildUnifiedBarcodeIndex();
  const byStore = {};
  let total = 0;
  for (const list of map.values()) {
    for (const h of list) {
      byStore[h.store] = (byStore[h.store] || 0) + 1;
      total += 1;
    }
  }
  return { total, byStore, builtAt: unifiedBuiltAt };
}

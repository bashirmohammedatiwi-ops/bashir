import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  enrichShades,
  extractBarcode,
  extractBarcodeFromImage,
  isValidBarcodeValue,
  fetchProductDetail,
  augmentShadesFromOptionFetch,
  applyIsbnListToShades,
  collectBarcodeList,
  parseBarcodeList,
} from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', 'data', 'barcode-cache.json');
const INDEX_FILE = path.join(__dirname, '..', 'data', 'barcode-index.json');
const LOOKUP_FILE = path.join(__dirname, '..', 'data', 'barcode-lookup.json');
const LOCAL_PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

const memoryCache = new Map();
let diskCache = null;
let diskDirty = false;
let barcodeIndex = null;
let indexDirty = false;
let lastUpcRequestAt = 0;

const UPC_MIN_INTERVAL_MS = 2200;
const OBF_DELAY_MS = 400;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cacheKey(manufacturer, productName, shadeName = '', shadeNameEn = '') {
  const shade = [shadeName, shadeNameEn].filter(Boolean).join('|');
  return `${manufacturer}|${productName}|${shade}`.toLowerCase().trim();
}

function shadeNames(shade = {}) {
  return {
    ar: String(shade.name || '').trim(),
    en: String(shade.nameEn || shade.name || '').trim(),
  };
}

function loadDiskCache() {
  if (diskCache) return diskCache;
  try {
    diskCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    diskCache = {};
  }
  return diskCache;
}

function saveDiskCache() {
  if (!diskDirty || !diskCache) return;
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(diskCache, null, 2));
  diskDirty = false;
}

export function loadBarcodeIndex({ force = false } = {}) {
  if (barcodeIndex && !force) {
    const count = Object.keys(barcodeIndex.products || {}).length;
    if (count > 0) return barcodeIndex;
    try {
      if (fs.existsSync(INDEX_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
        if (Object.keys(parsed.products || parsed || {}).length > 0) {
          barcodeIndex = parsed.products ? parsed : { products: parsed, meta: {} };
          if (!barcodeIndex.products) barcodeIndex = { products: barcodeIndex, meta: {} };
          return barcodeIndex;
        }
      }
    } catch {
      /* keep in-memory fallback */
    }
    return barcodeIndex;
  }
  try {
    barcodeIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    barcodeIndex = { products: {}, meta: { updatedAt: 0 } };
  }
  if (!barcodeIndex.products) barcodeIndex = { products: barcodeIndex, meta: {} };
  return barcodeIndex;
}

function gtinKey(digits = '') {
  let d = String(digits).replace(/\D/g, '');
  if (d.length === 12) d = `0${d}`;
  return d.padStart(14, '0');
}

let barcodeLookup = null;

export function loadBarcodeLookup({ force = false } = {}) {
  if (barcodeLookup && !force) return barcodeLookup;
  try {
    barcodeLookup = JSON.parse(fs.readFileSync(LOOKUP_FILE, 'utf8'));
  } catch {
    barcodeLookup = {};
  }
  return barcodeLookup;
}

function persistBarcodeLookup() {
  fs.mkdirSync(path.dirname(LOOKUP_FILE), { recursive: true });
  fs.writeFileSync(LOOKUP_FILE, JSON.stringify(barcodeLookup || {}, null, 2));
}

export function upsertBarcodeLookup(barcode, fields = {}) {
  if (!barcode) return;
  const lookup = loadBarcodeLookup();
  lookup[gtinKey(barcode)] = { ...fields, barcode: String(barcode).replace(/\D/g, ''), updatedAt: Date.now() };
  barcodeLookup = lookup;
  persistBarcodeLookup();
  invalidateBarcodeRamIndex();
}

export function findBarcodeLookup(barcode) {
  const lookup = loadBarcodeLookup();
  return lookup[gtinKey(barcode)] || null;
}

/** بحث سريع في products.json المحلي (نسخة احتياطية) */
export function searchLocalProductsFile(barcode) {
  if (!barcode || !fs.existsSync(LOCAL_PRODUCTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(LOCAL_PRODUCTS_FILE, 'utf8');
    if (!raw.includes(String(barcode).replace(/\D/g, ''))) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const hits = [];
    for (const p of list) {
      const fields = [p.isbn, p.sku, p.thumb, JSON.stringify(p.options || '')].join(' ');
      if (!gtinEqual(fields, barcode) && !String(fields).includes(String(barcode).replace(/\D/g, ''))) continue;
      const bc = extractBarcode(p) || barcode;
      if (!gtinEqual(bc, barcode) && !String(p.isbn || '').includes(String(barcode).replace(/\D/g, ''))) {
        const fromThumb = extractBarcodeFromImage(p.thumb, p.id);
        if (!gtinEqual(fromThumb, barcode)) continue;
      }
      hits.push({
        id: String(p.id),
        name: p.en_name || p.name || '',
        manufacturer: p.manufacturer || '',
        thumb: p.thumb || '',
        barcode,
        sku: p.sku || '',
        matchType: 'product',
        source: 'local-file',
      });
    }
    return hits;
  } catch {
    return [];
  }
}

/** توحيد GTIN للمقارنة */
function gtinEqual(a, b) {
  const norm = (v) => {
    let d = String(v).replace(/\D/g, '');
    if (d.length === 12) d = `0${d}`;
    return d.padStart(14, '0');
  };
  return norm(a) === norm(b);
}

/** بحث في كاش الباركود المحلي بالقيمة */
export function findBarcodeCacheEntries(barcode) {
  const disk = loadDiskCache();
  const hits = [];
  for (const [key, entry] of Object.entries(disk)) {
    if (!entry?.ean) continue;
    if (gtinEqual(entry.ean, barcode)) {
      hits.push({ key, ean: entry.ean, source: entry.source || 'cache' });
    }
  }
  return hits;
}

/** فهرس باركود في الذاكرة — بحث فوري O(1) */
let ramBarcodeIndex = null;
let ramBarcodeIndexBuiltAt = 0;

export function invalidateBarcodeRamIndex() {
  ramBarcodeIndex = null;
  ramBarcodeIndexBuiltAt = 0;
}

export function buildBarcodeRamIndex({ force = false } = {}) {
  if (ramBarcodeIndex && !force) return ramBarcodeIndex;

  const map = new Map();
  const add = (barcode, fields) => {
    if (!barcode) return;
    const key = gtinKey(barcode);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(fields);
  };

  for (const entry of Object.values(loadBarcodeLookup())) {
    if (!entry?.barcode) continue;
    add(entry.barcode, {
      store: entry.store || 'niceone',
      productId: entry.productId || entry.id || '',
      name: entry.name || '',
      manufacturer: entry.manufacturer || '',
      thumb: entry.thumb || '',
      shadeName: entry.shadeName || '',
      sku: entry.sku || '',
      barcode: entry.barcode,
      matchType: entry.matchType || 'product',
      source: 'lookup',
    });
  }

  for (const entry of Object.values(loadBarcodeIndex().products || {})) {
    if (entry.productEan) {
    add(entry.productEan, {
      store: 'niceone',
      productId: entry.id,
        name: entry.name,
        manufacturer: entry.manufacturer || '',
        matchType: 'product',
        source: 'index',
        barcode: entry.productEan,
      });
    }
    for (const shade of entry.shades || []) {
      if (!shade.ean) continue;
      add(shade.ean, {
        store: 'niceone',
        productId: entry.id,
        name: entry.name,
        manufacturer: entry.manufacturer || '',
        shadeName: shade.name,
        sku: shade.sku || '',
        matchType: 'shade',
        source: 'index',
        barcode: shade.ean,
      });
    }
  }

  for (const [cacheKey, entry] of Object.entries(loadDiskCache())) {
    if (!entry?.ean) continue;
    const key = String(cacheKey || '');
    if (key.startsWith('upc_barcode|') || key.startsWith('meta|')) continue;
    const parts = key.split('|');
    add(entry.ean, {
      store: 'niceone',
      productId: '',
      name: parts[1] || parts[0] || '',
      manufacturer: parts[0] || '',
      shadeName: parts[2] || '',
      matchType: parts[2] ? 'shade' : 'product',
      source: 'cache',
      barcode: entry.ean,
    });
  }

  if (fs.existsSync(LOCAL_PRODUCTS_FILE)) {
    try {
      const raw = fs.readFileSync(LOCAL_PRODUCTS_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const p of list) {
          const bc = extractBarcode(p);
          if (!bc) {
            const fromThumb = extractBarcodeFromImage(p.thumb, p.id);
            if (fromThumb) add(fromThumb, {
              store: 'niceone',
              productId: String(p.id),
              name: p.en_name || p.name || '',
              manufacturer: p.manufacturer || '',
              thumb: p.thumb || '',
              matchType: 'product',
              source: 'local-file',
              barcode: fromThumb,
            });
            continue;
          }
          add(bc, {
            store: 'niceone',
            productId: String(p.id),
            name: p.en_name || p.name || '',
            manufacturer: p.manufacturer || '',
            thumb: p.thumb || '',
            matchType: 'product',
            source: 'local-file',
            barcode: bc,
          });
        }
      }
    } catch {
      /* optional local catalog */
    }
  }

  ramBarcodeIndex = map;
  ramBarcodeIndexBuiltAt = Date.now();
  return map;
}

export function searchRamBarcodeIndex(barcode) {
  if (!ramBarcodeIndex) buildBarcodeRamIndex();
  return ramBarcodeIndex.get(gtinKey(barcode)) || [];
}

function saveBarcodeIndex() {
  if (!indexDirty || !barcodeIndex) return;
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  barcodeIndex.meta = { ...barcodeIndex.meta, updatedAt: Date.now() };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(barcodeIndex, null, 2));
  indexDirty = false;
}

/** حفظ باركودات منتج في الفهرس المركزي */
export function saveProductToIndex(productId, product, shades) {
  const index = loadBarcodeIndex();
  const stats = shadeStats(shades);
  index.products[String(productId)] = {
    id: String(productId),
    name: product.en_name || product.name || '',
    manufacturer: product.manufacturer || '',
    productEan: extractBarcode(product) || '',
    hasOptions: !!product.has_option,
    shades: shades.map((s) => ({
      optionId: s.optionId,
      name: s.name,
      sku: s.sku || '',
      ean: s.ean || '',
      barcodeSource: s.barcodeSource || '',
    })),
    stats,
    updatedAt: Date.now(),
  };
  indexDirty = true;
  saveBarcodeIndex();
  invalidateBarcodeRamIndex();

  const base = {
    productId: String(productId),
    name: product.en_name || product.name || '',
    manufacturer: product.manufacturer || '',
    thumb: product.thumb || '',
  };
  const productEan = extractBarcode(product);
  if (productEan) {
    upsertBarcodeLookup(productEan, { ...base, matchType: 'product', source: 'index' });
  }
  for (const s of shades) {
    if (!s.ean) continue;
    upsertBarcodeLookup(s.ean, {
      ...base,
      shadeName: s.name,
      sku: s.sku || '',
      matchType: 'shade',
      source: s.barcodeSource || 'index',
    });
  }
}

/** دمج الفهرس المركزي مع الدرجات */
export function applyIndexToShades(productId, shades) {
  const entry = loadBarcodeIndex().products[String(productId)];
  if (!entry?.shades?.length) return shades;

  const byOption = new Map(entry.shades.map((s) => [String(s.optionId), s]));
  const byName = new Map(entry.shades.map((s) => [String(s.name || '').toLowerCase().trim(), s]));

  for (const shade of shades) {
    if (shade.ean) continue;
    const hit = byOption.get(String(shade.optionId)) || byName.get(String(shade.name || '').toLowerCase().trim());
    if (hit?.ean) {
      shade.ean = normalizeEan(hit.ean);
      shade.barcode = shade.ean;
      shade.barcodeSource = hit.barcodeSource || 'index';
    }
  }
  return shades;
}

function remember(key, value) {
  memoryCache.set(key, value);
  const disk = loadDiskCache();
  if (value) disk[key] = { ean: value.ean || value, source: value.source || 'cache', at: Date.now() };
  else disk[key] = { ean: '', source: 'none', at: Date.now() };
  diskDirty = true;
}

function recall(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const hit = loadDiskCache()[key];
  if (!hit) return null;
  const val = hit.ean ? { ean: hit.ean, source: hit.source || 'cache' } : '';
  memoryCache.set(key, val);
  return val;
}

function shortenProductName(name = '') {
  return name
    .replace(/\s*-\s*\d+\s*ml.*$/i, '')
    .replace(/\s*SPF\s*\d+.*/i, '')
    .trim();
}

function buildSearchQueries(manufacturer, productName, shadeName, shadeNameEn = '') {
  const brand = (manufacturer || '').trim();
  const prod = shortenProductName(productName);
  const shade = (shadeName || '').trim();
  const shadeEn = (shadeNameEn || shade).trim();
  const prodShort = prod.split(/\s+/).slice(0, 5).join(' ');
  const shadeAlt = shade.replace(/peige/gi, 'beige');
  const shadeEnAlt = shadeEn.replace(/peige/gi, 'beige');

  const queries = [
    [brand, prodShort, shade].filter(Boolean).join(' '),
    [brand, prodShort, shadeEn].filter(Boolean).join(' '),
    [brand, prod.split(' ').slice(0, 3).join(' '), shadeEn].filter(Boolean).join(' '),
    [brand, shadeEn].filter(Boolean).join(' '),
    [prodShort, shadeEn].filter(Boolean).join(' '),
    shade && brand ? `${brand} ${shade}` : '',
    shadeEn && brand ? `${brand} ${shadeEn}` : '',
    shadeAlt !== shade ? [brand, prodShort, shadeAlt].filter(Boolean).join(' ') : '',
    shadeEnAlt !== shadeEn ? [brand, prodShort, shadeEnAlt].filter(Boolean).join(' ') : '',
  ];
  return [...new Set(queries.filter(Boolean))];
}

function scoreUpcItem(item, shadeName, productName) {
  const title = (item.title || '').toLowerCase();
  const shade = (shadeName || '').toLowerCase().trim();
  const prodWords = shortenProductName(productName).toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let score = 0;
  if (shade && title.includes(shade)) score += 12;
  if (shade) {
    const shadeCompact = shade.replace(/\s+/g, '');
    if (title.replace(/\s+/g, '').includes(shadeCompact)) score += 8;
  }
  for (const w of prodWords.slice(0, 4)) {
    if (title.includes(w)) score += 2;
  }
  if (isValidBarcodeValue(item.ean)) score += 1;
  return score;
}

async function throttleUpc() {
  const wait = Math.max(0, UPC_MIN_INTERVAL_MS - (Date.now() - lastUpcRequestAt));
  if (wait) await sleep(wait);
  lastUpcRequestAt = Date.now();
}

/** بحث UPCitemdb مباشرة بالباركود */
export async function lookupUpcByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  const key = `upc_barcode|${digits}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  for (let attempt = 0; attempt < 3; attempt++) {
    await throttleUpc();
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${digits}`, {
        headers: { 'User-Agent': 'niceone-catalog/2.0', Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.code === 'TOO_FAST' || data.code === 'EXCEED_LIMIT') {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (data.code === 'OK' && data.items?.length) {
        const item = data.items[0];
        const result = {
          ean: digits,
          brand: String(item.brand || '').trim(),
          title: String(item.title || '').trim(),
          description: String(item.description || '').trim(),
          source: 'upcitemdb_lookup',
        };
        remember(key, result);
        saveDiskCache();
        return result;
      }
      break;
    } catch {
      break;
    }
  }

  remember(key, '');
  saveDiskCache();
  return null;
}

/** بحث UPCitemdb (أفضل مصدر خارجي للمستحضرات) */
export async function lookupUpcItemDb(manufacturer = '', productName = '', shadeName = '', shadeNameEn = '') {
  const key = cacheKey(manufacturer, productName, shadeName, shadeNameEn);
  const cached = recall(key);
  if (cached !== null) return cached;

  const queries = buildSearchQueries(manufacturer, productName, shadeName, shadeNameEn);
  for (const q of queries) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await throttleUpc();
      try {
        const res = await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(q)}`, {
          headers: { 'User-Agent': 'niceone-catalog/2.0', Accept: 'application/json' },
        });
        const data = await res.json();

        if (data.code === 'TOO_FAST' || data.code === 'EXCEED_LIMIT') {
          if (data.code === 'EXCEED_LIMIT') return '';
          await sleep(3000 * (attempt + 1));
          continue;
        }
        if (data.code !== 'OK' || !data.items?.length) break;

        const ranked = [...data.items].sort(
          (a, b) => scoreUpcItem(b, shadeName, productName) - scoreUpcItem(a, shadeName, productName)
        );
        const best = ranked[0];
        const minScore = shadeName ? 3 : 2;
        if (best?.ean && scoreUpcItem(best, shadeName, productName) >= minScore) {
          const result = { ean: normalizeEan(best.ean), source: 'upcitemdb', title: best.title };
          remember(key, result);
          saveDiskCache();
          return result;
        }
        break;
      } catch {
        break;
      }
    }
  }

  remember(key, '');
  saveDiskCache();
  return '';
}

/** بحث Open Beauty Facts */
export async function lookupOpenBeautyFacts(manufacturer = '', productName = '', shadeName = '', shadeNameEn = '') {
  const key = `obf|${cacheKey(manufacturer, productName, shadeName, shadeNameEn)}`;
  const cached = recall(key);
  if (cached !== null) return cached;

  const queries = buildSearchQueries(manufacturer, productName, shadeName, shadeNameEn);
  for (const q of queries) {
    try {
      const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'niceone-catalog/2.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      for (const hit of data.products || []) {
        const code = String(hit.code || '').trim();
        if (isValidBarcodeValue(code)) {
          const result = { ean: code, source: 'openbeautyfacts' };
          remember(key, result);
          saveDiskCache();
          await sleep(OBF_DELAY_MS);
          return result;
        }
      }
    } catch {
      /* ignore */
    }
    await sleep(OBF_DELAY_MS);
  }

  remember(key, '');
  saveDiskCache();
  return '';
}

/** بحث UPCitemdb بالـ SKU الداخلي لـ Nice One */
export async function lookupBySku(sku = '', manufacturer = '') {
  const s = String(sku || '').trim();
  if (!s || s.length < 3) return '';
  const key = `sku|${s}`;
  const cached = recall(key);
  if (cached !== null) return cached;

  const queries = [s, `${manufacturer} ${s}`.trim()].filter(Boolean);
  for (const q of queries) {
    await throttleUpc();
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'niceone-catalog/2.0', Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.code === 'OK' && data.items?.length) {
        for (const item of data.items) {
          if (isValidBarcodeValue(item.ean)) {
            const result = { ean: normalizeEan(item.ean), source: 'upcitemdb_sku', title: item.title };
            remember(key, result);
            saveDiskCache();
            return result;
          }
        }
      }
      if (data.code === 'TOO_FAST' || data.code === 'EXCEED_LIMIT') break;
    } catch {
      break;
    }
  }
  remember(key, '');
  saveDiskCache();
  return '';
}

/** استخراج قوائم ISBN من HTML صفحة المنتج (عندما يعيد API النص "Array") */
export async function scrapeIsbnListsFromPage(product = {}) {
  const share = String(product.share_url || product.productUrl || '').trim();
  if (!share) return [];
  const key = `page|${product.id}`;
  const cached = recall(key);
  if (cached !== null) return cached?.lists || [];

  try {
    const res = await fetch(share, { headers: { 'User-Agent': 'niceone-catalog/2.0' } });
    if (!res.ok) return [];
    const html = await res.text();
    const lists = [];
    for (const m of html.matchAll(/(\d{12,13}(?:\s*,\s*\d{12,13}){2,})/g)) {
      const parsed = parseBarcodeList(m[1]);
      if (parsed.length >= 2) lists.push(parsed);
    }
    const best = lists.sort((a, b) => b.length - a.length)[0] || [];
    remember(key, { lists: best });
    saveDiskCache();
    return best;
  } catch {
    remember(key, { lists: [] });
    return [];
  }
}

/** بحث خارجي مجمّع: SKU ثم UPCitemdb ثم Open Beauty Facts */
export async function lookupExternalBarcode(manufacturer = '', productName = '', shadeName = '', shadeNameEn = '', sku = '') {
  if (sku) {
    const bySku = await lookupBySku(sku, manufacturer);
    if (bySku?.ean) return bySku;
  }
  const upc = await lookupUpcItemDb(manufacturer, productName, shadeName, shadeNameEn);
  if (upc?.ean) return upc;
  const obf = await lookupOpenBeautyFacts(manufacturer, productName, shadeName, shadeNameEn);
  if (obf?.ean) return obf;
  return '';
}

function applyExternalResult(shade, result) {
  if (!result?.ean) return;
  shade.ean = normalizeEan(result.ean);
  shade.barcode = shade.ean;
  shade.barcodeSource = result.source || 'external';
  if (result.title) shade.externalTitle = result.title;
}

/** توحيد EAN (إزالة أصفار البداية الزائدة للعرض) */
export function normalizeEan(value) {
  const s = String(value || '').trim();
  if (!isValidBarcodeValue(s)) return '';
  return s.replace(/^0+(\d{12,13})$/, '$1') || s;
}

/** تطبيق باركودات محفوظة في الكاش المحلي — فوري بدون API */
export function applyCachedBarcodes(product, shades) {
  const manufacturer = product.manufacturer || product.en_manufacturer || '';
  const productName = product.en_name || product.name || '';

  for (const shade of shades) {
    if (shade.ean) continue;
    const { ar, en } = shadeNames(shade);
    const cached = recall(cacheKey(manufacturer, productName, ar, en));
    if (cached?.ean) applyExternalResult(shade, cached);
  }
  return shades;
}

/** إثراء داخلي: صور + قائمة ISBN + جلب كل درجة + صفحة المنتج */
export async function enrichShadesFromNiceOneDb(product, shades = []) {
  const list = collectBarcodeList(product);
  if (list.length > 1) applyIsbnListToShades(shades, list);

  const missing = shades.filter((s) => !s.ean);
  if (missing.length && String(product.isbn || '').trim() === 'Array') {
    const pageList = await scrapeIsbnListsFromPage(product);
    if (pageList.length === shades.length) applyIsbnListToShades(shades, pageList);
  }

  if (missing.some((s) => !s.ean)) {
    await augmentShadesFromOptionFetch(product, shades);
  }

  if (shades.length === 1 && !shades[0].ean) {
    const productId = String(product.id || '');
    for (const url of [product.thumb, ...(product.images || [])]) {
      const bc = extractBarcodeFromImage(url, productId);
      if (bc) {
        shades[0].ean = bc;
        shades[0].barcode = bc;
        shades[0].barcodeSource = 'product_image';
        break;
      }
    }
  }
  return shades;
}

/** إثراء من الكاش + الفهرس + قاعدة Nice One (فوري/شبه فوري) */
export function enrichShadesCached(product) {
  const shades = enrichShades(product);
  applyCachedBarcodes(product, shades);
  applyIndexToShades(product.id, shades);
  return shades;
}

/** إثراء كامل من قاعدة Nice One ثم كاش محلي */
export async function enrichShadesFromDatabase(product) {
  let shades = enrichShadesCached(product);
  shades = await enrichShadesFromNiceOneDb(product, shades);
  applyCachedBarcodes(product, shades);
  applyIndexToShades(product.id, shades);
  return shades;
}

/** بحث خارجي لعدد محدود من الدرجات الناقصة (لتجنب timeout) */
export async function enrichShadesLookup(product, { maxLookups = 8, forceLookup = false } = {}) {
  let shades = await enrichShadesFromDatabase(product);
  const manufacturer = product.manufacturer || product.en_manufacturer || '';
  const productName = product.en_name || product.name || '';
  let looked = 0;

  for (const shade of shades) {
    if (shade.ean) continue;
    if (looked >= maxLookups) break;
    const { ar, en } = shadeNames(shade);
    const key = cacheKey(manufacturer, productName, ar, en);
    const cached = recall(key);
    if (!forceLookup && cached !== null) continue;

    const ext = await lookupExternalBarcode(manufacturer, productName, ar, en, shade.sku);
    applyExternalResult(shade, ext);
    looked += 1;
  }

  saveDiskCache();
  saveProductToIndex(product.id, product, shades);
  return {
    shades,
    looked,
    done: shades.every((s) => s.ean || recall(cacheKey(manufacturer, productName, shadeNames(s).ar, shadeNames(s).en)) !== null),
  };
}

/** إثراء الدرجات: قاعدة Nice One + كاش + فهرس + بحث خارجي كامل */
export async function enrichShadesDeep(product, { useExternal = true, forceLookup = false } = {}) {
  let shades = await enrichShadesFromDatabase(product);
  if (!useExternal) return shades;

  const manufacturer = product.manufacturer || product.en_manufacturer || '';
  const productName = product.en_name || product.name || '';

  for (const shade of shades) {
    if (shade.ean) continue;
    const { ar, en } = shadeNames(shade);
    const key = cacheKey(manufacturer, productName, ar, en);
    const cached = recall(key);
    if (!forceLookup && cached !== null) continue;

    const ext = await lookupExternalBarcode(manufacturer, productName, ar, en, shade.sku);
    applyExternalResult(shade, ext);
  }

  saveDiskCache();
  saveProductToIndex(product.id, product, shades);
  return shades;
}

export function shadeStats(shades = []) {
  const withEan = shades.filter((s) => s.ean).length;
  const withSku = shades.filter((s) => s.sku).length;
  return { total: shades.length, withEan, withSku, withAny: shades.filter((s) => s.ean || s.sku).length };
}

export async function resolveProductBarcodes(productId, { deep = false } = {}) {
  const detail = await fetchProductDetail(productId);
  const productEan = extractBarcode(detail);
  const shades = detail.has_option
    ? deep
      ? await enrichShadesDeep(detail)
      : await enrichShadesFromDatabase(detail)
    : [];

  let displayBarcode = productEan;
  let barcodeLabel = 'ean';

  if (detail.has_option && shades.length) {
    const stats = shadeStats(shades);
    if (stats.withEan === stats.total) {
      displayBarcode = shades[0]?.ean || productEan;
      barcodeLabel = 'ean';
    } else if (stats.withEan) {
      displayBarcode = `${stats.withEan}/${stats.total} درجة`;
      barcodeLabel = 'partial';
    } else if (productEan) {
      displayBarcode = productEan;
      barcodeLabel = 'product';
    } else {
      displayBarcode = '';
      barcodeLabel = 'sku_only';
    }
  } else if (!displayBarcode && detail.sku) {
    displayBarcode = detail.sku;
    barcodeLabel = 'sku';
  }

  return {
    id: String(productId),
    barcode: displayBarcode,
    productEan,
    barcodeLabel,
    sku: detail.sku || '',
    hasOptions: !!detail.has_option,
    shades,
    stats: shades.length ? shadeStats(shades) : null,
  };
}

/** جلب باركودات — deep يستخدم كاش ويبحث خارجياً بشكل تسلسلي */
export async function resolveProductBarcodesBatch(ids = [], { deep = false } = {}) {
  const unique = [...new Set(ids.map(String))].slice(0, 30);
  const results = {};
  for (const id of unique) {
    try {
      results[id] = await resolveProductBarcodes(id, { deep });
    } catch (err) {
      results[id] = { id, error: err.message };
    }
  }
  return results;
}

export function getBarcodeCacheStats() {
  const disk = loadDiskCache();
  const entries = Object.values(disk);
  const index = loadBarcodeIndex();
  const products = Object.values(index.products || {});
  return {
    cacheEntries: entries.length,
    cacheWithEan: entries.filter((e) => e.ean).length,
    indexProducts: products.length,
    indexShades: products.reduce((n, p) => n + (p.stats?.total || 0), 0),
    indexShadesWithEan: products.reduce((n, p) => n + (p.stats?.withEan || 0), 0),
    cacheFile: CACHE_FILE,
    indexFile: INDEX_FILE,
  };
}

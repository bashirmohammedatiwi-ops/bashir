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
  resolveShadeBarcode,
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
// النتائج السلبية (لم يُعثر على شيء) تنتهي بعد مدة حتى لا يُسمَّم الباركود للأبد عند فشل مؤقت
const NEGATIVE_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** يحدّ زمن أي عملية؛ يعيد fallback إن تجاوزت المهلة (يمنع حجب البحث) */
function withTimeout(promise, ms, fallback = null) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
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
  const key = gtinKey(barcode);
  if (lookup[key]) return lookup[key];

  for (const [k, row] of Object.entries(lookup)) {
    if (gtinEqual(k, barcode)) return row;
    if (row?.barcode && gtinEqual(row.barcode, barcode)) return row;
  }
  return null;
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
  if (value && typeof value === 'object') {
    // احفظ كل الحقول المفيدة (brand, title, description) ولا تحذفها
    disk[key] = {
      ean: value.ean || '',
      source: value.source || 'cache',
      at: Date.now(),
      ...(value.brand ? { brand: value.brand } : {}),
      ...(value.title ? { title: value.title } : {}),
      ...(value.description ? { description: value.description } : {}),
    };
  } else if (value) {
    disk[key] = { ean: String(value), source: 'cache', at: Date.now() };
  } else {
    disk[key] = { ean: '', source: 'none', at: Date.now() };
  }
  diskDirty = true;
}

function recall(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const hit = loadDiskCache()[key];
  if (!hit) return null;
  if (!hit.ean) {
    // نتيجة سلبية: أعِد المحاولة بعد انتهاء المدة (تجنّب التسميم الدائم بفشل مؤقت)
    if (hit.at && Date.now() - hit.at > NEGATIVE_CACHE_TTL_MS) {
      return null;
    }
    memoryCache.set(key, '');
    return '';
  }
  // أعِد البنية الكاملة بما فيها brand وtitle إن كانت محفوظة
  const val = {
    ean: hit.ean,
    source: hit.source || 'cache',
    ...(hit.brand ? { brand: hit.brand } : {}),
    ...(hit.title ? { title: hit.title } : {}),
    ...(hit.description ? { description: hit.description } : {}),
  };
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

/** متاجر Shopify تخزّن الباركود في SKU — مصدر تلميح للمنتجات الصينية (SHEGLAM وغيرها) */
const SHOPIFY_SKU_HOSTS = [
  'elbeaute-eg.com',
  'lra-cosmetics.com',
  'modabodyshop.com',
  'www.jubbas.com',
  'jubbas.com',
  'alrashidgalleria.co.uk',
  'dubaiopal.com',
  'alhajisperfumes.com',
];

function decodeHtmlEntities(text = '') {
  return String(text || '')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slugifyProductHandle(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function fetchShopifyProductJson(host, handle) {
  const h = String(handle || '').trim();
  const hostName = String(host || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!h || !hostName) return null;
  try {
    const res = await fetch(`https://${hostName}/products/${encodeURIComponent(h)}.json`, {
      headers: { 'User-Agent': 'catalog-hub/1.0', Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data?.product || null;
  } catch {
    return null;
  }
}

async function metaFromShopifyProduct(product, digits, host, sourceTag) {
  if (!product) return null;
  for (const v of product.variants || []) {
    const val = String(v.sku || v.barcode || '').replace(/\D/g, '');
    if (val !== digits) continue;
    const variantTitle = String(v.title || '').trim();
    let title = String(product.title || '').trim();
    let shade = variantTitle && variantTitle !== 'Default Title' ? variantTitle : '';
    if (!shade && /[-–—]/.test(title)) {
      const parts = title.split(/[-–—]/);
      const tail = parts.pop()?.trim() || '';
      const head = parts.join('-').trim();
      if (tail && head && tail.split(/\s+/).length <= 4) {
        shade = tail;
        title = head;
      }
    }
    return {
      ean: digits,
      brand: String(product.vendor || '').trim(),
      title,
      shade,
      description: String(product.body_html || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 500),
      source: `${sourceTag}:${host}`,
    };
  }
  return null;
}

async function lookupBarcodeFromShopifyProductJson(host, handle, digits) {
  const product = await fetchShopifyProductJson(host, handle);
  return metaFromShopifyProduct(product, digits, host, 'shopify-json');
}

async function lookupOpenBeautyFactsByBarcode(digits) {
  try {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${digits}.json`, {
      headers: { 'User-Agent': 'catalog-hub/1.0', Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    return {
      ean: digits,
      brand: String(p.brands || p.brand_owner || '').split(',')[0].trim(),
      title: String(p.product_name || p.product_name_en || p.generic_name || '').trim(),
      description: String(p.ingredients_text || '').trim(),
      source: 'openbeautyfacts',
    };
  } catch {
    return null;
  }
}

function parseWebSearchResultMeta(title = '', snippet = '', barcode = '') {
  let t = decodeHtmlEntities(title)
    .replace(new RegExp(String(barcode), 'g'), '')
    .replace(/\s*[-|–]\s*[^-|–]+$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  let brand = '';
  const snippetText = decodeHtmlEntities(snippet).replace(/<[^>]+>/g, ' ');
  const brandColon = snippetText.match(/Brand\s*:\s*([A-Za-z0-9][A-Za-z0-9\s&'.-]{1,40})/i);
  const byBrand = snippetText.match(/\bby\s+([A-Za-z0-9][A-Za-z0-9\s&'.-]{1,40}?)(?:\s+at|\s+for|\.|,|$)/i);
  brand = String(brandColon?.[1] || byBrand?.[1] || '').trim();

  if (!brand) {
    const lead = t.match(/^([A-Z][A-Za-z0-9&]+(?:\s+[A-Z][A-Za-z0-9&]+)?)\s+(.+)/);
    if (lead) {
      brand = lead[1].trim();
      t = lead[2].trim();
    }
  } else {
    t = t.replace(new RegExp(`^${brand}\\s+`, 'i'), '').trim();
  }

  t = t
    .replace(/\*/g, ' ')
    .replace(/\b(Unisex|Men'?s|Women'?s|EDP|EDT|Spray|Eau de Parfum|Fragrances?|Premium|Authentic)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:ml|oz|g|kg|lb)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let shade = '';
  const comma = t.lastIndexOf(',');
  if (comma > 0 && comma >= t.length - 28) {
    shade = t.slice(comma + 1).trim();
    t = t.slice(0, comma).trim();
  }

  const words = t.split(/\s+/).filter((w) => w.length >= 3);
  const productTitle = words.slice(0, 6).join(' ') || t;

  if (!brand && !productTitle) return null;
  return normalizeBarcodeMeta({ ean: barcode, brand, title: productTitle, shade, source: 'web-search' });
}

/** توحيد ماركة/عنوان metadata — Wet n Wild و SHEGLAM وغيرها */
export function normalizeBarcodeMeta(meta = {}) {
  if (!meta) return meta;
  let brand = String(meta.brand || '').trim();
  let title = String(meta.title || '').trim();
  let shade = String(meta.shade || '').trim();

  title = title.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim();

  if (/^wet$/i.test(brand) && /^wild\b/i.test(title)) {
    brand = 'Wet n Wild';
    title = title.replace(/^wild\s+/i, '').trim();
  }
  if (/^wet\s*'?n'?\s*wild$/i.test(brand)) brand = 'Wet n Wild';
  if (/^sheglam$/i.test(brand)) brand = 'SHEGLAM';

  if (!shade && /,/.test(title)) {
    const comma = title.lastIndexOf(',');
    if (comma > 0) {
      shade = title.slice(comma + 1).trim();
      title = title.slice(0, comma).trim();
    }
  }

  return { ...meta, brand, title, shade };
}

async function lookupBarcodeFromGoUpc(digits) {
  const key = `go_upc|${digits}`;
  const cached = recall(key);
  if (cached !== null) {
    if (!cached || cached.shade || !cached.title) return cached || null;
  }

  try {
    const res = await fetch(`https://go-upc.com/search?q=${encodeURIComponent(digits)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; catalog-hub/1.0)', Accept: 'text/html' },
    });
    if (!res.ok) {
      remember(key, '');
      saveDiskCache();
      return null;
    }
    const html = await res.text();
    const nameMatch = html.match(/<h1 class="product-name">([\s\S]*?)<\/h1>/i);
    if (!nameMatch) {
      remember(key, '');
      saveDiskCache();
      return null;
    }

    const fullTitle = decodeHtmlEntities(nameMatch[1].replace(/<[^>]+>/g, '').trim());
    let brand = '';
    let title = fullTitle;
    let shade = '';

    const wetMatch = fullTitle.match(/^Wet\s*'?n'?\s*Wild\s+(.+)$/i);
    const sheglamMatch = fullTitle.match(/^SHEGLAM\s+(.+)$/i);
    if (wetMatch) {
      brand = 'Wet n Wild';
      title = wetMatch[1].trim();
    } else if (sheglamMatch) {
      brand = 'SHEGLAM';
      title = sheglamMatch[1].trim();
    }

    const comma = title.lastIndexOf(',');
    if (comma > 0) {
      shade = title.slice(comma + 1).trim();
      title = title.slice(0, comma).trim();
    }

    const result = normalizeBarcodeMeta({
      ean: digits,
      brand,
      title,
      shade,
      source: 'go-upc',
    });
    remember(key, result);
    saveDiskCache();
    return result.brand || result.title ? result : null;
  } catch {
    remember(key, '');
    saveDiskCache();
    return null;
  }
}

async function fetchDuckDuckGoHtml(query) {
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; catalog-hub/1.0)',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=${encodeURIComponent(query)}&b=`,
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`DDG ${res.status}`);
  return res.text();
}

async function fetchBingHtml(query) {
  const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Bing ${res.status}`);
  return res.text();
}

async function fetchLiteDuckDuckGoHtml(query) {
  const res = await fetch('https://lite.duckduckgo.com/lite/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`DDG-lite ${res.status}`);
  return res.text();
}

function parseLiteDuckDuckGoResults(html = '') {
  if (html.includes('anomaly')) return [];
  const titles = [...html.matchAll(/<a[^>]+class="result-link"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/class="result-snippet"[^>]*>([\s\S]*?)<\/td>/g)]
    .map((m) => decodeHtmlEntities(m[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  return titles.map((m, i) => ({
    url: decodeHtmlEntities(m[1] || ''),
    title: decodeHtmlEntities(m[2] || '').replace(/<[^>]+>/g, '').trim(),
    snippet: snippets[i] || '',
  }));
}

function parseBingResults(html = '') {
  const rows = [];
  for (const m of html.matchAll(/<li class="b_algo"[\s\S]*?<h2>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?<\/li>/g)) {
    rows.push({
      url: decodeHtmlEntities(m[1] || ''),
      title: decodeHtmlEntities(m[2] || '').replace(/<[^>]+>/g, '').trim(),
      snippet: decodeHtmlEntities(m[3] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  }
  return rows;
}

/** صفوف نتائج بحث موحّدة: DuckDuckGo → DDG-lite → Bing (تدوير عند الحظر/الفشل) */
async function fetchWebSearchRows(query) {
  try {
    const rows = parseDuckDuckGoResults(await fetchDuckDuckGoHtml(query));
    if (rows.length) return rows;
  } catch { /* جرّب التالي */ }
  try {
    const rows = parseLiteDuckDuckGoResults(await fetchLiteDuckDuckGoHtml(query));
    if (rows.length) return rows;
  } catch { /* جرّب التالي */ }
  try {
    const rows = parseBingResults(await fetchBingHtml(query));
    if (rows.length) return rows;
  } catch { /* لا نتائج */ }
  return [];
}

function parseDuckDuckGoResults(html = '') {
  const rows = [];
  for (const m of html.matchAll(
    /class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g,
  )) {
    rows.push({
      url: decodeHtmlEntities(m[1] || ''),
      title: decodeHtmlEntities(m[2] || '').replace(/<[^>]+>/g, '').trim(),
      snippet: decodeHtmlEntities(m[3] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  }
  if (rows.length) return rows;
  for (const m of html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/g)) {
    rows.push({
      url: '',
      title: decodeHtmlEntities(m[1] || '').replace(/<[^>]+>/g, '').trim(),
      snippet: '',
    });
  }
  return rows;
}

async function lookupBarcodeFromShopifyWebHints(digits, rows = []) {
  const tried = new Set();

  for (const row of rows) {
    const titleHost = row.title.match(/(.+?)\s*[-–]\s*((?:www\.)?[a-z0-9.-]+\.(?:com|co\.uk|net))\s*$/i);
    if (titleHost) {
      const host = titleHost[2].toLowerCase().replace(/^www\./, '');
      const handle = slugifyProductHandle(titleHost[1]);
      const key = `${host}|${handle}`;
      if (handle && !tried.has(key)) {
        tried.add(key);
        const hit = await lookupBarcodeFromShopifyProductJson(host, handle, digits);
        if (hit) return hit;
        if (!host.startsWith('www.')) {
          const hitWww = await lookupBarcodeFromShopifyProductJson(`www.${host}`, handle, digits);
          if (hitWww) return hitWww;
        }
      }
    }

    for (const m of `${row.url} ${row.title}`.matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.(?:com|co\.uk|net))\/products\/([a-z0-9-]+)/gi)) {
      const host = m[1].toLowerCase();
      const handle = m[2];
      const key = `${host}|${handle}`;
      if (tried.has(key)) continue;
      tried.add(key);
      const hit = await lookupBarcodeFromShopifyProductJson(host, handle, digits);
      if (hit) return hit;
    }
  }
  return null;
}

function buildWebSearchQueries(digits) {
  const queries = [digits, `${digits} barcode`, `${digits} UPC`];
  if (/^697/.test(digits)) queries.push(`${digits} SHEGLAM`, `SHEGLAM ${digits}`);
  if (/^077802/.test(digits)) queries.push(`${digits} "Wet n Wild"`);
  return [...new Set(queries)];
}

async function parseBestWebSearchMeta(digits, rows = []) {
  const shopifyHit = await lookupBarcodeFromShopifyWebHints(digits, rows);
  if (shopifyHit?.title) return normalizeBarcodeMeta(shopifyHit);

  let best = null;
  let bestScore = 0;
  for (const row of rows) {
    const meta = parseWebSearchResultMeta(row.title, row.snippet, digits);
    if (!meta?.brand && !meta?.title) continue;
    let score = 0;
    if (row.title.includes(digits)) score += 4;
    if (meta.brand) score += 3;
    if (meta.title) score += 2;
    if (meta.shade) score += 2;
    if (/perfume|fragrance|cosmetic|makeup|skincare|gissah|mavro|sheglam|concealer|lip gloss|foundation/i.test(`${row.title} ${row.snippet}`)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = meta;
    }
  }
  return best;
}

/** بحث DuckDuckGo — يعمل لأي باركOD حتى لو غير موجود في UPC/OBF */
export async function lookupBarcodeFromWebSearch(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const key = `web_search|${digits}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  try {
    let best = null;
    for (const query of buildWebSearchQueries(digits)) {
      const rows = await fetchWebSearchRows(query);
      if (!rows.length) continue;
      const hit = await parseBestWebSearchMeta(digits, rows);
      if (hit?.brand || hit?.title) {
        best = hit;
        if (query === digits || hit.shade) break;
      }
    }

    if (best?.brand || best?.title) {
      remember(key, best);
      saveDiskCache();
      return best;
    }
  } catch { /* ignore */ }

  remember(key, '');
  saveDiskCache();
  return null;
}

/** استخراج ماركة + خط المنتج + الدرجة من metadata الباركود */
export function parseBarcodeMetaFields(meta = {}) {
  let brand = String(meta.brand || '').trim();
  let title = String(meta.title || '').trim();
  let shade = String(meta.shade || '').trim();

  if (!shade && /[-–—]/.test(title)) {
    const parts = title.split(/[-–—]/).map((p) => p.trim()).filter(Boolean);
    while (parts.length > 1) {
      const tail = parts[parts.length - 1];
      const isSize = /^\d[\d.]*\s*(oz|ml|g|kg|lb)?$/i.test(tail) || /^(oz|ml|g|kg|lb)$/i.test(tail);
      if (isSize) {
        parts.pop();
        continue;
      }
      shade = tail;
      title = parts.join(' - ').trim();
      break;
    }
  }

  if (brand && title.toLowerCase().startsWith(brand.toLowerCase())) {
    title = title.slice(brand.length).trim();
  }

  title = title
    .replace(/\b(edp|edt|spray|eau de parfum|fragrance|sheglam)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const productLine = title;
  const productWords = productLine.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);

  return { brand, title, shade, productLine, productWords };
}

export function productLineConflicts(hay = '', productLine = '') {
  const line = String(productLine || '').toLowerCase();
  const h = String(hay || '').toLowerCase();
  const pairs = [
    ['highlight', 'blush'],
    ['highlight', 'contour'],
    ['blush', 'highlight'],
    ['blush', 'contour'],
    ['lipstick', 'foundation'],
    ['corrector', 'foundation'],
    ['concealer', 'foundation'],
    ['color corrector', 'foundation'],
    ['mavro', 'valley'],
    ['mavro', 'tango'],
    ['mavro', 'calabria'],
  ];
  for (const [want, avoid] of pairs) {
    if (line.includes(want) && h.includes(avoid) && !h.includes(want)) return true;
  }
  return false;
}

/** استعلامات نصية مشتقة من metadata الباركود — للبحث في المتاجر */
export function buildMetaHintQueries(meta = {}) {
  const { brand, productLine, shade, productWords } = parseBarcodeMetaFields(meta);
  const queries = new Set();
  if (brand && productLine) queries.add(`${brand} ${productLine}`);
  if (productLine) queries.add(productLine);
  if (productWords.length >= 2) queries.add(productWords.slice(0, 3).join(' '));
  if (brand && productWords.length) queries.add(`${brand} ${productWords[0]}`);
  if (shade && productLine) {
    const core = productWords.slice(0, 2).join(' ');
    if (core) queries.add(`${core} ${shade}`);
  }
  if (brand && shade) queries.add(`${brand} ${shade}`);
  if (shade) {
    queries.add(shade);
    if (productLine) queries.add(`${productLine} ${shade}`);
    if (productWords.length >= 2) queries.add(`${productWords.slice(0, 2).join(' ')} ${shade}`);
  }
  return [...queries].filter(Boolean);
}

/**
 * حلّ الدرجة الصحيحة من تفاصيل منتج Shopify-style (shades[].name/barcode).
 * يُستخدم في orisdi/beautyway لتحويل نتيجة hint إلى درجة دقيقة.
 */
export function resolveHintShadeFromDetail(detail, meta = {}) {
  const parsed = parseBarcodeMetaFields(meta);
  if (!parsed.shade || !detail?.shades?.length) return null;
  const match = detail.shades.find((s) => shadeNamesMatch(s.name || s.nameEn, parsed.shade));
  return match || null;
}

/**
 * منطق موحّد للبحث بالتلميحات عبر المتاجر:
 * يبني الاستعلامات، يصنّف المرشّحين، يحلّ الدرجة الصحيحة إن وُجدت،
 * ويعيد أفضل نتيجة (أو أفضل مجموعة) — يستخدمه orisdi/beautyway وغيرهما.
 */
export async function resolveStoreHintMatches({
  meta,
  searchFn,
  fetchDetailFn = null,
  toShadeHit = null,
  toHit,
  limit = 12,
  minScore = 10,
  perPage = 16,
  maxQueries = 6,
}) {
  if ((!meta?.brand && !meta?.title) || typeof searchFn !== 'function' || typeof toHit !== 'function') {
    return [];
  }

  const parsed = parseBarcodeMetaFields(meta);
  const queries = buildMetaHintQueries(meta).slice(0, maxQueries);
  const scored = [];
  const seenIds = new Set();

  for (const q of queries) {
    let items = [];
    try {
      items = await searchFn(q, perPage);
    } catch {
      continue;
    }
    for (const item of items || []) {
      const idKey = String(item.id || item.sku || '');
      if (!idKey || seenIds.has(idKey)) continue;
      const score = scoreStoreHintMatch(item, meta);
      if (score < minScore) continue;
      seenIds.add(idKey);
      scored.push({ item, score });
    }
  }

  if (!scored.length) return [];
  scored.sort((a, b) => b.score - a.score);

  if (parsed.shade && fetchDetailFn && toShadeHit) {
    for (const { item } of scored.slice(0, 6)) {
      let detail = null;
      try {
        detail = await fetchDetailFn(item);
      } catch {
        detail = null;
      }
      const shade = detail ? resolveHintShadeFromDetail(detail, meta) : null;
      if (shade) {
        const resolved = toShadeHit(item, detail, shade);
        if (resolved) return [resolved];
      }
    }
  }

  const top = scored[0];
  const second = scored[1];
  const margin = second ? top.score - second.score : top.score;
  if (top.score >= 50 && margin >= 18) {
    return [toHit(top.item, top.score)];
  }

  return scored.slice(0, limit).map(({ item, score }) => toHit(item, score));
}

/** درجة مطابقة نتيجة متجر مع metadata الباركود */
export function scoreStoreHintMatch(item = {}, meta = {}) {
  const parsed = parseBarcodeMetaFields(meta);
  const hay = `${item.name || ''} ${item.nameEn || ''} ${item.manufacturer || ''} ${item.manufacturerEn || ''}`.toLowerCase();
  let score = 0;

  const brand = parsed.brand.toLowerCase();
  if (brand && (hay.includes(brand) || brand.includes((item.manufacturer || '').toLowerCase()))) score += 6;

  const words = parsed.productWords.filter((w) => !['sheglam', 'the', 'for', 'with'].includes(w));
  if (words.length) {
    const primary = words[0];
    if (primary && hay.includes(primary)) score += 14;
    else if (primary && primary.length >= 4) score -= 18;
    score += words.slice(1).filter((w) => hay.includes(w)).length * 5;
  }

  if (productLineConflicts(hay, parsed.productLine)) score -= 30;

  if (parsed.shade) {
    const shade = parsed.shade.toLowerCase();
    if (hay.includes(shade)) score += 22;
    if (String(item.shadeName || '').toLowerCase().includes(shade)) score += 30;
  }

  return score;
}

/**
 * محلّل باركود موحّد — UPC + Shopify + OBF + بحث ويب
 * يُستخدم لكل المتاجر عند فشل البحث المباشر بالباركود.
 */
export async function lookupBarcodeProductMeta(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const key = `product_meta|${digits}`;
  const cached = recall(key);
  if (cached !== null) {
    if (cached && !cached.shade) {
      const goCached = recall(`go_upc|${digits}`);
      if (goCached?.shade) return normalizeBarcodeMeta({ ...cached, shade: goCached.shade });
    }
    return cached || null;
  }

  const finish = (result) => {
    remember(key, result || '');
    saveDiskCache();
    return result || null;
  };

  // المصادر السريعة أولاً (≈1ث لكل منها) — تُغطّي غالبية الباركودات دون انتظار مسح Shopify البطيء
  const [upc, obf, web] = await Promise.all([
    lookupUpcByBarcode(digits).catch(() => null),
    lookupOpenBeautyFactsByBarcode(digits).catch(() => null),
    lookupBarcodeFromWebSearch(digits).catch(() => null),
  ]);

  // نفضّل المصدر الذي يحمل اسم درجة (أدق لمطابقة المتغيرات)، ثم الذي يحمل ماركة+عنوان
  const upcMeta = (upc?.brand || upc?.title)
    ? { ean: digits, brand: upc.brand || '', title: upc.title || '', source: upc.source || 'upc' }
    : null;
  const fastCandidates = [upcMeta, obf, web].filter((m) => m && (m.brand || m.title));
  const withShade = fastCandidates.find((m) => m.shade);
  if (withShade) return finish(normalizeBarcodeMeta(withShade));
  if (fastCandidates.length) return finish(normalizeBarcodeMeta(fastCandidates[0]));

  // حلول أبطأ كملاذ أخير فقط — مع حدّ زمني حتى لا تحجب الاستجابة
  const shopify = await withTimeout(lookupBarcodeFromShopifySku(digits), 6000, null);
  if (shopify?.title || shopify?.brand) return finish(normalizeBarcodeMeta(shopify));

  const goUpc = await withTimeout(lookupBarcodeFromGoUpc(digits), 6000, null);
  if (goUpc?.brand || goUpc?.title) return finish(goUpc);

  return finish(null);
}

async function scanShopifyHostForSku(host, digits, { maxPages = 2 } = {}) {
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`https://${host}/products.json?limit=250&page=${page}`, {
      headers: { 'User-Agent': 'catalog-hub/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
    }).catch(() => null);
    if (!res || !res.ok) break;
    const data = await res.json().catch(() => ({}));
    const products = data.products || [];
    if (!products.length) break;

    for (const p of products) {
      for (const v of p.variants || []) {
        const sku = String(v.sku || v.barcode || '').replace(/\D/g, '');
        if (sku !== digits) continue;
        const variantTitle = String(v.title || '').trim();
        const shade = variantTitle && variantTitle !== 'Default Title' ? variantTitle : '';
        return {
          ean: digits,
          brand: String(p.vendor || '').trim(),
          title: String(p.title || '').trim(),
          shade,
          description: String(p.body_html || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 500),
          source: `shopify:${host}`,
        };
      }
    }
    if (products.length < 250) break;
  }
  return null;
}

/** بحث الباركود في feeds Shopify (SKU = EAN) */
export async function lookupBarcodeFromShopifySku(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const key = `shopify_sku|${digits}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  for (const host of SHOPIFY_SKU_HOSTS) {
    try {
      const hit = await scanShopifyHostForSku(host, digits);
      if (hit?.title) {
        remember(key, hit);
        saveDiskCache();
        return hit;
      }
    } catch { /* next host */ }
  }

  remember(key, '');
  saveDiskCache();
  return null;
}

function normalizeMatchText(text = '') {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
}

function tokenOverlapScore(a = '', b = '') {
  const aw = new Set(normalizeMatchText(a).split(/\s+/).filter((w) => w.length >= 3));
  const bw = normalizeMatchText(b).split(/\s+/).filter((w) => w.length >= 3);
  if (!aw.size || !bw.length) return 0;
  return bw.filter((w) => aw.has(w)).length;
}

function productTitleMatches(title = '', query = '') {
  const score = tokenOverlapScore(title, query);
  if (score >= 2) return true;
  const t = normalizeMatchText(title);
  const q = normalizeMatchText(query);
  return Boolean(q && (t.includes(q) || q.includes(t)));
}

function shadeMatchesProduct(productTitle = '', variantTitle = '', shadeName = '') {
  const shade = normalizeMatchText(shadeName);
  if (!shade) return true;
  const variant = normalizeMatchText(variantTitle);
  if (variant && variant !== 'default title' && (variant.includes(shade) || shade.includes(variant))) {
    return true;
  }
  const tail = String(productTitle || '').split(/[-–—]/).pop()?.trim() || '';
  const tailNorm = normalizeMatchText(tail);
  return tailNorm.includes(shade) || shade.includes(tailNorm) || tokenOverlapScore(tail, shadeName) >= 1;
}

async function scanShopifyHostForShade(host, brand, productTitle, shadeName, { maxPages = 4 } = {}) {
  const brandNorm = normalizeMatchText(brand);
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`https://${host}/products.json?limit=250&page=${page}`, {
      headers: { 'User-Agent': 'catalog-hub/1.0', Accept: 'application/json' },
    });
    if (!res.ok) break;
    const data = await res.json().catch(() => ({}));
    const products = data.products || [];
    if (!products.length) break;

    for (const p of products) {
      const vendor = normalizeMatchText(p.vendor || '');
      if (brandNorm && vendor && !vendor.includes(brandNorm) && !brandNorm.includes(vendor)) continue;
      if (!productTitleMatches(p.title || '', productTitle)) continue;

      for (const v of p.variants || []) {
        if (!shadeMatchesProduct(p.title || '', v.title || '', shadeName)) continue;
        const sku = String(v.sku || v.barcode || '').replace(/\D/g, '');
        if (!/^\d{8,14}$/.test(sku)) continue;
        const variantTitle = String(v.title || '').trim();
        return {
          ean: sku,
          brand: String(p.vendor || '').trim(),
          title: String(p.title || '').trim(),
          shade: variantTitle !== 'Default Title' ? variantTitle : shadeName,
          source: `shopify-shade:${host}`,
        };
      }
    }
    if (products.length < 250) break;
  }
  return null;
}

/** بحث باركود درجة لونية في Shopify (SKU = EAN + مطابقة اسم الدرجة) */
export async function lookupShopifyVariantByShade(brand = '', productTitle = '', shadeName = '') {
  const shade = String(shadeName || '').trim();
  const title = String(productTitle || '').trim();
  if (!shade || !title) return null;

  const key = `shopify_shade|${normalizeMatchText(brand)}|${normalizeMatchText(title)}|${normalizeMatchText(shade)}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  for (const host of SHOPIFY_SKU_HOSTS) {
    try {
      const hit = await scanShopifyHostForShade(host, brand, title, shade);
      if (hit?.ean) {
        remember(key, hit);
        saveDiskCache();
        return hit;
      }
    } catch { /* next host */ }
  }

  remember(key, '');
  saveDiskCache();
  return null;
}

function applyBarcodeToShade(shade, barcode, source = 'external') {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!isValidBarcodeValue(digits)) return;
  shade.ean = normalizeEan(digits);
  shade.barcode = shade.ean;
  shade.barcodeSource = source;
}

function resolveImportShadeImages(shade = {}) {
  return [
    shade.swatchImage,
    shade.colorSourceImage,
    shade.rawImage,
    shade.image,
    shade.thumb,
    shade.imageUrl,
  ].filter(Boolean);
}

function applyBarcodeHintToShades(shades = [], barcodeHint = '', meta = null, productId = '') {
  const digits = String(barcodeHint || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return;

  const pid = String(productId || '').trim().toUpperCase();
  if (pid) {
    for (const shade of shades) {
      const sid = String(shade.sku || shade.optionId || '').trim().toUpperCase();
      if (sid && sid === pid) {
        applyBarcodeToShade(shade, digits, 'hint-asin');
        return;
      }
    }
  }

  const parsed = parseBarcodeMetaFields(meta || {});
  let assigned = false;

  if (parsed.shade && !/^\d|oz|ml|g\b/i.test(parsed.shade)) {
    for (const shade of shades) {
      if (shade.barcode || shade.ean) continue;
      const label = `${shade.name || ''} ${shade.nameEn || ''}`;
      if (shadeNamesMatch(label, parsed.shade)) {
        applyBarcodeToShade(shade, digits, 'hint-barcode');
        assigned = true;
      }
    }
    if (!assigned && parsed.shade) {
      const key = parsed.shade.toLowerCase().split(/\s+/).filter((w) => w.length >= 4).pop();
      if (key) {
        for (const shade of shades) {
          if (shade.barcode || shade.ean) continue;
          const hay = `${shade.name || ''} ${shade.nameEn || ''}`.toLowerCase();
          if (hay.includes(key)) {
            applyBarcodeToShade(shade, digits, 'hint-barcode');
            assigned = true;
            break;
          }
        }
      }
    }
  }

  if (!assigned) {
    const empty = shades.filter((s) => !s.barcode && !s.ean);
    if (empty.length === 1) {
      applyBarcodeToShade(empty[0], digits, 'hint-barcode');
    }
  }
}

function shadeNamesMatch(a = '', b = '') {
  const na = String(a || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  const nb = String(b || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** إثراء باركودات الدرجات عند الاستيراد (مسواگ، Amazon، وغير Nice One) */
export async function enrichShadesForImport(product, {
  light = false,
  maxLookups = 6,
  barcodeHint = '',
  skipAmazonAsinLookup = false,
  timeoutMs = 0,
} = {}) {
  const shades = (product.shades || []).map((s) => ({ ...s }));
  if (!shades.length) return shades;

  const manufacturer = product.manufacturerEn || product.en_manufacturer || product.manufacturer || product.brandEn || product.brandAr || '';
  const productName = product.nameEn || product.en_name || product.name || product.nameAr || '';
  const shadeCount = shades.length;

  for (let i = 0; i < shades.length; i++) {
    const shade = shades[i];
    if (shade.barcode || shade.ean) continue;

    const resolved = resolveShadeBarcode(shade, product, i, shadeCount);
    if (isValidBarcodeValue(resolved.barcode) && ['variant', 'image', 'list', 'attributes', 'product'].includes(resolved.barcodeSource)) {
      applyBarcodeToShade(shade, resolved.barcode, resolved.barcodeSource);
      continue;
    }

    for (const url of resolveImportShadeImages(shade)) {
      const bc = extractBarcodeFromImage(url, product.id);
      if (bc) {
        applyBarcodeToShade(shade, bc, 'image');
        break;
      }
    }
  }

  if (light) return shades;

  const runExternal = async () => {
    if (barcodeHint) {
      const meta = await lookupBarcodeProductMeta(barcodeHint).catch(() => null);
      applyBarcodeHintToShades(shades, barcodeHint, meta, product.id || product.asin);
    }

    const needLookup = shades.filter((s) => !s.barcode && !s.ean);
    const lookupLimit = Math.min(Math.max(1, maxLookups), needLookup.length);
    await Promise.all(needLookup.slice(0, lookupLimit).map(async (shade) => {
      const { ar, en } = shadeNames(shade);
      const shadeLabel = en || ar || shade.nameEn || shade.name || '';
      const asin = String(shade.sku || shade.optionId || '').trim().toUpperCase();

      if (!skipAmazonAsinLookup && /^[A-Z0-9]{10}$/.test(asin)) {
        const { lookupAmazonVariantByAsin } = await import('./amazon-api.js');
        const amazonVariant = await lookupAmazonVariantByAsin(asin).catch(() => null);
        if (amazonVariant?.ean) {
          applyExternalResult(shade, amazonVariant);
          return;
        }
      }

      const shopify = await lookupShopifyVariantByShade(manufacturer, productName, shadeLabel).catch(() => null);
      if (shopify?.ean) {
        applyExternalResult(shade, shopify);
        return;
      }
      const ext = await lookupExternalBarcode(manufacturer, productName, ar, en, shade.sku).catch(() => null);
      if (ext?.ean) {
        applyExternalResult(shade, ext);
      }
    }));
  };

  if (timeoutMs > 0) {
    await Promise.race([
      runExternal(),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } else {
    await runExternal();
  }

  saveDiskCache();
  return shades;
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

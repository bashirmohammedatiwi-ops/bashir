import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  normalizeEan,
} from './barcodes.js';

function isValidBarcodeValue(value) {
  if (value === undefined || value === null) return false;
  const s = String(value).trim();
  return s && s !== 'Array' && /^\d{8,14}$/.test(s);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', 'data', 'vanilla-barcode-cache.json');

const memoryCache = new Map();
let diskCache = null;
let diskDirty = false;

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

function cacheKey(brand, productName, variantName = '') {
  return `vanilla|${brand}|${productName}|${variantName}`.toLowerCase().trim();
}

function remember(key, value) {
  memoryCache.set(key, value);
  const disk = loadDiskCache();
  if (value?.ean) {
    disk[key] = { ean: value.ean, source: value.source || 'cache', at: Date.now() };
  } else if (value?.rateLimited) {
    disk[key] = { ean: '', source: 'none', status: 'rate_limited', at: Date.now() };
  } else {
    disk[key] = { ean: '', source: 'none', status: 'not_found', at: Date.now() };
  }
  diskDirty = true;
}

function recall(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const hit = loadDiskCache()[key];
  if (!hit) return null;
  if (hit.ean) {
    const val = { ean: hit.ean, source: hit.source || 'cache' };
    memoryCache.set(key, val);
    return val;
  }
  const age = Date.now() - (hit.at || 0);
  if (hit.status === 'rate_limited' && age < 30 * 60 * 1000) {
    return { rateLimited: true };
  }
  if (hit.status === 'not_found' && age < 7 * 24 * 60 * 60 * 1000) {
    return '';
  }
  return null;
}

/** باركود Vanilla الداخلي (timestamp) وليس EAN تجاري */
export function isInternalVanillaBarcode(value) {
  const s = String(value ?? '').trim();
  if (!s || !/^\d+$/.test(s)) return false;
  if (isValidBarcodeValue(s)) return false;
  if (s.length >= 15) return true;
  if (/^20\d{11,}$/.test(s)) return true;
  return false;
}

export function extractBrandFromName(name = '', slug = '') {
  const n = String(name).trim();
  if (/^pana\s*dora/i.test(n) || slug?.startsWith('pana-dora')) return 'Pana Dora';
  const m = n.match(/^([A-Z][A-Z0-9.\-/&]+(?:\s+[A-Z][A-Z0-9.\-/&]+)?)/);
  if (m) return m[1].trim().replace(/\s+SWEDEN$/i, '').trim();
  if (slug?.startsWith('pana-dora')) return 'Pana Dora';
  if (slug) {
    const part = slug.split('-')[0];
    if (part.length > 2) return part.toUpperCase();
  }
  return '';
}

const BRAND_SLUGS = {
  drorganic: 'Dr Organic',
  oralb: 'Oral-B',
  maybelline: 'Maybelline',
  loreal: "L'Oreal",
  clarins: 'Clarins',
  nars: 'NARS',
  mac: 'MAC',
  pudaiser: 'PUDAIER',
  pudaiier: 'PUDAIER',
  'pana-dora': 'Pana Dora',
  panadora: 'Pana Dora',
};

const NOISE_WORDS =
  /\b(sweden|100ml|50ml|30ml|75ml|3\.4\s*oz|extrait de parfum|eau de parfum|eau de toilette|edp|edt|spray|unisex|for men|for women|fragrance|perfume)\b/gi;

let lastUpcAt = 0;
const UPC_GAP_MS = 2500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function buildVanillaSearchQueries(product = {}, variantName = '') {
  const brand = resolveBrand(product).replace(/\bsweden\b/gi, '').replace(/\s+/g, ' ').trim();
  const full = englishProductName(product);
  const stripped = full.replace(NOISE_WORDS, ' ').replace(/\s+/g, ' ').trim();
  const tokens = stripped.split(' ').filter((t) => t.length > 2);
  const brandTokens = new Set(brand.toLowerCase().split(/\s+/));
  const distinctive = tokens.filter((t) => !brandTokens.has(t.toLowerCase()));
  const core = distinctive.slice(0, 2).join(' ') || tokens.slice(-2).join(' ');

  const queries = [
    [brand, core, variantName].filter(Boolean).join(' '),
    [brand.split(' ').slice(0, 2).join(' '), core, variantName].filter(Boolean).join(' '),
    [brand.split(' ')[0], distinctive[0], variantName].filter(Boolean).join(' '),
    stripped,
    core,
    full,
    variantName ? `${brand} ${variantName}` : '',
  ];
  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))];
}

function scoreUpcHit(item, productName, shadeName = '') {
  const title = (item.title || '').toLowerCase();
  const shade = (shadeName || '').toLowerCase().trim();
  const words = productName.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let score = 0;
  for (const w of words.slice(0, 5)) {
    if (title.includes(w)) score += 2;
  }
  if (shade && title.includes(shade)) score += 8;
  if (isValidBarcodeValue(item.ean)) score += 1;
  return score;
}

async function queryUpcItemDb(searchQuery, productName, shadeName = '') {
  const wait = Math.max(0, UPC_GAP_MS - (Date.now() - lastUpcAt));
  if (wait) await sleep(wait);
  lastUpcAt = Date.now();

  const res = await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(searchQuery)}`, {
    headers: { 'User-Agent': 'vanilla-catalog/1.0', Accept: 'application/json' },
  });
  const data = await res.json();
  if (data.code === 'TOO_FAST' || data.code === 'EXCEED_LIMIT') {
    return { rateLimited: true };
  }
  if (data.code !== 'OK' || !data.items?.length) return null;

  const ranked = [...data.items].sort(
    (a, b) => scoreUpcHit(b, productName, shadeName) - scoreUpcHit(a, productName, shadeName)
  );
  const best = ranked[0];
  const minScore = shadeName ? 3 : 2;
  if (best?.ean && scoreUpcHit(best, productName, shadeName) >= minScore) {
    return { ean: normalizeEan(best.ean), source: 'upcitemdb', title: best.title };
  }
  return null;
}

async function queryOpenBeautyFacts(searchQuery) {
  try {
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&json=1&page_size=5`;
    const res = await fetch(url, { headers: { 'User-Agent': 'vanilla-catalog/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    for (const hit of data.products || []) {
      const code = String(hit.code || '').trim();
      if (isValidBarcodeValue(code)) {
        return { ean: code, source: 'openbeautyfacts' };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function isValidEan13(code) {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return ((10 - (sum % 10)) % 10) === digits[12];
}

async function queryWebEan(searchPhrase) {
  const q = encodeURIComponent(`${searchPhrase} EAN barcode`.trim());
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; vanilla-catalog/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const counts = new Map();
    for (const m of html.matchAll(/\b(\d{13})\b/g)) {
      const code = m[1];
      if (isValidEan13(code)) counts.set(code, (counts.get(code) || 0) + 1);
    }
    if (!counts.size) return null;
    const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return { ean: best[0], source: 'web_search' };
  } catch {
    return null;
  }
}

export function englishProductName(product = {}) {
  if (product.slug) {
    const words = product.slug.split('-').filter(Boolean);
    const brandKey = words[0] === 'pana' && words[1] === 'dora' ? 'pana-dora' : words[0]?.toLowerCase();
    const titleWords = words[0] === 'pana' && words[1] === 'dora' ? words.slice(2) : words.slice(1);
    const title = titleWords
      .map((w) => w.replace(/^\d+$/, w).replace(/^./, (c) => c.toUpperCase()))
      .join(' ');
    if (BRAND_SLUGS[brandKey]) return `${BRAND_SLUGS[brandKey]} ${title}`.trim();
    return words.map((w) => w.replace(/^./, (c) => c.toUpperCase())).join(' ');
  }
  return String(product.name || '')
    .replace(/[^\x00-\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveBrand(product = {}) {
  return (
    product.manufacturer ||
    product.brandName ||
    extractBrandFromName(product.name, product.slug) ||
    ''
  );
}

function applyEan(target, ean, source) {
  if (!ean) return;
  target.ean = ean;
  target.barcode = ean;
  target.barcodeSource = source;
}

export function applyVanillaBarcodeCache(product, shades = []) {
  const brand = resolveBrand(product);
  const productName = englishProductName(product);

  if (isInternalVanillaBarcode(product.internalBarcode)) {
    const hit = recall(cacheKey(brand, productName, ''));
    if (hit?.ean) {
      product.ean = hit.ean;
      product.barcode = hit.ean;
      product.barcodeSource = hit.source || 'cache';
    }
  } else if (isValidBarcodeValue(product.barcode)) {
    product.ean = normalizeEan(product.barcode);
    product.barcode = product.ean;
    product.barcodeSource = 'api';
  }

  for (const shade of shades) {
    if (shade.ean) continue;
    const variantName = shade.name || '';
    const hit = recall(cacheKey(brand, productName, variantName));
    if (hit?.ean) applyEan(shade, hit.ean, hit.source || 'cache');
  }

  return { product, shades };
}

export async function lookupVanillaEan(product = {}, variantName = '') {
  const brand = resolveBrand(product);
  const productName = englishProductName(product);
  const key = cacheKey(brand, productName, variantName);
  const cached = recall(key);
  if (cached?.ean) return cached;
  if (cached?.rateLimited) return cached;
  if (cached === '') return cached;

  const queries = buildVanillaSearchQueries(product, variantName);
  let sawRateLimit = false;

  for (const q of queries) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const upc = await queryUpcItemDb(q, productName, variantName);
      if (upc?.rateLimited) {
        sawRateLimit = true;
        break;
      }
      if (upc?.ean) {
        remember(key, upc);
        saveDiskCache();
        return upc;
      }
      await sleep(1500);
    }
  }

  for (const q of queries.slice(0, 3)) {
    const obf = await queryOpenBeautyFacts(q);
    if (obf?.ean) {
      remember(key, obf);
      saveDiskCache();
      return obf;
    }
    await sleep(400);
  }

  const web = await queryWebEan(queries[0] || `${brand} ${productName}`);
  if (web?.ean) {
    remember(key, web);
    saveDiskCache();
    return web;
  }

  if (sawRateLimit) {
    remember(key, { rateLimited: true });
    saveDiskCache();
    return { rateLimited: true };
  }

  remember(key, null);
  saveDiskCache();
  return '';
}

export function getVanillaBarcodeStatus(product = {}) {
  if (product.ean) return 'found';
  const brand = resolveBrand(product);
  const productName = englishProductName(product);
  const cached = recall(cacheKey(brand, productName, ''));
  if (cached?.rateLimited) return 'rate_limited';
  if (cached === '') return 'not_found';
  if (isInternalVanillaBarcode(product.internalBarcode)) return 'pending';
  return 'none';
}

export function isBarcodeResolved(product = {}, shades = []) {
  const brand = resolveBrand(product);
  const productName = englishProductName(product);
  const productCached = recall(cacheKey(brand, productName, ''));
  const productOk =
    !isInternalVanillaBarcode(product.internalBarcode) ||
    Boolean(product.ean) ||
    productCached?.ean ||
    productCached?.rateLimited ||
    productCached === '';
  const shadesOk = shades.every((s) => {
    const hit = recall(cacheKey(brand, productName, s.name || ''));
    return Boolean(s.ean) || hit?.ean || hit?.rateLimited || hit === '';
  });
  return productOk && shadesOk;
}

export async function enrichVanillaBarcodes(product, shades = [], { maxLookups = 5 } = {}) {
  applyVanillaBarcodeCache(product, shades);

  const needsProduct =
    isInternalVanillaBarcode(product.internalBarcode) && !product.ean;
  const missingShades = shades.filter((s) => !s.ean);
  let looked = 0;

  if (needsProduct && looked < maxLookups) {
    const hit = await lookupVanillaEan(product, '');
    if (hit?.ean) {
      product.ean = hit.ean;
      product.barcode = hit.ean;
      product.barcodeSource = hit.source || 'external';
    } else if (hit?.rateLimited) {
      product.barcodeStatus = 'rate_limited';
    } else if (hit === '') {
      product.barcodeStatus = 'not_found';
    }
    looked += 1;
  }

  for (const shade of missingShades) {
    if (looked >= maxLookups) break;
    if (shade.ean) continue;
    const hit = await lookupVanillaEan(product, shade.name || '');
    if (hit?.ean) applyEan(shade, hit.ean, hit.source || 'external');
    looked += 1;
  }

  saveDiskCache();
  return {
    product,
    shades,
    looked,
    done: isBarcodeResolved(product, shades),
  };
}

export function prepareVanillaBarcodeFields(product = {}) {
  const raw = product.barcode || '';
  if (isInternalVanillaBarcode(raw)) {
    product.internalBarcode = raw;
    product.barcode = '';
    product.ean = '';
    product.barcodeSource = 'internal';
  } else if (isValidBarcodeValue(raw)) {
    product.ean = normalizeEan(raw);
    product.barcode = product.ean;
    product.barcodeSource = 'api';
    product.internalBarcode = '';
  } else {
    product.internalBarcode = raw || '';
    product.barcode = '';
    product.ean = '';
    product.barcodeSource = raw ? 'unknown' : 'none';
  }
  return product;
}

export function prepareVanillaVariationBarcode(variation = {}) {
  const raw = variation.barcode || '';
  const out = { ...variation };
  if (isInternalVanillaBarcode(raw)) {
    out.internalBarcode = raw;
    out.barcode = '';
    out.ean = '';
    out.barcodeSource = 'internal';
  } else if (isValidBarcodeValue(raw)) {
    out.ean = normalizeEan(raw);
    out.barcode = out.ean;
    out.barcodeSource = 'api';
    out.internalBarcode = '';
  } else {
    out.internalBarcode = raw || '';
    out.barcode = '';
    out.ean = '';
    out.barcodeSource = raw ? 'unknown' : 'none';
  }
  return out;
}

export function shadeStats(shades = []) {
  const withEan = shades.filter((s) => s.ean).length;
  return { total: shades.length, withEan, withSku: shades.filter((s) => s.sku).length };
}

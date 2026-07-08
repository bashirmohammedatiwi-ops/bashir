import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', '..', 'data', 'barcode-meta-cache.json');

const memoryCache = new Map();
let diskCache = null;
let diskDirty = false;
let lastUpcRequestAt = 0;

const UPC_MIN_INTERVAL_MS = 2200;
const NEGATIVE_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

function remember(key, value) {
  memoryCache.set(key, value);
  const disk = loadDiskCache();
  if (value && typeof value === 'object') {
    disk[key] = { ...value, at: Date.now() };
  } else {
    disk[key] = { ean: '', at: Date.now() };
  }
  diskDirty = true;
}

function recall(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const hit = loadDiskCache()[key];
  if (!hit) return null;
  if (!hit.brand && !hit.title && !hit.ean) {
    if (hit.at && Date.now() - hit.at > NEGATIVE_CACHE_TTL_MS) return null;
    memoryCache.set(key, '');
    return '';
  }
  const val = {
    ean: hit.ean || '',
    brand: hit.brand || '',
    title: hit.title || '',
    shade: hit.shade || '',
    source: hit.source || 'cache',
  };
  // تجاهل كاش metadata تالف (مثل "Barcode Lookup")
  if ((val.brand || val.title) && !isUsableBarcodeMeta(val)) {
    memoryCache.set(key, '');
    return '';
  }
  memoryCache.set(key, val);
  return val;
}

function decodeHtmlEntities(text = '') {
  return String(text || '')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const JUNK_META_RE = /^(barcode\s*lookup|upc\s*database|go-?upc|ean-?search|barcodelookup|upcitemdb|open\s*beauty\s*facts|gs1|checkdigit|barcode\s*spider)$/i;
const JUNK_TITLE_RE = /\b(upc|ean|isbn)\s*(search|lookup|database|scanner)?\b|barcode\s*lookup|find\s*upc|product\s*not\s*found/i;

export function isUsableBarcodeMeta(meta = {}) {
  const brand = String(meta.brand || '').trim();
  const title = String(meta.title || '').trim();
  if (!brand && !title) return false;
  if (brand && JUNK_META_RE.test(brand)) return false;
  if (title && JUNK_META_RE.test(title)) return false;
  if (title && JUNK_TITLE_RE.test(title) && (!brand || JUNK_META_RE.test(brand) || brand.length < 2)) {
    return false;
  }
  // عنوان ويب عام بلا ماركة حقيقية
  if (!brand && title && JUNK_TITLE_RE.test(title)) return false;
  return true;
}

export function normalizeBarcodeMeta(meta = {}) {
  const normalized = {
    ean: String(meta.ean || meta.barcode || '').replace(/\D/g, ''),
    brand: String(meta.brand || meta.manufacturer || '').trim(),
    title: String(meta.title || meta.name || '').trim(),
    shade: String(meta.shade || meta.shadeName || '').trim(),
    source: String(meta.source || 'meta').trim(),
  };
  if (!isUsableBarcodeMeta(normalized)) {
    return { ean: normalized.ean, brand: '', title: '', shade: '', source: normalized.source };
  }
  return normalized;
}

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
    .replace(/\b(edp|edt|spray|eau de parfum|fragrance|perfume)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const productLine = title;
  const productWords = productLine.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
  return { brand, title, shade, productLine, productWords };
}

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
  }
  return [...queries].filter(Boolean);
}

export function productLineConflicts(hay = '', productLine = '') {
  const line = String(productLine || '').toLowerCase();
  const h = String(hay || '').toLowerCase();
  const pairs = [
    ['highlight', 'blush'],
    ['lipstick', 'foundation'],
    ['concealer', 'foundation'],
  ];
  for (const [want, avoid] of pairs) {
    if (line.includes(want) && h.includes(avoid) && !h.includes(want)) return true;
  }
  return false;
}

export function scoreStoreHintMatch(item = {}, meta = {}) {
  const parsed = parseBarcodeMetaFields(meta);
  const hay = `${item.nameAr || item.name || ''} ${item.nameEn || ''} ${item.brandAr || item.manufacturer || ''} ${item.shadeName || ''}`.toLowerCase();
  let score = 0;

  const brand = parsed.brand.toLowerCase();
  if (brand && (hay.includes(brand) || brand.includes((item.brandAr || item.manufacturer || '').toLowerCase()))) {
    score += 6;
  }

  const GENERIC = new Set(['makeup', 'perfume', 'parfum', 'eau', 'for', 'the', 'with']);
  const words = parsed.productWords.filter((w) => !GENERIC.has(w.toLowerCase()));
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

async function throttleUpc() {
  const wait = Math.max(0, UPC_MIN_INTERVAL_MS - (Date.now() - lastUpcRequestAt));
  if (wait) await sleep(wait);
  lastUpcRequestAt = Date.now();
}

export async function lookupUpcByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  const key = `upc|${digits}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  for (let attempt = 0; attempt < 3; attempt++) {
    await throttleUpc();
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${digits}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'catalog-hub/2.0' },
      });
      const data = await res.json();
      if (data.code === 'TOO_FAST' || data.code === 'EXCEED_LIMIT') {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (data.code === 'OK' && data.items?.length) {
        const item = data.items[0];
        const result = normalizeBarcodeMeta({
          ean: digits,
          brand: item.brand,
          title: item.title,
          source: 'upcitemdb',
        });
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

export async function lookupOpenBeautyFactsByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  const key = `obf|${digits}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  try {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${digits}.json`, {
      headers: { Accept: 'application/json', 'User-Agent': 'catalog-hub/2.0' },
    });
    const data = await res.json();
    const p = data?.product;
    if (p?.product_name || p?.brands) {
      const result = normalizeBarcodeMeta({
        ean: digits,
        brand: String(p.brands || '').split(',')[0].trim(),
        title: String(p.product_name || p.generic_name || '').trim(),
        source: 'openbeautyfacts',
      });
      remember(key, result);
      saveDiskCache();
      return result;
    }
  } catch { /* ignore */ }

  remember(key, '');
  saveDiskCache();
  return null;
}

function parseWebSearchResultMeta(title = '', snippet = '', digits = '') {
  const text = `${title} ${snippet}`.trim();
  if (!text) return null;

  let brand = '';
  let productTitle = title;
  const dash = title.split(/\s*[-–—|]\s*/);
  if (dash.length >= 2) {
    brand = dash[0].trim();
    productTitle = dash.slice(1).join(' - ').trim();
  }

  return normalizeBarcodeMeta({
    ean: digits,
    brand,
    title: productTitle.replace(digits, '').trim(),
    source: 'web',
  });
}

async function fetchDuckDuckGoHtml(query) {
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; catalog-hub/2.0)',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=${encodeURIComponent(query)}&b=`,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`DDG ${res.status}`);
  return res.text();
}

async function fetchBingHtml(query) {
  const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Bing ${res.status}`);
  return res.text();
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
  return rows;
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

async function fetchWebSearchRows(query) {
  try {
    const rows = parseDuckDuckGoResults(await fetchDuckDuckGoHtml(query));
    if (rows.length) return rows;
  } catch { /* next */ }
  try {
    const rows = parseBingResults(await fetchBingHtml(query));
    if (rows.length) return rows;
  } catch { /* none */ }
  return [];
}

function buildWebSearchQueries(digits) {
  return [...new Set([
    digits,
    `${digits} barcode`,
    `${digits} site:miswag.com`,
    `${digits} miswag`,
  ])];
}

export function extractMiswagProductIdsFromRows(rows = []) {
  const ids = new Set();
  for (const row of rows) {
    const text = `${row.url || ''} ${row.title || ''} ${row.snippet || ''}`;
    for (const m of text.matchAll(/miswag\.com\/products\/(\d{8,12})/gi)) {
      ids.add(m[1]);
    }
  }
  return [...ids];
}

async function parseBestWebSearchMeta(digits, rows = []) {
  let best = null;
  let bestScore = 0;
  for (const row of rows) {
    const meta = parseWebSearchResultMeta(row.title, row.snippet, digits);
    if (!meta?.brand && !meta?.title) continue;
    let score = 0;
    if (`${row.title} ${row.snippet}`.includes(digits)) score += 4;
    if (meta.brand) score += 3;
    if (meta.title) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = meta;
    }
  }
  return best;
}

export async function lookupBarcodeFromWebSearch(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const key = `web|${digits}`;
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
        break;
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

export async function lookupBarcodeProductMeta(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;

  const key = `meta|${digits}`;
  const cached = recall(key);
  if (cached !== null) return cached || null;

  const [upc, obf, web] = await Promise.all([
    lookupUpcByBarcode(digits).catch(() => null),
    lookupOpenBeautyFactsByBarcode(digits).catch(() => null),
    lookupBarcodeFromWebSearch(digits).catch(() => null),
  ]);

  const candidates = [upc, obf, web]
    .map((m) => (m ? normalizeBarcodeMeta(m) : null))
    .filter((m) => m && isUsableBarcodeMeta(m));
  const withShade = candidates.find((m) => m.shade);
  const best = withShade || candidates[0] || null;
  remember(key, best || '');
  saveDiskCache();
  return best;
}

export async function findMiswagIdsFromWeb(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  const key = `miswag_web_ids|${digits}`;
  const cached = recall(key);
  if (cached !== null) return Array.isArray(cached) ? cached : [];

  const ids = new Set();
  for (const query of buildWebSearchQueries(digits)) {
    const rows = await fetchWebSearchRows(query);
    for (const id of extractMiswagProductIdsFromRows(rows)) ids.add(id);
    if (ids.size) break;
  }

  const list = [...ids];
  remember(key, list);
  saveDiskCache();
  return list;
}

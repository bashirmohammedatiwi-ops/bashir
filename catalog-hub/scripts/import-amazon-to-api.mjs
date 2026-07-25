#!/usr/bin/env node
/**
 * استيراد منتج أمازون (كل التدرجات) إلى API الحياة.
 *
 * Usage:
 *   API_BASE=http://187.127.88.146/api/v1 \
 *   ADMIN_EMAIL=admin@alhayaa.com \
 *   ADMIN_PASSWORD='...' \
 *   node scripts/import-amazon-to-api.mjs B07W59CNXQ
 *
 *   node scripts/import-amazon-to-api.mjs "https://www.amazon.com/dp/B07W59CNXQ"
 *
 * Options (env):
 *   BRAND_ID, CATEGORY_ID, SUBCATEGORY_ID — UUIDs from API
 *   DRY_RUN=1 — print payload only
 *   SKIP_IMAGES=1 — skip media upload (shades without imageId)
 */
import { fetchAllShadesForListing, scrapeProductDetail } from '../lib/stores/amazon/scrape.js';
import { mergeDetailWithVariantCache } from '../lib/stores/amazon/variant-cache.js';
import { enrichShadeColorsFromImages } from '../lib/core/shade-color-from-image.js';
import { sortShadesByNumber } from '../lib/core/product.js';

const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:3000/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
const SKIP_IMAGES = process.env.SKIP_IMAGES === '1';
const SKIP_BARCODES = process.env.SKIP_BARCODES !== '0';

const DEFAULTS = {
  brandId: process.env.BRAND_ID || '8e0f85f1-bd05-4e2c-b24b-698f33671144',
  categoryId: process.env.CATEGORY_ID || 'd3c24d19-dde5-41e5-b0a9-bede45393795',
  subcategoryId: process.env.SUBCATEGORY_ID || '56da5b82-c847-4e9b-9cea-cc901236189f',
};

function parseAsin(input = '') {
  const raw = String(input || '').trim();
  const fromUrl = raw.match(/\/dp\/([A-Z0-9]{10})/i)?.[1];
  if (fromUrl) return fromUrl.toUpperCase();
  if (/^[A-Z0-9]{10}$/i.test(raw)) return raw.toUpperCase();
  return '';
}

function slugify(name = '') {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .slice(0, 80);
  return base || `product-${Date.now()}`;
}

function cleanParentName(nameEn = '') {
  return String(nameEn || '')
    .replace(/,\s*[^,]+,\s*1 Count.*$/i, '')
    .replace(/,\s*[^,]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || 'Maybelline Product';
}

function cleanParentNameAr(nameAr = '') {
  return String(nameAr || '')
    .replace(/،\s*[^،]+،\s*1 عبوة.*$/u, '')
    .replace(/،\s*[^،]+$/u, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || cleanParentName(nameAr);
}

function decodeHtml(s = '') {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractAmazonColorName(html = '') {
  const fromSpecs = html.match(/po-color[\s\S]{0,300}?po-break-word[^>]*>\s*([^<]{1,80})/i)?.[1];
  if (fromSpecs) return decodeHtml(fromSpecs).trim();
  const title = html.match(/id="productTitle"[^>]*>\s*([^<]{10,220})/i)?.[1];
  if (title) {
    const parts = decodeHtml(title).split(',');
    if (parts.length >= 3) return parts[parts.length - 2].trim();
  }
  return '';
}

function shadeNumberCounts(shades = []) {
  const counts = new Map();
  for (const s of shades) {
    const num = String(s.shadeNumber || s.shadeCode || '').trim();
    if (num) counts.set(num, (counts.get(num) || 0) + 1);
  }
  return counts;
}

function needsShadeNameEnrichment(shade = {}, counts = new Map()) {
  const num = String(shade.shadeNumber || shade.shadeCode || '').trim();
  const title = String(shade.shadeTitleEn || '').trim();
  const name = String(shade.nameEn || shade.name || '').trim();
  if (title && !/^\d+$/.test(title)) return false;
  if (name && !/^\d+$/.test(name)) return false;
  if (!num) return true;
  return (counts.get(num) || 0) > 1;
}

function resolveImportShadeName(shade = {}, counts = new Map(), index = 0) {
  const num = String(shade.shadeNumber || shade.shadeCode || '').trim();
  const title = String(shade.shadeTitleEn || '').trim();
  const name = String(shade.nameEn || shade.name || '').trim();
  const descriptive = title || (name && !/^\d+$/.test(name) ? name : '');

  if (num && (counts.get(num) || 0) === 1) return num;
  if (descriptive) return descriptive.toUpperCase();
  if (num) return num;
  return String(index + 1);
}

async function enrichMissingShadeNamesFromAmazon(shades = []) {
  const counts = shadeNumberCounts(shades);
  const targets = shades
    .map((shade, index) => ({ shade, index }))
    .filter(({ shade }) => needsShadeNameEnrichment(shade, counts));

  if (!targets.length) return shades;

  const out = shades.map((s) => ({ ...s }));
  for (const { shade, index } of targets) {
    const asin = String(shade.id || shade.sku || '').toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(asin)) continue;
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const html = await res.text();
      const color = extractAmazonColorName(html);
      if (!color) continue;
      out[index] = {
        ...out[index],
        shadeTitleEn: color,
        nameEn: color,
        shadeNumber: '',
        shadeCode: '',
      };
      console.log(`  shade name: ${asin} -> ${color}`);
    } catch (err) {
      console.warn(`  skip shade name ${asin}: ${err.message}`);
    }
  }
  return out;
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return json?.data ?? json;
}

async function login() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
  }
  const data = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = data.accessToken;
  if (!token) throw new Error('Login succeeded but no accessToken returned');
  return token;
}

async function uploadFromUrl(token, url, purpose = 'PRODUCT') {
  const data = await api('/media/upload-from-url', {
    method: 'POST',
    token,
    body: { url, purpose },
  });
  return data?.id || data?.media?.id;
}

async function mapWithConcurrency(items, worker, limit = 4) {
  const out = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

async function loadAmazonProduct(asin) {
  const child = String(asin || '').trim().toUpperCase();
  let detail = await scrapeProductDetail(child, {
    light: false,
    skipRedirect: true,
    skipCache: true,
    matchedChildAsin: child,
  }).catch(() => null);

  if (!detail || (detail.shades?.length || 0) < 3) {
    detail = await fetchAllShadesForListing(child, { matchedChildAsin: child, skipCache: true });
  }

  detail = mergeDetailWithVariantCache(detail, {
    asin: detail?.id || detail?.parentAsin,
    matchedChildAsin: child,
    barcode: detail?.barcode || detail?.matchedShadeBarcode || '',
  }) || detail;

  detail.shades = await enrichMissingShadeNamesFromAmazon(detail.shades || []);
  detail.shades = await enrichShadeColorsFromImages(detail.shades || [], { concurrency: 8 });
  detail.shades = sortShadesByNumber(detail.shades || []);
  return detail;
}

function buildPayload(detail, imageIds) {
  const nameEn = cleanParentName(detail.nameEn);
  const nameAr = cleanParentNameAr(detail.nameAr);
  const numberCounts = shadeNumberCounts(detail.shades || []);
  const shades = sortShadesByNumber((detail.shades || []).map((s, i) => {
    const imageUrl = s.image || s.imageUrl || '';
    return {
      name: resolveImportShadeName(s, numberCounts, i),
      colorHex: s.colorHex || s.hex || '#CCCCCC',
      barcode: SKIP_BARCODES ? undefined : (String(s.barcode || '').replace(/\D/g, '') || undefined),
      imageId: imageIds.get(imageUrl),
      position: Number.isFinite(Number(s.position)) ? Number(s.position) : i,
      stock: 0,
    };
  }));

  const productImages = [...new Set([detail.thumb, ...(detail.images || [])].filter(Boolean))]
    .map((url) => imageIds.get(url))
    .filter(Boolean);

  return {
    sku: detail.parentAsin || detail.id || `AMZ-${Date.now()}`,
    name: nameAr || nameEn,
    nameAr,
    nameEn,
    slug: slugify(nameEn || nameAr),
    brandId: DEFAULTS.brandId,
    categoryId: DEFAULTS.categoryId,
    subcategoryIds: [DEFAULTS.subcategoryId],
    description: detail.descriptionAr || detail.descriptionEn || '',
    descriptionAr: detail.descriptionAr || undefined,
    descriptionEn: detail.descriptionEn || undefined,
    ingredients: '',
    howToUse: '',
    price: 0,
    originalPrice: 0,
    discountPercent: 0,
    stock: 0,
    isActive: true,
    isNew: true,
    imageIds: productImages,
    shades,
  };
}

async function main() {
  const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
  const asin = parseAsin(arg || process.env.ASIN || '');
  if (!asin) {
    console.error('Usage: node scripts/import-amazon-to-api.mjs <ASIN or Amazon URL>');
    process.exit(1);
  }

  console.log(`Loading Amazon product ${asin}...`);
  const detail = await loadAmazonProduct(asin);
  const shades = detail.shades || [];
  const barcodes = shades.filter((s) => String(s.barcode || '').replace(/\D/g, '').length >= 8).length;
  console.log(`Parent: ${detail.parentAsin || detail.id}`);
  console.log(`Shades: ${shades.length}, barcodes: ${barcodes}, images: ${shades.filter((s) => s.image).length}`);

  const imageIds = new Map();
  if (!SKIP_IMAGES && !DRY_RUN) {
    const token = await login();
    const urls = [];
    const seen = new Set();
    const add = (u) => {
      const url = String(u || '').trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      urls.push(url);
    };
    add(detail.thumb);
    for (const s of shades) add(s.image);
    console.log(`Uploading ${urls.length} images...`);
    await mapWithConcurrency(urls, async (url) => {
      try {
        const id = await uploadFromUrl(token, url);
        if (id) imageIds.set(url, id);
      } catch (err) {
        console.warn(`  skip image: ${err.message}`);
      }
    }, 4);
    console.log(`Uploaded ${imageIds.size}/${urls.length} images`);

    const payload = buildPayload(detail, imageIds);
    console.log('Creating product...');
    const created = await api('/products', { method: 'POST', token, body: payload });
    console.log('Done:', created?.id || created?.slug || created);
    return;
  }

  const payload = buildPayload(detail, imageIds);
  if (DRY_RUN) {
    console.log(JSON.stringify({
      parentAsin: detail.parentAsin || detail.id,
      shadeCount: shades.length,
      barcodeCount: barcodes,
      payload,
    }, null, 2));
    return;
  }

  console.log('Set ADMIN_EMAIL + ADMIN_PASSWORD or use DRY_RUN=1');
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

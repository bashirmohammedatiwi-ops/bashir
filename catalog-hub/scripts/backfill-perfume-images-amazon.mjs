#!/usr/bin/env node
/**
 * رفع صور Amazon للعطور بدون صور — حد أقصى 4 صور بدقة عالية.
 * يستخدم amazon.ae مباشرة لاستخراج معرض الصور (أسرع وأكثر موثوقية من scrape الكامل).
 */
import { searchBarcode } from '../lib/stores/amazon/products.js';
import { findAmazonByBarcode } from '../lib/stores/amazon/catalog-index.js';
import { scrapeSearchProducts } from '../lib/stores/amazon/scrape.js';
import {
  dedupeImagesPreferLargest,
  normalizeAmazonImageUrl,
} from '../lib/core/images.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';

const PERFUME_BRANDS = new Set([
  'b610d576-9fb9-4b21-a6a2-74e71b471474',
  '6260d08f-b87d-4d87-a4ca-fce8ee81a2b4',
  'bca2c344-538c-4ef1-ae91-9d12f789d8fa',
]);
const PERFUMES_CATEGORY = '975e0e23-edd2-4181-ad6d-ecade6452b95';
const MAX_IMAGES = 4;
const IMAGE_SIZE = 1600;
const PRODUCT_CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** ASIN معروف مسبقاً من بحث Amazon بالباركود */
const ASIN_HINTS = {
  '3365440787971': 'B00NBK5JHK',
  '3614274184785': 'B0G1PK4GWT',
  '3614273069557': 'B08H3PCGWT',
  '3614273924030': 'B0CH8TSCR4',
  '3614273776127': 'B0B9T35NCJ',
  '3614272050358': 'B00AU1JM3K',
  '3605522040588': 'B071SGZ7CK',
  '3614273668743': 'B09VLC9CNP',
  '3614273683401': 'B09VLCJSZ9',
  '3614274266801': 'B0F25S255K',
  '3614273336383': 'B08WRLF7RG',
  '3614274040067': 'B0D35TBXL4',
  '3605530262309': 'B00BVO9K82',
  '3614273258180': 'B09FFKRBXQ',
  '3614272443716': 'B07CP241KH',
  '3614271969545': 'B075FZHHZR',
  '3614272491359': 'B09D6W1T7X',
  '3614271990013': 'B0795RNLY2',
  '3614274521238': 'B0GK9KXK3T',
  '3614274114645': 'B0DDTMT6R6',
  '3614273852814': 'B0CFWQF39W',
  '3614274329384': 'B0FHBK8L1L',
  '3614272889590': 'B08YKHSPGW',
  '3605522041486': 'B071ZHLSLV',
  '3614273665018': 'B0B7G3QJTD',
  '3365440025578': 'B08CP4CJSW',
  '3614272648425': 'B07X1YGWSX',
  '3614270561634': 'B081S5D2WW',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s = '') {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\\u0026/g, '&');
}

function buildSearchQueries(nameEn = '', barcode = '') {
  const clean = String(nameEn)
    .replace(/Yves Saint Laurent/gi, 'YSL')
    .replace(/Emporio Armani|Giorgio Armani/gi, 'Armani')
    .replace(/Lancôme|Lancome/gi, 'Lancome')
    .replace(/\d+\s*ml/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return [...new Set([
    barcode,
    clean,
    clean.split(' ').slice(0, 7).join(' '),
  ].filter((q) => String(q).replace(/\D/g, '').length >= 8 || q.length >= 12))];
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || json?.message || res.statusText);
  return json?.data ?? json;
}

function hasRealImages(product = {}) {
  return (product.images || []).some((img) => img?.id && img.id !== 'placeholder');
}

async function resolveAsin(barcode, nameEn) {
  if (ASIN_HINTS[barcode]) return ASIN_HINTS[barcode];

  const indexed = findAmazonByBarcode(barcode);
  if (indexed?.id) return String(indexed.id).toUpperCase();

  const hits = await searchBarcode(barcode).catch(() => []);
  if (hits[0]?.id) return String(hits[0].id).toUpperCase();

  for (const query of buildSearchQueries(nameEn, barcode)) {
    const search = await scrapeSearchProducts(query, { page: 1, limit: 6 });
    if (search.items?.length) {
      return String(search.items[0].id || '').toUpperCase();
    }
    if (search.softBlocked) await sleep(800);
  }
  return null;
}

async function fetchAmazonGallery(asin) {
  const pageUrls = [
    `https://www.amazon.ae/dp/${asin}`,
    `https://www.amazon.com/dp/${asin}?th=1&psc=1`,
  ];
  const raw = [];

  for (const url of pageUrls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8' },
        signal: AbortSignal.timeout(20_000),
      });
      const html = await res.text();
      if (!res.ok || /Robot Check|captcha/i.test(html)) continue;

      const landing = html.match(/id="landingImage"[^>]+(?:data-old-hires|src)="(https:[^"]+)"/)?.[1];
      if (landing) raw.push(decodeHtml(landing));

      for (const m of html.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/g)) raw.push(decodeHtml(m[1]));
      for (const m of html.matchAll(/"large"\s*:\s*"(https:[^"]+)"/g)) raw.push(decodeHtml(m[1]));

      const dyn = html.match(/data-a-dynamic-image="(\{[^"]+\})"/)?.[1];
      if (dyn) {
        try {
          raw.push(...Object.keys(JSON.parse(decodeHtml(dyn))));
        } catch { /* ignore */ }
      }

      if (raw.length >= 2) break;
    } catch { /* try next market */ }
  }

  return dedupeImagesPreferLargest(
    raw.map((url) => normalizeAmazonImageUrl(url, IMAGE_SIZE)),
  ).slice(0, MAX_IMAGES);
}

async function uploadFromUrl(token, url) {
  const data = await api('/media/upload-from-url', {
    method: 'POST',
    token,
    body: { url, purpose: 'PRODUCT' },
  });
  return data?.id || data?.media?.id || null;
}

async function uploadImages(token, urls) {
  const settled = await Promise.all(
    urls.slice(0, MAX_IMAGES).map((url) => uploadFromUrl(token, url).catch(() => null)),
  );
  return settled.filter(Boolean);
}

async function processProduct(token, product) {
  const { barcode, id, nameEn } = product;
  const asin = await resolveAsin(barcode, nameEn);
  if (!asin) return { barcode, status: 'skip', reason: 'no asin' };

  const urls = await fetchAmazonGallery(asin);
  if (!urls.length) return { barcode, status: 'skip', reason: 'no images', asin };

  const imageIds = await uploadImages(token, urls);
  if (!imageIds.length) return { barcode, status: 'fail', reason: 'upload failed', asin };

  await api(`/products/${id}`, { method: 'PATCH', token, body: { imageIds } });
  return { barcode, status: 'ok', asin, count: imageIds.length };
}

async function mapWithConcurrency(items, worker, limit = 4) {
  const results = [];
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;

  const targets = [];
  for (let page = 1; page <= 30; page++) {
    const items = await api(`/products?limit=100&page=${page}`, { token });
    if (!items?.length) break;
    for (const p of items) {
      if (!PERFUME_BRANDS.has(p.brandId) || p.categoryId !== PERFUMES_CATEGORY) continue;
      if (hasRealImages(p)) continue;
      targets.push({ id: p.id, barcode: p.barcode, nameEn: p.nameEn || p.nameAr || '' });
    }
  }

  console.log(`Amazon backfill: ${targets.length} perfumes (max ${MAX_IMAGES} HQ images, concurrency ${PRODUCT_CONCURRENCY})\n`);

  const results = await mapWithConcurrency(
    targets,
    (product) => processProduct(token, product).then((r) => {
      if (r.status === 'ok') console.log(`OK ${r.barcode} -> ${r.count} img [${r.asin}]`);
      else console.log(`${r.status === 'skip' ? 'SKIP' : 'FAIL'} ${r.barcode} — ${r.reason}${r.asin ? ` [${r.asin}]` : ''}`);
      return r;
    }),
    PRODUCT_CONCURRENCY,
  );

  const ok = results.filter((r) => r.status === 'ok').length;
  const skip = results.filter((r) => r.status === 'skip').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed (${targets.length} total)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

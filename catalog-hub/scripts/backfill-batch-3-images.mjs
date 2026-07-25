#!/usr/bin/env node
/**
 * Batch-3 image backfill — Niceone only, parallel, barcode-accurate.
 * Uses upload-from-url (same as admin panel) — no local storage bloat.
 */
import { readFileSync } from 'fs';
import { searchBarcode as niceoneSearchBarcode, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { findBarcodeIndexEntry, upsertBarcodeIndex } from '../lib/core/barcode-index.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const INDEX_ONLY = process.env.INDEX_ONLY === '1'; // default: full Niceone barcode search
const UPLOAD_CONCURRENCY = Number(process.env.UPLOAD_CONCURRENCY || 6);

const BATCH3_SRC = readFileSync(new URL('./import-barcodes-batch-3.mjs', import.meta.url), 'utf8');
const BATCH3_BARCODES = [...BATCH3_SRC.matchAll(/\bp\('(\d{8,14})'/g)].map((m) => m[1]);

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function isJunkImage(url = '') {
  const u = String(url).toLowerCase();
  return !u.startsWith('http') || /\s/.test(u) || /\/swatch\//i.test(u) || /placeholder|no[_-]?image|data:image/i.test(u);
}

function normalizeImages(urls = []) {
  return dedupeImagesPreferLargest(
    urls.map((url) => upgradeImageUrl(url)).filter((url) => url && !isJunkImage(url)),
  );
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return json?.data ?? json;
}

function detailMatchesBarcode(detail, barcode) {
  if (!detail) return false;
  if (bcMatch(detail.barcode, barcode)) return true;
  return (detail.shades || []).some((s) => bcMatch(s.barcode, barcode));
}

function imagesFromDetail(detail, barcode) {
  const shade = (detail.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const shadeImages = shade ? [shade.image, ...(shade.additional_images || [])] : [];
  return normalizeImages([...(detail.images || []), ...shadeImages, detail.thumb]);
}

async function fetchDetailWithRetry(productId, tries = 3) {
  for (let n = 0; n < tries; n++) {
    const detail = await fetchProductDetail(productId).catch(() => null);
    if (detail) return detail;
    await new Promise((r) => setTimeout(r, 400 * (n + 1)));
  }
  return null;
}

/** Fast Niceone lookup: index → barcode search → verify barcode match */
async function resolveNiceoneImages(barcode) {
  const idx = findBarcodeIndexEntry(barcode);
  if (idx?.store === 'niceone' && idx.productId) {
    const detail = await fetchDetailWithRetry(idx.productId);
    if (detailMatchesBarcode(detail, barcode)) {
      const images = imagesFromDetail(detail, barcode);
      if (images.length) return { productId: idx.productId, images };
    }
  }

  if (INDEX_ONLY) return null;

  const hits = await niceoneSearchBarcode(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit?.id) return null;

  const detail = await fetchDetailWithRetry(hit.id);
  if (!detailMatchesBarcode(detail, barcode)) return null;

  const images = imagesFromDetail(detail, barcode);
  if (!images.length) return null;

  upsertBarcodeIndex(barcode, { store: 'niceone', productId: hit.id });
  return { productId: hit.id, images };
}

async function uploadFromUrl(token, url) {
  const data = await api('/media/upload-from-url', {
    method: 'POST',
    token,
    body: { url, purpose: 'PRODUCT' },
  });
  return data?.id || data?.media?.id || null;
}

async function uploadAll(token, urls) {
  const ids = [];
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const idx = i;
      i += 1;
      const url = urls[idx];
      try {
        const id = await uploadFromUrl(token, url);
        if (id && id !== 'placeholder') ids.push(id);
      } catch { /* skip bad URL */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, urls.length || 1) }, () => worker()));
  return ids;
}

function hasRealImages(product = {}) {
  return (product.images || []).some((img) => {
    const id = img?.id || img?.media?.id;
    return id && id !== 'placeholder';
  });
}

async function fetchProductsByBarcodes(token, barcodes) {
  const set = new Set(barcodes);
  const out = [];
  for (let page = 1; page <= 40; page++) {
    const items = await api(`/products?limit=100&page=${page}`, { token });
    if (!items?.length) break;
    for (const p of items) {
      if (p.barcode && set.has(p.barcode)) {
        out.push({ id: p.id, barcode: p.barcode, hasReal: hasRealImages(p) });
      }
    }
    if (out.length >= barcodes.length) break;
  }
  return out;
}

async function processProduct(token, product) {
  const { barcode, id } = product;
  const resolved = await resolveNiceoneImages(barcode);
  if (!resolved?.images?.length) {
    return { barcode, status: 'skip', reason: 'not on Niceone' };
  }

  const imageIds = await uploadAll(token, resolved.images);
  if (!imageIds.length) {
    return { barcode, status: 'fail', reason: 'upload failed' };
  }

  await api(`/products/${id}`, { method: 'PATCH', token, body: { imageIds } });
  return { barcode, status: 'ok', count: imageIds.length, niceoneId: resolved.productId };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let idx = 0;
  async function loop() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => loop()));
  return results;
}

async function main() {
  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;

  const products = await fetchProductsByBarcodes(token, BATCH3_BARCODES);
  const targets = products
    .filter((p) => !p.hasReal)
    .sort((a, b) => {
      const score = (idx) => (idx?.store === 'niceone' ? 2 : idx ? 1 : 0);
      return score(findBarcodeIndexEntry(b.barcode)) - score(findBarcodeIndexEntry(a.barcode));
    });

  console.log(`Batch-3: ${BATCH3_BARCODES.length} | in API: ${products.length} | need images: ${targets.length}`);
  console.log(`Concurrency: lookup=${CONCURRENCY} upload=${UPLOAD_CONCURRENCY} | source: Niceone only | index-only: ${INDEX_ONLY}\n`);

  const t0 = Date.now();
  const results = await runPool(targets, (p) => processProduct(token, p), CONCURRENCY);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const r of results) {
    if (!r) continue;
    if (r.status === 'ok') {
      ok += 1;
      console.log(`OK ${r.barcode} -> ${r.count} img [niceone:${r.niceoneId}]`);
    } else if (r.status === 'skip') {
      skip += 1;
      console.log(`SKIP ${r.barcode} — ${r.reason}`);
    } else {
      fail += 1;
      console.log(`FAIL ${r.barcode} — ${r.reason}`);
    }
  }

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  const already = products.length - targets.length;
  console.log(`\nDone in ${sec}s: OK=${ok} SKIP=${skip} FAIL=${fail} already=${already}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

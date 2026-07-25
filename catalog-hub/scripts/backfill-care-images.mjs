#!/usr/bin/env node
/**
 * رفع صور منتجات العناية الأخيرة بدون صور:
 * 1) Nice One بالباركود
 * 2) ساره (Salla) كبديل — بدون الصور الافتراضية للمتجر
 *
 * Usage:
 *   node scripts/backfill-care-images.mjs
 *   LIMIT=20 node scripts/backfill-care-images.mjs
 *   ALL_CARE=1 node scripts/backfill-care-images.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { fetchGalleryFromPage, mergeGalleryUrls } from '../lib/stores/salla/gallery.js';
import { filterSallaImages } from '../lib/stores/salla/image-filters.js';
import { searchBarcode as niceoneSearchBarcode, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { findBarcodeIndexEntry, upsertBarcodeIndex } from '../lib/core/barcode-index.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { api, getToken } from '../lib/core/api-auth.js';
import { CARE_CATEGORY_ID } from '../lib/core/care-category-map.js';

const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const UPLOAD_CONCURRENCY = Number(process.env.UPLOAD_CONCURRENCY || 4);
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 8);
const LIMIT = Number(process.env.LIMIT || 0);
const ALL_CARE = process.env.ALL_CARE === '1';
const SALLA_STORE = process.env.SALLA_STORE || 'sarahmakeup37.com';
const STATE_PATH = process.env.STATE_PATH
  || new URL('../data/care-images-backfill-state.json', import.meta.url).pathname;
const REPAIR_STATE_PATH = new URL('../data/care-batch-large-repair-state.json', import.meta.url).pathname;

const sallaClient = createSallaClient(SALLA_STORE, { cachePrefix: 'sarah-care' });
const salla = createSallaProductsApi(sallaClient);

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  if (x.length < 8 || y.length < 8) return false;
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function isJunkImage(url = '') {
  const u = String(url).toLowerCase();
  return !u.startsWith('http') || /\s/.test(u) || /\/swatch\//i.test(u)
    || /placeholder|no[_-]?image|data:image/i.test(u);
}

function normalizeNiceoneImages(urls = []) {
  return dedupeImagesPreferLargest(
    urls.map((url) => upgradeImageUrl(url)).filter((url) => url && !isJunkImage(url)),
  );
}

function realImageCount(product = {}) {
  return (product.images || []).filter((img) => {
    if (!img?.id || img.id === 'placeholder' || img?.media?.id === 'placeholder') return false;
    if (img?.media?.hash === 'alhayaa-product-placeholder-v1') return false;
    if (img?.media?.storagePath === 'placeholder') return false;
    return true;
  }).length;
}

function detailMatchesBarcode(detail, barcode) {
  if (!detail) return false;
  if (bcMatch(detail.barcode, barcode)) return true;
  return (detail.shades || []).some((s) => bcMatch(s.barcode, barcode));
}

function imagesFromNiceoneDetail(detail, barcode) {
  const shade = (detail.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const shadeImages = shade ? [shade.image, ...(shade.additional_images || [])] : [];
  return normalizeNiceoneImages([...(detail.images || []), ...shadeImages, detail.thumb]);
}

async function fetchNiceoneDetailWithRetry(productId, tries = 3) {
  for (let n = 0; n < tries; n++) {
    const detail = await fetchProductDetail(productId).catch(() => null);
    if (detail) return detail;
    await new Promise((r) => setTimeout(r, 400 * (n + 1)));
  }
  return null;
}

async function resolveNiceoneImages(barcode) {
  const idx = findBarcodeIndexEntry(barcode);
  if (idx?.store === 'niceone' && idx.productId) {
    const detail = await fetchNiceoneDetailWithRetry(idx.productId);
    if (detailMatchesBarcode(detail, barcode)) {
      const images = imagesFromNiceoneDetail(detail, barcode);
      if (images.length) return { source: 'niceone', productId: idx.productId, images };
    }
  }

  const hits = await niceoneSearchBarcode(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit?.id) return null;

  const detail = await fetchNiceoneDetailWithRetry(hit.id);
  if (!detailMatchesBarcode(detail, barcode)) return null;

  const images = imagesFromNiceoneDetail(detail, barcode);
  if (!images.length) return null;

  upsertBarcodeIndex(barcode, { store: 'niceone', productId: hit.id });
  return { source: 'niceone', productId: hit.id, images };
}

async function findSarahProduct(barcode) {
  const { data: hits = [] } = await sallaClient.sallaFetch('/products/search', {
    params: { query: barcode, per_page: 5 },
    ttl: 0,
  }).catch(() => ({ data: [] }));

  if (!hits.length) return null;

  for (const hit of hits.slice(0, 3)) {
    const detail = await salla.fetchProductDetail(hit.id);
    if (!detail || !bcMatch(detail.barcode || detail.sku, barcode)) continue;

    const pageImages = await fetchGalleryFromPage(hit.url || detail.productUrl);
    const merged = mergeGalleryUrls(detail.images || [], pageImages);
    const images = filterSallaImages(merged);
    if (!images.length) continue;

    return { source: 'sarah', productId: hit.id, images, name: detail.nameAr?.slice(0, 50) };
  }

  return null;
}

async function uploadImages(urls) {
  const token = await getToken();
  const ids = [];
  let i = 0;

  async function worker() {
    while (i < urls.length) {
      const idx = i;
      i += 1;
      const url = urls[idx];
      try {
        const data = await api('/media/upload-from-url', {
          method: 'POST',
          body: { url, purpose: 'PRODUCT' },
        });
        const id = data?.id || data?.media?.id;
        if (id && id !== 'placeholder') ids.push(id);
      } catch { /* skip bad URL */ }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, urls.length || 1) }, () => worker()),
  );
  return ids;
}

function loadState() {
  if (!existsSync(STATE_PATH)) return { ok: {}, skip: {}, fail: {} };
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { ok: {}, skip: {}, fail: {} };
  }
}

function saveState(state) {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function loadRecentRepairBarcodes() {
  const raw = JSON.parse(readFileSync(REPAIR_STATE_PATH, 'utf8'));
  return Object.entries(raw.done || {})
    .sort((a, b) => b[1].at - a[1].at)
    .map(([barcode, meta]) => ({ barcode, at: meta.at, id: meta.id }));
}

async function fetchAllProducts() {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    out.push(...items);
  }
  return out;
}

function buildTargets(allProducts) {
  const byBarcode = new Map(allProducts.filter((p) => p.barcode).map((p) => [p.barcode, p]));
  const state = loadState();
  const done = new Set([...Object.keys(state.ok || {}), ...Object.keys(state.skip || {})]);

  if (ALL_CARE) {
    return allProducts
      .filter((p) => p.categoryId === CARE_CATEGORY_ID && p.barcode && realImageCount(p) === 0)
      .filter((p) => !done.has(p.barcode))
      .map((p) => ({ id: p.id, barcode: p.barcode, nameEn: p.nameEn || '', sortAt: 0 }));
  }

  const recent = loadRecentRepairBarcodes();
  const targets = [];
  for (const row of recent) {
    if (done.has(row.barcode)) continue;
    const p = byBarcode.get(row.barcode);
    if (!p || realImageCount(p) > 0) continue;
    targets.push({
      id: p.id,
      barcode: row.barcode,
      nameEn: p.nameEn || '',
      sortAt: row.at,
    });
  }
  return targets.sort((a, b) => b.sortAt - a.sortAt);
}

async function processOne(product, state) {
  const { id, barcode } = product;
  if (state.ok[barcode]) return { barcode, status: 'skip', reason: 'already done' };

  let resolved = await resolveNiceoneImages(barcode);
  if (!resolved?.images?.length) {
    resolved = await findSarahProduct(barcode);
  }
  if (!resolved?.images?.length) {
    state.skip[barcode] = { at: Date.now(), reason: 'not on niceone or sarah' };
    saveState(state);
    return { barcode, status: 'skip', reason: 'not on niceone or sarah' };
  }

  const imageIds = await uploadImages(resolved.images.slice(0, MAX_IMAGES));
  if (!imageIds.length) {
    state.fail[barcode] = { at: Date.now(), reason: 'upload failed', source: resolved.source };
    saveState(state);
    return { barcode, status: 'fail', reason: 'upload failed' };
  }

  await api(`/products/${id}`, { method: 'PATCH', body: { imageIds } });
  state.ok[barcode] = {
    at: Date.now(),
    source: resolved.source,
    count: imageIds.length,
    storeId: resolved.productId,
  };
  saveState(state);
  return {
    barcode,
    status: 'ok',
    source: resolved.source,
    count: imageIds.length,
    storeId: resolved.productId,
    name: resolved.name || product.nameEn?.slice(0, 50),
  };
}

async function runPool(items, worker, concurrency, onResult) {
  let idx = 0;
  async function loop() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      const result = await worker(items[i]);
      if (onResult) onResult(result, i + 1, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => loop()));
}

async function main() {
  await getToken();
  const state = loadState();
  const allProducts = await fetchAllProducts();
  let targets = buildTargets(allProducts);

  if (LIMIT > 0) targets = targets.slice(0, LIMIT);

  console.log(`Care image backfill: ${targets.length} targets | niceone→sarah | sarah defaults filtered`);
  console.log(`Scope: ${ALL_CARE ? 'all care without images' : 'recent batch-large repair'} | concurrency=${CONCURRENCY}\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  const t0 = Date.now();

  await runPool(
    targets,
    (p) => processOne(p, state),
    CONCURRENCY,
    (r, n, total) => {
      if (!r) return;
      if (r.status === 'ok') {
        ok += 1;
        console.log(`[${n}/${total}] OK ${r.barcode} [${r.source}:${r.storeId}] -> ${r.count} img | ${r.name || ''}`);
      } else if (r.status === 'skip') {
        skip += 1;
        console.log(`[${n}/${total}] SKIP ${r.barcode} — ${r.reason}`);
      } else {
        fail += 1;
        console.log(`[${n}/${total}] FAIL ${r.barcode} — ${r.reason}`);
      }
    },
  );

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone in ${sec}s: OK=${ok} SKIP=${skip} FAIL=${fail} (${targets.length} total)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

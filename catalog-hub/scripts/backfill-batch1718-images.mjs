#!/usr/bin/env node
/** Backfill images for batch17/18 products still missing real images. */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { fetchGalleryFromPage, mergeGalleryUrls } from '../lib/stores/salla/gallery.js';
import { filterSallaImages } from '../lib/stores/salla/image-filters.js';
import { searchBarcode as niceSearch, fetchProductDetail as niceDetail } from '../lib/stores/niceone/products.js';
import { fetchProductJs } from '../lib/stores/orisdi/client.js';
import { mapDetailProduct } from '../lib/stores/orisdi/map.js';
import { searchBarcode as miswagSearch, fetchProductDetail as miswagDetail } from '../lib/stores/miswag/products.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 8);
const DELAY_MS = Number(process.env.DELAY_MS || 400);

const salla = createSallaProductsApi(createSallaClient('sarahmakeup37.com', { cachePrefix: `img-${Date.now()}` }));

const orisdiEntries = Object.values(
  JSON.parse(readFileSync(path.join(__dirname, '../data/orisdi-barcode-index.json'), 'utf8')).entries || {},
);
const orisdiByBc = new Map(orisdiEntries.filter((e) => e.barcode).map((e) => [e.barcode, e]));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  if (x.length < 8 || y.length < 8) return false;
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function hasReal(product = {}) {
  return (product.images || []).some((img) => {
    if (!img?.id || img.id === 'placeholder') return false;
    if (img?.media?.hash === 'alhayaa-product-placeholder-v1') return false;
    return true;
  });
}

function normalize(urls = []) {
  return dedupeImagesPreferLargest(
    urls.map((u) => upgradeImageUrl(String(u || ''))).filter((u) => u.startsWith('http') && !/waheteter\.com/i.test(u)),
  ).slice(0, MAX_IMAGES);
}

async function urlsFromSarah(barcode) {
  const hits = await salla.searchBarcode(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit) return [];
  const slug = String(hit.url || hit.productUrl || '').match(/\/ar\/([^/?#]+)/)?.[1] || hit.id;
  const detail = await salla.fetchProductDetail(slug).catch(() => null);
  if (!detail) return [];
  const page = await fetchGalleryFromPage(hit.url || detail.productUrl);
  return normalize(filterSallaImages(mergeGalleryUrls(detail.images || [], page)));
}

async function urlsFromNiceone(barcode) {
  const hits = await niceSearch(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit?.id) return [];
  const detail = await niceDetail(hit.id).catch(() => null);
  if (!detail || !bcMatch(detail.barcode, barcode)) return [];
  const shade = (detail.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const shadeImages = shade ? [shade.image, ...(shade.additional_images || [])] : [];
  return normalize([...(detail.images || []), ...shadeImages, detail.thumb]);
}

async function urlsFromOrisdi(barcode) {
  const hit = orisdiByBc.get(barcode);
  if (!hit?.handle) return [];
  const [ar, en] = await Promise.all([
    fetchProductJs(hit.handle, { lang: 'ar' }).catch(() => null),
    fetchProductJs(hit.handle, { lang: 'en' }).catch(() => null),
  ]);
  if (!ar?.id) return [];
  const detail = mapDetailProduct(ar, en);
  return normalize(detail.images || [detail.thumb]);
}

async function urlsFromMiswag(barcode) {
  const hits = await miswagSearch(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit?.id) return [];
  const detail = await miswagDetail(hit.id).catch(() => null);
  if (!detail || !bcMatch(detail.barcode, barcode)) return [];
  return normalize([...(detail.images || []), detail.thumb]);
}

async function upload(urls) {
  const ids = [];
  for (const url of urls) {
    try {
      const data = await api('/media/upload-from-url', { method: 'POST', body: { url, purpose: 'PRODUCT' } });
      const id = data?.id || data?.media?.id;
      if (id && id !== 'placeholder') ids.push(id);
    } catch { /* skip */ }
  }
  return ids;
}

function loadBatchBarcodes() {
  const out = new Map();
  for (const n of [17, 18]) {
    const state = JSON.parse(readFileSync(path.join(__dirname, `../data/sarah-pos-import-state-batch${n}.json`), 'utf8'));
    for (const [bc, meta] of Object.entries(state.imported || {})) out.set(bc, meta.id);
  }
  return out;
}

async function main() {
  await getToken();
  const targets = loadBatchBarcodes();
  let ok = 0;
  let skip = 0;

  for (const [barcode, id] of targets) {
    await sleep(DELAY_MS);
    const live = await api(`/products/${id}`);
    if (hasReal(live)) {
      skip += 1;
      continue;
    }

    const sources = [
      ['sarah', urlsFromSarah],
      ['niceone', urlsFromNiceone],
      ['orisdi', urlsFromOrisdi],
      ['miswag', urlsFromMiswag],
    ];

    let urls = [];
    let src = '';
    for (const [name, fn] of sources) {
      urls = await fn(barcode);
      if (urls.length) {
        src = name;
        break;
      }
    }

    if (!urls.length) {
      skip += 1;
      console.log(`SKIP ${barcode} — no image source`);
      continue;
    }

    const imageIds = await upload(urls);
    if (!imageIds.length) {
      skip += 1;
      console.log(`SKIP ${barcode} — upload failed`);
      continue;
    }

    await api(`/products/${id}`, { method: 'PATCH', body: { imageIds } });
    ok += 1;
    console.log(`OK ${barcode} [${src}] ${imageIds.length} imgs | ${live.nameEn?.slice(0, 45)}`);
  }

  console.log(`\nDone: OK=${ok} SKIP=${skip}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

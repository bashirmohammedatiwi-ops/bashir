#!/usr/bin/env node
/** Upload ordered Sarah images for imported products missing real images. */
import { readFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { fetchGalleryFromPage } from '../lib/stores/salla/gallery.js';
import { filterSallaImages } from '../lib/stores/salla/image-filters.js';
import { api, getToken } from '../lib/core/api-auth.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = process.env.PRODUCTS_FILE || path.join(__dirname, '../data/sarah-pos-import-products.json');
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, '../data/sarah-pos-import-state.json');
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 8);

const salla = createSallaProductsApi(createSallaClient(process.env.SALLA_STORE || 'sarahmakeup37.com'));

function isPlaceholder(img = {}) {
  return img.id === 'placeholder' || img?.media?.hash === 'alhayaa-product-placeholder-v1';
}

function realImageCount(p) {
  return (p.images || []).filter((img) => img?.id && !isPlaceholder(img)).length;
}

async function fetchSarahImagesOrdered(product) {
  const detail = await salla.fetchProductDetail(product.sarahId).catch(() => null);
  const apiImages = detail?.images || [];
  const pageImages = await fetchGalleryFromPage(product.url || detail?.productUrl);
  const seen = new Set();
  const ordered = [];
  for (const raw of [...apiImages, ...pageImages]) {
    const url = String(raw || '').trim();
    if (!url) continue;
    const key = url.match(/mvKj\/([A-Za-z0-9]+)/)?.[1] || url;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(url);
  }
  return filterSallaImages(ordered).slice(0, MAX_IMAGES);
}

async function uploadImages(urls) {
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

async function main() {
  await getToken();
  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  const imported = Object.entries(state.imported || {});

  let ok = 0;
  let skip = 0;
  for (const [barcode, meta] of imported) {
    const product = products.find((p) => p.barcode === barcode);
    if (!product?.sarahId) { skip++; continue; }

    const live = await api(`/products/${meta.id}`);
    if (realImageCount(live) > 0) {
      skip++;
      console.log(`SKIP ${barcode} — already has images`);
      continue;
    }

    const urls = await fetchSarahImagesOrdered(product);
    if (!urls.length) {
      skip++;
      console.log(`SKIP ${barcode} — no Sarah images`);
      continue;
    }

    const imageIds = await uploadImages(urls);
    if (!imageIds.length) {
      console.log(`FAIL ${barcode} — upload failed`);
      continue;
    }

    await api(`/products/${meta.id}`, { method: 'PATCH', body: { imageIds } });
    ok++;
    console.log(`OK ${barcode} -> ${imageIds.length} images`);
  }

  console.log(`\nDone: OK=${ok} SKIP=${skip}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });

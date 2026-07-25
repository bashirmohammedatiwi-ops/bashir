#!/usr/bin/env node
/**
 * Import Sarah store products with POS stock — manual content + ordered Sarah images.
 * Usage: node scripts/import-sarah-pos-sequential.mjs
 * Env: MIN_STOCK=2  LIMIT=50  DRY_RUN=1  DELAY_MS=900
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { fetchGalleryFromPage } from '../lib/stores/salla/gallery.js';
import { filterSallaImages } from '../lib/stores/salla/image-filters.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIN_STOCK = Number(process.env.MIN_STOCK || 2);
const LIMIT = Number(process.env.LIMIT || 50);
const DRY_RUN = process.env.DRY_RUN === '1';
const DELAY_MS = Number(process.env.DELAY_MS || 900);
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 8);
const PRODUCTS_FILE = process.env.PRODUCTS_FILE || path.join(__dirname, '../data/sarah-pos-import-products.json');
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, '../data/sarah-pos-import-state.json');

const sallaClient = createSallaClient(process.env.SALLA_STORE || 'sarahmakeup37.com', { cachePrefix: 'sarah-import' });
const salla = createSallaProductsApi(sallaClient);

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 85);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { imported: {}, skipped: {} };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { imported: {}, skipped: {} };
  }
}

function saveState(state) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function lookupPosBatch(barcodes) {
  if (!barcodes.length) return {};
  const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes } });
  return res.items || {};
}

async function verifyProduct(barcode) {
  const res = await api('/sync/inventory/lookup-barcodes', {
    method: 'POST',
    body: { barcodes: [barcode] },
  });
  const hit = res.items?.[barcode];
  if (hit?.inApp?.id) {
    return { id: hit.inApp.id, barcode, nameEn: hit.inApp.name };
  }
  return null;
}

async function loadBrands() {
  const brands = await api('/brands?limit=500');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const bySlug = new Map();
  for (const b of list) {
    const slug = (b.slug || '').toLowerCase();
    if (slug) bySlug.set(slug, b.id);
  }
  return { list, bySlug };
}

function brandSlug(name = '') {
  return String(name).toLowerCase().trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const BRAND_ALIASES = {
  'elie-saab': ['elie-saab'],
  'mugler': ['mugler', 'thierry-mugler'],
  'lalique': ['lalique'],
  'roberto-cavalli': ['roberto-cavalli'],
  'maybelline': ['maybelline'],
  'gucci': ['gucci'],
  'versace': ['versace'],
  'narciso-rodriguez': ['narciso-rodriguez'],
  'prada': ['prada'],
  'dolce-gabbana': ['dolce-gabbana', 'd-g'],
  'valentino': ['valentino'],
  'hermes': ['hermes'],
  'dior': ['dior'],
  'givenchy': ['givenchy'],
  'bvlgari': ['bvlgari', 'bulgari'],
  'chopard': ['chopard'],
  'cartier': ['cartier'],
  'paco-rabanne': ['paco-rabanne'],
  'jean-paul-gaultier': ['jean-paul-gaultier', 'jpg'],
  'huda-beauty': ['huda-beauty'],
  'xerjoff': ['xerjoff'],
  'cacharel': ['cacharel'],
  'lanvin': ['lanvin'],
  'bentley': ['bentley'],
  'calvin-klein': ['calvin-klein'],
  'clinique': ['clinique'],
  'the-woods-collection': ['the-woods-collection'],
  'carolina-herrera': ['carolina-herrera'],
  'geparlys': ['geparlys', 'gabriela'],
  'kojie-san': ['kojie-san'],
};

async function resolveBrandId(brandCache, brandEn = '', brandAr = '') {
  const slug = brandSlug(brandEn);
  const aliases = BRAND_ALIASES[slug] || [slug];
  for (const s of aliases) {
    if (brandCache.bySlug.has(s)) return brandCache.bySlug.get(s);
  }
  for (const raw of [brandEn, brandAr].filter(Boolean)) {
    const exact = brandCache.list.find((b) => {
      const names = [b.nameEn, b.nameAr, b.name].filter(Boolean).map((x) => x.trim().toLowerCase());
      return names.includes(raw.toLowerCase().trim());
    });
    if (exact) return exact.id;
  }
  const name = brandEn || brandAr;
  if (!name) return null;
  if (DRY_RUN) return `dry-${slug}`;
  try {
    const resolved = await api('/brands/resolve', {
      method: 'POST',
      body: { brandEn, brandAr, name: brandEn || brandAr, createIfMissing: true },
    });
    if (resolved?.id) {
      brandCache.bySlug.set(aliases[0] || slug, resolved.id);
      return resolved.id;
    }
  } catch { /* fallback create */ }
  try {
    const created = await api('/brands', { method: 'POST', body: { name: brandEn || name, slug: aliases[0] || slug } });
    brandCache.bySlug.set(aliases[0] || slug, created.id);
    brandCache.list.push({ id: created.id, slug, nameEn: brandEn, nameAr: brandAr });
    return created.id;
  } catch (err) {
    const msg = String(err?.message || err);
    if (/unique constraint|slug/i.test(msg)) {
      const refreshed = await api(`/brands?search=${encodeURIComponent(brandEn || brandAr)}&limit=20`);
      const items = Array.isArray(refreshed) ? refreshed : refreshed?.items || [];
      const hit = items.find((b) => {
        const s = (b.slug || '').toLowerCase();
        return s === (aliases[0] || slug) || aliases.includes(s);
      });
      if (hit?.id) {
        brandCache.bySlug.set(aliases[0] || slug, hit.id);
        return hit.id;
      }
    }
    throw err;
  }
}

/** Sarah images in store order — API main image first, then gallery extras. */
async function fetchSarahImagesOrdered(product) {
  const detail = await salla.fetchProductDetail(product.sarahId).catch(() => null);
  if (!detail) return [];

  const apiImages = (detail.images || []).filter(Boolean);
  const pageImages = await fetchGalleryFromPage(product.url || detail.productUrl);
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

async function importOne(brandCache, product, pos, state) {
  const { barcode } = product;
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported' };

  const brandId = await resolveBrandId(brandCache, product.brandEn, product.brandAr);
  if (!brandId) return { status: 'skip', reason: 'no brand' };

  const imageUrls = await fetchSarahImagesOrdered(product);
  let imageIds = [];
  if (imageUrls.length && !DRY_RUN) {
    imageIds = await uploadImages(imageUrls);
  }

  const payload = {
    sku: barcode,
    barcode,
    name: product.nameAr,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    slug: slugify(`${product.nameEn}-${barcode}`),
    brandId,
    categoryId: product.categoryId,
    subcategoryIds: product.subcategoryIds || [],
    tertiaryCategoryIds: product.tertiaryCategoryIds || [],
    description: product.descriptionAr,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    ingredients: '',
    howToUse: '',
    price: 0,
    originalPrice: 0,
    discountPercent: 0,
    stock: 0,
    isActive: true,
    isNew: !!product.isNew,
    imageIds,
  };

  if (DRY_RUN) {
    return { status: 'ok', dry: true, images: imageUrls.length, uploaded: imageIds.length };
  }

  const created = await api('/products', { method: 'POST', body: payload });
  state.imported[barcode] = { id: created.id, at: Date.now(), stock: pos?.pos?.stock, images: imageIds.length };
  saveState(state);
  return { status: 'ok', id: created.id, images: imageIds.length, stock: pos?.pos?.stock };
}

async function main() {
  await getToken();
  const brandCache = await loadBrands();
  const state = loadState();
  let products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  if (LIMIT > 0) products = products.slice(0, LIMIT);

  const posMap = await lookupPosBatch(products.map((p) => p.barcode));
  console.log(`Sarah POS import | products=${products.length} | minStock=${MIN_STOCK} | dry=${DRY_RUN}\n`);

  const stats = { ok: 0, fail: 0, skip: 0 };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const { barcode } = product;
    const hit = posMap[barcode];
    const stock = hit?.pos?.stock ?? 0;

    if (i > 0) await sleep(DELAY_MS);

    if (hit?.inApp?.id || state.imported[barcode]) {
      stats.skip += 1;
      console.log(`SKIP ${barcode} — already in app`);
      continue;
    }

    const existing = await verifyProduct(barcode);
    if (existing?.id) {
      stats.skip += 1;
      state.imported[barcode] = { id: existing.id, at: Date.now(), via: 'pre-existing' };
      saveState(state);
      console.log(`SKIP ${barcode} — catalog id=${existing.id}`);
      continue;
    }

    if (stock < MIN_STOCK) {
      stats.skip += 1;
      state.skipped[barcode] = { reason: `stock=${stock}`, at: Date.now() };
      saveState(state);
      console.log(`SKIP ${barcode} — stock=${stock}`);
      continue;
    }

    if (!product.sarahId && process.env.ALLOW_NO_IMAGES !== '1') {
      const imageUrls = await fetchSarahImagesOrdered(product);
      if (!imageUrls.length) {
        stats.skip += 1;
        state.skipped[barcode] = { reason: 'no-sarah-id-or-images', at: Date.now() };
        saveState(state);
        console.log(`SKIP ${barcode} — no Sarah ID/images (run enrich first)`);
        continue;
      }
    }

    try {
      const result = await importOne(brandCache, product, hit, state);
      if (result.status !== 'ok') {
        stats.skip += 1;
        console.log(`SKIP ${barcode} — ${result.reason}`);
        continue;
      }
      stats.ok += 1;
      console.log(`OK ${barcode} id=${result.id || 'dry'} imgs=${result.images ?? result.uploaded ?? 0} stock=${result.stock ?? stock} | ${product.nameEn.slice(0, 50)}`);
    } catch (err) {
      stats.fail += 1;
      console.log(`FAIL ${barcode} — ${err.message}`);
    }
  }

  console.log(`\nDone: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

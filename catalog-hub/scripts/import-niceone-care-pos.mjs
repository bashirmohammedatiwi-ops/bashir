#!/usr/bin/env node
/**
 * Import Niceone care products that exist in POS with stock > 0.
 * - Names/descriptions: generated (not from Niceone)
 * - Images: from Niceone (upload-from-url)
 * - Incremental: imports each product immediately when found
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { extractBarcode } from '../lib/stores/niceone/client.js';
import { barcodeFromImageUrl } from '../lib/stores/niceone/barcodes.js';
import {
  CARE_CATEGORY_ID,
  CARE_SUB_SLUGS,
  collectCareLeaves,
  subcategoryIdsForLeaf,
  resolveCareCategories,
} from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { buildCareContent } from '../lib/core/care-content.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { upsertBarcodeIndex } from '../lib/core/barcode-index.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 3);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 4);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const LIMIT = Number(process.env.LIMIT || 0);
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const SKIP_SHADES = process.env.SKIP_SHADES !== '0';
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const STATE_FILE = path.join(__dirname, '../data/care-pos-import-state.json');

const catsJson = JSON.parse(readFileSync(path.join(__dirname, '../data/niceone-categories.json'), 'utf8'));
const CARE_LEAVES = collectCareLeaves(catsJson);

const LEAF_LABELS = {};
(function walkAll(nodes = []) {
  for (const n of nodes) {
    if (n.niceoneId) LEAF_LABELS[n.niceoneId] = { en: n.nameEn || n.nameAr, ar: n.nameAr || n.nameEn };
    if (n.children?.length) walkAll(n.children);
  }
})(catsJson.tree || []);

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 85);
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { imported: {}, skipped: {} };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { imported: {}, skipped: {} };
  }
}

let stateWriteChain = Promise.resolve();

function saveState(state) {
  stateWriteChain = stateWriteChain.then(() => {
    mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  });
  return stateWriteChain;
}

async function lookupPosBatch(barcodes) {
  if (!barcodes.length) return {};
  const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes } });
  return res.items || {};
}

function posHit(items, barcode) {
  const hit = items[barcode];
  if (!hit?.pos || hit.pos.stock < MIN_STOCK) return null;
  if (hit.inApp?.id) return { skip: 'already in app', inApp: hit.inApp };
  return hit;
}

async function loadExistingBarcodes() {
  const set = new Set();
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    for (const p of items) {
      if (p.barcode) set.add(p.barcode);
    }
  }
  return set;
}

async function loadBrands() {
  const brands = await api('/brands?limit=300');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const bySlug = new Map();
  const byName = new Map();
  for (const b of list) {
    const slug = (b.slug || '').toLowerCase();
    const names = [b.nameEn, b.nameAr, b.name, b.slug].filter(Boolean).map((s) => s.toLowerCase());
    if (slug) bySlug.set(slug, b.id);
    for (const n of names) byName.set(n.replace(/\s+/g, '-'), b.id);
  }
  return { list, bySlug, byName };
}

function brandSlug(name = '') {
  return String(name).toLowerCase().trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function resolveBrandId(brandCache, brandEn = '', brandAr = '') {
  const candidates = [brandEn, brandAr].filter(Boolean);
  for (const raw of candidates) {
    const slug = brandSlug(raw);
    if (brandCache.bySlug.has(slug)) return brandCache.bySlug.get(slug);
    if (brandCache.byName.has(slug)) return brandCache.byName.get(slug);
    const loose = brandCache.list.find((b) => {
      const n = `${b.nameEn || ''} ${b.nameAr || ''} ${b.name || ''} ${b.slug || ''}`.toLowerCase();
      return n.includes(raw.toLowerCase()) || raw.toLowerCase().includes((b.slug || '').toLowerCase());
    });
    if (loose) return loose.id;
  }

  const name = brandEn || brandAr;
  if (!name) return null;
  const slug = brandSlug(name);
  const created = await api('/brands', {
    method: 'POST',
    body: { name, slug },
  });
  brandCache.bySlug.set(slug, created.id);
  brandCache.list.push({ id: created.id, slug, nameEn: brandEn, nameAr: brandAr });
  return created.id;
}

async function uploadImages(urls) {
  const ids = [];
  for (const url of urls) {
    if (ids.length) break;
    try {
      const data = await api('/media/upload-from-url', {
        method: 'POST',
        body: { url, purpose: 'PRODUCT' },
      });
      const id = data?.id || data?.media?.id;
      if (id && id !== 'placeholder') ids.push(id);
    } catch { /* try next image */ }
  }
  return ids;
}

function quickBarcode(item) {
  return extractBarcode(item?.barcode || '') || barcodeFromImageUrl(item?.thumb || '');
}

async function enrichItemBarcode(item) {
  const existing = quickBarcode(item);
  if (existing) return { ...item, barcode: existing };

  const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
  if (!detail) return item;

  let barcode = extractBarcode(detail.barcode || '');
  if (!barcode && detail.shades?.length === 1) {
    barcode = extractBarcode(detail.shades[0]?.barcode || '');
  }

  return {
    ...item,
    barcode: barcode || item.barcode,
    brandEn: item.brandEn || detail.brandEn,
    brandAr: item.brandAr || detail.brandAr,
    thumb: item.thumb || detail.images?.[0] || detail.thumb,
  };
}

async function enrichListingItems(items) {
  const ready = [];
  const pending = [];
  for (const item of items) {
    if (quickBarcode(item)) ready.push({ ...item, barcode: quickBarcode(item) });
    else pending.push(item);
  }
  if (!pending.length) return ready;

  const enriched = await runPool(pending, enrichItemBarcode, DETAIL_CONCURRENCY);
  return [...ready, ...enriched];
}

function isJunkImage(url = '') {
  const u = String(url).toLowerCase();
  return !u.startsWith('http') || /\s/.test(u) || /\/swatch\//i.test(u) || /placeholder|no[_-]?image|data:image/i.test(u);
}

async function resolveImages(item) {
  const raw = [item.thumb];
  const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
  if (detail?.images?.length) raw.push(...detail.images);
  else if (detail?.thumb) raw.push(detail.thumb);

  return dedupeImagesPreferLargest(
    raw.map(upgradeImageUrl).filter((url) => url && !isJunkImage(url)),
  );
}

async function importOne(brandCache, item, leaf, pos, state) {
  const barcode = extractBarcode(item.barcode || '');
  if (!barcode) return { status: 'skip', reason: 'no barcode' };
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported this run' };

  const brandId = await resolveBrandId(brandCache, item.brandEn, item.brandAr);
  if (!brandId) return { status: 'skip', reason: 'no brand' };

  const label = LEAF_LABELS[leaf] || { en: 'Care', ar: 'عناية' };

  if (!getCareOverride(barcode)) {
    const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
    console.log(`SKIP_NO_OVERRIDE ${barcode} | niceone=${item.id} | ${detail?.nameEn || detail?.nameAr || 'unknown'}`);
    return { status: 'skip', reason: 'no content override' };
  }

  const content = buildCareContent({
    barcode,
    brandEn: item.brandEn,
    brandAr: item.brandAr,
    categoryEn: label.en,
    categoryAr: label.ar,
    posName: pos?.pos?.name,
    leaf,
  });

  const imageUrls = await resolveImages(item);
  if (!imageUrls.length) return { status: 'skip', reason: 'no images' };

  const imageIds = await uploadImages(imageUrls);
  if (!imageIds.length) return { status: 'fail', reason: 'upload failed' };

  const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories(leaf, {
    barcode,
    brandEn: content.brandEn || item.brandEn,
    brandAr: item.brandAr,
    posName: pos?.pos?.name,
    typeKey: content.typeKey,
  });
  const payload = {
    sku: barcode,
    barcode,
    name: content.nameAr,
    nameAr: content.nameAr,
    nameEn: content.nameEn,
    slug: slugify(`${content.nameEn}-${barcode}`),
    brandId,
    categoryId: CARE_CATEGORY_ID,
    subcategoryIds,
    tertiaryCategoryIds,
    description: content.descriptionAr,
    descriptionAr: content.descriptionAr,
    descriptionEn: content.descriptionEn,
    ingredients: '',
    howToUse: '',
    price: 0,
    originalPrice: 0,
    discountPercent: 0,
    stock: 0,
    isActive: true,
    isNew: false,
    imageIds,
  };

  const created = await api('/products', { method: 'POST', body: payload });
  upsertBarcodeIndex(barcode, { store: 'niceone', productId: item.id, brand: item.brandEn });
  state.imported[barcode] = { id: created.id, niceoneId: item.id, leaf, at: Date.now() };
  saveState(state);
  return { status: 'ok', id: created.id, images: imageIds.length, stock: pos.pos.stock, subCount: subcategoryIds.length, tertCount: tertiaryCategoryIds.length };
}

async function runPool(items, worker, n) {
  const results = [];
  let i = 0;
  async function loop() {
    while (i < items.length) {
      const idx = i;
      i += 1;
      results[idx] = await worker(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => loop()));
  return results;
}

const stats = { ok: 0, skip: 0, fail: 0, imported: 0 };
let stopImport = false;

async function processLeaf(brandCache, existing, state, leaf) {
  let page = 1;
  let hasMore = true;
  const label = LEAF_LABELS[leaf]?.ar || leaf;
  console.log(`▶ ${leaf} (${label})`);

  while (hasMore && !stopImport) {
    if (LIMIT && stats.imported >= LIMIT) {
      stopImport = true;
      break;
    }

    const tPage = Date.now();
    const listing = await listCategoryProducts(leaf, { page, limit: LIST_LIMIT, arOnly: true });
    const enriched = await enrichListingItems(listing.items || []);
    const items = enriched.filter((it) => {
      const bc = extractBarcode(it.barcode || '');
      if (!bc) return false;
      if (existing.has(bc) || state.imported[bc]) return false;
      if (SKIP_SHADES && it.hasOptions && it.shadeCount > 1) return false;
      return true;
    });

    if (!items.length) {
      hasMore = listing.hasMore;
      page += 1;
      continue;
    }

    const barcodes = items.map((it) => extractBarcode(it.barcode));
    const posMap = {};
    for (let i = 0; i < barcodes.length; i += POS_BATCH) {
      const chunk = barcodes.slice(i, i + POS_BATCH);
      const batch = await lookupPosBatch(chunk);
      Object.assign(posMap, batch);
    }

    const queue = [];
    for (const item of items) {
      const bc = extractBarcode(item.barcode);
      const hit = posHit(posMap, bc);
      if (!hit) {
        stats.skip += 1;
        continue;
      }
      if (hit.skip) {
        existing.add(bc);
        stats.skip += 1;
        continue;
      }
      queue.push({ item, leaf, pos: hit });
    }

    if (queue.length) {
      console.log(`  p${page} ${leaf}: ${queue.length} POS hits (${Date.now() - tPage}ms list)`);
    }

    await runPool(queue, async ({ item, leaf, pos }) => {
      if (stopImport) return { status: 'skip' };
      try {
        const r = await importOne(brandCache, item, leaf, pos, state);
        const bc = extractBarcode(item.barcode);
        if (r.status === 'ok') {
          stats.ok += 1;
          stats.imported += 1;
          existing.add(bc);
            console.log(`OK ${bc} [${leaf}] stock=${r.stock} imgs=${r.images} subs=${r.subCount} tert=${r.tertCount}`);
          if (LIMIT && stats.imported >= LIMIT) stopImport = true;
        } else if (r.status === 'skip') {
          stats.skip += 1;
        } else {
          stats.fail += 1;
          console.log(`FAIL ${bc} — ${r.reason}`);
        }
        return r;
      } catch (err) {
        stats.fail += 1;
        console.log(`FAIL ${item.barcode} — ${err.message}`);
        return { status: 'fail' };
      }
    }, CONCURRENCY);

    hasMore = listing.hasMore;
    page += 1;
  }

  console.log(`✓ done ${leaf}`);
}

async function main() {
  await getToken();
  const existing = await loadExistingBarcodes();
  const brandCache = await loadBrands();
  const state = loadState();

  console.log(`Care leaves: ${CARE_LEAVES.length} | POS min stock: ${MIN_STOCK} | import×${CONCURRENCY} leaf×${LEAF_CONCURRENCY}`);
  console.log(`Existing catalog barcodes: ${existing.size} | resumed imports: ${Object.keys(state.imported).length}\n`);

  const t0 = Date.now();
  let leafIdx = 0;

  async function leafWorker() {
    while (!stopImport) {
      const idx = leafIdx;
      leafIdx += 1;
      if (idx >= CARE_LEAVES.length) break;
      await processLeaf(brandCache, existing, state, CARE_LEAVES[idx]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(LEAF_CONCURRENCY, CARE_LEAVES.length) }, () => leafWorker()),
  );
  await saveState(state);

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone in ${sec}s: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

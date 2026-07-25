#!/usr/bin/env node
/**
 * استيراد 50 منتج مكياج من نايس وان:
 * - بدون تدرجات (ألوان)
 * - مجموعة في POS فقط + مخزون > 2
 * - اسم ووصف بالعربية والإنجليزية من نايس وان
 * - تصنيف يدوي حسب قسم نايس وان
 *
 * Usage: LIMIT=50 node scripts/import-niceone-makeup-bundles-batch19.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { extractBarcode } from '../lib/stores/niceone/client.js';
import { barcodeFromImageUrl } from '../lib/stores/niceone/barcodes.js';
import { collectMakeupLeaves, resolveMakeupCategories } from '../lib/core/makeup-category-map.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { upsertBarcodeIndex } from '../lib/core/barcode-index.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIMIT = Number(process.env.LIMIT || 50);
const MIN_POS_STOCK = Number(process.env.MIN_POS_STOCK || 3); // أكثر من 2
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 2);
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const STATE_FILE = path.join(__dirname, '../data/niceone-makeup-bundles-batch19-state.json');
const CANDIDATES_FILE = path.join(__dirname, '../data/niceone-makeup-bundles-batch19-candidates.json');

const catsJson = JSON.parse(readFileSync(path.join(__dirname, '../data/niceone-categories.json'), 'utf8'));
const ALL_LEAVES = collectMakeupLeaves(catsJson);
const BUNDLE_LEAVES = ALL_LEAVES.filter((l) => /sets|set|palette|brush-sets/i.test(l));
const OTHER_LEAVES = ALL_LEAVES.filter((l) => !BUNDLE_LEAVES.includes(l));
const SCAN_LEAVES = [...BUNDLE_LEAVES, ...OTHER_LEAVES];

const PERF = /parfum|perfume|eau de|edp|edt|cologne|عطر|fragrance/i;

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

function saveState(state) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function collectExcludedBarcodes() {
  const excluded = new Set();
  const dataDir = path.join(__dirname, '../data');
  for (const name of [
    'niceone-makeup-bundles-batch19-state.json',
    'care-pos-import-state.json',
    'sarah-pos-import-state.json',
  ]) {
    const p = path.join(dataDir, name);
    if (!existsSync(p)) continue;
    try {
      const s = JSON.parse(readFileSync(p, 'utf8'));
      for (const bc of Object.keys(s.imported || {})) excluded.add(bc);
    } catch { /* ignore */ }
  }
  for (let i = 2; i <= 18; i++) {
    const p = path.join(dataDir, `sarah-pos-import-state-batch${i}.json`);
    if (!existsSync(p)) continue;
    try {
      const s = JSON.parse(readFileSync(p, 'utf8'));
      for (const bc of Object.keys(s.imported || {})) excluded.add(bc);
    } catch { /* ignore */ }
  }
  return excluded;
}

function isPosBundle(posName = '', nameAr = '', nameEn = '', niceoneCategory = '') {
  const t = `${posName} ${nameAr} ${nameEn} ${niceoneCategory}`;
  return /مجموعة|مجموعه|طقم|gift set|makeup set|lip set|eye set|face set|\bkit\b|bundle|\bpack\b|\d+\s*x\s*\d+|palette set|brush set|مجموعه/i.test(t);
}

function isPerfume(text = '') {
  return PERF.test(text) && !/makeup|mascara|lip|palette|blush|foundation|concealer|مكياج|شفاه|عيون/i.test(text);
}

function hasShadeVariants(detail) {
  const shades = detail?.shades || [];
  if (shades.length > 1) return true;
  if (detail?.shadeCount > 1) return true;
  if (detail?.hasOptions && shades.length > 0) {
    const names = shades.map((s) => `${s.nameAr || ''} ${s.nameEn || ''}`.trim()).filter(Boolean);
    if (names.length > 1) return true;
  }
  return false;
}

function cleanText(v = '') {
  return String(v).replace(/\s+/g, ' ').trim();
}

function quickBarcode(item) {
  return extractBarcode(item?.barcode || '') || barcodeFromImageUrl(item?.thumb || '');
}

async function lookupPosBatch(barcodes) {
  if (!barcodes.length) return {};
  const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes } });
  return res.items || {};
}

async function loadExistingBarcodes() {
  const set = new Set();
  for (let page = 1; page <= 80; page++) {
    const items = await api(`/products?limit=100&page=${page}&status=all`);
    if (!items?.length) break;
    for (const p of items) {
      if (p.barcode) set.add(p.barcode);
    }
  }
  return set;
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

async function resolveBrandId(brandCache, brandEn = '', brandAr = '') {
  try {
    const resolved = await api('/brands/resolve', {
      method: 'POST',
      body: { brandEn, brandAr, name: brandEn || brandAr, createIfMissing: true },
    });
    if (resolved?.id) return resolved.id;
  } catch { /* fallback */ }

  const slug = brandSlug(brandEn || brandAr);
  if (brandCache.bySlug.has(slug)) return brandCache.bySlug.get(slug);
  const loose = brandCache.list.find((b) => {
    const n = `${b.nameEn || ''} ${b.nameAr || ''} ${b.name || ''}`.toLowerCase();
    return n.includes((brandEn || brandAr).toLowerCase());
  });
  if (loose) return loose.id;
  return null;
}

function isJunkImage(url = '') {
  const u = String(url).toLowerCase();
  return !u.startsWith('http') || /\s/.test(u) || /\/swatch\//i.test(u) || /placeholder|no[_-]?image/i.test(u);
}

async function uploadImages(urls) {
  const ids = [];
  for (const url of urls) {
    try {
      const data = await api('/media/upload-from-url', {
        method: 'POST',
        body: { url, purpose: 'PRODUCT' },
      });
      const id = data?.id || data?.media?.id;
      if (id && id !== 'placeholder') ids.push(id);
    } catch { /* try next */ }
  }
  return ids;
}

async function runPool(items, worker, n) {
  const results = [];
  let i = 0;
  async function loop() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => loop()));
  return results;
}

async function importOne(brandCache, row, state) {
  const { barcode, leaf, pos } = row;
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported' };

  const detail = await fetchProductDetail(row.niceoneId, { light: false });
  if (!detail) return { status: 'skip', reason: 'no niceone detail' };
  if (hasShadeVariants(detail)) return { status: 'skip', reason: 'has shades' };

  const nameAr = cleanText(detail.nameAr);
  const nameEn = cleanText(detail.nameEn);
  const descriptionAr = cleanText(detail.descriptionAr);
  const descriptionEn = cleanText(detail.descriptionEn);

  if (!nameAr || !nameEn) return { status: 'skip', reason: 'missing bilingual name' };
  if (!descriptionAr || !descriptionEn) return { status: 'skip', reason: 'missing bilingual description' };
  if (isPerfume(`${nameAr} ${nameEn} ${pos?.pos?.name || ''}`)) return { status: 'skip', reason: 'perfume' };
  if (!isPosBundle(pos?.pos?.name || '', nameAr, nameEn, detail.category || '')) {
    return { status: 'skip', reason: 'not a POS bundle' };
  }

  const brandId = await resolveBrandId(brandCache, detail.brandEn || row.brandEn, detail.brandAr || row.brandAr);
  if (!brandId) return { status: 'skip', reason: 'no brand' };

  const imageUrls = dedupeImagesPreferLargest(
    [...(detail.images || []), detail.thumb].map(upgradeImageUrl).filter((u) => u && !isJunkImage(u)),
  );
  if (!imageUrls.length) return { status: 'skip', reason: 'no images' };

  const imageIds = await uploadImages(imageUrls);
  if (!imageIds.length) return { status: 'skip', reason: 'upload failed' };

  const cats = resolveMakeupCategories(leaf, detail);
  const payload = {
    sku: barcode,
    barcode,
    name: nameAr,
    nameAr,
    nameEn,
    slug: slugify(`${nameEn}-${barcode}`),
    brandId,
    categoryId: cats.categoryId,
    subcategoryIds: cats.subcategoryIds,
    tertiaryCategoryIds: cats.tertiaryCategoryIds,
    description: descriptionAr,
    descriptionAr,
    descriptionEn,
    ingredients: '',
    howToUse: '',
    price: Number(pos?.pos?.price || 0),
    originalPrice: Number(pos?.pos?.originalPrice || 0),
    discountPercent: Number(pos?.pos?.discountPercent || 0),
    stock: 0,
    isActive: true,
    isNew: false,
    imageIds,
  };

  const created = await api('/products', { method: 'POST', body: payload });
  upsertBarcodeIndex(barcode, { store: 'niceone', productId: row.niceoneId, brand: detail.brandEn });
  state.imported[barcode] = {
    id: created.id,
    niceoneId: row.niceoneId,
    leaf,
    stock: pos?.pos?.stock,
    at: Date.now(),
  };
  saveState(state);
  return {
    status: 'ok',
    id: created.id,
    nameAr,
    stock: pos?.pos?.stock,
    sub: cats.makeupSub,
  };
}

async function scanLeaf(leaf, existing, excluded) {
  const found = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const listing = await listCategoryProducts(leaf, { page, limit: LIST_LIMIT, arOnly: false });
    const items = listing.items || [];

    const withBarcode = [];
    for (const it of items) {
      const bc = quickBarcode(it);
      if (!bc || existing.has(bc) || excluded.has(bc)) continue;
      if (it.hasOptions && (it.shadeCount || 0) > 1) continue;
      withBarcode.push({ ...it, barcode: bc });
    }

    if (withBarcode.length) {
      const barcodes = withBarcode.map((it) => extractBarcode(it.barcode));
      const posMap = {};
      for (let i = 0; i < barcodes.length; i += POS_BATCH) {
        const chunk = barcodes.slice(i, i + POS_BATCH);
        Object.assign(posMap, await lookupPosBatch(chunk));
      }

      for (const item of withBarcode) {
        const bc = extractBarcode(item.barcode);
        const hit = posMap[bc];
        if (!hit?.pos || hit.pos.stock < MIN_POS_STOCK) continue;
        if (hit.inApp?.id) continue;
        if (!isPosBundle(hit.pos.name || '', item.nameAr || '', item.nameEn || '', '')) continue;
        found.push({
          barcode: bc,
          niceoneId: item.id,
          leaf,
          brandAr: item.brandAr || '',
          brandEn: item.brandEn || '',
          nameAr: item.nameAr || '',
          nameEn: item.nameEn || '',
          pos: hit,
        });
      }
    }

    hasMore = listing.hasMore;
    page += 1;
  }

  return found;
}

const stats = { ok: 0, skip: 0, fail: 0 };
let stop = false;

async function main() {
  await getToken();
  const existing = await loadExistingBarcodes();
  const excluded = collectExcludedBarcodes();
  const brandCache = await loadBrands();
  const state = loadState();

  console.log(`Makeup leaves: ${SCAN_LEAVES.length} | min POS stock: >2 (${MIN_POS_STOCK}+) | target: ${LIMIT}`);
  console.log(`In app: ${existing.size} | excluded batches: ${excluded.size}\n`);

  const candidates = [];
  let leafIdx = 0;

  async function leafWorker() {
    while (!stop && leafIdx < SCAN_LEAVES.length && candidates.length < LIMIT * 3) {
      const leaf = SCAN_LEAVES[leafIdx++];
      const rows = await scanLeaf(leaf, existing, excluded);
      if (rows.length) console.log(`  scan ${leaf}: ${rows.length} bundle hits`);
      for (const r of rows) {
        if (!candidates.some((c) => c.barcode === r.barcode)) candidates.push(r);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(LEAF_CONCURRENCY, SCAN_LEAVES.length) }, () => leafWorker()));

  const unique = [...new Map(candidates.map((c) => [c.barcode, c])).values()]
    .sort((a, b) => (b.pos?.pos?.stock || 0) - (a.pos?.pos?.stock || 0));

  writeFileSync(CANDIDATES_FILE, `${JSON.stringify(unique.slice(0, LIMIT * 2), null, 2)}\n`);
  console.log(`\nCandidates saved: ${unique.length} → importing up to ${LIMIT}\n`);

  for (const row of unique) {
    if (stats.ok >= LIMIT) break;
    try {
      const r = await importOne(brandCache, row, state);
      if (r.status === 'ok') {
        stats.ok += 1;
        existing.add(row.barcode);
        console.log(`OK ${row.barcode} | ${r.nameAr?.slice(0, 50)} | stock=${r.stock} | sub=${r.sub}`);
      } else {
        stats.skip += 1;
        if (r.reason !== 'already imported') {
          console.log(`SKIP ${row.barcode} — ${r.reason}`);
        }
      }
    } catch (err) {
      stats.fail += 1;
      console.log(`FAIL ${row.barcode} — ${err.message}`);
    }
    if (stats.ok >= LIMIT) {
      stop = true;
      break;
    }
  }

  saveState(state);
  console.log(`\nDone: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
  console.log(`State: ${STATE_FILE}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * استيراد 50 منتج من وجوه FACES:
 * - موجود في POS ومخزونه 2 أو أكثر
 * - بدون تدرجات في التطبيق (باركود POS واحد)
 * - الاسم: البراند + المنتج (عربي وإنجليزي) من وجوه
 * - الوصف من وجوه بالعربية والإنجليزية
 * - تصنيف يدوي حسب قسم وجوه
 *
 * Usage:
 *   LIMIT=50 MIN_POS_STOCK=2 node scripts/import-faces-pos-batch23.mjs
 *   SCAN_ONLY=1 node scripts/import-faces-pos-batch23.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, searchProducts, fetchProductDetail } from '../lib/stores/faces/products.js';
import { extractBarcode, fetchProductVariation } from '../lib/stores/faces/client.js';
import { orderedGalleryUrls } from '../lib/stores/faces/gallery.js';
import { FACES_CATEGORIES } from '../lib/stores/faces/categories.js';
import { resolveFacesCategories } from '../lib/core/faces-category-map.js';
import {
  buildMakeupNames,
  cleanText,
  isTrivialDescription,
  stripHtml,
} from '../lib/core/makeup-product-names.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { gtinEqual, upsertBarcodeIndex } from '../lib/core/barcode-index.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIMIT = Number(process.env.LIMIT || 50);
const MIN_POS_STOCK = Number(process.env.MIN_POS_STOCK || 2);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 1);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 4);
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const MAX_PAGES = Number(process.env.MAX_PAGES || 15);
const USE_SEARCH = process.env.USE_SEARCH === '1';
const PRIORITY_LEAVES = (process.env.PRIORITY_LEAVES || 'perfume,makeup,skincare,haircare,body-care').split(',').map((s) => s.trim()).filter(Boolean);
const SCAN_ONLY = process.env.SCAN_ONLY === '1';
const IMPORT_ONLY = process.env.IMPORT_ONLY === '1';
const STATE_FILE = path.join(__dirname, '../data/faces-pos-batch23-state.json');
const CANDIDATES_FILE = path.join(__dirname, '../data/faces-pos-batch23-candidates.json');

const SCAN_LEAVES = FACES_CATEGORIES.map((c) => c.id);
const SKIP_NAME = /tester|sample|تستر|عينة|\btest\b/i;

const FACES_SEARCH = [
  'dior', 'chanel', 'ysl', 'armani', 'tom ford', 'creed', 'lancome', 'clinique',
  'cerave', 'la roche posay', 'huda beauty', 'sol de janeiro',
];

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
  const stateFiles = [
    'faces-pos-batch22-state.json',
    'niceone-makeup-pos-batch20-state.json',
    'niceone-makeup-import-state-batch19.json',
    'niceone-care-pos-batch21-state.json',
    'care-pos-import-state.json',
    'sarah-pos-import-state.json',
  ];
  for (const name of stateFiles) {
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

function resolveShadeImport(detail, barcode, posName = '') {
  const shades = (detail?.shades || []).filter((s) => s.barcode);
  if (shades.length <= 1) return { ok: true, shade: shades[0] || null };

  const match = shades.find((s) => s.barcode && gtinEqual(s.barcode, barcode));
  if (match) return { ok: true, shade: match, singleShade: true };

  if (detail.barcode && gtinEqual(detail.barcode, barcode)) {
    const posTag = cleanText(posName);
    return {
      ok: true,
      shade: posTag ? { nameEn: posTag, nameAr: posTag } : null,
      singleShade: true,
      posFallback: true,
    };
  }

  const posTag = cleanText(posName);
  return {
    ok: true,
    shade: posTag ? { nameEn: posTag, nameAr: posTag } : null,
    singleShade: true,
    posFallback: true,
  };
}

function appendShadeName(names, shade) {
  if (!shade) return names;
  const shadeAr = cleanText(shade.nameAr || shade.nameEn || '');
  const shadeEn = cleanText(shade.nameEn || shade.nameAr || '');
  if (!shadeAr && !shadeEn) return names;
  const hasAr = shadeAr && names.nameAr.includes(shadeAr);
  const hasEn = shadeEn && names.nameEn.toLowerCase().includes(shadeEn.toLowerCase());
  return {
    ...names,
    nameAr: hasAr ? names.nameAr : cleanText(`${names.nameAr} - ${shadeAr}`),
    nameEn: hasEn ? names.nameEn : cleanText(`${names.nameEn} - ${shadeEn}`),
  };
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
    if (resolved?.brand?.id) return resolved.brand.id;
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

async function quickVariation(item, lang = 'ar') {
  return fetchProductVariation(item.id, { lang }).catch(() => null);
}

function listingBarcode(item = {}) {
  const bc = extractBarcode(item.sku || '') || extractBarcode(item.barcode || '');
  return bc;
}

function barcodeRowsFromItem(item, leaf, arVar, enVar) {
  const rows = [];
  const bc = listingBarcode(item) || extractBarcode(arVar) || extractBarcode(enVar);
  if (!bc) return rows;
  rows.push({
    barcode: bc,
    facesId: item.id,
    leaf,
    brandAr: item.brandAr || arVar?.brand || '',
    brandEn: item.brandEn || enVar?.brand || arVar?.brand || '',
    nameAr: item.nameAr || arVar?.productName || '',
    nameEn: item.nameEn || enVar?.productName || item.nameEn || '',
  });
  return rows;
}

async function enrichListingItems(items, leaf, existing, excluded) {
  const pending = items.filter((it) => !SKIP_NAME.test(`${it.nameAr || ''} ${it.nameEn || ''}`));

  const enriched = await runPool(pending, async (item) => {
    const bc = listingBarcode(item);
    if (bc && !existing.has(bc) && !excluded.has(bc)) {
      return [{
        barcode: bc,
        facesId: item.id,
        leaf,
        brandAr: item.brandAr || '',
        brandEn: item.brandEn || '',
        nameAr: item.nameAr || '',
        nameEn: item.nameEn || '',
      }];
    }
    const [arVar, enVar] = await Promise.all([
      quickVariation(item, 'ar'),
      quickVariation(item, 'en'),
    ]);
    if (!arVar && !enVar) return [];
    if (arVar?.productType === 'master' || enVar?.productType === 'master') {
      return [];
    }
    return barcodeRowsFromItem(item, leaf, arVar, enVar).filter((r) => {
      const b = r.barcode;
      return b && !existing.has(b) && !excluded.has(b);
    });
  }, DETAIL_CONCURRENCY);

  const flat = enriched.flat();
  if (!flat.length) return [];

  const posMap = {};
  const barcodes = flat.map((r) => r.barcode);
  for (let i = 0; i < barcodes.length; i += POS_BATCH) {
    Object.assign(posMap, await lookupPosBatch(barcodes.slice(i, i + POS_BATCH)));
  }

  const found = [];
  for (const row of flat) {
    const hit = posMap[row.barcode];
    if (!hit?.pos || hit.pos.stock < MIN_POS_STOCK) continue;
    if (hit.inApp?.id) continue;
    found.push({ ...row, pos: hit });
  }
  return found;
}

async function scanLeaf(leaf, existing, excluded) {
  const found = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const listing = await listCategoryProducts(leaf, { page, limit: LIST_LIMIT });
    const hits = await enrichListingItems(listing.items || [], leaf, existing, excluded);
    found.push(...hits);
    if (!listing.hasMore) break;
  }
  return found;
}

async function discoverFromSearch(existing, excluded) {
  const found = [];
  const seen = new Set();
  for (const query of FACES_SEARCH) {
    for (let page = 1; page <= 3; page++) {
      const listing = await searchProducts(query, { page, limit: LIST_LIMIT });
      const hits = await enrichListingItems(listing.items || [], 'bestsellers', existing, excluded);
      for (const h of hits) {
        if (seen.has(h.barcode)) continue;
        seen.add(h.barcode);
        found.push(h);
      }
      if (!listing.hasMore) break;
    }
    if (found.length >= LIMIT * 5) break;
  }
  return found;
}

function pushCandidates(pool, rows) {
  const seen = new Set(pool.map((c) => c.barcode));
  for (const row of rows) {
    if (seen.has(row.barcode)) continue;
    seen.add(row.barcode);
    pool.push(row);
  }
}

async function importOne(brandCache, row, state) {
  const { barcode, leaf, pos } = row;
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported' };

  const detail = await fetchProductDetail(row.facesId, { light: false });
  if (!detail) return { status: 'skip', reason: 'no faces detail' };

  const shadeCtx = resolveShadeImport(detail, barcode, pos?.pos?.name || '');
  if (!shadeCtx.ok) return { status: 'skip', reason: shadeCtx.reason || 'has shades' };

  let names = buildMakeupNames({
    brandAr: detail.brandAr || row.brandAr,
    brandEn: detail.brandEn || row.brandEn,
    productAr: detail.nameAr,
    productEn: detail.nameEn,
    posName: pos?.pos?.name || '',
  });
  names = appendShadeName(names, shadeCtx.shade);

  const descriptionAr = stripHtml(detail.descriptionAr);
  const descriptionEn = stripHtml(detail.descriptionEn);

  if (!names.nameAr || !names.nameEn) return { status: 'skip', reason: 'missing bilingual name' };
  if (isTrivialDescription(descriptionAr) || isTrivialDescription(descriptionEn)) {
    return { status: 'skip', reason: 'missing bilingual description' };
  }
  if (SKIP_NAME.test(`${names.nameAr} ${names.nameEn}`)) {
    return { status: 'skip', reason: 'tester/sample' };
  }

  let brandId = await resolveBrandId(brandCache, names.brandEn, names.brandAr);
  if (!brandId && detail.brandEn) {
    brandId = await resolveBrandId(brandCache, detail.brandEn, detail.brandAr);
  }
  if (!brandId) return { status: 'skip', reason: 'no brand' };

  const variant = await fetchProductVariation(row.facesId, { lang: 'ar' }).catch(() => null)
    || await fetchProductVariation(row.facesId, { lang: 'en' }).catch(() => null);
  const galleryUrls = variant ? orderedGalleryUrls(variant) : [];
  const imageUrls = dedupeImagesPreferLargest(
    [
      ...galleryUrls,
      ...(shadeCtx.shade?.image ? [shadeCtx.shade.image] : []),
      ...(detail.images || []),
      detail.thumb,
    ].map(upgradeImageUrl).filter((u) => u && !isJunkImage(u)),
  );
  if (!imageUrls.length) return { status: 'skip', reason: 'no images' };

  const imageIds = await uploadImages(imageUrls);
  if (!imageIds.length) return { status: 'skip', reason: 'upload failed' };

  const cats = resolveFacesCategories(leaf, { ...detail, barcode });
  const payload = {
    sku: barcode,
    barcode,
    name: names.nameAr,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    slug: slugify(`${names.nameEn}-${barcode}`),
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
  upsertBarcodeIndex(barcode, { store: 'faces', productId: row.facesId, brand: names.brandEn });
  state.imported[barcode] = {
    id: created.id,
    facesId: row.facesId,
    leaf,
    stock: pos?.pos?.stock,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    kind: cats.kind,
    categoryId: cats.categoryId,
    subcategoryIds: cats.subcategoryIds,
    tertiaryCategoryIds: cats.tertiaryCategoryIds,
    careLeaf: cats.careLeaf || null,
    makeupSub: cats.makeupSub || null,
    at: Date.now(),
  };
  saveState(state);
  return {
    status: 'ok',
    id: created.id,
    nameAr: names.nameAr,
    stock: pos?.pos?.stock,
    kind: cats.kind,
    subCount: cats.subcategoryIds?.length || 0,
    terCount: cats.tertiaryCategoryIds?.length || 0,
  };
}

const stats = { ok: 0, skip: 0, fail: 0 };

async function main() {
  await getToken();
  const existing = await loadExistingBarcodes();
  const excluded = collectExcludedBarcodes();
  const brandCache = await loadBrands();
  const state = loadState();

  console.log(`FACES import batch23`);
  console.log(`Categories: ${SCAN_LEAVES.length} | min POS stock: ${MIN_POS_STOCK}+ | target: ${LIMIT}`);
  console.log(`In app: ${existing.size} | excluded: ${excluded.size}\n`);

  const candidates = IMPORT_ONLY && existsSync(CANDIDATES_FILE)
    ? JSON.parse(readFileSync(CANDIDATES_FILE, 'utf8'))
    : [];
  let leafIdx = 0;

  if (!IMPORT_ONLY) {
    if (USE_SEARCH) {
      const searchHits = await discoverFromSearch(existing, excluded);
      pushCandidates(candidates, searchHits);
      console.log(`Search discovery: ${searchHits.length} hits (pool ${candidates.length})`);
    }

    const leaves = [
      ...PRIORITY_LEAVES.filter((l) => SCAN_LEAVES.includes(l)),
      ...SCAN_LEAVES.filter((l) => !PRIORITY_LEAVES.includes(l)),
    ];

    async function leafWorker() {
      while (leafIdx < leaves.length) {
        const leaf = leaves[leafIdx++];
        const rows = await scanLeaf(leaf, existing, excluded);
        if (rows.length) console.log(`  scan ${leaf}: ${rows.length} POS hits`);
        pushCandidates(candidates, rows);
      }
    }

    await Promise.all(Array.from({ length: Math.min(LEAF_CONCURRENCY, leaves.length) }, () => leafWorker()));
  }

  const unique = IMPORT_ONLY
    ? candidates
    : [...new Map(candidates.map((c) => [c.barcode, c])).values()]
      .sort((a, b) => (b.pos?.pos?.stock || 0) - (a.pos?.pos?.stock || 0));

  writeFileSync(CANDIDATES_FILE, `${JSON.stringify(unique.slice(0, LIMIT * 3), null, 2)}\n`);
  console.log(`\nCandidates: ${unique.length} (saved ${CANDIDATES_FILE})`);

  if (SCAN_ONLY) {
    console.log('SCAN_ONLY=1 — stopping before import.');
    return;
  }

  console.log(`Importing up to ${LIMIT}...\n`);

  for (const row of unique) {
    if (stats.ok >= LIMIT) break;
    try {
      const r = await importOne(brandCache, row, state);
      if (r.status === 'ok') {
        stats.ok += 1;
        existing.add(row.barcode);
        console.log(`OK ${row.barcode} | ${r.nameAr?.slice(0, 50)} | stock=${r.stock} | ${r.kind} | sub=${r.subCount} ter=${r.terCount}`);
      } else {
        stats.skip += 1;
        state.skipped[row.barcode] = { reason: r.reason, at: Date.now() };
        if (r.reason !== 'already imported') {
          console.log(`SKIP ${row.barcode} — ${r.reason}`);
        }
      }
    } catch (err) {
      stats.fail += 1;
      console.log(`FAIL ${row.barcode} — ${err.message}`);
    }
    if (stats.ok > 0 && stats.ok % 5 === 0) saveState(state);
  }

  saveState(state);
  console.log(`\nDone: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
  console.log(`State: ${STATE_FILE}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

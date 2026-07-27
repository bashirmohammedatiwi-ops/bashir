#!/usr/bin/env node
/**
 * استيراد 50 منتج بريميوم إضافي من نايس وان (batch27):
 * - قسم premium/luxury-perfumes | luxury-makeup | luxury-care
 * - POS مخزون ≥ MIN_POS_STOCK، أو ALLOW_NO_POS=1 مع سعر نايس وان
 * - بدون تدرجات (باركود POS واحد)
 * - الاسم العربي كاملاً بالعربية
 * - تصنيف: بريميوم + فرعي + ثانوي
 *
 * Usage:
 *   LIMIT=50 MIN_POS_STOCK=2 node scripts/import-niceone-premium-pos-batch26.mjs
 *   LIMIT=50 MIN_POS_STOCK=0 ALLOW_NO_POS=1 node scripts/import-niceone-premium-pos-batch27.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { extractBarcode, isValidEan } from '../lib/stores/niceone/client.js';
import { barcodeFromImageUrl } from '../lib/stores/niceone/barcodes.js';
import { gtinEqual, upsertBarcodeIndex, loadBarcodeIndex } from '../lib/core/barcode-index.js';
import { collectPremiumLeaves, resolvePremiumCategories, inferKind } from '../lib/core/premium-category-map.js';
import {
  applyPremiumMeta,
  buildPremiumDescriptions,
  getPremiumMeta,
} from '../lib/core/premium-product-meta.js';
import {
  buildMakeupNames,
  cleanText,
  isTrivialDescription,
  stripHtml,
} from '../lib/core/makeup-product-names.js';
import {
  appendArabicShade,
  isValidArabicName,
  polishFacesArabicNames,
} from '../lib/core/faces-arabic-names.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIMIT = Number(process.env.LIMIT || 50);
const MIN_POS_STOCK = Number(process.env.MIN_POS_STOCK || 2);
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const MAX_PAGES = Number(process.env.MAX_PAGES || 30);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 3);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 6);
const PATCH_EXISTING = process.env.PATCH_EXISTING === '1';
const IMPORT_ONLY = process.env.IMPORT_ONLY === '1';
const ALLOW_NO_POS = process.env.ALLOW_NO_POS === '1';
const STATE_FILE = path.join(__dirname, '../data/niceone-premium-pos-batch27-state.json');
const CANDIDATES_FILE = path.join(__dirname, '../data/niceone-premium-pos-batch27-candidates.json');

const SCAN_LEAVES = collectPremiumLeaves();
const SKIP_NAME = /tester|sample|تستر|عينة|\btest\b|refill|ريفيل/i;

function toAsciiDigits(value = '') {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return String(value)
    .replace(/[٠-٩]/g, (ch) => String(ar.indexOf(ch)))
    .replace(/[۰-۹]/g, (ch) => String(fa.indexOf(ch)));
}

function parseNiceonePrice(priceStr = '') {
  const n = Number(toAsciiDigits(priceStr).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

function resolvePrice(row, detail, barcode = '') {
  const posPrice = Number(row?.pos?.pos?.price || 0);
  if (posPrice > 0) {
    return {
      price: posPrice,
      originalPrice: Number(row?.pos?.pos?.originalPrice || posPrice),
      discountPercent: Number(row?.pos?.pos?.discountPercent || 0),
    };
  }
  const shade = (detail?.shades || []).find((s) => s.barcode && gtinEqual(s.barcode, barcode));
  const shadePrice = parseNiceonePrice(shade?.price || '');
  if (shadePrice > 0) {
    return { price: shadePrice, originalPrice: shadePrice, discountPercent: 0 };
  }
  const mainPrice = parseNiceonePrice(row?.listPrice || detail?.price || '');
  return { price: mainPrice, originalPrice: mainPrice, discountPercent: 0 };
}

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
    'niceone-premium-pos-batch27-state.json',
    'niceone-premium-pos-batch26-state.json',
    'niceone-premium-pos-batch25-state.json',
    'niceone-care-pos-batch21-state.json',
    'niceone-makeup-pos-batch20-state.json',
    'niceone-makeup-bundles-batch19-state.json',
    'niceone-makeup-import-state-batch19.json',
    'faces-pos-batch24-state.json',
    'faces-pos-batch23-state.json',
    'faces-pos-batch22-state.json',
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
  const shades = detail?.shades || [];
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
    if (resolved?.brand?.id) return resolved.brand.id;
  } catch { /* fallback */ }

  const slug = brandSlug(brandEn || brandAr);
  if (brandCache.bySlug.has(slug)) return brandCache.bySlug.get(slug);
  const loose = brandCache.list.find((b) => {
    const n = `${b.nameEn || ''} ${b.nameAr || ''} ${b.name || ''}`.toLowerCase();
    return n.includes((brandEn || brandAr).toLowerCase());
  });
  return loose?.id || null;
}

function normalizeImageUrl(url = '') {
  return String(url).trim().replace(/ /g, '%20');
}

function isJunkImage(url = '') {
  const u = normalizeImageUrl(url).toLowerCase();
  return !u.startsWith('http') || /\/swatch\//i.test(u) || /placeholder|no[_-]?image/i.test(u);
}

async function uploadImages(urls) {
  const ids = [];
  for (const url of urls) {
    try {
      const data = await api('/media/upload-from-url', {
        method: 'POST',
        body: { url: normalizeImageUrl(url), purpose: 'PRODUCT' },
      });
      const id = data?.id || data?.media?.id;
      if (id && id !== 'placeholder') ids.push(id);
    } catch { /* try next */ }
  }
  return ids;
}

function listingToCandidate(item, leaf, hit) {
  return {
    barcode: extractBarcode(item.barcode),
    niceoneId: item.id,
    leaf,
    brandAr: item.brandAr || '',
    brandEn: item.brandEn || '',
    nameAr: item.nameAr || '',
    nameEn: item.nameEn || '',
    pos: hit,
  };
}

function barcodesFromIndex(niceoneId) {
  const idx = loadBarcodeIndex();
  const out = [];
  for (const e of Object.values(idx.entries || {})) {
    if (e.store !== 'niceone' || String(e.productId) !== String(niceoneId)) continue;
    const bc = extractBarcode(e.barcode || '');
    if (bc && isValidEan(bc)) out.push(bc);
  }
  return [...new Set(out)];
}

async function runPool(items, worker, n) {
  let i = 0;
  async function loop() {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => loop()));
}

async function resolveItemBarcodes(item) {
  const barcodes = new Set(barcodesFromIndex(item.id));
  const quick = quickBarcode(item);
  if (quick && isValidEan(quick)) barcodes.add(quick);
  if (barcodes.size) return [...barcodes];
  const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
  const main = extractBarcode(detail?.barcode || '');
  if (main && isValidEan(main)) barcodes.add(main);
  for (const s of detail?.shades || []) {
    const bc = extractBarcode(s.barcode || '');
    if (bc && isValidEan(bc)) barcodes.add(bc);
  }
  return [...barcodes];
}

async function posFilterListingItems(items, leaf, existing, excluded) {
  const rows = [];
  await runPool(items, async (it) => {
    if (SKIP_NAME.test(`${it.nameAr || ''} ${it.nameEn || ''}`)) return;
    const barcodes = await resolveItemBarcodes(it);
    for (const bc of barcodes) {
      if (existing.has(bc) || excluded.has(bc)) continue;
      rows.push({
        barcode: bc,
        niceoneId: it.id,
        leaf,
        brandAr: it.brandAr || '',
        brandEn: it.brandEn || '',
        nameAr: it.nameAr || '',
        nameEn: it.nameEn || '',
        listPrice: it.price || '',
      });
    }
  }, DETAIL_CONCURRENCY);

  if (!rows.length) return [];

  const uniqueBc = [...new Set(rows.map((r) => r.barcode))];
  const posMap = {};
  for (let i = 0; i < uniqueBc.length; i += POS_BATCH) {
    Object.assign(posMap, await lookupPosBatch(uniqueBc.slice(i, i + POS_BATCH)));
  }

  const found = [];
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.barcode}:${row.niceoneId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = posMap[row.barcode] || { barcode: row.barcode };
    if (hit.inApp?.id && !PATCH_EXISTING) continue;
    if (hit?.pos) {
      if (hit.pos.stock < MIN_POS_STOCK) continue;
    } else if (!ALLOW_NO_POS) {
      continue;
    }
    found.push({ ...row, pos: hit, inAppId: hit.inApp?.id || null });
  }
  return found;
}

async function scanLeaf(leaf, existing, excluded) {
  const found = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const listing = await listCategoryProducts(leaf, { page, limit: LIST_LIMIT, arOnly: true });
    const hits = await posFilterListingItems(listing.items || [], leaf, existing, excluded);
    found.push(...hits);
    if (!listing.hasMore) break;
  }
  return found;
}

async function scanAllLeaves(existing, excluded) {
  const chunks = await Promise.all(SCAN_LEAVES.map((leaf) => scanLeaf(leaf, existing, excluded)));
  return chunks.flat();
}

async function importOne(brandCache, row, state) {
  const { barcode, leaf, pos } = row;
  const metaOverride = getPremiumMeta(barcode);
  const isPatch = PATCH_EXISTING && !!(row.inAppId || state.imported[barcode]?.id);
  if (state.imported[barcode] && !PATCH_EXISTING) {
    return { status: 'skip', reason: 'already imported' };
  }

  const detail = await fetchProductDetail(row.niceoneId, { light: false });
  if (!detail) return { status: 'skip', reason: 'no niceone detail' };

  const shadeCtx = resolveShadeImport(detail, barcode, pos?.pos?.name || '');
  if (!shadeCtx.ok) return { status: 'skip', reason: shadeCtx.reason || 'has shades' };

  let names;
  const applied = applyPremiumMeta(barcode, {}, detail);
  if (applied.meta) {
    names = applied.names;
  } else {
    names = buildMakeupNames({
      brandAr: detail.brandAr || row.brandAr,
      brandEn: detail.brandEn || row.brandEn,
      productAr: detail.nameAr,
      productEn: detail.nameEn,
      posName: pos?.pos?.name || '',
    });
    names = polishFacesArabicNames(names);
    if (!applied.meta) names = appendArabicShade(names, shadeCtx.shade);
  }

  const storeDescAr = stripHtml(detail.descriptionAr);
  const storeDescEn = stripHtml(detail.descriptionEn);
  let desc = buildPremiumDescriptions(metaOverride || applied.meta, storeDescAr, storeDescEn);
  const descLeaf = metaOverride?.leaf || leaf;

  if (isTrivialDescription(desc.descriptionAr) || isTrivialDescription(desc.descriptionEn)) {
    const kind = inferKind(descLeaf, `${names.nameAr} ${names.nameEn}`);
    desc = buildPremiumDescriptions({
      kind,
      introAr: `${names.nameAr} — منتج فاخر من قسم بريميوم.`,
      introEn: `${names.nameEn} — a luxury product from the Premium collection.`,
      typeAr: kind === 'perfume' ? 'عطر' : kind === 'makeup' ? 'مكياج' : 'عناية',
      typeEn: kind === 'perfume' ? 'Perfume' : kind === 'makeup' ? 'Makeup' : 'Skincare',
    }, storeDescAr, storeDescEn);
  }

  if (!names.nameAr || !names.nameEn) return { status: 'skip', reason: 'missing bilingual name' };
  if (!metaOverride && (!isValidArabicName(names.nameAr) || names.validAr === false)) {
    return { status: 'skip', reason: 'arabic name has latin' };
  }
  if (isTrivialDescription(desc.descriptionAr) || isTrivialDescription(desc.descriptionEn)) {
    return { status: 'skip', reason: 'missing bilingual description' };
  }
  if (SKIP_NAME.test(`${names.nameAr} ${names.nameEn} ${pos?.pos?.name || ''}`)) {
    return { status: 'skip', reason: 'tester/sample' };
  }

  let brandId = await resolveBrandId(brandCache, names.brandEn, names.brandAr);
  if (!brandId && detail.brandEn) {
    brandId = await resolveBrandId(brandCache, detail.brandEn, detail.brandAr);
  }
  if (!brandId) return { status: 'skip', reason: 'no brand' };

  const imageUrls = dedupeImagesPreferLargest(
    [
      ...(shadeCtx.shade?.image ? [shadeCtx.shade.image] : []),
      ...(detail.images || []),
      detail.thumb,
    ].map(upgradeImageUrl).filter((u) => u && !isJunkImage(u)),
  );
  if (!imageUrls.length) return { status: 'skip', reason: 'no images' };

  const imageIds = isPatch ? undefined : await uploadImages(imageUrls);
  if (!isPatch && !imageIds?.length) return { status: 'skip', reason: 'upload failed' };

  const pricing = resolvePrice(row, detail, barcode);
  if (!isPatch && pricing.price <= 0) return { status: 'skip', reason: 'no price' };

  const effectiveLeaf = metaOverride?.leaf || leaf;
  const cats = resolvePremiumCategories(effectiveLeaf, {
    ...detail,
    barcode,
    posName: pos?.pos?.name || '',
    nameAr: names.nameAr,
    nameEn: names.nameEn,
  });
  if (cats.kind === 'makeup') {
    // API يرفض tertiary المكياج من شجرة المكياج العادية تحت بريميوم
    cats.tertiaryCategoryIds = [];
  }
  if (cats.kind === 'care') {
    // API يرفض tertiary العناية من شجرة care العادية تحت بريميوم
    cats.tertiaryCategoryIds = [];
  }

  const payload = {
    name: names.nameAr,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    categoryId: cats.categoryId,
    subcategoryIds: cats.subcategoryIds,
    tertiaryCategoryIds: cats.tertiaryCategoryIds,
    description: desc.descriptionAr,
    descriptionAr: desc.descriptionAr,
    descriptionEn: desc.descriptionEn,
  };

  let productId = isPatch ? (row.inAppId || state.imported[barcode]?.id) : null;
  if (isPatch && productId) {
    await api(`/products/${productId}`, { method: 'PATCH', body: payload });
  } else {
    const created = await api('/products', {
      method: 'POST',
      body: {
        ...payload,
        sku: barcode,
        barcode,
        slug: slugify(`${names.nameEn}-${barcode}`),
        brandId,
        ingredients: '',
        howToUse: '',
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        discountPercent: pricing.discountPercent,
        stock: 0,
        isActive: true,
        isNew: false,
        imageIds,
      },
    });
    productId = created.id;
    upsertBarcodeIndex(barcode, { store: 'niceone', productId: row.niceoneId, brand: names.brandEn });
  }

  state.imported[barcode] = {
    id: productId,
    niceoneId: row.niceoneId,
    leaf: effectiveLeaf,
    stock: pos?.pos?.stock,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    kind: cats.kind,
    categoryId: cats.categoryId,
    subcategoryIds: cats.subcategoryIds,
    tertiaryCategoryIds: cats.tertiaryCategoryIds,
    at: Date.now(),
  };
  saveState(state);
  return {
    status: 'ok',
    id: productId,
    nameAr: names.nameAr,
    stock: pos?.pos?.stock,
    kind: cats.kind,
    subCount: cats.subcategoryIds?.length || 0,
    terCount: cats.tertiaryCategoryIds?.length || 0,
    patched: !!isPatch,
  };
}

const stats = { ok: 0, skip: 0, fail: 0 };
const importedBarcodes = new Set();
const candidates = [];

function pushCandidates(rows) {
  const seen = new Set(candidates.map((c) => c.barcode));
  for (const row of rows) {
    if (seen.has(row.barcode)) continue;
    seen.add(row.barcode);
    candidates.push(row);
  }
}

async function tryImportRow(brandCache, row, state, existing) {
  if (stats.ok >= LIMIT) return;
  const already = state.imported[row.barcode];
  if (importedBarcodes.has(row.barcode)) return;
  if (already && !PATCH_EXISTING) return;
  importedBarcodes.add(row.barcode);
  try {
    const r = await importOne(brandCache, row, state);
    if (r.status === 'ok') {
      stats.ok += 1;
      existing.add(row.barcode);
      console.log(`${r.patched ? 'PATCH' : 'OK'} ${row.barcode} | ${r.nameAr?.slice(0, 50)} | stock=${r.stock} | ${r.kind} | sub=${r.subCount} ter=${r.terCount}`);
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
}

async function main() {
  await getToken();
  const existing = await loadExistingBarcodes();
  const excluded = collectExcludedBarcodes();
  const brandCache = await loadBrands();
  const state = loadState();

  console.log(`Nice One PREMIUM import batch27`);
  console.log(`Leaves: ${SCAN_LEAVES.join(', ')}`);
  console.log(`Min POS stock: ${MIN_POS_STOCK}+ | allow no POS: ${ALLOW_NO_POS} | target: ${LIMIT}`);
  console.log(`In app: ${existing.size} | excluded: ${excluded.size}\n`);

  if (existsSync(CANDIDATES_FILE)) {
    const saved = JSON.parse(readFileSync(CANDIDATES_FILE, 'utf8'));
    pushCandidates(saved);
    const pending = saved.filter((r) => !state.imported[r.barcode]);
    if (pending.length) {
      console.log(`Retrying ${pending.length} saved candidates...\n`);
      for (const row of pending.sort((a, b) => (b.pos?.pos?.stock || 0) - (a.pos?.pos?.stock || 0))) {
        if (stats.ok >= LIMIT) break;
        await tryImportRow(brandCache, row, state, existing);
      }
    }
  }

  if (PATCH_EXISTING && state.imported && Object.keys(state.imported).length) {
    console.log(`Patching ${Object.keys(state.imported).length} existing premium products...\n`);
    for (const [bc, rec] of Object.entries(state.imported)) {
      if (stats.ok >= LIMIT) break;
      const pos = await lookupPosBatch([bc]);
      await tryImportRow(brandCache, {
        barcode: bc,
        niceoneId: rec.niceoneId,
        leaf: rec.leaf,
        inAppId: rec.id,
        pos: pos[bc] || { pos: { stock: rec.stock, price: 0 } },
      }, state, existing);
    }
  }

  if (!IMPORT_ONLY) {
    console.log('Fast parallel scan (3 leaves)...');
    const rows = await scanAllLeaves(existing, excluded);
    console.log(`  → ${rows.length} POS hits total\n`);
    pushCandidates(rows);
    const sorted = rows.sort((a, b) => (b.pos?.pos?.stock || 0) - (a.pos?.pos?.stock || 0));
    for (const row of sorted) {
      if (stats.ok >= LIMIT) break;
      await tryImportRow(brandCache, row, state, existing);
    }
  }

  writeFileSync(CANDIDATES_FILE, `${JSON.stringify(candidates, null, 2)}\n`);
  saveState(state);
  console.log(`\nDone: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
  console.log(`State: ${STATE_FILE}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

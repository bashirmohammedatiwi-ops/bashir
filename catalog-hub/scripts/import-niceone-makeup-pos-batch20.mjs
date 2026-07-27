#!/usr/bin/env node
/**
 * استيراد 50 منتج مكياج من نايس وان:
 * - موجود في POS ومخزونه 2 أو أكثر
 * - بدون تدرجات ألوان (shade variants)
 * - الاسم: البراند + المنتج (عربي وإنجليزي)
 * - الوصف من نايس وان بالعربية والإنجليزية
 * - تصنيف يدوي حسب قسم نايس وان
 *
 * Usage:
 *   LIMIT=50 MIN_POS_STOCK=2 node scripts/import-niceone-makeup-pos-batch20.mjs
 *   SCAN_ONLY=1 node scripts/import-niceone-makeup-pos-batch20.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, fetchProductDetail, searchProducts } from '../lib/stores/niceone/products.js';
import { extractBarcode } from '../lib/stores/niceone/client.js';
import { gtinEqual } from '../lib/core/barcode-index.js';
import { barcodeFromImageUrl } from '../lib/stores/niceone/barcodes.js';
import { collectMakeupLeaves, resolveMakeupCategories } from '../lib/core/makeup-category-map.js';
import {
  buildMakeupNames,
  cleanText,
  isTrivialDescription,
  stripHtml,
} from '../lib/core/makeup-product-names.js';
import { isMakeupCandidate, isMakeupDetail, isMakeupText } from '../lib/core/makeup-product-filter.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { upsertBarcodeIndex, loadBarcodeIndex } from '../lib/core/barcode-index.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIMIT = Number(process.env.LIMIT || 50);
const MIN_POS_STOCK = Number(process.env.MIN_POS_STOCK || 2);
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 2);
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const SCAN_ONLY = process.env.SCAN_ONLY === '1';
const MAX_PAGES = Number(process.env.MAX_PAGES || 40);
const USE_INDEX = process.env.USE_INDEX === '1';
const USE_SEARCH = process.env.USE_SEARCH !== '0';
const IMPORT_ONLY = process.env.IMPORT_ONLY === '1';
const STATE_FILE = path.join(__dirname, '../data/niceone-makeup-pos-batch20-state.json');
const CANDIDATES_FILE = path.join(__dirname, '../data/niceone-makeup-pos-batch20-candidates.json');

const catsJson = JSON.parse(readFileSync(path.join(__dirname, '../data/niceone-categories.json'), 'utf8'));
const SCAN_LEAVES = collectMakeupLeaves(catsJson);

const MAKEUP_SEARCH = [
  'essence', 'nyx', 'maybelline', 'revolution', 'catrice', 'wet n wild', 'flormar',
  'loreal', 'garnier', 'revlon', 'max factor', 'bourjois', 'note', 'golden rose',
  'make up for ever', 'ofra', 'mesauda', 'calla', 'huda', 'fenty', 'rare beauty',
  'benefit', 'too faced', 'urban decay', 'mac', 'clinique', 'real techniques',
  'elf', 'milani', 'physicians formula', 'la girl', 'jcat', 'essence',
  'ماسكرا', 'بودرة', 'أحمر شفاه', 'باليت', 'هايلايتر', 'كونتور', 'برايمر',
  'ظلال عيون', 'آيلاينر', 'مكياج', 'فرشاة مكياج', 'اسفنجة مكياج',
];
const PERF = /parfum|perfume|eau de|edp|edt|cologne|عطر|fragrance/i;
const SKIP_NAME = /tester|sample|تستر|عينة|\btest\b/i;

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
    'niceone-makeup-pos-batch20-state.json',
    'niceone-makeup-bundles-batch19-state.json',
    'niceone-makeup-import-state-batch19.json',
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

function isPerfume(text = '') {
  return PERF.test(text) && !/makeup|mascara|lip|palette|blush|foundation|concealer|مكياج|شفاه|عيون|برايمر|هايلايتر/i.test(text);
}

function resolveShadeImport(detail, barcode, posName = '') {
  const shades = detail?.shades || [];
  if (shades.length <= 1) return { ok: true, shade: shades[0] || null };

  const match = shades.find((s) => s.barcode && gtinEqual(s.barcode, barcode));
  if (match) return { ok: true, shade: match, singleShade: true };

  if (detail.barcode && gtinEqual(detail.barcode, barcode)) {
    if (shades.length > 1) {
      const posTag = cleanText(posName);
      return {
        ok: true,
        shade: posTag ? { nameEn: posTag, nameAr: posTag } : null,
        singleShade: true,
        posFallback: true,
      };
    }
    return { ok: false, reason: 'has shades' };
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
    productAr: hasAr ? names.productAr : cleanText(`${names.productAr || ''} ${shadeAr}`.trim()),
    productEn: hasEn ? names.productEn : cleanText(`${names.productEn || ''} ${shadeEn}`.trim()),
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

async function importOne(brandCache, row, state) {
  const { barcode, leaf, pos } = row;
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported' };

  const detail = await fetchProductDetail(row.niceoneId, { light: false });
  if (!detail) return { status: 'skip', reason: 'no niceone detail' };
  const shadeCtx = resolveShadeImport(detail, barcode, pos?.pos?.name || '');
  if (!shadeCtx.ok) return { status: 'skip', reason: shadeCtx.reason || 'has shades' };
  if (!isMakeupDetail(detail, leaf)) return { status: 'skip', reason: 'not makeup' };

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
  if (SKIP_NAME.test(`${names.nameAr} ${names.nameEn} ${pos?.pos?.name || ''}`)) {
    return { status: 'skip', reason: 'tester/sample' };
  }
  if (isPerfume(`${names.nameAr} ${names.nameEn} ${pos?.pos?.name || ''}`)) {
    return { status: 'skip', reason: 'perfume' };
  }

  let brandId = await resolveBrandId(brandCache, names.brandEn, names.brandAr);
  if (!brandId) {
    const posBrand = cleanText((pos?.pos?.name || '').split(/\s+/).slice(0, 3).join(' '));
    if (posBrand) brandId = await resolveBrandId(brandCache, posBrand, posBrand);
  }
  if (!brandId && names.brandEn) {
    brandId = await resolveBrandId(brandCache, names.brandEn.replace(/^the/i, 'The'), names.brandAr);
  }
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

  const imageIds = await uploadImages(imageUrls);
  if (!imageIds.length) return { status: 'skip', reason: 'upload failed' };

  const cats = resolveMakeupCategories(leaf, detail);
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
  upsertBarcodeIndex(barcode, { store: 'niceone', productId: row.niceoneId, brand: names.brandEn });
  state.imported[barcode] = {
    id: created.id,
    niceoneId: row.niceoneId,
    leaf,
    stock: pos?.pos?.stock,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    at: Date.now(),
  };
  saveState(state);
  return {
    status: 'ok',
    id: created.id,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    stock: pos?.pos?.stock,
    sub: cats.makeupSub,
  };
}

async function scanLeaf(leaf, existing, excluded) {
  const found = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    const listing = await listCategoryProducts(leaf, { page, limit: LIST_LIMIT, arOnly: false });
    const hits = await posFilterListingItems(listing.items || [], leaf, existing, excluded);
    found.push(...hits);
    hasMore = listing.hasMore;
    page += 1;
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

function listingToCandidate(item, leaf, hit) {
  return {
    barcode: extractBarcode(item.barcode),
    niceoneId: item.id,
    leaf: leaf || 'makeup',
    brandAr: item.brandAr || '',
    brandEn: item.brandEn || '',
    nameAr: item.nameAr || '',
    nameEn: item.nameEn || '',
    pos: hit,
  };
}

async function posFilterListingItems(items, leaf, existing, excluded) {
  const withBarcode = [];
  for (const it of items) {
    const bc = quickBarcode(it);
      if (!bc || existing.has(bc) || excluded.has(bc)) continue;
      if (SKIP_NAME.test(`${it.nameAr || ''} ${it.nameEn || ''}`)) continue;
    if (!isMakeupCandidate({
      leaf,
      nameAr: it.nameAr,
      nameEn: it.nameEn,
      posName: '',
    })) continue;
    withBarcode.push({ ...it, barcode: bc });
  }
  if (!withBarcode.length) return [];

  const barcodes = withBarcode.map((it) => extractBarcode(it.barcode));
  const posMap = {};
  for (let i = 0; i < barcodes.length; i += POS_BATCH) {
    Object.assign(posMap, await lookupPosBatch(barcodes.slice(i, i + POS_BATCH)));
  }

  const found = [];
  for (const item of withBarcode) {
    const bc = extractBarcode(item.barcode);
    const hit = posMap[bc];
    if (!hit?.pos || hit.pos.stock < MIN_POS_STOCK) continue;
    if (hit.inApp?.id) continue;
    if (isPerfume(`${item.nameAr || ''} ${item.nameEn || ''} ${hit.pos.name || ''}`)) continue;
    found.push(listingToCandidate(item, leaf, hit));
  }
  return found;
}

async function discoverFromIndex(existing, excluded) {
  const idx = loadBarcodeIndex();
  const entries = Object.values(idx.entries || {}).filter((e) => e.store === 'niceone' && e.productId);
  const rows = [];
  const seen = new Set();

  for (const e of entries) {
    const bc = extractBarcode(e.barcode || '');
    if (!bc || seen.has(bc) || existing.has(bc) || excluded.has(bc)) continue;
    seen.add(bc);
    rows.push({ barcode: bc, niceoneId: String(e.productId), leaf: 'makeup' });
  }

  const found = [];
  for (let i = 0; i < rows.length; i += POS_BATCH) {
    const batch = rows.slice(i, i + POS_BATCH);
    const posMap = await lookupPosBatch(batch.map((r) => r.barcode));
    for (const row of batch) {
      const hit = posMap[row.barcode];
      if (!hit?.pos || hit.pos.stock < MIN_POS_STOCK) continue;
      if (hit.inApp?.id) continue;
      if (isPerfume(hit.pos.name || '')) continue;
      found.push({ ...row, pos: hit, brandAr: '', brandEn: '', nameAr: '', nameEn: '' });
    }
  }
  return found;
}

async function discoverFromSearch(existing, excluded) {
  const found = [];
  const seen = new Set();

  for (const query of MAKEUP_SEARCH) {
    for (let page = 1; page <= 3; page++) {
      const listing = await searchProducts(query, { page, limit: LIST_LIMIT });
      const hits = await posFilterListingItems(listing.items || [], 'makeup', existing, excluded);
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

const stats = { ok: 0, skip: 0, fail: 0 };

async function main() {
  await getToken();
  const existing = await loadExistingBarcodes();
  const excluded = collectExcludedBarcodes();
  const brandCache = await loadBrands();
  const state = loadState();

  console.log(`Nice One makeup import batch20`);
  console.log(`Leaves: ${SCAN_LEAVES.length} | min POS stock: ${MIN_POS_STOCK}+ | target: ${LIMIT}`);
  console.log(`In app: ${existing.size} | excluded: ${excluded.size}\n`);

  const candidates = IMPORT_ONLY && existsSync(CANDIDATES_FILE)
    ? JSON.parse(readFileSync(CANDIDATES_FILE, 'utf8'))
    : [];
  let leafIdx = 0;

  if (!IMPORT_ONLY) {
  if (USE_INDEX) {
    const indexHits = await discoverFromIndex(existing, excluded);
    pushCandidates(candidates, indexHits);
    console.log(`Index discovery: ${indexHits.length} POS hits (pool ${candidates.length})`);
  }

  if (USE_SEARCH) {
    const searchHits = await discoverFromSearch(existing, excluded);
    pushCandidates(candidates, searchHits);
    console.log(`Search discovery: ${searchHits.length} new hits (pool ${candidates.length})`);
  }

  async function leafWorker() {
    while (leafIdx < SCAN_LEAVES.length) {
      const leaf = SCAN_LEAVES[leafIdx++];
      const rows = await scanLeaf(leaf, existing, excluded);
      if (rows.length) console.log(`  scan ${leaf}: ${rows.length} POS hits`);
      pushCandidates(candidates, rows);
    }
  }

  await Promise.all(Array.from({ length: Math.min(LEAF_CONCURRENCY, SCAN_LEAVES.length) }, () => leafWorker()));
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
        console.log(`OK ${row.barcode} | ${r.nameAr?.slice(0, 55)} | stock=${r.stock} | ${r.sub}`);
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

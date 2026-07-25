#!/usr/bin/env node
/**
 * Import care batch-large products one barcode at a time with verification.
 * Usage: node scripts/import-care-batch-large-sequential.mjs
 * Env: MIN_STOCK=1  DRY_RUN=1  DELAY_MS=1200
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CARE_CATEGORY_ID,
  resolveCareCategories,
} from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { buildCareContent } from '../lib/core/care-content.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const DRY_RUN = process.env.DRY_RUN === '1';
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const STATE_FILE = path.join(__dirname, '../data/care-batch-large-import-state.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/care-batch-large-products.json');

const TARGET = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'))
  .map((p) => String(p.barcode).trim())
  .filter(Boolean);

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 85);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const res = await api(`/products?sku=${encodeURIComponent(barcode)}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  return items.find((p) => String(p.sku || p.barcode || '').trim() === barcode) || items[0] || null;
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
  const EXACT = {
    'dr.clinic': ['dr-clinic', 'drclinic'],
    'nivea': ['nivea'],
    'garnier': ['garnier', 'garnier-ultra-doux'],
    "l'oréal paris": ['loreal', 'loreal-paris'],
    'loreal paris': ['loreal', 'loreal-paris'],
    'fayankou': ['fayankou'],
    'sadoer': ['sadoer'],
    'the body shop': ['the-body-shop'],
    'dissar': ['dissar'],
    'only': ['only'],
    'fair lady': ['fair-lady'],
    'triderma': ['triderma'],
    'dr.rashel': ['dr-rashel'],
    'dr.davey': ['dr-davey'],
    'beauty of joseon': ['beauty-of-joseon'],
    'la roche-posay': ['la-roche-posay'],
    'simple': ['simple'],
    'the ordinary': ['the-ordinary'],
    'embryolisse': ['embryolisse'],
    'eucerin': ['eucerin'],
    'vaseline': ['vaseline'],
    'neutrogena': ['neutrogena'],
    'glysolid': ['glysolid'],
    'obagi': ['obagi'],
    'revitalash': ['revitalash'],
    'tizo': ['tizo'],
    'dermedic': ['dermedic'],
    'qv': ['qv'],
    'bioaqua': ['bioaqua'],
    'floxia': ['floxia'],
    'panoxyl': ['panoxyl'],
    'foltene': ['foltene'],
    'eveline': ['eveline'],
    'beauty formulas': ['beauty-formulas'],
    'aveeno': ['aveeno'],
    'cantu': ['cantu'],
    'derma 101': ['derma-101'],
    'dr.davey': ['dr-davey'],
    'dr.rashel': ['dr-rashel'],
    'missha': ['missha'],
    'babaria': ['babaria'],
    'essence': ['essence'],
    'yc': ['yc'],
    'wardah': ['wardah'],
    'himalaya': ['himalaya'],
    'skinceuticals': ['skinceuticals'],
    'collistar': ['collistar'],
    'snow white': ['snow-white'],
  };

  const key = brandEn.toLowerCase().trim();
  const slugCandidates = EXACT[key] || [brandSlug(brandEn)];

  for (const slug of slugCandidates) {
    if (brandCache.bySlug.has(slug)) return brandCache.bySlug.get(slug);
  }

  for (const raw of [brandEn, brandAr].filter(Boolean)) {
    const exact = brandCache.list.find((b) => {
      const names = [b.nameEn, b.nameAr, b.name].filter(Boolean).map((s) => s.trim().toLowerCase());
      return names.includes(raw.toLowerCase().trim());
    });
    if (exact) return exact.id;
  }

  const name = brandEn || brandAr;
  if (!name) return null;
  const slug = slugCandidates[0] || brandSlug(name);
  if (DRY_RUN) return `dry-${slug}`;
  const created = await api('/brands', {
    method: 'POST',
    body: { name: brandEn || name, slug },
  });
  brandCache.bySlug.set(slug, created.id);
  brandCache.list.push({ id: created.id, slug, nameEn: brandEn, nameAr: brandAr });
  return created.id;
}

async function importOne(brandCache, barcode, pos, state) {
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported' };

  const override = getCareOverride(barcode);
  if (!override) return { status: 'skip', reason: 'no content override' };

  const brandEn = override.brandEn || '';
  const brandAr = override.brandAr || '';
  const brandId = await resolveBrandId(brandCache, brandEn, brandAr);
  if (!brandId) return { status: 'skip', reason: 'no brand' };

  const content = buildCareContent({
    barcode,
    brandEn,
    brandAr,
    categoryEn: 'Care',
    categoryAr: 'عناية',
    posName: pos?.pos?.name,
    leaf: '',
  });

  const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories('', {
    barcode,
    brandEn,
    brandAr,
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
    imageIds: [],
  };

  if (DRY_RUN) {
    return { status: 'ok', dry: true, subCount: subcategoryIds.length, tertCount: tertiaryCategoryIds.length };
  }

  const created = await api('/products', { method: 'POST', body: payload });
  state.imported[barcode] = { id: created.id, at: Date.now(), stock: pos?.pos?.stock };
  saveState(state);
  return {
    status: 'ok',
    id: created.id,
    stock: pos?.pos?.stock,
    subCount: subcategoryIds.length,
    tertCount: tertiaryCategoryIds.length,
  };
}

async function main() {
  await getToken();
  const brandCache = await loadBrands();
  const state = loadState();
  const posMap = await lookupPosBatch(TARGET);

  console.log(`Batch large sequential import | barcodes=${TARGET.length} | delay=${DELAY_MS}ms | dry=${DRY_RUN ? 'yes' : 'no'}\n`);

  const stats = { ok: 0, fail: 0, skip: 0 };

  for (let i = 0; i < TARGET.length; i += 1) {
    const barcode = TARGET[i];
    const hit = posMap[barcode];
    const stock = hit?.pos?.stock ?? 0;

    if (i > 0) await sleep(DELAY_MS);

    if (hit?.inApp?.id || state.imported[barcode]) {
      stats.skip += 1;
      state.skipped[barcode] = { reason: 'already in app', at: Date.now(), id: hit?.inApp?.id || state.imported[barcode]?.id };
      saveState(state);
      console.log(`SKIP ${barcode} — already imported`);
      continue;
    }

    const preExisting = await verifyProduct(barcode);
    if (preExisting?.id) {
      stats.skip += 1;
      state.imported[barcode] = { id: preExisting.id, at: Date.now(), stock: hit?.pos?.stock, via: 'pre-existing' };
      saveState(state);
      console.log(`SKIP ${barcode} — already in catalog id=${preExisting.id}`);
      continue;
    }

    if (stock < MIN_STOCK) {
      stats.skip += 1;
      state.skipped[barcode] = { reason: `stock=${stock}`, at: Date.now() };
      saveState(state);
      console.log(`SKIP ${barcode} — stock=${stock}`);
      continue;
    }

    if (!getCareOverride(barcode)) {
      stats.skip += 1;
      state.skipped[barcode] = { reason: 'no override', at: Date.now() };
      saveState(state);
      console.log(`SKIP ${barcode} — no override`);
      continue;
    }

    try {
      const result = await importOne(brandCache, barcode, hit, state);
      if (result.status !== 'ok') {
        stats.skip += 1;
        state.skipped[barcode] = { reason: result.reason, at: Date.now() };
        saveState(state);
        console.log(`SKIP ${barcode} — ${result.reason}`);
        continue;
      }

      if (DRY_RUN) {
        stats.ok += 1;
        console.log(`OK ${barcode} (dry-run)`);
        continue;
      }

      const verified = await verifyProduct(barcode);
      if (verified?.id) {
        stats.ok += 1;
        console.log(`OK ${barcode} id=${verified.id} stock=${result.stock ?? stock}`);
      } else {
        stats.fail += 1;
        console.log(`FAIL ${barcode} — POST ok but GET /products?sku=${barcode} returned nothing`);
      }
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

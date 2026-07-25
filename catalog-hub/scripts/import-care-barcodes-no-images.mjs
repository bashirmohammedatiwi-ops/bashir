#!/usr/bin/env node
/**
 * Import care products by barcode list — no images, manual overrides required.
 * Usage: node scripts/import-care-barcodes-no-images.mjs
 * Env: BARCODES=8809...,5031...  MIN_STOCK=1  DRY_RUN=1
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
const STATE_FILE = process.env.STATE_FILE
  || path.join(__dirname, '../data/care-barcode-no-image-import-state.json');
const DEFAULT_BARCODES_FILE = process.env.BARCODES_FILE
  || path.join(__dirname, '../data/care-batch51-barcodes.txt');

const DEFAULT_BARCODES = readFileSync(DEFAULT_BARCODES_FILE, 'utf8')
  .trim()
  .split(/\s+/)
  .filter(Boolean);

const BARCODES = (process.env.BARCODES || '')
  .split(/[\s,]+/)
  .filter(Boolean);
const TARGET = [...new Set((BARCODES.length ? BARCODES : DEFAULT_BARCODES).map((b) => b.trim()))];

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

async function lookupPosBatch(barcodes) {
  if (!barcodes.length) return {};
  const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes } });
  return res.items || {};
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
    'the body shop': ['the-body-shop', 'body-shop'],
    elizavecca: ['elizavecca'],
    'mario badescu': ['mario-badescu'],
    olay: ['olay'],
    fayankou: ['fayankou'],
    sadoer: ['sadoer'],
    mooyam: ['mooyam'],
    'nashi argan': ['nashi-argan', 'nashi'],
    "l'oréal professionnel": ['loreal', 'loreal-paris'],
    "l'oréal paris elvive": ['loreal', 'loreal-paris'],
    "l'oreal": ['loreal', 'loreal-paris'],
    'garnier ultra doux': ['garnier-ultra-doux', 'garnier'],
    'kérastase': ['kerastase'],
    hairburst: ['hairburst'],
    elebva: ['elebva'],
    nook: ['nook-difference', 'nook'],
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
  if (state.imported[barcode]) return { status: 'skip', reason: 'already imported this run' };

  const override = getCareOverride(barcode);
  if (!override) return { status: 'skip', reason: 'no content override' };

  const brandEn = override.brandEn || override.nameEn?.split(' ').slice(0, 2).join(' ') || '';
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
    console.log(`DRY ${barcode} | ${content.nameEn} | subs=${subcategoryIds.length} tert=${tertiaryCategoryIds.length}`);
    return { status: 'ok', dry: true };
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

  console.log(`Barcodes: ${TARGET.length} | min stock: ${MIN_STOCK} | dry=${DRY_RUN ? 'yes' : 'no'}\n`);

  const stats = { ok: 0, skip: 0, fail: 0 };

  for (const barcode of TARGET) {
    const hit = posMap[barcode];
    const stock = hit?.pos?.stock ?? 0;

    if (hit?.inApp?.id) {
      stats.skip += 1;
      console.log(`SKIP_IN_APP ${barcode}`);
      continue;
    }
    if (stock < MIN_STOCK) {
      stats.skip += 1;
      console.log(`SKIP_NO_STOCK ${barcode} stock=${stock}`);
      continue;
    }
    if (!getCareOverride(barcode)) {
      stats.skip += 1;
      console.log(`SKIP_NO_OVERRIDE ${barcode}`);
      continue;
    }

    try {
      const r = await importOne(brandCache, barcode, hit, state);
      if (r.status === 'ok') {
        stats.ok += 1;
        console.log(`OK ${barcode} stock=${r.stock} subs=${r.subCount} tert=${r.tertCount}${r.id ? ` id=${r.id}` : ''}`);
      } else {
        stats.skip += 1;
        console.log(`SKIP ${barcode} — ${r.reason}`);
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

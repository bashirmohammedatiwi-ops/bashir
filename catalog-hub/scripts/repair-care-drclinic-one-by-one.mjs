#!/usr/bin/env node
/**
 * Verify and apply Dr.Clinic product names, descriptions and categories from care-batch49-products.json.
 *
 * Usage:
 *   node scripts/build-care-batch49-products.mjs   # regenerate source JSON first
 *   LIST=1 node scripts/repair-care-drclinic-one-by-one.mjs
 *   node scripts/repair-care-drclinic-one-by-one.mjs
 *   BARCODES=8680923356242 node scripts/repair-care-drclinic-one-by-one.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '../data/care-batch49-products.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const START = Math.max(1, Number(process.env.START || 1));
const LIMIT = Number(process.env.LIMIT || 0);
const LIST = process.env.LIST === '1';
const ONLY = (process.env.BARCODES || '').split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function loadJson(p, fb) {
  if (!existsSync(p)) return fb;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; }
}

function toFix(p) {
  return {
    barcode: p.barcode,
    brandEn: p.brandEn,
    brandAr: p.brandAr,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    typeKey: p.typeKey,
    sub: p.subcategorySlugs || p.sub || [],
    tert: p.tertiarySlugs || p.tert || [],
    introEn: (p.descriptionEn || '').split('\n\n')[0],
    introAr: (p.descriptionAr || '').split('\n\n')[0],
    descriptionEn: p.descriptionEn,
    descriptionAr: p.descriptionAr,
  };
}

const ALL = loadJson(SOURCE, []).filter((p) => p.brandEn === 'Dr.Clinic').map(toFix);

async function findProduct(barcode) {
  const res = await api(`/products?limit=5&search=${encodeURIComponent(barcode)}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  return items.find((x) => String(x.sku || x.barcode || '').trim() === barcode) || null;
}

async function resolveBrand(brandEn) {
  const brands = await api('/brands?limit=500');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const slug = brandEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hit = list.find((b) => (b.slug || '').toLowerCase() === slug
    || [b.nameEn, b.name].filter(Boolean).some((n) => n.toLowerCase() === brandEn.toLowerCase()));
  if (hit) return hit.id;
  try {
    const created = await api('/brands', { method: 'POST', body: { name: brandEn, slug } });
    return created.id;
  } catch {
    const retry = list.find((b) => (b.slug || '').toLowerCase() === slug);
    if (retry) return retry.id;
    throw new Error(`brand resolve failed: ${brandEn}`);
  }
}

function printList() {
  console.log('══════════════════════════════════════════════════');
  console.log(`Dr.Clinic fixes ready: ${ALL.length}`);
  console.log('══════════════════════════════════════════════════\n');
  ALL.forEach((f, i) => console.log(`[${i + 1}] ${f.barcode} | ${f.nameEn}`));
}

async function main() {
  if (LIST) {
    printList();
    return;
  }
  if (!ALL.length) {
    console.error('No Dr.Clinic products in care-batch49-products.json');
    process.exit(1);
  }

  await getToken();
  let queue = ALL;
  if (ONLY.length) queue = queue.filter((p) => ONLY.includes(p.barcode));

  const start = START - 1;
  const end = LIMIT > 0 ? Math.min(queue.length, start + LIMIT) : queue.length;
  const slice = queue.slice(start, end);

  console.log('══════════════════════════════════════════════════');
  console.log(`Dr.Clinic repair | total=${ALL.length} | run=${slice.length}`);
  console.log('══════════════════════════════════════════════════\n');

  let overrides = loadJson(OUT, []);
  const map = new Map(overrides.map((p) => [p.barcode, p]));
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < slice.length; i += 1) {
    const p = slice[i];
    const n = start + i + 1;
    if (i > 0) await sleep(DELAY_MS);

    try {
      const brandId = await resolveBrand(p.brandEn);
      const body = {
        name: p.nameAr,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        description: p.descriptionAr,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        brandId,
        subcategoryIds: p.sub.map((s) => CARE_SUB_SLUGS[s]).filter(Boolean),
        tertiaryCategoryIds: p.tert.map((s) => CARE_TERTIARY_SLUGS[s]).filter(Boolean),
      };

      const existing = await findProduct(p.barcode);
      let action;
      if (existing?.id) {
        await api(`/products/${existing.id}`, { method: 'PATCH', body });
        action = 'PATCH';
      } else {
        await api('/products', {
          method: 'POST',
          body: {
            sku: p.barcode,
            barcode: p.barcode,
            slug: `dr-clinic-${p.barcode}`.slice(0, 85),
            brandId,
            categoryId: CARE_CATEGORY_ID,
            ingredients: '',
            howToUse: '',
            price: 0,
            stock: 0,
            isActive: true,
            imageIds: [],
            ...body,
          },
        });
        action = 'CREATE';
      }

      await sleep(400);
      const verified = await findProduct(p.barcode);
      if (!verified || verified.nameEn !== p.nameEn || verified.nameAr !== p.nameAr) {
        throw new Error(`verify failed: ${verified?.nameEn}`);
      }

      map.set(p.barcode, {
        barcode: p.barcode,
        brandEn: p.brandEn,
        brandAr: p.brandAr,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        typeKey: p.typeKey,
        subcategorySlugs: p.sub,
        tertiarySlugs: p.tert,
        descriptionEn: p.descriptionEn,
        descriptionAr: p.descriptionAr,
      });
      writeFileSync(OUT, `${JSON.stringify([...map.values()], null, 2)}\n`);

      ok += 1;
      console.log(`[${n}/${slice.length}] OK-${action} | ${p.barcode}`);
      console.log(`  EN: ${p.nameEn}`);
      console.log(`  AR: ${p.nameAr}\n`);
    } catch (err) {
      fail += 1;
      console.log(`[${n}/${slice.length}] FAIL | ${p.barcode} | ${err.message}`);
    }
  }

  console.log('══════════════════════════════════════════════════');
  console.log(`Done: OK=${ok} FAIL=${fail}`);
  console.log('══════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

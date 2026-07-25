#!/usr/bin/env node
/**
 * Reclassify mis-tagged Dr.Clinic (868092*) products as Nippon with corrected EN/AR names and descriptions.
 *
 * Usage:
 *   LIST=1 node scripts/repair-care-nippon-drclinic-one-by-one.mjs
 *   node scripts/repair-care-nippon-drclinic-one-by-one.mjs
 *   BARCODES=8680923356143 node scripts/repair-care-nippon-drclinic-one-by-one.mjs
 *   START=1 LIMIT=5 node scripts/repair-care-nippon-drclinic-one-by-one.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXES_PATH = path.join(__dirname, '../data/care-nippon-drclinic-fixes.json');
const STATE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const START = Math.max(1, Number(process.env.START || 1));
const LIMIT = Number(process.env.LIMIT || 0);
const LIST = process.env.LIST === '1';
const ONLY = (process.env.BARCODES || '').split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function loadJson(p, fallback) {
  if (!existsSync(p)) return fallback;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
}

const FIXES = loadJson(FIXES_PATH, []);

function desc(p) {
  const sizeM = p.nameEn.match(/(\d+(?:\.\d+)?)\s*(ml|g|pcs)\b/i);
  const size = sizeM ? sizeM[0] : 'As listed';
  const sizeAr = size.replace(/ml/i, ' مل').replace(/g/i, ' جم').replace(/pcs/i, ' قطعة');
  const typeMap = {
    serum: ['Face serum', 'سيروم للوجه'],
    toner: ['Facial toner', 'تونر للوجه'],
    cleanser: ['Facial cleanser', 'غسول للوجه'],
    cream: ['Face cream', 'كريم للوجه'],
    'body-cream': ['Body moisturiser', 'مرطب للجسم'],
    'body-wash': ['Body cleanser', 'غسول للجسم'],
    deodorant: ['Deodorant', 'مزيل عرق'],
    sunscreen: ['Sunscreen', 'واقي شمس'],
    'lip-balm': ['Lip care', 'العناية بالشفاه'],
    moisturizer: ['Moisturiser', 'مرطب'],
    shampoo: ['Shampoo', 'شامبو'],
  };
  const [typeEn, typeAr] = typeMap[p.typeKey] || ['Skincare', 'عناية'];
  const catEn = p.typeKey === 'shampoo' ? 'Hair care' : /body|foot|deodorant/i.test(p.typeKey) ? 'Body care' : 'Face care';
  const catAr = p.typeKey === 'shampoo' ? 'العناية بالشعر' : /body|foot|deodorant/i.test(p.typeKey) ? 'العناية بالجسم' : 'العناية بالوجه';
  return {
    descriptionEn: `${p.introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: Targeted formula · Daily care · Visible results\n◆ Suitable for: Daily skincare routines\n◆ Size: ${size}`,
    descriptionAr: `${p.introAr}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: تركيبة مركّزة · عناية يومية · نتائج ملموسة\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${sizeAr}`,
  };
}

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
  const created = await api('/brands', { method: 'POST', body: { name: brandEn, slug } });
  return created.id;
}

function drClinicQueue(products) {
  return products
    .filter((p) => /dr\.?clinic/i.test(p.brandEn || ''))
    .map((p) => p.barcode);
}

function printList(products) {
  const queue = drClinicQueue(products);
  const fixSet = new Set(FIXES.map((f) => f.barcode));
  console.log('══════════════════════════════════════════════════');
  console.log(`Dr.Clinic → Nippon queue | mis-tagged=${queue.length} | fixes ready=${FIXES.length}`);
  console.log('══════════════════════════════════════════════════\n');
  queue.forEach((barcode, i) => {
    const cur = products.find((p) => p.barcode === barcode);
    const fix = FIXES.find((f) => f.barcode === barcode);
    console.log(`[${i + 1}/${queue.length}] ${barcode}${fix ? ' ✓ FIX' : ' ✗ NO FIX'}`);
    console.log(`  Current: ${cur?.nameEn?.slice(0, 70)}`);
    if (fix) console.log(`  Target:  ${fix.nameEn.slice(0, 70)}`);
    console.log('');
  });
  const pending = queue.filter((b) => !fixSet.has(b));
  if (pending.length) console.log(`Missing fixes: ${pending.join(', ')}`);
}

async function main() {
  const products = loadJson(OUT, []);
  const state = loadJson(STATE, { done: {}, skipped: {}, failed: {} });

  if (LIST) {
    printList(products);
    return;
  }

  if (!FIXES.length) {
    console.error(`No fixes in ${FIXES_PATH}`);
    process.exit(1);
  }

  await getToken();

  const targetSet = new Set(drClinicQueue(products));
  let queue = FIXES.filter((p) => targetSet.has(p.barcode));
  if (ONLY.length) queue = queue.filter((p) => ONLY.includes(p.barcode));

  const start = START - 1;
  const end = LIMIT > 0 ? Math.min(queue.length, start + LIMIT) : queue.length;
  const slice = queue.slice(start, end);

  console.log('══════════════════════════════════════════════════');
  console.log(`Dr.Clinic → Nippon | mis-tagged=${targetSet.size} | fixes=${queue.length} | run=${slice.length}`);
  console.log('══════════════════════════════════════════════════\n');

  if (!slice.length) {
    console.log('Nothing to apply. Run LIST=1 to inspect queue.');
    return;
  }

  let overrides = loadJson(OUT, []);
  const map = new Map(overrides.map((p) => [p.barcode, p]));
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < slice.length; i += 1) {
    const p = slice[i];
    const n = start + i + 1;
    if (i > 0) await sleep(DELAY_MS);
    const d = desc(p);
    const brandId = await resolveBrand(p.brandEn);
    const body = {
      name: p.nameAr,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      description: d.descriptionAr,
      descriptionAr: d.descriptionAr,
      descriptionEn: d.descriptionEn,
      brandId,
      subcategoryIds: p.sub.map((s) => CARE_SUB_SLUGS[s]).filter(Boolean),
      tertiaryCategoryIds: p.tert.map((s) => CARE_TERTIARY_SLUGS[s]).filter(Boolean),
    };

    try {
      const existing = await findProduct(p.barcode);
      if (!existing?.id) throw new Error('product not found in API');

      await api(`/products/${existing.id}`, { method: 'PATCH', body });
      await sleep(400);
      const verified = await findProduct(p.barcode);
      if (!verified || verified.nameAr !== p.nameAr || verified.nameEn !== p.nameEn) {
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
        ...d,
      });
      writeFileSync(OUT, `${JSON.stringify([...map.values()], null, 2)}\n`);

      state.done[p.barcode] = {
        id: existing.id,
        action: 'patch-nippon',
        verified: true,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        at: Date.now(),
      };
      delete state.failed[p.barcode];
      writeFileSync(STATE, JSON.stringify(state, null, 2));

      ok += 1;
      const remaining = [...targetSet].filter((b) => {
        const cur = map.get(b);
        return cur && /dr\.?clinic/i.test(cur.brandEn || '');
      }).length;
      console.log(`[${n}/${slice.length}] OK-PATCH | ${p.barcode} | Dr.Clinic left: ${remaining}`);
      console.log(`  EN: ${p.nameEn}`);
      console.log(`  AR: ${p.nameAr}\n`);
    } catch (err) {
      fail += 1;
      state.failed[p.barcode] = { reason: err.message, at: Date.now() };
      writeFileSync(STATE, JSON.stringify(state, null, 2));
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

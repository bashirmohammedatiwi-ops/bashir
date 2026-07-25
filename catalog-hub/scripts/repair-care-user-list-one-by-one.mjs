#!/usr/bin/env node
/**
 * Apply care-user-list-fixes.json to API (one-by-one with verify).
 *
 * Usage:
 *   node scripts/build-care-user-list-fixes.mjs
 *   LIST=1 node scripts/repair-care-user-list-one-by-one.mjs
 *   node scripts/repair-care-user-list-one-by-one.mjs
 *   BARCODES=5011451103870 node scripts/repair-care-user-list-one-by-one.mjs
 *   START=1 LIMIT=20 node scripts/repair-care-user-list-one-by-one.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXES_PATH = path.join(__dirname, '../data/care-user-list-fixes.json');
const STATE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const START = Math.max(1, Number(process.env.START || 1));
const LIMIT = Number(process.env.LIMIT || 0);
const LIST = process.env.LIST === '1';
const ONLY = (process.env.BARCODES || '').split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

const EXACT = {
  'dr.clinic': ['dr-clinic', 'drclinic'],
  'l\'oréal paris': ['loreal', 'loreal-paris'],
  'l\'oreal paris': ['loreal', 'loreal-paris'],
  loreal: ['loreal', 'loreal-paris'],
  'the ordinary': ['the-ordinary'],
  'now foods': ['now-foods', 'now'],
  'foltene pharma': ['foltene', 'foltene-pharma'],
  foltene: ['foltene', 'foltene-pharma'],
  'st. ives': ['st-ives'],
  'johnson\'s': ['johnsons', 'johnson'],
  'pond\'s': ['ponds'],
  nippon: ['nippon'],
  qv: ['qv'],
  garnier: ['garnier'],
  neutrogena: ['neutrogena'],
  eucerin: ['eucerin'],
  simple: ['simple'],
  bioliq: ['bioliq'],
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function loadJson(p, fb) {
  if (!existsSync(p)) return fb;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; }
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
    'eye-cream': ['Eye care', 'العناية بالعين'],
    scrub: ['Face scrub', 'مقشر للوجه'],
    shampoo: ['Shampoo', 'شامبو'],
    makeup: ['Makeup', 'مكياج'],
    moisturizer: ['Moisturiser', 'مرطب'],
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
  const key = brandEn.toLowerCase();
  const candidates = EXACT[key] || [key.replace(/[^a-z0-9]+/g, '-')];
  const hit = list.find((b) => candidates.includes((b.slug || '').toLowerCase())
    || [b.nameEn, b.name].filter(Boolean).some((n) => n.toLowerCase() === key));
  if (hit) return hit.id;
  const slug = candidates[0];
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
  console.log(`User list fixes ready: ${FIXES.length}`);
  console.log('══════════════════════════════════════════════════\n');
  FIXES.slice(0, 30).forEach((f, i) => {
    console.log(`[${i + 1}] ${f.barcode} | ${f.brandEn} | ${f.nameEn.slice(0, 55)}`);
  });
  if (FIXES.length > 30) console.log(`... +${FIXES.length - 30} more`);
}

async function main() {
  if (LIST) {
    printList();
    return;
  }
  if (!FIXES.length) {
    console.error('Run: node scripts/build-care-user-list-fixes.mjs');
    process.exit(1);
  }

  await getToken();
  let queue = FIXES;
  if (ONLY.length) queue = queue.filter((p) => ONLY.includes(p.barcode));

  const start = START - 1;
  const end = LIMIT > 0 ? Math.min(queue.length, start + LIMIT) : queue.length;
  const slice = queue.slice(start, end);

  console.log('══════════════════════════════════════════════════');
  console.log(`User list repair | fixes=${queue.length} | run=${slice.length}`);
  console.log('══════════════════════════════════════════════════\n');

  let overrides = loadJson(OUT, []);
  const map = new Map(overrides.map((p) => [p.barcode, p]));
  const state = loadJson(STATE, { done: {}, skipped: {}, failed: {} });
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < slice.length; i += 1) {
    const p = slice[i];
    const n = start + i + 1;
    if (i > 0) await sleep(DELAY_MS);
    const d = desc(p);

    try {
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

      const existing = await findProduct(p.barcode);
      let id;
      let action;
      if (existing?.id) {
        await api(`/products/${existing.id}`, { method: 'PATCH', body });
        id = existing.id;
        action = 'PATCH';
      } else {
        const created = await api('/products', {
          method: 'POST',
          body: {
            sku: p.barcode,
            barcode: p.barcode,
            slug: `${p.brandEn}-${p.barcode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 85),
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
        id = created.id;
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
        ...d,
      });
      writeFileSync(OUT, `${JSON.stringify([...map.values()], null, 2)}\n`);

      state.done[p.barcode] = {
        id, action: action.toLowerCase(), verified: true,
        nameEn: p.nameEn, nameAr: p.nameAr, at: Date.now(),
      };
      delete state.failed[p.barcode];
      writeFileSync(STATE, JSON.stringify(state, null, 2));

      ok += 1;
      console.log(`[${n}/${slice.length}] OK-${action} | ${p.barcode}`);
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

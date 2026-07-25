#!/usr/bin/env node
/**
 * Manual one-by-one review for care-batch-large SKIPPED products (POS garbled / no auto-id).
 *
 * Usage:
 *   LIST=1 node scripts/repair-care-skipped-one-by-one.mjs   # show queue + context
 *   node scripts/repair-care-skipped-one-by-one.mjs            # apply FIXES entries
 *   START=1 LIMIT=10 node scripts/repair-care-skipped-one-by-one.mjs
 *   BARCODES=42164104,42355083 node scripts/repair-care-skipped-one-by-one.mjs
 *
 * Add researched products to FIXES below, then run again.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const RESEARCH = path.join(__dirname, '../data/care-batch-large-research.json');
const STORE = path.join(__dirname, '../data/care-batch-large-store-lookup.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const START = Math.max(1, Number(process.env.START || 1));
const LIMIT = Number(process.env.LIMIT || 0);
const LIST = process.env.LIST === '1';
const ONLY = (process.env.BARCODES || '').split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

const BATCH2_PATH = path.join(__dirname, '../data/care-skipped-fixes-batch2.json');

/** @type {Array<object>} — batch 1 (applied earlier) */
const FIXES_BATCH1 = [
  {
    barcode: '42164104',
    brandEn: 'Nivea', brandAr: 'نيفيا',
    nameEn: 'Nivea Creme Multi-Purpose Moisturiser 60ml',
    nameAr: 'نيفيا كريم كلاسيكي متعدد الاستخدامات 60 مل',
    typeKey: 'cream', sub: ['care-skin-and-body-care', 'care-face-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Nivea Creme is the classic all-purpose moisturiser for face, hands and body.',
    introAr: 'كريم نيفيا الكلاسيكي مرطب متعدد الاستخدامات للوجه واليدين والجسم.',
  },
  {
    barcode: '42355083',
    brandEn: 'Nivea', brandAr: 'نيفيا',
    nameEn: 'Nivea MicellAIR Expert Waterproof Eye Make-Up Remover 125ml',
    nameAr: 'نيفيا ميسيلار Expert مزيل مكياج العيون المقاوم للماء 125 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nivea MicellAIR Expert gently removes waterproof eye makeup without harsh rubbing.',
    introAr: 'مزيل مكياج العيون نيفيا ميسيلار إكسبيرت يزيل المكياج المقاوم للماء بلطف.',
  },
  {
    barcode: '60018915',
    brandEn: 'Vaseline', brandAr: 'فازلين',
    nameEn: 'Vaseline Blue Seal Aloe Fresh Petroleum Jelly 100ml',
    nameAr: 'فازلين بلو سيل هلامي منعش بالصبار 100 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Vaseline Blue Seal Aloe Fresh locks in moisture and soothes dry, irritated skin.',
    introAr: 'فازلين بلو سيل بالصبار يحبس الرطوبة ويهدئ البشرة الجافة والمتهيجة.',
  },
  {
    barcode: '3574661450964',
    brandEn: "Johnson's", brandAr: 'جونسون',
    nameEn: "Johnson's Micellar Rose-Infused Cleansing Water 400ml",
    nameAr: 'جونسون ماء ميسيلار منظف بالورد 400 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: "Johnson's Rose Micellar Water removes makeup and impurities while hydrating skin.",
    introAr: 'ماء ميسيلار جونسون بالورد يزيل المكياج والشوائب مع ترطيب البشرة.',
  },
  {
    barcode: '5900017087665',
    brandEn: 'Nivea', brandAr: 'نيفيا',
    nameEn: 'Nivea Derma Skin Clear Cleansing Gel for Blemish-Prone Skin 150ml',
    nameAr: 'نيفيا ديرما سكين كلير جل غسول للبشرة المعرضة للحبوب 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care', 'care-derma-hub'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nivea Derma Skin Clear Gel cleanses pores with salicylic acid and niacinamide.',
    introAr: 'جل نيفيا ديرما سكين كلير ينظف المسام بحمض الساليسيليك والنياسيناميد.',
  },
  {
    barcode: '9005800352367',
    brandEn: 'Nivea', brandAr: 'نيفيا',
    nameEn: 'Nivea Rose Touch Two-Phase Eye Make-Up Remover 100ml',
    nameAr: 'نيفيا روز تاتش مزيل مكياج العيون ثنائي المرحلة 100 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nivea Rose Touch two-phase remover lifts waterproof eye makeup gently.',
    introAr: 'مزيل مكياج العيون نيفيا روز تاتش ثنائي المرحلة يزيل المكياج المقاوم للماء بلطف.',
  },
  {
    barcode: '3600524076085',
    brandEn: "L'Oréal Paris", brandAr: 'لوريال باريس',
    nameEn: "L'Oréal Paris Revitalift Vitamin C + Salicylic Acid Cleanser 150ml",
    nameAr: 'لوريال باريس Revitalift غسول فيتامين سي وحمض الساليسيليك 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: "L'Oréal Revitalift Vitamin C Cleanser brightens skin and helps unclog pores.",
    introAr: 'غسول لوريال Revitalift بفيتامين سي يفتح البشرة ويساعد على تنظيف المسام.',
  },
  {
    barcode: '3600523959631',
    brandEn: "L'Oréal Paris", brandAr: 'لوريال باريس',
    nameEn: "L'Oréal Paris Hyaluron Specialist Replumping Smoothing Toner 200ml",
    nameAr: 'لوريال باريس Hyaluron Specialist تونر مرطب ومملِّس 200 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: "L'Oréal Hyaluron Specialist Toner replumps skin with concentrated hyaluronic acid.",
    introAr: 'تونر لوريال Hyaluron Specialist يرطب البشرة ويملِّسها بتركيز من حمض الهيالورونيك.',
  },
  {
    barcode: '3600524019587',
    brandEn: "L'Oréal Paris", brandAr: 'لوريال باريس',
    nameEn: "L'Oréal Paris Revitalift 5% Glycolic Acid Peeling Toner 180ml",
    nameAr: 'لوريال باريس Revitalift تونر تقشير بحمض الجليكوليك 5% 180 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: "L'Oréal Revitalift Glycolic Toner gently exfoliates for smoother, glowing skin.",
    introAr: 'تونر لوريال Revitalift بالجليكوليك يقشّر بلطف لبشرة أكثر نعومة وإشراقاً.',
  },
  {
    barcode: '3600542488051',
    brandEn: 'Garnier', brandAr: 'غارنييه',
    nameEn: 'Garnier Pure Active HA Moisturizing Cleansing Emulsion 250ml',
    nameAr: 'غارنييه Pure Active HA غسول كريمي مرطب 250 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Garnier Pure Active HA Emulsion cleanses while supporting the skin moisture barrier.',
    introAr: 'إمulsion غارنييه Pure Active HA ينظف ويدعم حاجز ترطيب البشرة.',
  },
  {
    barcode: '6294016925769',
    brandEn: 'Garnier', brandAr: 'غارنييه',
    nameEn: 'Garnier SkinActive Micellar Cleansing Water Vitamin C 400ml',
    nameAr: 'غارنييه SkinActive ماء ميسيلار منظف بفيتامين سي 400 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Garnier Vitamin C Micellar Water cleanses, removes makeup and brightens dull skin.',
    introAr: 'ماء ميسيلar غارنييه بفيتامين سي ينظف ويزيل المكياج ويفتح البشرة الباهتة.',
  },
  {
    barcode: '3760019121642',
    brandEn: 'Soskin', brandAr: 'سوسكين',
    nameEn: 'Soskin Whitening Body Lotion 150ml',
    nameAr: 'سوسكين لوشن تفتيح للجسم والمناطق الحساسة 150 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Soskin Whitening Body Lotion hydrates while supporting a more even-looking tone.',
    introAr: 'لوشن سوسكين للتفتيح يرطب ويدعم مظهراً أكثر تجانساً للجسم.',
  },
  {
    barcode: '5281019046677',
    brandEn: 'Cosmaline', brandAr: 'كوزمالين',
    nameEn: 'Cosmaline Soft Wave Purifying Face Wash Oily Skin 250ml',
    nameAr: 'كوزمالين سوفت ويف غسول وجه منقٍ للبشرة الدهنية 250 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Cosmaline Soft Wave Face Wash purifies oily skin without over-drying.',
    introAr: 'غسول كوزمالين سوفت ويف ينقي البشرة الدهنية دون جفاف مفرط.',
  },
  {
    barcode: '5281019046684',
    brandEn: 'Cosmaline', brandAr: 'كوزمالين',
    nameEn: 'Cosmaline Moisturizing Face Wash Dry to Normal Skin 250ml',
    nameAr: 'كوزمالين غسول وجه مرطب للبشرة العادية إلى الجافة 250 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Cosmaline Moisturizing Face Wash cleanses dry to normal skin gently.',
    introAr: 'غسول كوزمالين المرطب ينظف البشرة العادية إلى الجافة بلطف.',
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function loadJson(p, fallback) {
  if (!existsSync(p)) return fallback;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
}

function loadFixes() {
  const batch2 = loadJson(BATCH2_PATH, []);
  return [...FIXES_BATCH1, ...(Array.isArray(batch2) ? batch2 : [])];
}

const FIXES = loadFixes();

function cleanText(s = '') {
  return String(s).replace(/[\u200e\u200f\u202a-\u202e\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();
}

function loadContext() {
  const researchRaw = loadJson(RESEARCH, []);
  const rows = Array.isArray(researchRaw) ? researchRaw : researchRaw.rows || [];
  const byResearch = Object.fromEntries(rows.map((r) => [r.barcode, r]));
  const storeRaw = loadJson(STORE, { rows: [] });
  const byStore = Object.fromEntries((storeRaw.rows || []).map((r) => [r.barcode, r]));
  return { byResearch, byStore };
}

function skippedQueue(state) {
  return Object.entries(state.skipped || {})
    .sort((a, b) => (a[1].at || 0) - (b[1].at || 0))
    .map(([barcode]) => barcode);
}

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
    'eye-cream': ['Eye care', 'العناية بالعين'],
    scrub: ['Face scrub', 'مقشر للوجه'],
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

function printList(state, { byResearch, byStore }) {
  const queue = skippedQueue(state);
  const fixSet = new Set(FIXES.map((f) => f.barcode));
  console.log('══════════════════════════════════════════════════');
  console.log(`SKIPPED review queue | total=${queue.length} | fixes ready=${FIXES.length}`);
  console.log('══════════════════════════════════════════════════\n');
  queue.forEach((barcode, i) => {
    const r = byResearch[barcode] || {};
    const s = byStore[barcode] || {};
    const inDone = state.done?.[barcode];
    const hint = s.elryan?.nameEn || s.miraaya?.nameEn || '';
    console.log(`[${i + 1}/${queue.length}] ${barcode}${fixSet.has(barcode) ? ' ✓ FIX' : ''}${inDone ? ' (in done — needs name upgrade)' : ''}`);
    console.log(`  POS: ${cleanText(r.posName || state.skipped[barcode]?.posName || '').slice(0, 70)}`);
    console.log(`  Guess: ${r.guessBrand || '—'} | stock: ${r.stock ?? '?'}`);
    if (inDone) console.log(`  Current: ${inDone.nameEn}`);
    if (hint) console.log(`  Store: ${hint.slice(0, 70)}`);
    console.log('');
  });
  const pending = queue.filter((b) => !fixSet.has(b));
  console.log(`Pending manual research: ${pending.length}`);
  if (pending.length) console.log(`Next: ${pending.slice(0, 5).join(', ')}`);
}

async function main() {
  const state = loadJson(STATE, { done: {}, skipped: {}, failed: {} });
  const ctx = loadContext();

  if (LIST) {
    printList(state, ctx);
    return;
  }

  await getToken();
  const skippedSet = new Set(skippedQueue(state));
  let queue = FIXES.filter((p) => skippedSet.has(p.barcode));
  if (ONLY.length) queue = queue.filter((p) => ONLY.includes(p.barcode));

  const start = START - 1;
  const end = LIMIT > 0 ? Math.min(queue.length, start + LIMIT) : queue.length;
  const slice = queue.slice(start, end);
  const totalSkipped = skippedSet.size;

  console.log('══════════════════════════════════════════════════');
  console.log(`Skipped manual review | skipped=${totalSkipped} | fixes ready=${queue.length} | run=${slice.length}`);
  console.log('══════════════════════════════════════════════════\n');

  if (!slice.length) {
    console.log('No fixes to apply. Run LIST=1 to see queue, then add FIXES entries.');
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
        id, action: action.toLowerCase(), verified: true,
        nameEn: p.nameEn, nameAr: p.nameAr, at: Date.now(),
      };
      delete state.failed[p.barcode];
      delete state.skipped[p.barcode];
      writeFileSync(STATE, JSON.stringify(state, null, 2));

      ok += 1;
      const remaining = Object.keys(state.skipped || {}).length;
      console.log(`[${n}/${slice.length}] OK-${action} | ${p.barcode} | skipped left: ${remaining}`);
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
  console.log(`Done: OK=${ok} FAIL=${fail} | skipped remaining=${Object.keys(state.skipped || {}).length}`);
  console.log('══════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

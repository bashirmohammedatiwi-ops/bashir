#!/usr/bin/env node
/**
 * Apply verified barcode corrections for the user barcode list, update JSON, patch API.
 * Usage: node scripts/apply-user-barcode-corrections.mjs
 * Env: DRY_RUN=1  PATCH_API=0  DELAY_MS=800
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BATCH140_OVERRIDES } from '../lib/core/care-content-overrides-batch140.js';
import { resolveCareCategories } from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.join(__dirname, '../data/care-batch140-products.json');
const STATE_FILE = path.join(__dirname, '../data/care-batch140-import-state.json');
const NAME_AR_FILE = path.join(__dirname, 'care-batch140-name-ar.mjs');
const DRY_RUN = process.env.DRY_RUN === '1';
const PATCH_API = process.env.PATCH_API !== '0';
const DELAY_MS = Number(process.env.DELAY_MS || 800);

const BRAND_SPECS = {
  'Nashi Argan': { slug: 'nashi-argan', nameEn: 'Nashi Argan', nameAr: 'ناشي أرغان', fallbackSlug: 'nashi' },
  "L'Oreal": { slug: 'loreal', nameEn: "L'Oreal", nameAr: 'لوريال', fallbackSlug: 'loreal-paris' },
  'Garnier Ultra Doux': { slug: 'garnier-ultra-doux', nameEn: 'Garnier Ultra Doux', nameAr: 'غارنييه ألترا دو', fallbackSlug: 'garnier' },
  'Kérastase': { slug: 'kerastase', nameEn: 'Kérastase', nameAr: 'كيراستاس' },
  Hairburst: { slug: 'hairburst', nameEn: 'Hairburst', nameAr: 'هيربيرست' },
  ELEBVA: { slug: 'elebva', nameEn: 'ELEBVA', nameAr: 'إليبفا' },
  NOOK: { slug: 'nook-difference', nameEn: 'NOOK', nameAr: 'NOOK' },
};

function desc({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size }) {
  const sizeEn = size;
  return {
    descriptionEn: `${introEn}

◆ Category: ${catEn}
◆ Product type: ${typeEn}
◆ Key benefits: ${benefitsEn.join(' · ')}
◆ Suitable for: Daily hair care routines
◆ Size: ${sizeEn}`,
    descriptionAr: `${introAr}

◆ التصنيف: ${catAr}
◆ نوع المنتج: ${typeAr}
◆ الفوائد الرئيسية: ${benefitsAr.join(' · ')}
◆ الأنسب لـ: روتين العناية اليومي بالشعر
◆ الحجم: ${size}`,
  };
}

function makeEntry(p) {
  const sub = p.subcategorySlugs || ['care-hair-care'];
  const tertiary = p.tertiarySlugs || ['care-hair-care-shampoo-conditioners'];
  const d = desc(p);
  return {
    barcode: p.barcode,
    brandEn: p.brandEn,
    brandAr: p.brandAr,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    typeKey: p.typeKey,
    subcategorySlugs: sub,
    tertiarySlugs: tertiary,
    introEn: p.introEn,
    introAr: p.introAr,
    catEn: p.catEn,
    catAr: p.catAr,
    typeEn: p.typeEn,
    typeAr: p.typeAr,
    benefitsEn: p.benefitsEn,
    benefitsAr: p.benefitsAr,
    size: p.size,
    ...d,
  };
}

/** Verified corrections — barcode → partial product fields */
const CORRECTIONS = {
  // Wrong product: Wonder Water was labelled as Bond Repair Pre-Shampoo
  '3600524004538': makeEntry({
    barcode: '3600524004538',
    brandEn: "L'Oreal",
    brandAr: 'لوريال',
    nameEn: 'Elvive Colour Protect 8 Second Wonder Water 200ml',
    nameAr: 'علاج ماء لامع لوريال باريس إلفيف لحماية اللون 8 ثوانٍ 200 مل',
    typeKey: 'hair-mask',
    tertiarySlugs: ['care-hair-care-hair-treatment'],
    typeEn: 'Rinse-out shine treatment',
    typeAr: 'علاج لامع يُشطف',
    introEn: 'Elvive Colour Protect Wonder Water is a lamellar rinse-out treatment that boosts shine on coloured hair in just 8 seconds.',
    introAr: 'علاج ماء لامع إلفيف لحماية اللون يُشطف ويعزّز لمعان الشعر المصبوغ في 8 ثوانٍ فقط.',
    benefitsEn: ['8-second rinse-out treatment', 'Boosts colour shine', 'For coloured hair'],
    benefitsAr: ['علاج يُشطف في 8 ثوانٍ', 'يعزّز لمعان اللون', 'للشعر المصبوغ'],
    catEn: 'Hair care',
    catAr: 'العناية بالشعر',
    size: '200 مل',
  }),
  '4008668230971': makeEntry({
    barcode: '4008668230971',
    brandEn: 'ELEBVA',
    brandAr: 'إليبفا',
    nameEn: 'ELEBVA Elea Professional Colour & Care 6.1 Dark Ash Blond',
    nameAr: 'صبغة شعر إليبفا كولور آند كير 6.1 أشقر رمادي داكن',
    typeKey: 'hair-color',
    tertiarySlugs: ['care-hair-care-hair-coloring'],
    typeEn: 'Permanent hair color kit',
    typeAr: 'طقم صبغة دائمة',
    introEn: 'Elea Professional Colour & Care 6.1 Dark Ash Blond is a permanent cream colour kit with Oils Care Complex for 100% grey coverage.',
    introAr: 'صبغة إليبفا كولور آند كير 6.1 أشقر رمادي داكن طقم كريمي دائم بتركيبة زيوت للعناية مع تغطية 100% للشيب.',
    benefitsEn: ['Shade 6.1 Dark Ash Blond', '100% grey coverage', 'Nourishing oils complex'],
    benefitsAr: ['درجة 6.1 أشقر رمادي داكن', 'تغطية كاملة للشيب', 'تركيبة زيوت مغذية'],
    catEn: 'Hair colour',
    catAr: 'صبغة الشعر',
    size: '123 مل',
  }),
};

/** New products verified by barcode but missing from batch140 JSON */
const NEW_PRODUCTS = [
  makeEntry({
    barcode: '3610340673887',
    brandEn: "L'Oreal",
    brandAr: 'لوريال',
    nameEn: 'Elvive Glycolic Gloss Leave-In Combing Cream 200ml',
    nameAr: 'كريم تصفيف لوريال باريس إلفيف جليكوليك جلوس بدون شطف 200 مل',
    typeKey: 'leave-in',
    tertiarySlugs: ['care-hair-care-hair-treatment'],
    typeEn: 'Leave-in combing cream',
    typeAr: 'كريم تصفيف بدون شطف',
    introEn: 'Elvive Glycolic Gloss Leave-In Combing Cream seals cuticles with glycolic acid for mirror shine and easier detangling.',
    introAr: 'كريم تصفيف إلفيف جليكوليك جلوس بدون شطف يغلق قشرة الشعر بحمض الجليكوليك للمعان والتصفيف السهل.',
    benefitsEn: ['2% glycolic gloss complex', 'Seals cuticles', 'Heat and UV protection'],
    benefitsAr: ['تركيبة جليكوليك 2%', 'يغلق قشرة الشعر', 'حماية من الحرارة والأشعة'],
    catEn: 'Hair treatment',
    catAr: 'علاج الشعر',
    size: '200 مل',
  }),
  makeEntry({
    barcode: '3474637154981',
    brandEn: 'Kérastase',
    brandAr: 'كيراستاس',
    nameEn: 'Kérastase Nutritive Lait Vital Conditioner 200ml',
    nameAr: 'بلسم كيراستاس nutritive لايت فيтал 200 مل',
    typeKey: 'conditioner',
    typeEn: 'Hydrating conditioner',
    typeAr: 'بلسم مرطب',
    introEn: 'Kérastase Nutritive Lait Vital is an ultra-light detangling conditioner that nourishes dry hair without weighing it down.',
    introAr: 'بلسم كيراستاس nutritive لايت فيтал خفيف يفك التشابك ويغذي الشعر الجاف دون ثقل.',
    benefitsEn: ['Ultra-light formula', 'Detangles dry hair', 'High nutrition'],
    benefitsAr: ['تركيبة خفيفة', 'يفك تشابك الشعر الجاف', 'تغذية عالية'],
    catEn: 'Hair conditioning',
    catAr: 'بلسم الشعر',
    size: '200 مل',
  }),
  makeEntry({
    barcode: '3474637154912',
    brandEn: 'Kérastase',
    brandAr: 'كيراستاس',
    nameEn: 'Kérastase Nutritive Bain Satin Shampoo 250ml',
    nameAr: 'شامبو كيراستاس نيوتريتيف باين سatin 250 مل',
    typeKey: 'shampoo',
    typeEn: 'Hydrating shampoo',
    typeAr: 'شامبو مرطب',
    introEn: 'Kérastase Nutritive Bain Satin gently cleanses fine to medium dry hair while delivering essential nutriments.',
    introAr: 'شامبو كيراستاس نيوتريتيف باين سatin ينظف بلطف الشعر الجاف من النوع الرفيع إلى المتوسط ويغذيه.',
    benefitsEn: ['For dry hair', 'Essential nutriments', 'Satin softness'],
    benefitsAr: ['للشعر الجاف', 'مغذيات أساسية', 'نعومة حريرية'],
    catEn: 'Hair cleansing',
    catAr: 'تنظيف الشعر',
    size: '250 مل',
  }),
  makeEntry({
    barcode: '3660732557158',
    brandEn: 'Kérastase',
    brandAr: 'كيراستاس',
    nameEn: 'Kérastase Chronologiste Black Diamond Key Source Repair Kit 3 pcs',
    nameAr: 'طقم كيراستاس كرونولوجist بلاك دايمond للإصلاح 3 قطع',
    typeKey: 'hair-mask',
    tertiarySlugs: ['care-hair-care-hair-treatment'],
    typeEn: 'Hair repair gift set',
    typeAr: 'طقم إصلاح للشعر',
    introEn: 'Kérastase Chronologiste Black Diamond Key Source kit combines three Chronologiste essentials for comprehensive hair regeneration.',
    introAr: 'طقم كيراستاس كرونولوجist بلاك دايمond يضم ثلاثة منتجات أساسية لإصلاح شامل وتجديد الشعر.',
    benefitsEn: ['Three-piece set', 'Chronologiste range', 'Intensive regeneration'],
    benefitsAr: ['طقم 3 قطع', 'من مجموعة chronologiste', 'تجديد مكثف'],
    catEn: 'Hair treatment',
    catAr: 'علاج الشعر',
    size: '3 قطع',
  }),
  makeEntry({
    barcode: '71249633830',
    brandEn: "L'Oreal",
    brandAr: 'لوريال',
    nameEn: 'L\'Oreal Paris EverPure Moisture Sulfate-Free Shampoo 1000ml',
    nameAr: 'شامبو لوريال باريس everpure moisture خالي من الكبريتات 1000 مل',
    typeKey: 'shampoo',
    introEn: 'L\'Oreal Paris EverPure Moisture Sulfate-Free Shampoo gently cleanses colour-treated dry hair with rosemary care.',
    introAr: 'شامبو لوريال باريس everpure moisture خالي من الكبريتات ينظف الشعر المصبوغ الجاف بلطف بعناية إكليل الجبل.',
    benefitsEn: ['Sulfate-free', 'For colour-treated hair', 'Moisture care'],
    benefitsAr: ['خالي من الكبريتات', 'للشعر المصبوغ', 'ترطيب'],
    catEn: 'Hair cleansing',
    catAr: 'تنظيف الشعر',
    typeEn: 'Sulfate-free shampoo',
    typeAr: 'شامبو خالي من السulfate',
    size: '1000 مل',
  }),
  makeEntry({
    barcode: '71249633847',
    brandEn: "L'Oreal",
    brandAr: 'لوريال',
    nameEn: 'L\'Oreal Paris EverPure Moisture Sulfate-Free Conditioner 1000ml',
    nameAr: 'بلسم لوريال باريس everpure moisture خالي من الكبريتات 1000 مل',
    typeKey: 'conditioner',
    introEn: 'L\'Oreal Paris EverPure Moisture Sulfate-Free Conditioner detangles and hydrates colour-treated dry hair.',
    introAr: 'بلسم لوريال باريس everpure moisture خالي من الكبريتات يفك التشابك ويرطب الشعر المصبوغ الجاف.',
    benefitsEn: ['Sulfate-free', 'Colour-safe care', 'Deep moisture'],
    benefitsAr: ['خالي من الكبريtات', 'آمن للون', 'ترطيب عميق'],
    catEn: 'Hair conditioning',
    catAr: 'بلسم الشعر',
    typeEn: 'Sulfate-free conditioner',
    typeAr: 'بلسم خالي من السulfate',
    size: '1000 مل',
  }),
  makeEntry({
    barcode: '71249633977',
    brandEn: "L'Oreal",
    brandAr: 'لوريال',
    nameEn: 'L\'Oreal Paris EverPure Volume Sulfate-Free Conditioner 1000ml',
    nameAr: 'بلسم لوريال باريس everpure volume خالي من الكبريtات 1000 مل',
    typeKey: 'conditioner',
    introEn: 'L\'Oreal Paris EverPure Volume Sulfate-Free Conditioner adds lightweight volume to fine colour-treated hair.',
    introAr: 'بلسم لوريال باريس everpure volume خالي من الكبريtات يمنح حجمًا خفيفًا للشعر المصبوغ الرفيع.',
    benefitsEn: ['Sulfate-free', 'Volume for fine hair', 'Lotus flower care'],
    benefitsAr: ['خالي من الكبريtات', 'حجم للشعر الرفيع', 'عناية زهرة اللوتس'],
    catEn: 'Hair conditioning',
    catAr: 'بلسم الشعر',
    typeEn: 'Volumising conditioner',
    typeAr: 'بلسم للحجم',
    size: '1000 مل',
  }),
];

const NAME_AR_PATCHES = {
  '3600524004538': 'علاج ماء لامع لوريال باريس إلفيف لحماية اللون 8 ثوانٍ 200 مل',
  '4008668230971': 'صبغة شعر إليبفا كولور آند كير 6.1 أشقر رمادي داكن',
  '3610340673887': 'كريم تصفيف لوريال باريس إلفيف جليكوليك جلوس بدون شطف 200 مل',
  '3474637154981': 'بلسم كيراستاس نيوتريتيف لايت فيтал 200 مل',
  '3474637154912': 'شامبو كيراستاس نيوتريتيف باين سatin 250 مل',
  '3660732557158': 'طقم كيراستاس كرونولوجist بلاك دايمond للإصلاح 3 قطع',
  '71249633830': 'شامبو لوريال باريس everpure moisture خالي من السulfate 1000 مل',
  '71249633847': 'بلسم لوريال باريس everpure moisture خالي من السulfate 1000 مل',
  '71249633977': 'بلسم لوريال باريس everpure volume خالي من السulfate 1000 مل',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveBrandEn(barcode, override) {
  if (override?.brandEn) return override.brandEn;
  if (BATCH140_OVERRIDES[barcode]?.brandEn) return BATCH140_OVERRIDES[barcode].brandEn;
  const name = override?.nameEn || '';
  if (/kérastase|kerastase/i.test(name)) return 'Kérastase';
  if (/nashi/i.test(name)) return 'Nashi Argan';
  if (/hairburst/i.test(name)) return 'Hairburst';
  if (/elebva|elea/i.test(name)) return 'ELEBVA';
  if (/nook/i.test(name)) return 'NOOK';
  if (/garnier|ultra doux/i.test(name)) return 'Garnier Ultra Doux';
  if (/elvive|serie expert|l'or|l’or|everpure|metal detox|vitamino|absolut repair|mythic|curl expression|pro longer|inforcer|silver|scalp advanced|pro source|symbiose|genesis|resistance|discipline|specifique|chronologiste|elixir|blond absolu|curl manifesto|nutritive|aminexil|protocole|black diamond|everpure/i.test(name)) {
    if (/kérastase|kerastase|symbiose|genesis|resistance|discipline|specifique|chronologiste|elixir|blond absolu|curl manifesto|nutritive|aminexil|protocole|black diamond/i.test(name)) return 'Kérastase';
    return "L'Oreal";
  }
  return "L'Oreal";
}

async function loadBrandCache() {
  const brands = await api('/brands?limit=300');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const bySlug = new Map();
  for (const b of list) {
    if (b.slug) bySlug.set(b.slug.toLowerCase(), b);
  }
  return { list, bySlug };
}

async function ensureBrand(cache, brandEn) {
  const spec = BRAND_SPECS[brandEn];
  if (!spec) throw new Error(`Unknown brand: ${brandEn}`);
  for (const slug of [spec.slug, spec.fallbackSlug].filter(Boolean)) {
    const hit = cache.bySlug.get(slug);
    if (hit?.id) return hit.id;
  }
  const exact = cache.list.find((b) => {
    const names = [b.nameEn, b.nameAr, b.name].filter(Boolean).map((s) => s.trim().toLowerCase());
    return names.includes(spec.nameEn.toLowerCase()) || names.includes(spec.nameAr);
  });
  if (exact?.id) return exact.id;
  throw new Error(`Brand not found: ${brandEn}`);
}

function updateJsonFile() {
  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  const byBc = new Map(products.map((p) => [p.barcode, p]));
  let corrected = 0;
  let added = 0;

  for (const [bc, entry] of Object.entries(CORRECTIONS)) {
    byBc.set(bc, entry);
    corrected += 1;
  }
  for (const entry of NEW_PRODUCTS) {
    if (!byBc.has(entry.barcode)) added += 1;
    byBc.set(entry.barcode, entry);
  }

  const merged = [...byBc.values()].sort((a, b) => a.barcode.localeCompare(b.barcode));
  if (!DRY_RUN) writeFileSync(PRODUCTS_FILE, `${JSON.stringify(merged, null, 2)}\n`);

  let nameArSrc = readFileSync(NAME_AR_FILE, 'utf8');
  for (const [bc, nameAr] of Object.entries(NAME_AR_PATCHES)) {
    const re = new RegExp(`(['"])${bc}\\1:\\s*\`[^\`]*\``);
    if (re.test(nameArSrc)) {
      nameArSrc = nameArSrc.replace(re, `'${bc}': \`${nameAr}\``);
    } else {
      nameArSrc = nameArSrc.replace(
        /(\};\s*)$/,
        `  '${bc}': \`${nameAr}\`,\n$1`,
      );
    }
  }
  if (!DRY_RUN) writeFileSync(NAME_AR_FILE, nameArSrc);

  return { corrected, added, total: merged.length, mergedByBc: Object.fromEntries(merged.map((p) => [p.barcode, p])) };
}

async function patchApiForBarcodes(barcodes, freshByBc = {}) {
  await getToken();
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  const brandCache = await loadBrandCache();
  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const barcode of barcodes) {
    const meta = state.imported?.[barcode];
    if (!meta?.id) {
      skipped += 1;
      continue;
    }
    const override = freshByBc[barcode]
      || CORRECTIONS[barcode]
      || NEW_PRODUCTS.find((p) => p.barcode === barcode)
      || getCareOverride(barcode);
    if (!override?.nameEn) {
      fail += 1;
      console.log(`FAIL ${barcode} — no override`);
      continue;
    }
    try {
      const brandEn = resolveBrandEn(barcode, override);
      const brandId = await ensureBrand(brandCache, brandEn);
      const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories('', {
        barcode,
        brandEn,
        brandAr: override.brandAr || BRAND_SPECS[brandEn]?.nameAr,
        typeKey: override.typeKey,
      });
      await api(`/products/${meta.id}`, {
        method: 'PATCH',
        body: {
          brandId,
          name: override.nameAr,
          nameAr: override.nameAr,
          nameEn: override.nameEn,
          description: override.descriptionAr,
          descriptionAr: override.descriptionAr,
          descriptionEn: override.descriptionEn,
          subcategoryIds,
          tertiaryCategoryIds,
        },
      });
      ok += 1;
      console.log(`OK ${barcode} | ${override.nameEn.slice(0, 60)}`);
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${barcode} — ${err.message}`);
    }
    await sleep(DELAY_MS);
  }
  return { ok, fail, skipped };
}

const USER_BARCODES = `8025026275616
8025026277399
8025026274800
8025026280832
8025026008962
8025026281488
8025026281495
8025026008672
8025026277863
8025026272028
8025026007521
8025026278266
8025026273766
8025026274596
8025026274565
8025026273810
8025026281662
8025026271977
8025026277412
8025026008313
8025026008474
8025026270536
8025026280825
8025026271984
5060743580639
5060743580950
5060743580943
5060743580912
5060743580905
5060743580936
5060743580929
5060743580783
5060743580714
3474637188207
3474636975570
3474636975976
3474636975938
3474636975556
30160668
3474636975587
3474637090531
3474636976072
3474636975921
3474636974429
3474636975396
3474636977307
3474636976119
3474636975952
3474636202447
3474637069155
3474636975679
3474636975297
3474636975211
3474637072483
3474637069162
3474637268435
3474637090609
3474637268510
3474637268381
3474637268206
3474637268459
3474636974269
3474637269012
3474636976133
3600523736836
3600523738632
3600523738625
3600523738649
3610340028502
3610340653865
3610340650659
71249633830
71249633847
71249633977
3600524135720
3600524074876
3600524127961
3600524087593
3600524074739
3600524075651
3610340673887
3600524034931
3610340687662
3610340687679
3610340687488
3600520837963
3610340667282
3600524016265
3600524004538
3600521852972
3610340673801
3600524228040
3610340673849
3610340653650
3610340636691
3600523955015
3610340667275
7509552847598
7509552843026
3600524016234
3600521453315
3600520838014
7509552847505
7509552848021
7509552847529
3610340020025
3610340670978
7509552875010
3600523477777
7509552848007
7509552889543
3610340667237
3610340649653
3600523944354
3610340655197
3610340667268
3600521767818
3610340667251
3600524016272
3600523477821
3474636692408
3474636728336
3474636728268
3474636873999
3474636728305
3660732557158
3474637157906
3474637154981
3474637155063
3474637154912
3474636400195
3474636397433
3474636858033
3474636397495
3474630677630
3474636614103
3474630647770
3474636968688
3474636400218
3474636397969
3474636397945
3474636397884
3474636693214
4008668230971
4008668230957
4008668230964
8033171866177
8033171866153
8033171866061
8033171866191
8033171866054
8033171866108
3474630267596
3474637106331`.trim().split(/\s+/);

async function main() {
  const unique = [...new Set(USER_BARCODES)];
  const jsonResult = updateJsonFile();
  console.log(`JSON updated: corrected=${jsonResult.corrected} added=${jsonResult.added} total=${jsonResult.total}`);

  if (!PATCH_API) {
    console.log('PATCH_API=0 — skipping API');
    return;
  }

  // Wait for rate limit cooldown
  console.log(`Waiting ${DELAY_MS * 2}ms before API...`);
  await sleep(DELAY_MS * 2);

  const apiResult = await patchApiForBarcodes(unique, jsonResult.mergedByBc);
  console.log(`API: OK=${apiResult.ok} FAIL=${apiResult.fail} SKIPPED=${apiResult.skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

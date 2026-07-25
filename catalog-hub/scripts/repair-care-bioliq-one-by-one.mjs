#!/usr/bin/env node
/**
 * Correct Bioliq / mislabeled Regenerum products (wrong generic Face Serum / Toner names).
 * Verified against EAN listings, elryan store, and Polish product catalogs.
 *
 * Usage: node scripts/repair-care-bioliq-one-by-one.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const ONLY = (process.env.BARCODES || '').split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

/** @type {Array<object>} */
const FIXES = [
  {
    barcode: '5906071003641',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Eyelash 4+ Eyelash Boost Serum 3ml',
    nameAr: 'بيوليك سيروم 4+ لتكثيف وتقوية الرموش 3 مل',
    typeKey: 'eye-cream', sub: ['care-face-care'], tert: ['care-face-care-eye-care'],
    introEn: 'Bioliq Eyelash 4+ Serum supports thicker, stronger-looking lashes with daily use.',
    introAr: 'سيروم بيوليك 4+ للرموش يدعم مظهراً أكثر كثافة وقوة مع الاستخدام اليومي.',
  },
  {
    barcode: '5902802706492',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Pure Vitamin C Serum 20% 30ml',
    nameAr: 'بيوليك سيروم فيتامين سي نقي 20% 30 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Pure Vitamin C 20% Serum brightens dull skin and helps even out tone.',
    introAr: 'سيروم بيوليك بفيتامين سي 20% يفتح البشرة الباهتة ويساعد على توحيد لونها.',
  },
  {
    barcode: '5906071023076',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Soothing & Strengthening Cream for Couperose Skin 50ml',
    nameAr: 'بيوليك ديرمو كريم مهدئ ومقوّي للبشرة ذات الاحمرار والأوردة الظاهرة 50 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Couperose Cream calms redness and strengthens fragile, capillary-prone skin.',
    introAr: 'كريم بيوليك ديرمو للبشرة ذات الاحمرار يهدئ التورد ويقوّي البشرة الحساسة.',
  },
  {
    barcode: '5906071027814',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Strengthening & Protective Cream SPF 15 30ml',
    nameAr: 'بيوليك ديرمو كريم مقوّي وواقٍ للبشرة ذات الشعيرات الدموية SPF 15 30 مل',
    typeKey: 'sunscreen', sub: ['care-face-care', 'care-sun-care'], tert: ['care-sun-care-sunscreen'],
    introEn: 'Bioliq Dermo SPF 15 Cream strengthens sensitive skin while providing daily UV protection.',
    introAr: 'كريم بيوليك ديرمو SPF 15 يقوّي البشرة الحساسة ويوفر حماية يومية من الشمس.',
  },
  {
    barcode: '5902802707796',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Night Cream for Acne-Prone Skin 30ml',
    nameAr: 'بيوليك ديرمو كريم ليلي للبشرة المعرضة للحبوب 30 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Night Cream supports overnight repair for acne-prone skin without clogging pores.',
    introAr: 'كريم بيوليك ديرمو الليلي يدعم تجديد البشرة المعرضة للحبوب طوال الليل.',
  },
  {
    barcode: '5902802705891',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo CICA Intensively Regenerating Cream 30ml',
    nameAr: 'بيوليك ديرمو كريم سيكا للتجديد المكثف بعد العلاجات الجلدية 30 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo CICA Cream intensively regenerates skin after dermatological treatments.',
    introAr: 'كريم بيوليك ديرمو سيكا يجدّد البشرة بشكل مكثف بعد العلاجات والإجراءات الجلدية.',
  },
  {
    barcode: '5906071023021',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Anti-Acne Spot Serum 15ml',
    nameAr: 'بيوليك ديرمو سيروم موضعي مضاد لحب الشباب 15 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Spot Serum targets individual blemishes and helps reduce breakouts.',
    introAr: 'سيروم بيوليك ديرمو الموضعي يستهدف الحبوب ويساعد على تقليل البثور.',
  },
  {
    barcode: '5906071044651',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Antiperspirant 48h Roll-On 50ml',
    nameAr: 'بيوليك ديرمو مزيل عرق رول أون 48 ساعة 50 مل',
    typeKey: 'deodorant', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-deodorant'],
    introEn: 'Bioliq Dermo 48h Roll-On provides long-lasting antiperspirant protection.',
    introAr: 'مزيل عرق بيوليك ديرمو رول أون يمنح حماية مضادة للتعرق لمدة 48 ساعة.',
  },
  {
    barcode: '5906071028798',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Intensive Eye Serum 15ml',
    nameAr: 'بيوليك سيروم مكثف للمنطقة حول العين 15 مل',
    typeKey: 'eye-cream', sub: ['care-face-care'], tert: ['care-face-care-eye-care'],
    introEn: 'Bioliq Intensive Eye Serum hydrates and revitalizes the delicate eye area.',
    introAr: 'سيروم بيوليك المكثف للعين يرطب وينعش منطقة ما حول العين.',
  },
  {
    barcode: '5906071043340',
    brandEn: 'Regenerum', brandAr: 'ريجينيروم',
    nameEn: 'Regenerum Regenerative Hand Serum 50ml',
    nameAr: 'ريجينيروم سيروم مجدّد لليدين 50 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Regenerum Hand Serum regenerates dry, damaged skin on hands and nails.',
    introAr: 'سيروم ريجينيروم لليدين يجدّد جلد اليدين والأظافر الجاف والمتضرر.',
  },
  {
    barcode: '5902802708205',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq BHL Barrier Protective Hand Cream 75ml',
    nameAr: 'بيوليك BHL كريم حاجز واقٍ لليدين 75 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Bioliq BHL Hand Cream rebuilds the skin barrier and protects dry, irritated hands.',
    introAr: 'كريم بيوليك BHL لليدين يعيد بناء حاجز البشرة ويحمي اليدين الجافة والمتهيجة.',
  },
  {
    barcode: '5902802708175',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq BHL Barrier Protective Face Cream 50ml',
    nameAr: 'بيوليك BHL كريم حاجز واقٍ للوجه 50 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq BHL Face Cream strengthens the skin barrier and soothes reactive facial skin.',
    introAr: 'كريم بيوليك BHL للوجه يقوّي حاجز البشرة ويهدئ البشرة المتهيجة.',
  },
  {
    barcode: '5906071004402',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Clean Purifying Cleansing Gel 125ml',
    nameAr: 'بيوليك كلين جل غسول تنقية وتنظيف للوجه 125 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Bioliq Clean Purifying Gel deeply cleanses pores and removes impurities without drying.',
    introAr: 'جل بيوليك كلين المنقّي ينظف المسام بعمق ويزيل الشوائب دون جفاف.',
  },
  {
    barcode: '5906071023045',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Regenerating Night Cream for Acne-Prone Skin 50ml',
    nameAr: 'بيوليك ديرمو كريم ليلي مجدّد للبشرة المعرضة للحبوب 50 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Night Cream regenerates acne-prone skin overnight and reduces blemishes.',
    introAr: 'كريم بيوليك ديرمو الليلي يجدّد البشرة المعرضة للحبوب ويقلل من البثور.',
  },
  {
    barcode: '5906071023069',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Repair Cream for Atopic Skin 50ml',
    nameAr: 'بيوليك ديرمو كريم إصلاحي للبشرة المعرضة للأكزيما والحساسة 50 مل',
    typeKey: 'cream', sub: ['care-face-care', 'care-derma-hub'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Atopic Repair Cream restores comfort to very dry, atopic-prone skin.',
    introAr: 'كريم بيوليك ديرمو الإصلاحي يرطب ويستعيد راحة البشرة المعرضة للأكزيما والجافة جداً.',
  },
  {
    barcode: '5906071023038',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Day Cream for Acne-Prone Skin 50ml',
    nameAr: 'بيوليك ديرمو كريم نهاري للبشرة المعرضة للحبوب 50 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Day Cream mattifies acne-prone skin and supports daily blemish control.',
    introAr: 'كريم بيوليك ديرمو النهاري يتحكم باللمعان ويدعم مكافحة الحبوب يومياً.',
  },
  {
    barcode: '5906071022963',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Brightening Cream for Discoloration 50ml',
    nameAr: 'بيوليك ديرمو كريم تفتيح للتصبغات والبقع الداكنة 50 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Brightening Cream reduces discoloration and evens out skin tone.',
    introAr: 'كريم بيوليك ديرمو للتفتيح يقلل التصبغات ويساعد على توحيد لون البشرة.',
  },
  {
    barcode: '5902802705969',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo CICA Oil for Scars and Stretch Marks 30ml',
    nameAr: 'بيوليك ديرمو زيت سيكا للندبات وعلامات التمدد 30 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Bioliq Dermo CICA Oil improves the appearance of scars and stretch marks.',
    introAr: 'زيت بيوليك ديرمو سيكا يحسّن مظهر الندبات وعلامات التمدد.',
  },
  {
    barcode: '5902802700506',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Pro Intensive Moisturizing Serum 30ml',
    nameAr: 'بيوليك برو سيروم ترطيب مكثف 30 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Pro Moisturizing Serum delivers deep hydration for dry and dehydrated skin.',
    introAr: 'سيروم بيوليك برو المرطب يمنح ترطيباً عميقاً للبشرة الجافة والمجففة.',
  },
  {
    barcode: '5906071007809',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Clean Anti-Wrinkle Facial Cleansing Gel 125ml',
    nameAr: 'بيوليك كلين جل غسول وجه مضاد للتجاعيد 125 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Bioliq Clean Anti-Wrinkle Gel cleanses mature skin while supporting a smoother look.',
    introAr: 'جل بيوليك كلين المضاد للتجاعيد ينظف البشرة الناضجة ويدعم مظهراً أكثر نعومة.',
  },
  {
    barcode: '5906071043784',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Clean Micellar Cleansing Water 200ml',
    nameAr: 'بيوليك كلين ماء ميسيلار منظف لجميع أنواع البشرة 200 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Bioliq Clean Micellar Water removes makeup and impurities gently without rinsing.',
    introAr: 'ماء بيوليك كلين الميسيلار يزيل المكياج والشوائب بلطف دون الحاجة للشطف.',
  },
  {
    barcode: '5906071049366',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Specialist Anti-Imperfection Toning Liquid 200ml',
    nameAr: 'بيوليك اختصاصي سائل منقّي وتنسيق للبشرة ضد العيوب 200 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Bioliq Specialist Toning Liquid mattifies oily skin and helps reduce imperfections.',
    introAr: 'سائل بيوليك اختصاصي يتحكم باللمعان ويساعد على تقليل عيوب البشرة.',
  },
  {
    barcode: '5902802700414',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Specialist Point Serum with Concealer 10ml',
    nameAr: 'بيوليك اختصاصي سيروم موضعي مع خافي للعيوب 10 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Specialist Point Serum treats blemishes and covers them with a built-in concealer.',
    introAr: 'سيروم بيوليك اختصاصي الموضعي يعالج الحبوب ويخفيها بخافي مدمج.',
  },
  {
    barcode: '5906071009285',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Exfoliating Face Gel 125ml',
    nameAr: 'بيوليك جل مقشر للوجه 125 مل',
    typeKey: 'scrub', sub: ['care-face-care'], tert: ['care-face-care-face-scrubs'],
    introEn: 'Bioliq Exfoliating Face Gel removes dead cells and smooths skin texture.',
    introAr: 'جل بيوليك المقشر للوجه يزيل الخلايا الميتة ويُنعّم ملمس البشرة.',
  },
  {
    barcode: '5906071029443',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Specialist Acne Marks Removal Night Cream 30ml',
    nameAr: 'بيوليك اختصاصي كريم ليلي لإزالة آثار حب الشباب 30 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Specialist Night Cream fades post-acne marks and evens skin tone overnight.',
    introAr: 'كريم بيوليك اختصاصي الليلي يخفّف آثار حب الشباب ويوحّد لون البشرة.',
  },
  {
    barcode: '5902802700827',
    brandEn: 'Regenerum', brandAr: 'ريجينيروم',
    nameEn: 'Regenerum Regenerative Foot Serum 125ml',
    nameAr: 'ريجينيروم سيروم مجدّد للقدمين 125 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Regenerum Foot Serum regenerates rough, cracked skin on feet and heels.',
    introAr: 'سيروم ريجينيروم للقدمين يجدّد الجلد الخشن والمتشقق في القدمين والكعبين.',
  },
  {
    barcode: '5906071028187',
    brandEn: 'Regenerum', brandAr: 'ريجينيروم',
    nameEn: 'Regenerum Regenerative Face Serum 50ml',
    nameAr: 'ريجينيروم سيروم مجدّد للوجه 50 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Regenerum Face Serum supports skin regeneration and a healthier-looking complexion.',
    introAr: 'سيروم ريجينيروم للوجه يدعم تجديد البشرة ومظهراً أكثر صحة.',
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function desc(p) {
  const sizeM = p.nameEn.match(/(\d+(?:\.\d+)?)\s*(ml|g)\b/i);
  const size = sizeM ? sizeM[0] : 'As listed';
  const sizeAr = size.replace(/ml/i, ' مل').replace(/g/i, ' جم');
  const typeMap = {
    serum: ['Face serum', 'سيروم للوجه'],
    toner: ['Facial toner', 'تونر للوجه'],
    cleanser: ['Facial cleanser', 'غسول للوجه'],
    cream: ['Face cream', 'كريم للوجه'],
    'body-cream': ['Body care', 'العناية بالجسم'],
    deodorant: ['Deodorant', 'مزيل عرق'],
    sunscreen: ['Sunscreen', 'واقي شمس'],
    'eye-cream': ['Eye care', 'العناية بالعين'],
    scrub: ['Face scrub', 'مقشر للوجه'],
  };
  const [typeEn, typeAr] = typeMap[p.typeKey] || ['Skincare', 'عناية'];
  const catEn = /body|foot|deodorant/i.test(p.typeKey) ? 'Body care' : 'Face care';
  const catAr = /body|foot|deodorant/i.test(p.typeKey) ? 'العناية بالجسم' : 'العناية بالوجه';
  return {
    descriptionEn: `${p.introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: Targeted formula · Daily care · Visible results\n◆ Suitable for: ${p.nameEn.includes('Acne') ? 'Acne-prone skin' : 'Daily skincare routines'}\n◆ Size: ${size}`,
    descriptionAr: `${p.introAr}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: تركيبة مركّزة · عناية يومية · نتائج ملموسة\n◆ الأنسب لـ: ${p.nameAr.includes('حب') ? 'البشرة المعرضة للحبوب' : 'الاستخدام اليومي ضمن روتين العناية'}\n◆ الحجم: ${sizeAr}`,
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

async function main() {
  await getToken();
  const queue = FIXES.filter((p) => !ONLY.length || ONLY.includes(p.barcode));
  const total = queue.length;

  console.log('══════════════════════════════════════════════════');
  console.log(`Bioliq / Regenerum repair ONE-BY-ONE | total=${total}`);
  console.log('══════════════════════════════════════════════════\n');

  const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { done: {}, skipped: {}, failed: {} };
  let overrides = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
  const map = new Map(overrides.map((p) => [p.barcode, p]));
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < queue.length; i += 1) {
    const p = queue[i];
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
        throw new Error(`verify failed: ${verified?.nameEn} / ${verified?.nameAr}`);
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
      state.done[p.barcode] = { id, action: action.toLowerCase(), verified: true, nameEn: p.nameEn, nameAr: p.nameAr, at: Date.now() };
      delete state.failed[p.barcode];
      writeFileSync(STATE, JSON.stringify(state, null, 2));
      ok += 1;
      console.log(`[${i + 1}/${total}] OK-${action} | ${p.barcode}`);
      console.log(`  EN: ${p.nameEn}`);
      console.log(`  AR: ${p.nameAr}\n`);
    } catch (err) {
      fail += 1;
      state.failed[p.barcode] = { reason: err.message, at: Date.now() };
      writeFileSync(STATE, JSON.stringify(state, null, 2));
      console.log(`[${i + 1}/${total}] FAIL | ${p.barcode} | ${err.message}`);
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

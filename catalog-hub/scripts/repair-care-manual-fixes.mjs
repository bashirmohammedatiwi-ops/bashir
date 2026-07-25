#!/usr/bin/env node
/** Manual one-by-one fixes for remaining hard barcodes. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');

const FIXES = [
  {
    barcode: '8809667080446',
    brandEn: 'Derma 101', brandAr: 'ديرما 101',
    nameEn: 'Derma 101 Niacinamide Serum 30ml',
    nameAr: 'ديرما 101 سيروم نياسيناميد 30 مل',
    typeKey: 'serum', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Derma 101 Niacinamide Serum helps balance oil and refine the look of pores.',
    introAr: 'سيروم ديرما 101 بالنياسيناميد يساعد على توازن الدهون وتحسين مظهر المسام.',
  },
  {
    barcode: '8809317118628',
    brandEn: 'Farm Stay', brandAr: 'فارسماي',
    nameEn: 'Farm Stay Snail Mucus Moisture Toner 150ml',
    nameAr: 'فارسماي تونر مرطب بمخاط الحلزون 150 مل',
    typeKey: 'toner', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Farm Stay Snail Toner moisturizes and soothes skin with snail mucin care.',
    introAr: 'تونر فارسماي بمخاط الحلزون يرطب ويهدئ البشرة بعناية مغذية.',
  },
  {
    barcode: '4806500238815',
    brandEn: 'Kokuryu', brandAr: 'كوكوريو',
    nameEn: 'Kokuryu Cucumber Face Wash 225ml',
    nameAr: 'كوكوريو غسول وجه بالخيار 225 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Kokuryu Cucumber Face Wash cleanses gently with a refreshing cucumber feel.',
    introAr: 'غسول كوكوريو بالخيار ينظف بلطف ويمنح إحساساً منعشاً.',
  },
  {
    barcode: '4806500238822',
    brandEn: 'Kokuryu', brandAr: 'كوكوريو',
    nameEn: 'Kokuryu Face Wash 225ml',
    nameAr: 'كوكوريو غسول وجه 225 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Kokuryu Face Wash provides a gentle daily cleanse.',
    introAr: 'غسول كوكوريو يمنح تنظيفاً يومياً لطيفاً للوجه.',
  },
  {
    barcode: '8435534412982',
    brandEn: 'La Cabine', brandAr: 'لا كابين',
    nameEn: 'La Cabine Advanced Serum 25% Vitamin C 30ml',
    nameAr: 'لا كابين سيروم متقدم بفيتامين سي 25% 30 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'La Cabine Advanced Vitamin C Serum brightens dull skin with a concentrated formula.',
    introAr: 'سيروم لا كابين المتقدم بفيتامين سي يضيء البشرة الباهتة بتركيبة مركّزة.',
  },
  {
    barcode: '733739076847',
    brandEn: 'Now Foods', brandAr: 'ناو فودز',
    nameEn: 'Now Foods Solutions Glycolic Acid Toner 237ml',
    nameAr: 'ناو فودز تونر بحمض الجليكوليك 237 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Now Foods Glycolic Acid Toner gently exfoliates for smoother-looking skin.',
    introAr: 'تونر ناو فودز بحمض الجليكوليك يقشّر بلطف لبشرة أكثر نعومة.',
  },
  {
    barcode: '733739081902',
    brandEn: 'Now Foods', brandAr: 'ناو فودز',
    nameEn: 'Now Foods Solutions Rose Hydrosol 170ml',
    nameAr: 'ناو فودز ماء ورد 170 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Now Foods Rose Hydrosol refreshes skin with a light rose water mist.',
    introAr: 'ماء الورد من ناو فودز ينعش البشرة برذاذ خفيف.',
  },
  {
    barcode: '8809305993831',
    brandEn: 'Secret Key', brandAr: 'سيكريت كي',
    nameEn: 'Secret Key Snow White Spot Gel 65g',
    nameAr: 'سيكريت كي جل سنو وايت للبقع 65 جم',
    typeKey: 'cream', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Secret Key Snow White Spot Gel targets dark spots for a brighter look.',
    introAr: 'جل سيكريت كي سنو وايت يستهدف البقع لمظهر أكثر إشراقاً.',
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
  {
    barcode: '5907609345707',
    brandEn: 'Eveline', brandAr: 'إيفيلين',
    nameEn: 'Eveline Cosmetics Facemed Brightening Cleanser 150ml',
    nameAr: 'إيفيلين غسول وجه مضيء 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Eveline Brightening Face Cleanser cleanses while supporting a radiant look.',
    introAr: 'غسول إيفيلين المضيء ينظف ويدعم مظهراً مشرقاً للبشرة.',
  },
  {
    barcode: '3574660310405',
    brandEn: 'Gosh', brandAr: 'غوش',
    nameEn: 'Gosh Catchy Eyes Mascara 50 Black',
    nameAr: 'غوش ماسكارا كاتشي آيز أسود',
    typeKey: 'moisturizer', sub: ['care-face-care'], tert: ['care-face-care-eye-care'],
    introEn: 'Gosh Catchy Eyes mascara defines lashes with a classic black finish.',
    introAr: 'ماسكارا غوش كاتشي آيز تحدّد الرموش بلمسة سوداء كلاسيكية.',
  },
  {
    barcode: '892717001162',
    brandEn: 'PFB Vanish', brandAr: 'بي إف بي فانيش',
    nameEn: 'PFB Vanish Chromabright Skin Brightening Serum 93g',
    nameAr: 'بي إف بي فانيش سيروم كرومابرايت لتفتيح البشرة 93 جم',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'PFB Vanish Chromabright supports a brighter more even-looking complexion.',
    introAr: 'سيروم بي إف بي فانيش كرومابرايت يدعم بشرة أكثر إشراقاً وتجانساً.',
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function desc(p) {
  const size = (p.nameEn.match(/(\d+)\s*(ml|g)/i) || [])[0] || 'حسب المنتج';
  const sizeAr = size.replace(/ml/i, 'مل').replace(/g/i, 'جم') || 'حسب المنتج';
  const typeMap = {
    serum: ['Face serum', 'سيروم للوجه'],
    toner: ['Facial toner', 'تونر للوجه'],
    cleanser: ['Facial cleanser', 'غسول للوجه'],
    cream: ['Face cream', 'كريم للوجه'],
    'body-cream': ['Body lotion', 'لوشن للجسم'],
    moisturizer: ['Skincare', 'عناية'],
  };
  const [typeEn, typeAr] = typeMap[p.typeKey] || ['Skincare', 'عناية'];
  return {
    descriptionEn: `${p.introEn}\n\n◆ Category: Face care\n◆ Product type: ${typeEn}\n◆ Key benefits: Daily care · Targeted formula · Routine essential\n◆ Suitable for: Daily care routines\n◆ Size: ${size}`,
    descriptionAr: `${p.introAr}\n\n◆ التصنيف: العناية بالوجه\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: عناية يومية · تركيبة مركّزة · أساسي للروتين\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${sizeAr}`,
  };
}

async function findProduct(barcode) {
  const res = await api(`/products?limit=5&search=${encodeURIComponent(barcode)}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  return items.find((p) => String(p.sku || p.barcode || '').trim() === barcode) || null;
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
  const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { done: {}, skipped: {}, failed: {} };
  let overrides = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
  const map = new Map(overrides.map((p) => [p.barcode, p]));
  const total = FIXES.length;
  let ok = 0;
  let fail = 0;

  console.log(`Manual fixes ONE-BY-ONE | total=${total}\n`);

  for (let i = 0; i < FIXES.length; i += 1) {
    const p = FIXES[i];
    if (i > 0) await sleep(1200);
    const d = desc(p);
    const bodyBase = {
      name: p.nameAr,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      description: d.descriptionAr,
      descriptionAr: d.descriptionAr,
      descriptionEn: d.descriptionEn,
      subcategoryIds: p.sub.map((s) => CARE_SUB_SLUGS[s]).filter(Boolean),
      tertiaryCategoryIds: p.tert.map((s) => CARE_TERTIARY_SLUGS[s]).filter(Boolean),
    };

    try {
      let existing = await findProduct(p.barcode);
      let id;
      let action;
      if (existing?.id) {
        await api(`/products/${existing.id}`, { method: 'PATCH', body: bodyBase });
        id = existing.id;
        action = 'PATCH';
      } else {
        const brandId = await resolveBrand(p.brandEn);
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
            ...bodyBase,
          },
        });
        id = created.id;
        action = 'CREATE';
      }

      await sleep(400);
      const verified = await findProduct(p.barcode);
      if (!verified || verified.nameAr !== p.nameAr || verified.nameEn !== p.nameEn) {
        throw new Error(`verify failed got=${verified?.nameAr}`);
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
      console.log(`[${i + 1}/${total}] ${((i + 1) / total * 100).toFixed(0)}% | OK-${action} | ${p.barcode} | ${p.nameAr}`);
    } catch (err) {
      fail += 1;
      state.failed[p.barcode] = { reason: err.message, at: Date.now() };
      writeFileSync(STATE, JSON.stringify(state, null, 2));
      console.log(`[${i + 1}/${total}] FAIL | ${p.barcode} | ${err.message}`);
    }
  }

  console.log(`\nManual Done: OK=${ok} FAIL=${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

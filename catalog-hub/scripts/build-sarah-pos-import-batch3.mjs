#!/usr/bin/env node
/** Build batch-3 — 50 Sarah+POS products with auto categories + EN copy. */
import { readFileSync, writeFileSync } from 'fs';
import { CATEGORIES, SUBCATEGORIES, perfumeSubs } from '../lib/core/app-categories.js';
import {
  CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS,
  resolveCareCategories,
} from '../lib/core/care-category-map.js';

const CARE = CARE_CATEGORY_ID;
const SUB = CARE_SUB_SLUGS;
const TER = CARE_TERTIARY_SLUGS;
const SKIP = new Set(['3616306115965', '3346475561910', '3346475547280']);
const imported = new Set([
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch2.json', import.meta.url), 'utf8')).imported || {}),
]);
const candidates = JSON.parse(readFileSync(new URL('../data/sarah-pos-candidates-batch3.json', import.meta.url), 'utf8'));

function pEn(d) {
  return { descriptionEn: `${d.intro}\n\n◆ Scent family: ${d.family}\n◆ Key notes: ${d.notes}\n◆ Character: ${d.character}\n◆ Best for: ${d.best}\n◆ Longevity: ${d.long}` };
}
function cEn(d) {
  return { descriptionEn: `${d.intro}\n\n◆ Category: ${d.cat}\n◆ Product type: ${d.type}\n◆ Key benefits: ${d.benefits.join(' · ')}\n◆ Suitable for: Daily care routines\n◆ Size: ${d.size}` };
}
function mEn(d) {
  return { descriptionEn: `${d.intro}\n\n◆ Category: Makeup\n◆ Product type: ${d.type}\n◆ Key benefits: ${d.benefits.join(' · ')}\n◆ Suitable for: Daily makeup looks` };
}

function cleanBrandEn(raw = '') {
  const m = String(raw).match(/([A-Za-z][A-Za-z\s&.'\-]{1,45})/);
  return m ? m[1].trim().replace(/\s+/g, ' ') : String(raw).trim();
}

function posToNameEn(row) {
  const pos = String(row.posName || '').trim();
  if (pos.length > 8 && /[A-Za-z]/.test(pos)) {
    return pos
      .replace(/\bEDP\b/gi, 'Eau de Parfum')
      .replace(/\bEDT\b/gi, 'Eau de Toilette')
      .replace(/\bEDC\b/gi, 'Eau de Cologne')
      .replace(/\bPARFUM\b/gi, 'Parfum')
      .replace(/\bPH\b/gi, 'Pour Homme')
      .replace(/\bPF\b/gi, 'Pour Femme')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return null;
}

function inferKind(row) {
  const text = `${row.category} ${row.nameAr} ${row.posName}`.toLowerCase();
  if (/مكياج|ماسكارا|بودرة|باليت|ظلال|آيلاين|كحل|lipstick|mascara|palette|eyeshadow|foundation|concealer|blush|makeup/.test(text)) return 'makeup';
  if (/عناية|كريم|سيروم|غسول|تونر|شامبو|بلسم|مرطب|sunscreen|cleanser|serum|shampoo|conditioner|gel|lotion|cream|mask|tooth|razor|deodorant/.test(text)) return 'care';
  if (/عطر|perfume|parfum|cologne|edp|edt|oud|eau de/.test(text)) return 'perfume';
  if (/^[A-Z0-9][A-Z0-9\s\-./'&]+$/i.test(String(row.posName || '').trim())) return 'perfume';
  return 'perfume';
}

function inferMakeupSub(row) {
  const t = `${row.nameAr} ${row.posName}`.toLowerCase();
  if (/lip|شفاه|lipstick|tint|gloss/.test(t)) return SUBCATEGORIES.lips;
  if (/mascara|eyeshadow|palette|eye|kohl|liner|ظلال|رموش|عيون/.test(t)) return SUBCATEGORIES.eyes;
  return SUBCATEGORIES.face;
}

function inferCareType(row) {
  const t = `${row.nameAr} ${row.posName}`.toLowerCase();
  if (/eye|عين/.test(t)) return 'eye-cream';
  if (/sun|spf|واقي/.test(t)) return 'sunscreen';
  if (/shampoo|شامبو/.test(t)) return 'shampoo';
  if (/conditioner|بلسم/.test(t)) return 'conditioner';
  if (/tooth|فم|أسنان|whitening/.test(t)) return 'toothpaste';
  if (/razor|حلاقة|شفر/.test(t)) return 'cleanser';
  if (/deodorant|مزيل/.test(t)) return 'deodorant';
  if (/gel|غسول|cleans|wash|foam/.test(t)) return 'cleanser';
  if (/serum|سيروم/.test(t)) return 'serum';
  if (/mask|ماسك/.test(t)) return 'face-mask';
  if (/toner|تونر/.test(t)) return 'toner';
  if (/lip|شفاه/.test(t)) return 'lip-balm';
  return 'cream';
}

function inferCareLeaf(typeKey, row) {
  const t = `${row.nameAr} ${row.posName}`.toLowerCase();
  if (/hair|شعر|shampoo|conditioner/.test(t)) return 'care/hair-care/shampoo-conditioners';
  if (/mouth|teeth|tooth|فم|أسنان/.test(t)) return 'care/mouth--teeth-care/teeth-whitening';
  if (/women|نساء|venus|razor/.test(t)) return 'care/women-care/women-hair-removal';
  if (/sun|spf/.test(t)) return 'care/sun-care/sunscreen';
  if (/body|جسم/.test(t)) return 'care/skin-and-body-care/body-moisturizer';
  if (/hand|يد/.test(t)) return 'care/hand-care/hand-moisturizer';
  if (/eye|عين/.test(t)) return 'care/face-care/eye-care';
  if (typeKey === 'cleanser') return 'care/face-care/cleansers--toners';
  if (typeKey === 'serum') return 'care/face-care/face-moisturizer';
  return 'care/face-care/face-moisturizer';
}

function inferPerfumeSubs(row) {
  const t = `${row.posName} ${row.nameAr}`.toUpperCase();
  const isNew = /2024|2025|2026|INTENSE|ELIXIR|NEW|EXTREME|EXCLUSIF|BORN IN ROMA|GORGEOUS|BLUSH ELIXIR/.test(t);
  const isNiche = /XERJOFF|INITIO|AMOUAGE|BYREDO|PARFUM DE MARLY|NISHANE|KILIAN|CREED|MEMO|MATIERE|EX NIHILO|MANCERA|MONTALE|ROSENDO|HOUBIGANT|LE LABO|MFK|MAISON FRANCIS/.test(t);
  const isUnisex = /\b(U|UNISEX)\b/.test(t) || /UNISEX|LAIT|ABSOLU/.test(t);
  const isWomen = /(WOMEN|FEMME|FOR HER|DONNA|WOMAN|\bW\b|F\)| POUR F| PF\b| SHE |HER )/.test(t)
    || /نساء|نسائي|للنساء/.test(row.nameAr || '');
  const isMen = /(MEN|HOMME|FOR HIM|UOMO|\bM\b| POUR H| PH\b| HE )/.test(t)
    || /رجali|رجالي|للرجال/.test(row.nameAr || '');
  let gender = 'women';
  if (isMen && !isWomen) gender = 'men';
  else if (isWomen) gender = 'women';
  else if (/unisex|للجنسين/.test(String(row.nameAr))) return perfumeSubs({ isUnisex: true, isNiche, isNew });
  return perfumeSubs({ gender, isNew, isNiche, isUnisex: isUnisex && !isMen && !isWomen });
}

/** Manual verified metadata for all batch-3 products */
const META = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch3-meta.json', import.meta.url), 'utf8'));

function build(row) {
  const override = META[row.barcode];
  if (override) {
    const { kind, subs, careLeaf, typeKey, makeupSub, brandEn, nameEn } = override;
    const base = { barcode: row.barcode, sarahId: row.sarahId, url: row.url, stock: row.stock, brandEn, nameEn };
    if (kind === 'care') {
      const cats = resolveCareCategories(careLeaf, { brandEn, brandAr: row.brandAr, posName: row.posName, typeKey, barcode: row.barcode });
      const sizeM = nameEn.match(/(\d+)\s*(ml|g|G|ML)/i);
      const size = sizeM ? `${sizeM[1]} ${sizeM[2].toLowerCase() === 'ml' ? 'ml' : 'g'}` : '—';
      return {
        ...base,
        categoryId: CARE,
        subcategoryIds: cats.subcategoryIds?.length ? cats.subcategoryIds : [SUB['care-derma-hub'], SUB['care-face-care']],
        tertiaryCategoryIds: cats.tertiaryCategoryIds || [],
        isNew: false,
        ...cEn({ intro: `${nameEn} supports daily care with a trusted formula.`, cat: 'Skincare', type: typeKey?.replace(/-/g, ' ') || 'care', benefits: ['Daily care', 'Trusted formula', 'Regular use'], size }),
      };
    }
    if (kind === 'makeup') {
      const subMap = { eyes: SUBCATEGORIES.eyes, lips: SUBCATEGORIES.lips, face: SUBCATEGORIES.face };
      return {
        ...base,
        categoryId: CATEGORIES.makeup,
        subcategoryIds: [subMap[makeupSub] || SUBCATEGORIES.face],
        tertiaryCategoryIds: [],
        isNew: false,
        ...mEn({ intro: `${nameEn} delivers reliable makeup performance for everyday looks.`, type: makeupSub === 'eyes' ? 'Eye makeup' : makeupSub === 'lips' ? 'Lip makeup' : 'Face makeup', benefits: ['Easy application', 'Buildable result', 'Everyday wear'] }),
      };
    }
    const subIds = perfumeSubs(subs || { gender: 'women' });
    return {
      ...base,
      categoryId: CATEGORIES.perfumes,
      subcategoryIds: subIds,
      tertiaryCategoryIds: [],
      isNew: !!subs?.isNew,
      ...pEn({ intro: `${nameEn} is a refined fragrance with elegant character and lasting presence.`, family: 'Eau de parfum', notes: 'Bergamot, florals, amber, woods, musk', character: 'Elegant and long-lasting', best: 'Daily to evening wear', long: '6–9 hours with good projection' }),
    };
  }

  const kind = inferKind(row);
  const brandEn = cleanBrandEn(row.brandEn || row.brandAr || row.posName);
  const nameEn = posToNameEn(row) || `${brandEn} ${String(row.nameAr || '').slice(0, 60)}`.trim();

  if (kind === 'care') {
    const typeKey = inferCareType(row);
    const leaf = inferCareLeaf(typeKey, row);
    const cats = resolveCareCategories(leaf, { brandEn, brandAr: row.brandAr, posName: row.posName, typeKey, barcode: row.barcode });
    const sizeM = String(row.posName || row.nameAr || '').match(/(\d+)\s*(ML|ml|G|g|L)/);
    const size = sizeM ? `${sizeM[1]} ${sizeM[2].toLowerCase() === 'ml' ? 'ml' : sizeM[2]}` : '—';
    return {
      barcode: row.barcode, sarahId: row.sarahId, url: row.url, stock: row.stock,
      brandEn, nameEn,
      categoryId: CARE,
      subcategoryIds: cats.subcategoryIds?.length ? cats.subcategoryIds : [SUB['care-derma-hub'], SUB['care-face-care']],
      tertiaryCategoryIds: cats.tertiaryCategoryIds || [],
      isNew: false,
      ...cEn({
        intro: `${nameEn} supports daily skincare with a formula suited for regular use.`,
        cat: 'Skincare', type: typeKey.replace(/-/g, ' '),
        benefits: ['Daily care', 'Quality formula', 'Trusted brand'],
        size,
      }),
    };
  }

  if (kind === 'makeup') {
    const sub = inferMakeupSub(row);
    return {
      barcode: row.barcode, sarahId: row.sarahId, url: row.url, stock: row.stock,
      brandEn, nameEn,
      categoryId: CATEGORIES.makeup,
      subcategoryIds: [sub],
      tertiaryCategoryIds: [],
      isNew: false,
      ...mEn({
        intro: `${nameEn} delivers reliable makeup performance for everyday looks.`,
        type: sub === SUBCATEGORIES.eyes ? 'Eye makeup' : sub === SUBCATEGORIES.lips ? 'Lip makeup' : 'Face makeup',
        benefits: ['Easy application', 'Buildable coverage', 'Everyday wear'],
      }),
    };
  }

  const subs = inferPerfumeSubs(row);
  const isNew = subs.includes('07d0e8c3-3369-47b7-bb34-d430ca4a26d4');
  return {
    barcode: row.barcode, sarahId: row.sarahId, url: row.url, stock: row.stock,
    brandEn, nameEn,
    categoryId: CATEGORIES.perfumes,
    subcategoryIds: subs,
    tertiaryCategoryIds: [],
    isNew,
    ...pEn({
      intro: `${nameEn} is a refined fragrance with elegant character and lasting presence.`,
      family: 'Eau de parfum', notes: 'Bergamot, florals, amber, woods, musk',
      character: 'Elegant and long-lasting', best: 'Daily to evening wear', long: '6–9 hours with good projection',
    }),
  };
}

const selected = [];
for (const row of candidates) {
  if (SKIP.has(row.barcode) || imported.has(row.barcode)) continue;
  if (selected.length >= 50) break;
  selected.push(build(row));
}

writeFileSync(new URL('../data/sarah-pos-import-products-batch3.json', import.meta.url).pathname, `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Built batch3: ${selected.length} products`);
const kinds = { care: 0, makeup: 0, perfume: 0 };
for (const p of selected) {
  if (p.categoryId === CARE) kinds.care++;
  else if (p.categoryId === CATEGORIES.makeup) kinds.makeup++;
  else kinds.perfume++;
}
console.log('mix', kinds);

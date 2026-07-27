import { CATEGORIES, SUBCATEGORIES, TERTIARY } from './app-categories.js';
import { resolveCareCategories } from './care-category-map.js';
import { inferCareTypeKey } from './care-product-filter.js';

const PREMIUM_LEAVES = [
  'premium/luxury-perfumes',
  'premium/luxury-makeup',
  'premium/luxury-care',
];

const PERF = /parfum|perfume|eau de|edp|edt|edc|cologne|عطر|fragrance|برفيوم|برفان|أو دو|extrait/i;
const MAKEUP = /mascara|lipstick|lip gloss|foundation|concealer|palette|blush|highlighter|bronzer|primer|brow|مكياج|ماسكر|شفاه|عيون|بودرة|كحل|ظلال|حواجب|كونسيلر|هايلايتر|برايمر/i;

function inferMakeupSub(text = '') {
  const t = text.toLowerCase();
  if (/lip|شفاه|lipstick|gloss|tint|lipliner|lip oil|lip balm|ملمع|أحمر شفاه|تينت/i.test(t)) return 'lips';
  if (/mascara|eyeshadow|eyeliner|eye|kajal|عيون|رموش|ظلال|كحل|حواجب|brow/i.test(t)) return 'eyes';
  return 'face';
}

function inferMakeupTertiary(sub, text = '') {
  if (sub !== 'lips') return [];
  if (/tint|تينت|lip & cheek/i.test(text)) return [TERTIARY.lipTint];
  if (/gloss|ملمع|liquid|سائل|lip oil/i.test(text)) return [TERTIARY.liquidLipstick];
  return [TERTIARY.lipstick];
}

function inferCareLeaf(text = '') {
  const t = text.toLowerCase();
  if (/hair|شعر|shampoo|conditioner|maskeratine|masque/i.test(t)) return 'care/hair-care/shampoo-conditioners';
  if (/body|جسم|deodorant|shower|lotion/i.test(t)) return 'care/skin-and-body-care/body-moisturizer';
  if (/sun|spf|واقي/i.test(t)) return 'care/sun-care/sunscreen';
  if (/cleanser|toner|غسول|تونر|micellar/i.test(t)) return 'care/face-care/cleansers--toners';
  if (/eye cream|كريم عين/i.test(t)) return 'care/face-care/eye-care';
  if (/mask|ماسك/i.test(t)) return 'care/face-care/face-masks';
  if (/serum|سيروم|ampoule|essence/i.test(t)) return 'care/face-care/face-moisturizer';
  return 'care/face-care/face-moisturizer';
}

export function inferKind(leaf, text = '') {
  if (leaf === 'premium/luxury-perfumes') return 'perfume';
  if (leaf === 'premium/luxury-makeup') return 'makeup';
  if (leaf === 'premium/luxury-care') return 'care';
  if (PERF.test(text) && !/body lotion|shampoo|cream(?!.*parfum)/i.test(text)) return 'perfume';
  if (MAKEUP.test(text)) return 'makeup';
  return 'care';
}

/** تصنيف بريميوم: قسم رئيسي + فرعي + ثانوي */
export function resolvePremiumCategories(leaf, detail = {}) {
  const text = `${detail.nameAr || ''} ${detail.nameEn || ''} ${detail.category || ''}`;
  const kind = inferKind(leaf, text);

  if (kind === 'perfume') {
    return {
      categoryId: CATEGORIES.premium,
      subcategoryIds: [SUBCATEGORIES.luxuryPerfume],
      tertiaryCategoryIds: [],
      kind: 'perfume',
      leaf,
    };
  }

  if (kind === 'makeup') {
    const sub = inferMakeupSub(text);
    return {
      categoryId: CATEGORIES.premium,
      subcategoryIds: [SUBCATEGORIES.luxuryMakeup],
      tertiaryCategoryIds: inferMakeupTertiary(sub, text),
      kind: 'makeup',
      leaf,
      makeupSub: sub,
    };
  }

  const careLeaf = inferCareLeaf(text);
  const typeKey = inferCareTypeKey(text, careLeaf);
  const care = resolveCareCategories(careLeaf, {
    typeKey,
    brandEn: detail.brandEn,
    brandAr: detail.brandAr,
    barcode: detail.barcode,
    posName: detail.posName || '',
  });

  return {
    categoryId: CATEGORIES.premium,
    subcategoryIds: [SUBCATEGORIES.luxuryCare],
    tertiaryCategoryIds: care.tertiaryCategoryIds,
    kind: 'care',
    leaf,
    careLeaf,
    typeKey,
  };
}

export function collectPremiumLeaves() {
  return [...PREMIUM_LEAVES];
}

export { PREMIUM_LEAVES };

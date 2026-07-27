import { CATEGORIES, SUBCATEGORIES, TERTIARY, perfumeSubs } from './app-categories.js';
import { CARE_CATEGORY_ID, resolveCareCategories } from './care-category-map.js';
import { inferCareTypeKey } from './care-product-filter.js';

const FACES_LEAF_MAP = {
  perfume: { kind: 'perfume' },
  makeup: { kind: 'makeup' },
  skincare: { kind: 'care', careLeaf: 'care/face-care/face-moisturizer' },
  haircare: { kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners' },
  'body-care': { kind: 'care', careLeaf: 'care/skin-and-body-care/body-moisturizer' },
  'men-beauty-products': { kind: 'men' },
  gifts: { kind: 'infer' },
  bestsellers: { kind: 'infer' },
};

const PERF = /parfum|perfume|eau de|edp|edt|edc|cologne|عطر|fragrance|برفيوم|برفان|أو دو|او دو|extrait de parfum/i;
const MAKEUP = /mascara|lipstick|lip gloss|lipliner|eyeliner|eyeshadow|foundation|concealer|palette|blush|highlighter|bronzer|primer|brow|مكياج|ماسكر|شفاه|عيون|بودرة|كحل|ظلال|حواجب|كونسيلر|هايلايتر|برايمر/i;
const NOT_PERF = /body lotion|deodorant|shampoo|conditioner|toothpaste|cream(?!.*parfum)|serum(?!.*parfum)|mask|غسول|شامبو|بلسم|معجون|مزيل عرق|كريم(?!.*parf)/i;

const NICHE_BRANDS = /tom ford|creed|byredo|maison francis|initio|xerjoff|amouage|parfums de marly|kilian|frederic malle|memo paris|diptyque|le labo|penhaligon|mancera|montale/i;
const PERFUME_BRANDS = /mancera|montale|armaf|diesel|hugo boss|ralph lauren|valentino|chloe|dior|chanel|rabanne|dolce|issey|gucci|prada|versace|burberry|givenchy|ysl|yves saint|lancome|hermes|bvlgari|azzaro|davidoff|calvin klein|jean paul gaultier|narciso rodriguez|carolina herrera|viktor|roja|xerjoff/i;

function inferPerfumeGender(nameEn = '', nameAr = '') {
  const t = `${nameEn} ${nameAr}`.toLowerCase();
  if (/pour homme|for men|\bmen\b|homme|رجال|للرجال|pour lui/i.test(t)) return 'men';
  if (/pour femme|for women|\bwomen\b|femme|نساء|للنساء|pour elle/i.test(t)) return 'women';
  if (/unisex|للجنسين|universal/i.test(t)) return 'unisex';
  return 'women';
}

function inferPerfumeExtras(text = '') {
  const extras = [];
  if (/gift set|coffret|discovery set|مجموعة|طقم|هدايا/i.test(text)) {
    extras.push(SUBCATEGORIES.giftSetPerfume);
  }
  if (/\bmini\b|miniature|travel size|عطر صغير|mini spray/i.test(text)) {
    extras.push(SUBCATEGORIES.miniPerfume);
  }
  if (/\boud\b|عود|mukhallat/i.test(text)) {
    extras.push(SUBCATEGORIES.oudPerfume);
  }
  if (/body mist|hair mist|معطر جسد|معطر شعر|body spray/i.test(text)) {
    extras.push(SUBCATEGORIES.bodyPerfume);
  }
  return extras;
}

function inferMakeupSub(text = '') {
  const t = text.toLowerCase();
  if (/blush|خدود|bronzer|برونزر|highlighter|هايلايتر|contour|كونتور/i.test(t)) return 'face';
  if (/lip|شفاه|lipstick|gloss|tint|lipliner|lip liner|lip pencil|poutline|lip oil|lip balm|ملمع شفاه|أحمر شفاه|تينت|بينسل شفاه|زيت شفاه|كريم شفاه/i.test(t)) return 'lips';
  if (/mascara|eyeshadow|eyeliner|eye|kajal|عيون|رموش|ظلال|كحل|حواجب|brow/i.test(t)) return 'eyes';
  return 'face';
}

function inferMakeupTertiary(sub, text = '') {
  if (sub !== 'lips') return [];
  if (/tint|تينت|lip & cheek|شفاه وخدود/i.test(text)) return [TERTIARY.lipTint];
  if (/gloss|ملمع|liquid|سائل|oil/i.test(text)) return [TERTIARY.liquidLipstick];
  return [TERTIARY.lipstick];
}

function inferKind(leaf = '', detail = {}) {
  const text = `${detail.nameAr || ''} ${detail.nameEn || ''} ${detail.category || ''}`;
  if (PERF.test(text) && !NOT_PERF.test(text)) return 'perfume';
  if (PERFUME_BRANDS.test(text) && !NOT_PERF.test(text) && !MAKEUP.test(text)) return 'perfume';
  if (MAKEUP.test(text)) return 'makeup';
  const mapped = FACES_LEAF_MAP[leaf];
  if (mapped?.kind === 'perfume') return 'perfume';
  if (mapped?.kind === 'makeup') return 'makeup';
  if (mapped?.kind === 'care') return 'care';
  if (mapped?.kind === 'men') return 'care';
  return 'care';
}

function inferCareLeaf(leaf = '', text = '') {
  if (FACES_LEAF_MAP[leaf]?.careLeaf) return FACES_LEAF_MAP[leaf].careLeaf;
  const t = text.toLowerCase();
  if (leaf === 'haircare' || /hair|شعر|shampoo|conditioner|بلسم/i.test(t)) {
    return 'care/hair-care/shampoo-conditioners';
  }
  if (leaf === 'body-care' || /body wash|shower|deodorant|جسم|غسول جسم|مزيل عرق/i.test(t)) {
    return /deodorant|مزيل عرق/i.test(t)
      ? 'care/skin-and-body-care/deodorant'
      : 'care/skin-and-body-care/body-cleansers';
  }
  if (/sun|spf|واقي شمس/i.test(t)) return 'care/sun-care/sunscreen';
  if (/mouth|teeth|tooth|فم|أسنان|معجون/i.test(t)) return 'care/mouth--teeth-care/toothpaste';
  if (/hand|يد/i.test(t)) return 'care/hand-care/hand-moisturizer';
  if (/eye cream|كريم عين/i.test(t)) return 'care/face-care/eye-care';
  if (/mask|ماسك|sheet mask/i.test(t)) return 'care/face-care/face-masks';
  if (/cleanser|toner|غسول|تونر/i.test(t)) return 'care/face-care/cleansers--toners';
  if (/serum|سيروم/i.test(t)) return 'care/face-care/face-moisturizer';
  if (leaf === 'men-beauty-products' || /men|رجال|beard|حلاقة/i.test(t)) {
    if (/shav|beard|aftershave|حلاقة|لحية|grooming/i.test(t)) {
      return 'care/men-care/shaving-grooming';
    }
    if (/serum|cleanser|toner|moistur|mask|سيروم|غسول|كريم|تونر|زيت التنظيف/i.test(t)) {
      if (/cleanser|غسول|زيت التنظيف|cleansing/i.test(t)) return 'care/face-care/cleansers--toners';
      if (/toner|تونر/i.test(t)) return 'care/face-care/cleansers--toners';
      return 'care/face-care/face-moisturizer';
    }
    return 'care/men-care/shaving-grooming';
  }
  return 'care/face-care/face-moisturizer';
}

export function resolveFacesCategories(leaf, detail = {}) {
  const text = `${detail.nameAr || ''} ${detail.nameEn || ''} ${detail.category || ''}`;
  const kind = inferKind(leaf, detail);
  const careLeaf = inferCareLeaf(leaf, text);
  const typeKey = inferCareTypeKey(text, careLeaf);

  if (kind === 'perfume') {
    const gender = inferPerfumeGender(detail.nameEn, detail.nameAr);
    const isNiche = NICHE_BRANDS.test(text);
    const isNew = /\bnew\b|جديد|nouveau/i.test(text);
    const subcategoryIds = [
      ...perfumeSubs({
        gender: gender === 'unisex' ? 'men' : gender,
        isUnisex: gender === 'unisex',
        isNiche,
        isNew,
      }),
      ...inferPerfumeExtras(text),
    ];
    return {
      categoryId: CATEGORIES.perfumes,
      subcategoryIds: [...new Set(subcategoryIds)],
      tertiaryCategoryIds: [],
      kind,
      leaf,
    };
  }

  if (kind === 'makeup') {
    const sub = inferMakeupSub(text);
    return {
      categoryId: CATEGORIES.makeup,
      subcategoryIds: [SUBCATEGORIES[sub] || SUBCATEGORIES.face],
      tertiaryCategoryIds: inferMakeupTertiary(sub, text),
      kind,
      leaf,
      makeupSub: sub,
    };
  }

  const care = resolveCareCategories(careLeaf, {
    typeKey,
    brandEn: detail.brandEn,
    brandAr: detail.brandAr,
    barcode: detail.barcode,
    posName: detail.posName || '',
  });
  return {
    categoryId: CARE_CATEGORY_ID,
    subcategoryIds: care.subcategoryIds,
    tertiaryCategoryIds: care.tertiaryCategoryIds,
    kind: 'care',
    leaf,
    careLeaf,
    typeKey,
  };
}

export { FACES_LEAF_MAP };

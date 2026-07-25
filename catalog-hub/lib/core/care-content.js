/** Generate bilingual care product copy — written in-house, not from Niceone. */
import { getCareOverride } from './care-content-overrides.js';

const KNOWN_BRANDS = [
  'beauty of joseon', 'la roche-posay', 'la roche posay', "l'oreal paris", 'loreal paris',
  'the ordinary', 'mielle organics', 'mielle', 'eucerin', 'embryolisse', 'kerastase', 'kérastase',
  'tresemme', 'tresmme', 'panoxyl', 'cosrx', 'garnier', 'vaseline', 'dove', 'cantu', 'qv', 'rdl',
  'ekel', 'k18', 'bioderma', 'cerave', 'vichy', 'avene', 'avène', 'neutrogena', 'nivea',
  'some by mi', 'anua', 'laneige', 'innisfree', 'skin1004', 'round lab', 'isntree',
];

const TYPE_HINTS = [
  { key: 'heat-protectant', re: /heat\s*(protect|tamer|shield)|thermal/i, en: 'Heat Protectant Spray', ar: 'بخاخ حماية من الحرارة', familyEn: 'Hair heat protection', familyAr: 'حماية الشعر من الحرارة' },
  { key: 'leave-in', re: /leave[\s-]?in/i, en: 'Leave-In Treatment', ar: 'علاج بدون شطف', familyEn: 'Leave-in hair care', familyAr: 'علاج الشعر بدون شطف' },
  { key: 'lip-mask', re: /lip\s*(mask|sleep)/i, en: 'Lip Mask', ar: 'قناع الشفاه', familyEn: 'Lip treatment', familyAr: 'علاج الشفاه' },
  { key: 'lip-balm', re: /lip\s*balm/i, en: 'Lip Balm', ar: 'بلسم شفاه', familyEn: 'Lip care', familyAr: 'عناية الشفاه' },
  { key: 'sunscreen', re: /sun\s*(screen|serum|cream|stick)|spf|relief\s*sun/i, en: 'Sunscreen SPF50+', ar: 'واقي شمس SPF50+', familyEn: 'Sun protection', familyAr: 'حماية من الشمس' },
  { key: 'acne-wash', re: /panoxyl|acne|salicylic|benzoyl/i, en: 'Acne Treatment Wash', ar: 'غسول علاج حب الشباب', familyEn: 'Acne care', familyAr: 'العناية بحب الشباب' },
  { key: 'toner', re: /\btoner\b/i, en: 'Facial Toner', ar: 'تونر للوجه', familyEn: 'Skin toning', familyAr: 'تنقية البشرة' },
  { key: 'cleanser', re: /cleanser|face\s*wash/i, en: 'Facial Cleanser', ar: 'غسول الوجه', familyEn: 'Face cleansing', familyAr: 'تنظيف الوجه' },
  { key: 'shampoo', re: /shampoo/i, en: 'Shampoo', ar: 'شامبو', familyEn: 'Hair cleansing', familyAr: 'تنظيف الشعر' },
  { key: 'conditioner', re: /conditioner/i, en: 'Conditioner', ar: 'بلسم شعر', familyEn: 'Hair conditioning', familyAr: 'ترطيب الشعر' },
  { key: 'hair-mask', re: /hair\s*mask/i, en: 'Hair Mask', ar: 'ماسك الشعر', familyEn: 'Hair treatment', familyAr: 'علاج الشعر' },
  { key: 'hair-oil', re: /hair\s*oil/i, en: 'Hair Oil', ar: 'زيت الشعر', familyEn: 'Hair nourishment', familyAr: 'تغذية الشعر' },
  { key: 'hair-spray', re: /hairspray|hair\s*spray|elnett|lacquer/i, en: 'Hair Styling Spray', ar: 'بخاخ تثبيت الشعر', familyEn: 'Hair styling', familyAr: 'تصفيف الشعر' },
  { key: 'serum', re: /serum/i, en: 'Serum', ar: 'سيروم', familyEn: 'Targeted serum care', familyAr: 'سيروم مركّز' },
  { key: 'face-mask', re: /sheet\s*mask|face\s*mask/i, en: 'Sheet Face Mask', ar: 'قناع وجه ورقي', familyEn: 'Face treatment mask', familyAr: 'قناع علاجي للوجه' },
  { key: 'eye-cream', re: /eye\s*(cream|gel)/i, en: 'Eye Cream', ar: 'كريم العين', familyEn: 'Eye care', familyAr: 'عناية بالعين' },
  { key: 'scrub', re: /scrub|exfoliat/i, en: 'Exfoliating Scrub', ar: 'مقشر', familyEn: 'Exfoliation', familyAr: 'تقشير' },
  { key: 'deodorant', re: /deodorant|antiperspirant/i, en: 'Antiperspirant Deodorant', ar: 'مزيل عرق ومضاد للتعرق', familyEn: 'Body freshness', familyAr: 'انتعاش الجسم' },
  { key: 'body-wash', re: /body\s*wash|shower\s*gel/i, en: 'Body Wash', ar: 'غسول الجسم', familyEn: 'Body cleansing', familyAr: 'تنظيف الجسم' },
  { key: 'body-cream', re: /body\s*(cream|lotion|butter)|whitening/i, en: 'Body Moisturiser', ar: 'مرطب الجسم', familyEn: 'Body hydration', familyAr: 'ترطيب الجسم' },
  { key: 'hand-cream', re: /hand\s*(cream|lotion)/i, en: 'Hand Cream', ar: 'كريم اليدين', familyEn: 'Hand care', familyAr: 'عناية اليدين' },
  { key: 'toothpaste', re: /toothpaste/i, en: 'Toothpaste', ar: 'معجون أسنان', familyEn: 'Oral care', familyAr: 'العناية بالفم' },
  { key: 'mouthwash', re: /mouthwash|oral rinse|thera.?breath/i, en: 'Mouthwash', ar: 'غسول فم', familyEn: 'Oral care', familyAr: 'العناية بالفم' },
  { key: 'cream', re: /cream|crème/i, en: 'Nourishing Cream', ar: 'كريم مغذٍ', familyEn: 'Moisturising cream', familyAr: 'كريم مرطب' },
  { key: 'lotion', re: /lotion/i, en: 'Hydrating Lotion', ar: 'لوشن مرطب', familyEn: 'Hydrating lotion', familyAr: 'لوشن مرطب' },
  { key: 'moisturizer', re: /moistur/i, en: 'Moisturiser', ar: 'مرطب', familyEn: 'Skin hydration', familyAr: 'ترطيب البشرة' },
  { key: 'oil', re: /\boil\b/i, en: 'Treatment Oil', ar: 'زيت علاجي', familyEn: 'Nourishing oil', familyAr: 'زيت مغذّي' },
];

const LEAF_TYPE = [
  [/hair-care\/hair-treatment/, 'leave-in'],
  [/hair-care\/shampoo/, 'shampoo'],
  [/hair-care\/oil/, 'hair-oil'],
  [/hair-care\/hair-styling/, 'hair-spray'],
  [/hair-care\/hair-coloring/, 'hair-spray'],
  [/face-care\/lip-care/, 'lip-mask'],
  [/face-care\/face-masks/, 'face-mask'],
  [/face-care\/eye-care/, 'eye-cream'],
  [/face-care\/cleansers/, 'cleanser'],
  [/face-care\/face-moisturizer/, 'moisturizer'],
  [/face-care\/face-scrubs/, 'scrub'],
  [/sun-care\/sunscreen/, 'sunscreen'],
  [/skin-and-body-care\/deodorant/, 'deodorant'],
  [/skin-and-body-care\/body-cleansers/, 'body-wash'],
  [/skin-and-body-care\/body-moisturizer/, 'body-cream'],
  [/skin-and-body-care\/body-whitening/, 'body-cream'],
  [/hand-care\/hand-moisturizer/, 'hand-cream'],
  [/mouth.*toothpaste/, 'toothpaste'],
  [/derma-hub/, 'moisturizer'],
];

const BRAND_DISPLAY = {
  'beauty of joseon': 'Beauty of Joseon',
  'la roche-posay': 'La Roche-Posay',
  'la roche posay': 'La Roche-Posay',
  "l'oreal paris": "L'Oréal Paris",
  'loreal paris': "L'Oréal Paris",
  'the ordinary': 'The Ordinary',
  'mielle organics': 'Mielle Organics',
  mielle: 'Mielle Organics',
  eucerin: 'Eucerin',
  embryolisse: 'Embryolisse',
  kerastase: 'Kérastase',
  kérastase: 'Kérastase',
  tresemme: 'TRESemmé',
  tresmme: 'TRESemmé',
  panoxyl: 'PanOxyl',
  cosrx: 'COSRX',
  garnier: 'Garnier',
  vaseline: 'Vaseline',
  dove: 'Dove',
  cantu: 'Cantu',
  qv: 'QV',
  rdl: 'RDL',
  ekel: 'Ekel',
  k18: 'K18',
  bioderma: 'Bioderma',
  cerave: 'CeraVe',
  vichy: 'Vichy',
  avene: 'Avène',
  avène: 'Avène',
  neutrogena: 'Neutrogena',
  nivea: 'Nivea',
};

const BRAND_AR = {
  'Beauty of Joseon': 'بيوتي أوف جوسون',
  'La Roche-Posay': 'لاروش بوزيه',
  "L'Oréal Paris": 'لوريال باريس',
  'The Ordinary': 'ذا أورديناري',
  'Mielle Organics': 'ميلي أورجانيكس',
  Eucerin: 'يوريكرين',
  Embryolisse: 'إمبريوليس',
  'Kérastase': 'كيراستاس',
  TRESemmé: 'تريسميه',
  PanOxyl: 'بانوكسيل',
  COSRX: 'كوسركس',
  Garnier: 'غارنييه',
  Vaseline: 'فازلين',
  Dove: 'دوف',
  Cantu: 'كانتو',
  QV: 'كيو في',
  RDL: 'آر دي إل',
  Ekel: 'إيكيل',
  K18: 'كي18',
  Bioderma: 'بيوديرما',
  CeraVe: 'سيرافي',
  Vichy: 'فيشي',
  Avène: 'أفين',
  Neutrogena: 'نيوتروجينا',
  Nivea: 'نيفيا',
};

function cleanText(text = '') {
  return String(text)
    .replace(/[\u200e\u200f\u202a-\u202e\u061c]/g, '')
    .replace(/[^\x20-\x7E\u0600-\u06FF%+./'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSize(text = '') {
  const m = cleanText(text).match(/(\d+(?:[.,]\d+)?)\s*(ml|g|gm|gram|oz|kg|l)\b/i);
  if (!m) return '';
  const unit = m[2].toLowerCase().replace('gram', 'g').replace('gm', 'g');
  return `${m[1]}${unit}`;
}

function detectBrandFromPos(pos = '') {
  const lower = cleanText(pos).toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lower.startsWith(brand) || lower.includes(` ${brand} `) || lower.includes(brand)) {
      return BRAND_DISPLAY[brand] || titleCaseWords(brand);
    }
  }
  const first = cleanText(pos).split(/\s+/)[0];
  return first ? titleCaseWords(first) : '';
}

function titleCaseWords(text = '') {
  return cleanText(text)
    .split(/\s+/)
    .map((w) => (/^(spf|pa|k18|qv|rdl|cosrx)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
    .replace(/\bOf\b/g, 'of');
}

function detectType(text = '', leaf = '') {
  for (const t of TYPE_HINTS) if (t.re.test(text)) return t;
  for (const [re, key] of LEAF_TYPE) {
    if (re.test(leaf)) return TYPE_HINTS.find((t) => t.key === key) || TYPE_HINTS.at(-1);
  }
  return { key: 'care', en: 'Care Product', ar: 'منتج عناية', familyEn: 'Daily care', familyAr: 'عناية يومية' };
}

function stripBrandWords(text = '', brand = '') {
  let out = cleanText(text);
  for (const word of cleanText(brand).split(/\s+/)) {
    out = out.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'ig'), ' ');
  }
  return cleanText(out);
}

function extractLine(text = '', brand = '', type = null) {
  let line = stripBrandWords(text, brand);
  line = line.replace(/\b\d+(?:[.,]\d+)?\s*(ml|g|oz|kg|l)\b/gi, ' ');
  const drop = ['shampoo', 'conditioner', 'cream', 'lotion', 'serum', 'mask', 'toner', 'cleanser', 'spray', 'oil', 'gel', 'balm', 'wash', 'deodorant', 'pump', 'ml', 'g'];
  for (const w of drop) line = line.replace(new RegExp(`\\b${w}\\b`, 'gi'), ' ');
  if (type?.key === 'acne-wash') line = line.replace(/\btoner\b/gi, ' ');
  line = cleanText(line);
  if (line.length < 2) return '';
  return titleCaseWords(line);
}

function isReadablePos(pos = '') {
  const words = cleanText(pos).match(/[a-zA-Z]{3,}/g) || [];
  return words.length >= 2;
}

function buildBenefits(type) {
  const map = {
    sunscreen: ['حماية واسعة من الأشعة فوق البنفسجية', 'خفيف للاستخدام اليومي', 'يساعد على الوقاية من أضرار الشمس'],
    shampoo: ['تنظيف لطيف', 'يقوي مظهر الشعر', 'مناسب للاستخدام المنتظم'],
    moisturizer: ['ترطيب عميق', 'يعزز حاجز البشرة', 'ملمس مريح يومياً'],
    cream: ['تركيبة غنية مغذية', 'ترطيب يدوم', 'يهدئ الجفاف'],
    'face-mask': ['علاج مكثف', 'ينعش البشرة', 'يزيد الإشراقة'],
    'lip-mask': ['تغذية ليلية للشفاه', 'ينعم الشفاه الجافة', 'يعيد الراحة والنعومة'],
    'acne-wash': ['يستهدف الحبوب', 'ينظف المسام بعمق', 'يساعد على تقليل البثور'],
    'heat-protectant': ['يحمي الشعر من الحرارة', 'يقلل التقصف', 'لمسة تصفيف أنعم'],
    'leave-in': ['إصلاح وتقوية', 'لا يحتاج شطفاً', 'يحسّن ملمس الشعر'],
    deodorant: ['انتعاش يدوم', 'حماية يومية مريحة', 'تركيبة لطيفة'],
    serum: ['عناية مركزة', 'يستهدف احتياجات محددة', 'امتصاص خفيف'],
    toner: ['يوازن البشرة بعد التنظيف', 'يحسّن ملمس البشرة', 'يجهّز البشرة للخطوة التالية'],
    cleanser: ['يزيل الشوائب', 'لطيف على البشرة', 'إحساس نظافة وانتعاش'],
    'body-cream': ['ترطيب الجسم', 'ملمس ناعم', 'عناية يومية مريحة'],
    'hand-cream': ['ترطيب اليدين', 'امتصاص سريع', 'يعيد النعومة'],
    'hair-spray': ['تثبيت مرن', 'لمسة نهائية أنيقة', 'يحافظ على التسريحة'],
  };
  return map[type?.key] || ['عناية يومية فعالة', 'تركيبة عالية الجودة', 'مناسب للاستخدام المنتظم'];
}

function buildBenefitsEn(type) {
  const map = {
    sunscreen: ['Broad-spectrum UV protection', 'Lightweight daily wear', 'Helps prevent sun damage'],
    shampoo: ['Gentle cleansing', 'Supports healthy-looking hair', 'Suitable for regular use'],
    moisturizer: ['Deep hydration', 'Strengthens skin barrier', 'Comfortable daily use'],
    cream: ['Rich nourishing texture', 'Long-lasting moisture', 'Soothes dryness'],
    'face-mask': ['Intensive treatment', 'Revives tired skin', 'Boosts radiance'],
    'lip-mask': ['Overnight lip nourishment', 'Softens dry lips', 'Restores comfort'],
    'acne-wash': ['Targets breakouts', 'Deep pore cleansing', 'Helps reduce blemishes'],
    'heat-protectant': ['Shields hair from heat', 'Reduces breakage', 'Smoother styling finish'],
    'leave-in': ['Repairs and strengthens', 'No rinse needed', 'Improves hair texture'],
    deodorant: ['Long-lasting freshness', 'Comfortable daily protection', 'Skin-friendly formula'],
    serum: ['Concentrated active care', 'Targets specific concerns', 'Lightweight absorption'],
    toner: ['Balances skin after cleansing', 'Refines skin texture', 'Prepares skin for next steps'],
    cleanser: ['Removes impurities', 'Gentle on skin', 'Fresh clean feel'],
    'body-cream': ['Body hydration', 'Smooth silky feel', 'Comfortable daily care'],
    'hand-cream': ['Hand hydration', 'Fast absorption', 'Restores softness'],
    'hair-spray': ['Flexible hold', 'Elegant finishing touch', 'Keeps style in place'],
  };
  return map[type?.key] || ['Effective daily care', 'Quality formula', 'Suitable for regular routines'];
}

function buildGeneratedContent(ctx = {}) {
  const posClean = cleanText(ctx.posName || '');
  const source = isReadablePos(posClean) ? posClean : '';
  const type = detectType(source, ctx.leaf || '');
  const size = extractSize(source);
  const brandEn = detectBrandFromPos(source) || titleCaseWords(ctx.brandEn || 'Brand');
  const brandAr = BRAND_AR[brandEn] || cleanText(ctx.brandAr) || brandEn;
  const line = extractLine(source, brandEn, type);
  const catEn = ctx.categoryEn || type.familyEn;
  const catAr = ctx.categoryAr || type.familyAr;

  const productPartEn = line || type.en;
  const productPartAr = line || type.ar;
  const nameEn = [brandEn, productPartEn, size].filter(Boolean).join(' ').trim();
  const nameAr = [brandAr, productPartAr, size].filter(Boolean).join(' ').trim();

  const benefitsEn = buildBenefitsEn(type);
  const benefitsAr = buildBenefits(type);

  const descriptionEn = `${nameEn} is crafted for effective ${type.familyEn.toLowerCase()} as part of your daily beauty routine.

◆ Category: ${catEn}
◆ Product type: ${type.en}
◆ Key benefits: ${benefitsEn.join(' · ')}
◆ Suitable for: Daily care routines
◆ Size: ${size || 'As listed'}`;

  const descriptionAr = `${nameAr} مصمم لتقديم ${type.ar} فعال ضمن روتين العناية اليومي.

◆ التصنيف: ${catAr}
◆ نوع المنتج: ${type.ar}
◆ الفوائد الرئيسية: ${benefitsAr.join(' · ')}
◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية
◆ الحجم: ${size || 'حسب المنتج'}`;

  return { nameEn, nameAr, descriptionEn, descriptionAr, size, typeKey: type.key, brandEn, line };
}

/**
 * @param {{ barcode?: string, brandEn?: string, brandAr?: string, categoryEn?: string, categoryAr?: string, posName?: string, leaf?: string }} ctx
 */
export function buildCareContent(ctx = {}) {
  const override = ctx.barcode ? getCareOverride(ctx.barcode) : null;
  if (override) {
    return {
      nameEn: override.nameEn,
      nameAr: override.nameAr,
      descriptionEn: override.descriptionEn,
      descriptionAr: override.descriptionAr,
      typeKey: override.typeKey,
      brandEn: override.nameEn.split(' ')[0],
      line: '',
      size: '',
      subcategorySlugs: override.subcategorySlugs || [],
      tertiarySlugs: override.tertiarySlugs || [],
    };
  }
  return buildGeneratedContent(ctx);
}

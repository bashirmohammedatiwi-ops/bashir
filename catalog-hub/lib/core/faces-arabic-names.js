import { cleanText, stripBrandPrefix } from './makeup-product-names.js';

/** Known brand Arabic spellings for Faces catalog */
const BRAND_AR = {
  essence: 'إيسنس',
  catrice: 'كاتريس',
  sheglam: 'شيجلام',
  dior: 'ديور',
  chanel: 'شانيل',
  clarins: 'كلارنس',
  cosrx: 'كوسركس',
  skin1004: 'سكين 1004',
  'beauty of joseon': 'بيوتي أوف جوسون',
  kerastase: 'كيراستاس',
  'armaf': 'ارماف',
  'ARMAF': 'ارماف',
  'issey miyake': 'ايسي مياكي',
  'dolce & gabbana': 'دولتشي أند غابانا',
  'dolce gabbana': 'دولتشي أند غابانا',
  'ralph lauren': 'رالف لورين',
  valentino: 'فالنتينو',
  chloe: 'كلوي',
  rabanne: 'رابان',
  'paco rabanne': 'رابان',
  mancera: 'مانسيرا',
  montale: 'مونتال',
  'dr althea': 'دكتور آلتيا',
  'dr. althea': 'دكتور آلتيا',
  'the balm': 'ذا بالم',
  mac: 'ماك',
  nars: 'نارس',
  'huda beauty': 'هودا بيوتي',
  'tom ford': 'توم فورد',
  creed: 'كريد',
  lancome: 'لانكوم',
  'make up for ever': 'ميك أب فور إيفر',
  'makeup forever': 'ميك أب فور إيفر',
  tarte: 'تارت',
  burberry: 'بربري',
  clinique: 'كلينيك',
  cerave: 'سيرافي',
  'la roche-posay': 'لاروش بوزيه',
  'la roche posay': 'لاروش بوزيه',
  'sol de janeiro': 'سول دي جانيرو',
  ysl: 'إيف سان لوران',
  'yves saint laurent': 'إيف سان لوران',
  armani: 'أرماني',
  'giorgio armani': 'أرماني',
  gucci: 'غوتشي',
  prada: 'برادا',
  versace: 'فيرساتشي',
  burberry: 'بربري',
  givenchy: 'جيفنشي',
  guerlain: 'غيرلان',
  kilian: 'كيليان',
  byredo: 'بايريدو',
  amouage: 'أمواج',
  xerjoff: 'زيرجوف',
  'jean paul gaultier': 'جان بول غوتييه',
  mugler: 'موغلر',
  'carolina herrera': 'كارولينا هيريرا',
  'calvin klein': 'كالفن كلاين',
  'hugo boss': 'هوغو بوس',
  diesel: 'ديزل',
  'jo malone': 'جو مالون',
  'estee lauder': 'إستي لودر',
  'bobbi brown': 'بوبي براون',
  'charlotte tilbury': 'شارلوت تيلبري',
  benefit: 'بنفت',
  'urban decay': 'أوربان ديكاي',
  'too faced': 'تو فيسد',
  'fenty beauty': 'فنتي بيوتي',
  maybelline: 'ميبيلين',
  loreal: 'لوريال',
  "l'oreal": 'لوريال',
  nyx: 'نيكس',
  revlon: 'ريفلون',
  bourjois: 'بورجواز',
  'max factor': 'ماكس فاكتور',
  anua: 'أنوا',
  laneige: 'لانيج',
  innisfree: 'إينيسفري',
  'dr jart': 'دكتور جارت',
  bioderma: 'بيوديرما',
  vichy: 'فيشي',
  eucerin: 'يوسيرين',
  nivea: 'نيفيا',
  garnier: 'غارنييه',
  'the ordinary': 'ذا أورديناري',
  filorga: 'فيلورجا',
  'paula\'s choice': 'باولا تشويس',
  tatcha: 'تاتشا',
  shiseido: 'شيسيدو',
  'sk-ii': 'إس كي تو',
  olaplex: 'أولابلكس',
  moroccanoil: 'موروكانويل',
  davines: 'دافينز',
  redken: 'ريدكن',
  lorealprofessionnel: 'لوريال بروفشنال',
};

const AR_MAP = [
  [/eau de parfum/gi, 'أو دو بارفان'],
  [/eau de toilette/gi, 'أو دو تواليت'],
  [/eau de cologne/gi, 'أو دو كولون'],
  [/extrait de parfum/gi, 'إكستريت دو بارفان'],
  [/parfum spray/gi, 'عطر بخاخ'],
  [/parfum/gi, 'عطر'],
  [/cologne intense/gi, 'كولون مكثف'],
  [/cologne/gi, 'كولون'],
  [/intense/gi, 'مكثف'],
  [/dramatic false lash effect/gi, 'تأثير رموش كثيفة'],
  [/false lash/gi, 'رموش كثيفة'],
  [/volume boost/gi, 'تعزيز الحجم'],
  [/waterproof/gi, 'مقاوم للماء'],
  [/long-?lasting/gi, 'طويل الأمد'],
  [/24h/gi, '24 ساعة'],
  [/matte/gi, 'مطفي'],
  [/glossy|gloss/gi, 'لامع'],
  [/liquid lipstick/gi, 'أحمر شفاه سائل'],
  [/lip liner|lipliner/gi, 'محدد شفاه'],
  [/lip pencil|poutline/gi, 'قلم شفاه'],
  [/lip oil/gi, 'زيت شفاه'],
  [/lip balm/gi, 'مرطب شفاه'],
  [/lip tint|lip & cheek tint/gi, 'تينت شفاه وخدود'],
  [/lip gloss/gi, 'ملمع شفاه'],
  [/lipstick/gi, 'أحمر شفاه'],
  [/mascara/gi, 'مسكارا'],
  [/eyeliner|ink liner/gi, 'كحل'],
  [/kajal/gi, 'كحل كاجال'],
  [/eyeshadow/gi, 'ظلال عيون'],
  [/eyebrow|brow/gi, 'حواجب'],
  [/concealer/gi, 'خافي عيوب'],
  [/foundation/gi, 'كريم أساس'],
  [/primer/gi, 'برايمر'],
  [/highlighter/gi, 'هايلايتر'],
  [/blush/gi, 'أحمر خدود'],
  [/bronzer/gi, 'برونزر'],
  [/powder/gi, 'بودرة'],
  [/setting powder/gi, 'بودرة تثبيت'],
  [/compact/gi, 'مضغوطة'],
  [/palette/gi, 'باليت'],
  [/sharpener/gi, 'مبراة'],
  [/lash glue/gi, 'لاصق رموش'],
  [/makeup remover/gi, 'مزيل مكياج'],
  [/cleansing oil/gi, 'زيت تنظيف'],
  [/face serum|facial serum/gi, 'سيروم للوجه'],
  [/face toner|facial toner/gi, 'تونر للوجه'],
  [/face cream/gi, 'كريم وجه'],
  [/hair mask/gi, 'ماسك شعر'],
  [/shampoo/gi, 'شامبو'],
  [/conditioner/gi, 'بلسم'],
  [/sunscreen|sun cream/gi, 'واقي شمس'],
  [/micellar water/gi, 'ماء ميسيلار'],
  [/hyaluronic acid/gi, 'حمض الهيالورونيك'],
  [/niacinamide/gi, 'نياسيناميد'],
  [/centella/gi, 'سنتيلا'],
  [/ginseng/gi, 'جنسنغ'],
  [/relief cream/gi, 'كريم ترطيب وإصلاح'],
  [/double serum/gi, 'سيروم مزدوج'],
  [/for men|pour homme/gi, 'للرجال'],
  [/for women|pour femme/gi, 'للنساء'],
  [/unisex/gi, 'للجنسين'],
  [/gift set|coffret/gi, 'طقم هدايا'],
  [/travel size|mini/gi, 'حجم سفر'],
  [/(\d+)\s*ml\b/gi, '$1 مل'],
  [/(\d+)\s*g\b/gi, '$1 جم'],
  [/(\d+)ml\b/gi, '$1 مل'],
  [/(\d+)g\b/gi, '$1 جم'],
  [/spf\s*50\+/gi, 'SPF 50+'],
  [/spf\s*\+?50/gi, 'SPF 50'],
  [/spf\s*\+?30/gi, 'SPF 30'],
];

const COLOR_AR = {
  cherry: 'كرزي',
  chili: 'تشيلي',
  taupe: 'بني فاتح',
  beige: 'بيج',
  brown: 'بني',
  nude: 'نود',
  pink: 'وردي',
  rose: 'ورد',
  red: 'أحمر',
  coral: 'مرجاني',
  mauve: 'موف',
  sand: 'رملي',
  white: 'أبيض',
  black: 'أسود',
  gold: 'ذهبي',
  silver: 'فضي',
  neutral: 'محايد',
  strawberry: 'فراولة',
  chili: 'فلفل حار',
};

export function hasLatinInArabic(nameAr = '') {
  const stripped = String(nameAr)
    .replace(/SPF\s*\+?\d+\+?/gi, '')
    .replace(/\b\d+\s*%/g, '')
    .replace(/\b\d+\s*(مل|جم)\b/g, '')
    .replace(/\+/g, '')
    .replace(/ب5/g, '');
  return /[a-zA-Z]{2,}/.test(stripped);
}

function resolveBrandAr(brandEn = '', brandAr = '') {
  const ar = cleanText(brandAr);
  if (ar && !hasLatinInArabic(ar)) return ar;
  const key = cleanText(brandEn).toLowerCase();
  if (BRAND_AR[key]) return BRAND_AR[key];
  for (const [k, v] of Object.entries(BRAND_AR)) {
    if (key.startsWith(k) || key.includes(k)) return v;
  }
  return ar || '';
}

function translateProductToArabic(text = '') {
  let s = cleanText(text);
  s = s.replace(/\bB5\b/gi, '§B5§');
  for (const [re, ar] of AR_MAP) s = s.replace(re, ar);
  s = s.replace(/§B5§/g, 'ب5');
  s = s.replace(/L'|l'/g, '');
  // translate known color tokens before stripping latin
  s = s.replace(/\b([a-z][a-z_-]{2,})\b/gi, (m) => COLOR_AR[m.toLowerCase()] || '');
  s = s.replace(/\b(?!SPF\b)[A-Za-z]{2,}\b/g, '');
  s = s.replace(/[A-Za-z]/g, '');
  s = s.replace(/[_]+/g, ' ');
  s = s.replace(/\s*[-–—]+\s*/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function polishShadeAr(shade = '') {
  let s = cleanText(shade);
  if (!s) return '';
  // keep numeric shade codes only
  if (/^\d{1,3}[a-z]?$/i.test(s)) return s.replace(/[a-z]/gi, '');
  if (!hasLatinInArabic(s)) return s;
  s = translateProductToArabic(s);
  const num = shade.match(/\b\d{1,3}[a-z]?\b/i);
  if (num && !s.includes(num[0].replace(/[a-z]/gi, ''))) {
    s = `${s} ${num[0].replace(/[a-z]/gi, '')}`.trim();
  }
  // if still latin, use number-only or drop
  if (hasLatinInArabic(s)) {
    const digits = shade.match(/\d+/);
    return digits ? digits[0] : '';
  }
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Ensure Arabic display name is fully Arabic: "Brand - Product".
 * Rebuilds from English when store Arabic has Latin fragments.
 */
export function polishFacesArabicNames({
  brandAr = '',
  brandEn = '',
  productAr = '',
  productEn = '',
  nameAr = '',
  nameEn = '',
} = {}) {
  const brandArClean = resolveBrandAr(brandEn, brandAr);
  const brandEnClean = cleanText(brandEn) || brandArClean;

  let productEnClean = stripBrandPrefix(brandEnClean, cleanText(productEn) || cleanText(nameEn));
  let productArClean = stripBrandPrefix(brandArClean, cleanText(productAr));

  if (!productArClean || hasLatinInArabic(productArClean)) {
    productArClean = translateProductToArabic(productEnClean || productArClean || nameAr);
  }
  if (!productArClean) productArClean = translateProductToArabic(nameEn);

  productArClean = productArClean
    .replace(new RegExp(`^${escapeRegExp(brandArClean)}\\s*[-–—]?\\s*`, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim();

  const finalNameAr = brandArClean && productArClean
    ? `${brandArClean} - ${productArClean}`
    : brandArClean || productArClean;

  return {
    brandAr: brandArClean,
    brandEn: brandEnClean,
    productAr: productArClean,
    productEn: productEnClean,
    nameAr: cleanText(finalNameAr),
    nameEn: cleanText(nameEn) || cleanText(`${brandEnClean} ${productEnClean}`),
  };
}

function escapeRegExp(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function appendArabicShade(names, shade) {
  if (!shade) return names;
  let shadeAr = polishShadeAr(shade.nameAr || shade.nameEn || '');
  const shadeEn = cleanText(shade.nameEn || shade.nameAr || '');
  if (!shadeAr && shadeEn) {
    const num = shadeEn.match(/\b(?:no\.?|#)?\s*([yY]?\d+[a-z]?)\b/i);
    shadeAr = num ? num[1].replace(/^[yY]/, '').replace(/[a-z]/gi, '') : '';
  }
  if (!shadeAr && !shadeEn) return names;
  const hasAr = shadeAr && names.nameAr.includes(shadeAr);
  const hasEn = shadeEn && names.nameEn.toLowerCase().includes(shadeEn.toLowerCase());
  const nameAr = hasAr || !shadeAr
    ? names.nameAr
    : cleanText(`${names.nameAr} - ${shadeAr}`);
  if (hasLatinInArabic(nameAr)) {
    const digits = (shadeEn + shade.nameAr).match(/\d+/);
    if (digits) {
      const fixed = hasAr ? names.nameAr : cleanText(`${names.nameAr} - ${digits[0]}`);
      if (!hasLatinInArabic(fixed)) {
        return {
          ...names,
          nameAr: fixed,
          nameEn: hasEn ? names.nameEn : cleanText(`${names.nameEn} - ${shadeEn}`),
          validAr: true,
        };
      }
    }
    return { ...names, validAr: false };
  }
  return {
    ...names,
    nameAr,
    nameEn: hasEn ? names.nameEn : cleanText(`${names.nameEn} - ${shadeEn}`),
    validAr: true,
  };
}

export function isValidArabicName(nameAr = '') {
  const t = cleanText(nameAr);
  return t.length >= 8 && !hasLatinInArabic(t) && /[\u0600-\u06FF]{4,}/.test(t);
}

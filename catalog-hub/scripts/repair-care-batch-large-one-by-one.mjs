#!/usr/bin/env node
/**
 * Repair / import care batch-large ONE PRODUCT AT A TIME.
 * - Fix EN/AR names, descriptions, categories
 * - Verify after each product before next
 * - Live progress counter
 *
 * Usage: node scripts/repair-care-batch-large-one-by-one.mjs
 * Env: DELAY_MS=1500 START=1 LIMIT=0 DRY_RUN=1
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CARE_CATEGORY_ID,
  resolveCareCategories,
} from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';
import { miraayaAdapter } from '../lib/stores/miraaya/index.js';
import { elryanAdapter } from '../lib/stores/elryan/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BARCODES_FILE = path.join(__dirname, '../data/care-batch-large-barcodes.txt');
const RESEARCH_FILE = path.join(__dirname, '../data/care-batch-large-research.json');
const STORE_FILE = path.join(__dirname, '../data/care-batch-large-store-lookup.json');
const STATE_FILE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const OVERRIDES_OUT = path.join(__dirname, '../data/care-batch-large-products.json');

const DELAY_MS = Number(process.env.DELAY_MS || 1500);
const DRY_RUN = process.env.DRY_RUN === '1';
const START = Math.max(1, Number(process.env.START || 1));
const LIMIT = Number(process.env.LIMIT || 0);
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const ONLY_BARCODES = (process.env.BARCODES || '')
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 85);
}

function cleanText(s = '') {
  return String(s)
    .replace(/[\u200e\u200f\u202a-\u202e\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** English → Arabic phrase map (longest first) */
const AR_MAP = [
  [/refreshing face wash/gi, 'غسول وجه منعش'],
  [/micellar water|micellar cleansing water/gi, 'ماء ميسيلار'],
  [/make\s*up cleaning foam|makeup cleaning foam/gi, 'رغوة تنظيف المكياج'],
  [/cleansing foam|cleaning foam|foam cleanser/gi, 'رغوة تنظيف'],
  [/face wash|facial wash|cleanser|cleansing gel/gi, 'غسول وجه'],
  [/face serum|facial serum/gi, 'سيروم للوجه'],
  [/facial toner|face toner/gi, 'تونر للوجه'],
  [/face cream/gi, 'كريم وجه'],
  [/body lotion/gi, 'لوشن جسم'],
  [/make\s*up removers?|makeup removers?/gi, 'مزيل مكياج'],
  [/salicylic acid/gi, 'حمض الساليسيليك'],
  [/hyaluronic acid|hya acid/gi, 'حمض الهيالورونيك'],
  [/glycolic acid/gi, 'حمض الجليكوليك'],
  [/retinoic acid/gi, 'حمض الريتينويك'],
  [/hyaluron expert/gi, 'هيالورون إكسبرت'],
  [/hyaluron/gi, 'هيالورون'],
  [/prebiotic/gi, 'بروبيوتيك'],
  [/micellair|micellar/gi, 'ميسيلار'],
  [/niacinamide/gi, 'نياسيناميد'],
  [/panthenol/gi, 'بانثينول'],
  [/retinol/gi, 'ريتينول'],
  [/glutathione/gi, 'جلوتاثيون'],
  [/arbutin/gi, 'أربوتين'],
  [/ceramide/gi, 'سيراميد'],
  [/collagen spray/gi, 'بخاخ كولاجين'],
  [/collagen serum/gi, 'سيروم كولاجين'],
  [/collagen/gi, 'كولاجين'],
  [/vitamin c|vit\.?\s*c|vitamini c/gi, 'فيتامين سي'],
  [/vitamin e|vit\.?\s*e/gi, 'فيتامين إي'],
  [/tea tree/gi, 'شجرة الشاي'],
  [/aloe vera|aloe/gi, 'الصبار'],
  [/avocado cleanser/gi, 'غسول بالأفوكادو'],
  [/avocado/gi, 'الأفوكادو'],
  [/chamomile/gi, 'البابونج'],
  [/lavender/gi, 'الخزامى'],
  [/rose water|rosewater/gi, 'ماء الورد'],
  [/coconut water/gi, 'ماء جوز الهند'],
  [/green tea/gi, 'الشاي الأخضر'],
  [/cucumber/gi, 'الخيار'],
  [/lemon/gi, 'الليمون'],
  [/papaya/gi, 'البابايا'],
  [/cinnamon/gi, 'القرفة'],
  [/berry/gi, 'التوت'],
  [/rice/gi, 'الأرز'],
  [/peptide/gi, 'ببتيد'],
  [/snail/gi, 'الحلزون'],
  [/cica/gi, 'سيكا'],
  [/urea repair/gi, 'يوريا ريبير'],
  [/urea/gi, 'يوريا'],
  [/spf\s*50\+/gi, 'SPF 50+'],
  [/spf\s*\+?50/gi, 'SPF 50'],
  [/spf\s*\+?60/gi, 'SPF 60'],
  [/spf\s*\+?90/gi, 'SPF 90'],
  [/spf\s*\+?40/gi, 'SPF 40'],
  [/spf\s*\+?30/gi, 'SPF 30'],
  [/spf\s*\+?15/gi, 'SPF 15'],
  [/hand cream/gi, 'كريم يدين'],
  [/heel balm|foot cream|foot care/gi, 'كريم قدمين'],
  [/eye cream|eye care/gi, 'كريم عين'],
  [/face cream|day cream|night cream/gi, 'كريم وجه'],
  [/body lotion|body cream/gi, 'لوشن جسم'],
  [/shower gel|body wash/gi, 'غسول جسم'],
  [/intimate gel|feminine wash/gi, 'غسول حميمي'],
  [/lip mask|lip scrub/gi, 'عناية شفاه'],
  [/sunscreen|sun cream|sun protect|sun shield/gi, 'واقي شمس'],
  [/hair serum/gi, 'سيروم شعر'],
  [/petroleum jelly|blue seal/gi, 'جيلي'],
  [/cocoa butter/gi, 'زبدة الكاكاو'],
  [/face fluid/gi, 'سائل للوجه'],
  [/bright reveal/gi, 'برايت ريفيل'],
  [/anti pigment|anti-pigment/gi, 'مضاد للتصبغ'],
  [/dermo purifyer|dermo pure/gi, 'ديرمو بيور'],
  [/skin active|skinactive/gi, 'سكين أكتيف'],
  [/skin naturals/gi, 'سكين ناتشرالز'],
  [/pure active|pureactive/gi, 'بيور أكتيف'],
  [/oil control|oily skin/gi, 'للبشرة الدهنية'],
  [/dry skin|sensitive skin/gi, 'للبشرة الجافة والحساسة'],
  [/normal skin|all skin/gi, 'لكل أنواع البشرة'],
  [/anti-?acne|acne/gi, 'مضاد للحبوب'],
  [/anti-?age(?:ing)?|anti-?wrinkle/gi, 'مضاد للشيخوخة'],
  [/brighten(?:ing)?|whitening|illuminat/gi, 'مضيء'],
  [/moisturiz(?:ing|er)?|hydrat/gi, 'مرطب'],
  [/nourishing|repair(?:ing)?/gi, 'مُرمّم'],
  [/deep pore|pore/gi, 'المسام'],
  [/refreshing/gi, 'منعش'],
  [/advanced/gi, 'متقدم'],
  [/intense|intensive/gi, 'مكثف'],
  [/daily/gi, 'يومي'],
  [/expert/gi, 'إكسبرت'],
  [/serum/gi, 'سيروم'],
  [/toner/gi, 'تونر'],
  [/scrub|exfoliating wash|exfoliat/gi, 'مقشر'],
  [/shampoo/gi, 'شامبو'],
  [/conditioner/gi, 'بلسم'],
  [/cream/gi, 'كريم'],
  [/lotion/gi, 'لوشن'],
  [/spray/gi, 'بخاخ'],
  [/mask|masque/gi, 'قناع'],
  [/jelly/gi, 'جيلي'],
  [/deodorant|anti-?perspirant|deodoranti/gi, 'مزيل عرق'],
  [/no\.?\s*sd\d+/gi, ''],
  [/(\d+)\s*ml\b/gi, '$1 مل'],
  [/(\d+)\s*g\b/gi, '$1 جم'],
  [/(\d+)ml\b/gi, '$1 مل'],
  [/(\d+)g\b/gi, '$1 جم'],
  [/\bB5\b/gi, 'ب5'],
  [/\+?\s*60\s*spf|spf\s*\+?\s*60|60\s*spf/gi, 'SPF 60'],
  [/\+?\s*50\s*spf|spf\s*\+?\s*50|50\s*spf/gi, 'SPF 50'],
  [/rose\s*water/gi, 'ماء الورد'],
  [/rose/gi, 'الورد'],
  [/hyaluronic acid serum/gi, 'سيروم حمض الهيالورونيك'],
  [/hyaluronic acid/gi, 'حمض الهيالورونيك'],
  [/face wash/gi, 'غسول وجه'],
  [/body serum/gi, 'سيروم للجسم'],
  [/double lash/gi, 'تقوية الرموش'],
  [/eye care/gi, 'عناية بالعين'],
  [/daily moisture/gi, 'ترطيب يومي'],
  [/intensive body moisturiser|intensive body moisturizer/gi, 'مرطب جسم مكثف'],
  [/concealer pomade/gi, 'كونسيلر'],
  [/infaillible|infallible/gi, 'إنفاليبل'],
  [/water boots|water boots/gi, 'أكوا بوتس'],
  [/micellar water/gi, 'ماء ميسيلار'],
  [/gummy/gi, 'علكة'],
  [/vit\.?\s*c/gi, 'فيتامين سي'],
  [/vit\.?\s*e/gi, 'فيتامين إي'],
  [/derma/gi, 'ديرما'],
  [/cat eye/gi, 'كات'],
  [/bam\b/gi, ''],
  [/ultra roll/gi, 'رول أون'],
  [/bambo fresh/gi, 'بالخيزران'],
  [/t-moly|tmoly/gi, 'تي مولي'],
  [/biovene/gi, 'بيوفين'],
  [/snow white/gi, 'سنو وايت'],
  [/berry/gi, 'التوت'],
];

const TOKEN_BRANDS = [
  ['NIPPON', 'Dr.Clinic', 'دكتور كلينيك'],
  ['DR CLINIC', 'Dr.Clinic', 'دكتور كلينيك'],
  ['SADOER', 'Sadoer', 'سادور'],
  ['SADDER', 'Sadoer', 'سادور'],
  ['FAYANKOY', 'Fayankou', 'فايانكو'],
  ['FAYANKOU', 'Fayankou', 'فايانكو'],
  ['BIOAQUA', 'Bioaqua', 'بيوأكوا'],
  ['DISSAR', 'Dissar', 'ديسار'],
  ['ONLY', 'Only', 'أونلي'],
  ['FOLTENE', 'Foltene', 'فولتين'],
  ['FAIR LADY', 'Fair Lady', 'فير ليدي'],
  ['DERMA 101', 'Derma 101', 'ديرما 101'],
  ['DERMA', 'Derma 101', 'ديرما 101'],
  ['TRIDERMA', 'TriDerma', 'تراي ديرما'],
  ['GLYSOLID', 'Glysolid', 'جليسوليد'],
  ['WARDAH', 'Wardah', 'وردة'],
  ['HIMALAYA', 'Himalaya', 'هيمالايا'],
  ['POND', "Pond's", 'بوندز'],
  ['PONDS', "Pond's", 'بوندز'],
  ['BIOLIQ', 'Bioliq', 'بيوليك'],
  ['ESTELIN', 'Estelin', 'إستيلين'],
  ['CETAPHIL', 'Cetaphil', 'سيتافيل'],
  ['CERAVE', 'CeraVe', 'سيرافي'],
  ['LA ROCHE', 'La Roche-Posay', 'لاروش بوزيه'],
  ['EUCERIN', 'Eucerin', 'يوسيرين'],
  ['NIVEA', 'Nivea', 'نيفيا'],
  ['GARNIER', 'Garnier', 'غارنييه'],
  ['SIMPLE', 'Simple', 'سيمبل'],
  ['QV ', 'QV', 'كيو في'],
  ['LOREAL', "L'Oréal Paris", 'لوريال باريس'],
  ["L'ORAL", "L'Oréal Paris", 'لوريال باريس'],
  ["L'OREAL", "L'Oréal Paris", 'لوريال باريس'],
  ['ORDINARY', 'The Ordinary', 'ذا أورديناري'],
  ['EMBRYOLISSE', 'Embryolisse', 'أمبريوليس'],
  ['REVITALASH', 'RevitaLash', 'ريفيتالاش'],
  ['OBAGI', 'Obagi', 'أوباجي'],
  ['DERMEDIC', 'Dermedic', 'ديرميديك'],
  ['FLOXIA', 'Floxia', 'فلوكسيا'],
  ['PANOXYL', 'PanOxyl', 'بانوكسيل'],
  ['DR RASHEL', 'Dr.Rashel', 'دكتور راشيل'],
  ['DR.RASHEL', 'Dr.Rashel', 'دكتور راشيل'],
  ['DR DAVEY', 'Dr.Davey', 'دكتور ديفي'],
  ['DR.DAVEY', 'Dr.Davey', 'دكتور ديفي'],
  ['YC ', 'YC', 'واي سي'],
  ['ALPHA ARBUTIN', 'YC', 'واي سي'],
  ['BEAUTY FORMULAS', 'Beauty Formulas', 'بيوتي فورميولاز'],
  ['SKIN CEUTICALS', 'SkinCeuticals', 'سكين سيوتيكالز'],
  ['MISHA', 'Missha', 'ميشا'],
  ['MISSHA', 'Missha', 'ميشا'],
  ['ESSENCE', 'essence', 'إيسنس'],
  ['BABARIA', 'Babaria', 'باباريا'],
  ['VASELINE', 'Vaseline', 'فازلين'],
  ['NEUTROGENA', 'Neutrogena', 'نيوتروجينا'],
  ['BIOVENE', 'Biovene', 'بيوفين'],
  ['T-MOLY', 'T-Moly', 'تي مولي'],
  ['CAT EYE', 'Cat Eye', 'كات'],
  ['ROSE BERRY', 'Rose Berry', 'روز بيري'],
  ['SNOW WHITE', 'Snow White', 'سنو وايت'],
];

const SMALL_WORDS = new Set(['for', 'and', 'the', 'with', 'of', 'in', 'to', 'a', 'an', 'by', 'or', 'at']);

const BRAND_AR = {
  'dr.clinic': 'دكتور كلينيك',
  sadoer: 'سادور',
  bioaqua: 'بيوأكوا',
  fayankou: 'فايانكو',
  nivea: 'نيفيا',
  garnier: 'غارنييه',
  "l'oréal paris": 'لوريال باريس',
  "l'oreal paris": 'لوريال باريس',
  loreal: 'لوريال باريس',
  simple: 'سيمبل',
  obagi: 'أوباجي',
  'the ordinary': 'ذا أورديناري',
  embryolisse: 'أمبريوليس',
  revitalash: 'ريفيتالاش',
  tizo: 'تيزو',
  dermedic: 'ديرميديك',
  qv: 'كيو في',
  'dr.davey': 'دكتور ديفي',
  'dr.rashel': 'دكتور راشيل',
  'derma 101': 'ديرما 101',
  floxia: 'فلوكسيا',
  panoxyl: 'بانوكسيل',
  foltene: 'فولتين',
  eveline: 'إيفيلين',
  bioliq: 'بيوليك',
  estelin: 'إستيلين',
  'beauty formulas': 'بيوتي فورميولاز',
  'the body shop': 'ذا بودي شوب',
  olay: 'أولاي',
  neutrogena: 'نيوتروجينا',
  aveeno: 'أفينو',
  cantu: 'كانتو',
  bioderma: 'بيوديرما',
  essence: 'إيسنس',
  mooyam: 'مويام',
  missha: 'ميشا',
  babaria: 'باباريا',
  wardah: 'وردة',
  himalaya: 'هيمالايا',
  skinceuticals: 'سكين سيوتيكالز',
  'skin ceuticals': 'سكين سيوتيكالز',
  eucerin: 'يوسيرين',
  vaseline: 'فازلين',
  glysolid: 'جليسوليد',
  dissar: 'ديسار',
  'fair lady': 'فير ليدي',
  triderma: 'تراي ديرما',
  yc: 'واي سي',
  'snow white': 'سنو وايت',
  nippon: 'دكتور كلينيك',
  'la cabine': 'لا كابين',
  lacabine: 'لا كابين',
  cosmaline: 'كوزمالين',
  soskin: 'سوسكين',
  'secret key': 'سيكريت كي',
  'now foods': 'ناو فودز',
  now: 'ناو فودز',
  'pfb vanish': 'بي إف بي فانيش',
  pfb: 'بي إف بي فانيش',
  gosh: 'غوش',
  beautybomb: 'بيوتي بومب',
  'eveline cosmetics': 'إيفيلين',
  eveline: 'إيفيلين',
  biovene: 'بيوفين',
  't-moly': 'تي مولي',
  'cat eye': 'كات آي',
  only: 'أونلي',
  'aqua vera': 'أكوا فيرا',
  'pond\'s': 'بوندز',
  ponds: 'بوندز',
  cetaphil: 'سيتافيل',
  cerave: 'سيرافي',
};

function extractBrandFromGarbled(text = '') {
  const upper = cleanText(text).toUpperCase();
  for (const [token, brandEn, brandAr] of TOKEN_BRANDS) {
    if (upper.includes(token.trim())) return { brandEn, brandAr, token: token.trim() };
  }
  return null;
}

function isReadablePosName(name = '') {
  const n = cleanText(name);
  if (!n || n.length < 6) return false;
  if (extractBrandFromGarbled(n)) return true;
  if (!/[A-Za-z]{3,}/.test(n)) return false;
  const letters = (n.match(/[A-Za-z]/g) || []).length;
  const weird = (n.match(/[^\x20-\x7E\u0600-\u06FF]/g) || []).length;
  return letters >= 8 && weird < 3;
}

function expandPosAbbreviations(text = '') {
  let s = cleanText(text);
  s = s.replace(/\bNO\.?\s*SD\d+/gi, '');
  s = s.replace(/\bSADDER\b/gi, 'Sadoer');
  s = s.replace(/\bFAYANKOY\b/gi, 'Fayankou');
  s = s.replace(/\bORDINARU\b/gi, 'Ordinary');
  s = s.replace(/\bParlak\b/gi, 'Brightening');
  s = s.replace(/\bVitamini\b/gi, 'Vitamin');
  s = s.replace(/\bHYA\b/gi, 'Hyaluronic');
  s = s.replace(/\bVIT\.?\s*C\b/gi, 'Vitamin C');
  s = s.replace(/\bV\.C\b/gi, 'Vitamin C');
  s = s.replace(/\bVIT\.?\s*E\b/gi, 'Vitamin E');
  s = s.replace(/\bACID\b/gi, 'Acid');
  s = s.replace(/\bCLEANSER\b/gi, 'Cleanser');
  s = s.replace(/\bTONER\b/gi, 'Toner');
  s = s.replace(/\bSERUM\b/gi, 'Serum');
  s = s.replace(/\bCREAM\b/gi, 'Cream');
  s = s.replace(/\bWASH\b/gi, 'Wash');
  s = s.replace(/\bSPRAY\b/gi, 'Spray');
  s = s.replace(/\bMASK\b/gi, 'Mask');
  s = s.replace(/\bLOTION\b/gi, 'Lotion');
  s = s.replace(/\bMOISTUR(?:ISER|IZER)\b/gi, 'Moisturiser');
  s = s.replace(/\bNippon\b/gi, 'Dr.Clinic');
  s = s.replace(/\bL'?Or(?:é|e)al(?:\s*Paris)?\b/gi, "L'Oréal Paris");
  s = s.replace(/\bLoreal\b/gi, "L'Oréal Paris");
  s = s.replace(/(\d+)\s*(ML|Ml)\b/g, '$1 ml');
  s = s.replace(/(\d+)\s*(G)\b(?!\w)/g, '$1 g');
  s = s.replace(/(\d+)(ml|g)\b/gi, (_, n, u) => `${n} ${u.toLowerCase()}`);
  // Infer product type when only ingredient + size (e.g. ROSE HYA ACID 100ML)
  if (/\bhyaluronic\b/i.test(s) && !/\b(cleanser|toner|serum|cream|wash|lotion|spray|mask)\b/i.test(s)) {
    s = `${s} Serum`.replace(/\s+/g, ' ').trim();
  }
  if (/\bspf\b/i.test(s) && !/\b(sunscreen|cream|lotion|spray)\b/i.test(s)) {
    s = `${s} Sunscreen`.replace(/\s+/g, ' ').trim();
  }
  if (/^micellar water\b/i.test(s)) {
    s = s.replace(/^micellar water/i, 'Micellar Cleansing Water');
  }
  return normalizeEnglishWordOrder(s.replace(/\s+/g, ' ').trim());
}

function normalizeEnglishWordOrder(nameEn = '') {
  let s = cleanText(nameEn);
  const size = extractSize(s);
  if (size) {
    s = s.replace(new RegExp(size.replace('.', '\\.'), 'i'), '')
      .replace(/\b(\d+(?:\.\d+)?)\s*(ml|g)\b/gi, '')
      .replace(/\s+/g, ' ').trim();
  }
  const typeMatch = s.match(/\b(serum|cleanser|toner|cream|lotion|spray|mask|sunscreen|shampoo|deodorant|moisturiser|moisturizer|wash)\b/i);
  if (typeMatch) {
    const typeWord = typeMatch[0];
    s = s.replace(new RegExp(`\\b${typeWord}\\b`, 'i'), '').replace(/\s+/g, ' ').trim();
    s = `${s} ${typeWord}`.replace(/\s+/g, ' ').trim();
  }
  if (size) s = `${s} ${size}`.replace(/\s+/g, ' ').trim();
  return s.trim();
}

function polishArabicOrder(nameAr = '', brandAr = '') {
  let s = normalizeBrandAr(nameAr, brandAr);
  const typePatterns = [
    [/(\s+سيروم)$/u, 'سيروم'],
    [/(\s+غسول وجه)$/u, 'غسول وجه'],
    [/(\s+تونر)$/u, 'تونر'],
    [/(\s+كريم)$/u, 'كريم'],
    [/(\s+لوشن)$/u, 'لوشن'],
    [/(\s+بخاخ)$/u, 'بخاخ'],
    [/(\s+واقي شمس)$/u, 'واقي شمس'],
  ];
  for (const [re, typeWord] of typePatterns) {
    if (re.test(s)) {
      s = s.replace(re, '').trim();
      if (brandAr && s.startsWith(brandAr)) {
        const rest = s.slice(brandAr.length).trim();
        s = `${brandAr} ${typeWord} ${rest}`.replace(/\s+/g, ' ').trim();
      } else {
        s = `${typeWord} ${s}`.replace(/\s+/g, ' ').trim();
      }
      break;
    }
  }
  s = s.replace(/الورد/g, 'ورد').replace(/ورد حمض/g, 'ورد بحمض');
  return normalizeBrandAr(s, brandAr);
}

function titleCaseWord(word = '', index = 0) {
  const w = String(word);
  if (!w) return w;
  if (/^\d/.test(w) || /^SPF/i.test(w)) return w.replace(/spf/i, 'SPF');
  if (/%/.test(w)) return w;
  if (index > 0 && SMALL_WORDS.has(w.toLowerCase())) return w.toLowerCase();
  if (/^\+/.test(w)) return w;
  if (w.includes("'")) {
    return w.split("'").map((part, i) => {
      if (!part) return part;
      if (i > 0) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join("'");
  }
  if (/^(SPF|QV|B5|pH)$/i.test(w)) return w.toUpperCase().replace(/^PH$/, 'pH');
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function formatEnglishName(nameEn = '', brandEn = '') {
  let s = expandPosAbbreviations(nameEn);
  s = s.split(/\s+/).map((w, i) => titleCaseWord(w, i)).join(' ');
  // Preserve The Ordinary, L'Oréal, Dr.Clinic
  s = s.replace(/\bThe Ordinary\b/i, 'The Ordinary');
  s = s.replace(/\bL'oréal Paris\b/i, "L'Oréal Paris");
  s = s.replace(/\bDr\. Clinic\b/i, 'Dr.Clinic');
  s = s.replace(/\bSkin Ceuticals\b/i, 'SkinCeuticals');
  s = s.replace(/\bLa Roche-posay\b/i, 'La Roche-Posay');
  if (brandEn) {
    const esc = brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`\\s*[-–—]\\s*${esc}\\s*$`, 'i'), '');
    s = s.replace(/\s*[-–—]\s*[A-Za-z0-9.'\s&]{2,24}$/, (m) => {
      const seg = m.replace(/^[\s\-–—]+/, '').trim();
      if (new RegExp(`^${esc}$`, 'i').test(seg)) return '';
      if (/^\d/.test(seg)) return m;
      return '';
    });
    s = s.replace(new RegExp(`^(${esc}\\s+){2,}`, 'i'), `${brandEn} `);
  }
  return s.replace(/\s+/g, ' ').trim();
}

function normalizeBrandAr(nameAr = '', brandAr = '') {
  if (!brandAr) return cleanText(nameAr);
  let s = cleanText(nameAr);
  const esc = brandAr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Remove trailing duplicate brand suffix and dash segments from store names
  s = s.replace(new RegExp(`\\s*[-–—]\\s*${esc}\\s*$`), '');
  s = s.replace(/\s*[-–—]\s*[^-\s–—]{2,}\s*$/, (m) => {
    // drop trailing dash segment if it looks like size/variant noise or duplicate brand
    const seg = m.replace(/^[\s\-–—]+/, '').trim();
    if (new RegExp(`^${esc}$`, 'i').test(seg)) return '';
    if (/^\d/.test(seg) || /^(مل|جم|\d+\s*(مل|جم))/.test(seg)) return m;
    if (seg.length <= 18) return '';
    return m;
  });
  s = s.replace(/\s*&\s*/g, ' و ');
  s = s.replace(/\s*[-–—]+\s*/g, ' ');
  // Remove duplicate / variant brand prefixes
  s = normalizeArabicAlif(s).replace(/(?:ذا\s+ا?ورد(?:ين|n?)ري\s*)+/gi, ' ').trim();
  s = s.replace(/^(The\s+Ordinary\s+)+/gi, '');
  s = s.replace(/^(نيتروجينا\s+)+/gi, `${brandAr} `);
  s = s.replace(/^(امبريوليس\s+)+/gi, `${brandAr} `);
  s = s.replace(/^(غارنييه\s+)+/gi, `${brandAr} `);
  s = s.replace(new RegExp(`^(${esc}\\s*)+`, 'i'), `${brandAr} `);
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function normalizeArabicAlif(s = '') {
  return String(s).replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
}

function hasDuplicateBrandAr(nameAr = '', brandAr = '') {
  if (!nameAr) return false;
  const norm = normalizeArabicAlif(nameAr);
  const ordinaryHits = (norm.match(/ذا\s+ا?ورد(?:ين|n?)ري/gi) || []).length;
  if (ordinaryHits >= 2) return true;
  if (!brandAr) return false;
  const esc = normalizeArabicAlif(brandAr).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (normalizeArabicAlif(nameAr).match(new RegExp(esc, 'g')) || []).length > 1;
}

function finalizeNames({ nameEn, nameAr, brandEn, brandAr }) {
  const en = formatEnglishName(nameEn, brandEn);
  let ar = normalizeBrandAr(nameAr, brandAr);
  if (!ar || hasLatinInArabic(ar) || ar.length < 10 || hasDuplicateBrandAr(ar, brandAr)) {
    ar = translateToArabic(en, brandAr);
  }
  ar = normalizeBrandAr(ar, brandAr);
  if (brandAr && !ar.startsWith(brandAr)) ar = `${brandAr} ${ar}`.replace(/\s+/g, ' ').trim();
  ar = normalizeBrandAr(ar, brandAr);
  ar = polishArabicOrder(ar, brandAr);
  return { nameEn: en, nameAr: ar };
}

function inferCoreFromSize(size = '', barcode = '') {
  const n = parseFloat(String(size));
  if (!Number.isFinite(n)) return 'Face Serum';
  const isG = /\bg\b/i.test(size);
  if (isG) return n <= 100 ? 'Face Cream' : 'Body Cream';
  if (n <= 45) return 'Face Serum';
  if (n <= 130) return 'Facial Toner';
  if (n <= 220) return 'Face Wash';
  return 'Body Lotion';
}

function inferProductFromGarbled(pos = '', barcode = '') {
  const upper = cleanText(pos).toUpperCase();
  if (/MICELLAR\s*WATER/i.test(upper)) {
    const sizeM = cleanText(pos).match(/(\d+(?:\.\d+)?)/);
    const size = sizeM ? `${sizeM[1]} ml` : '';
    const nameEn = formatEnglishName(`Micellar Cleansing Water${size ? ` ${size}` : ''}`.trim());
    const nameAr = translateToArabic(nameEn, '');
    return {
      brandEn: 'Skincare',
      brandAr: 'عناية',
      nameEn,
      nameAr: nameAr.startsWith('عناية') ? nameAr : `عناية ${nameAr}`,
      source: 'pos-micellar',
    };
  }

  const garbled = extractBrandFromGarbled(pos);
  if (!garbled) return null;
  const { brandEn, brandAr } = garbled;
  const sizeM = cleanText(pos).match(/(\d+(?:\.\d+)?)\s*(?:ml|g|mg|مل|جم)?/i);
  const size = sizeM ? `${sizeM[1]} ${/g|جم/i.test(pos) && !/ml|مل/i.test(pos) ? 'g' : 'ml'}` : '';
  let core = '';
  if (/\+?\s*60\s*SPF|SPF\s*\+?\s*60|60\s*SPF/i.test(upper)) core = 'SPF 60 Sunscreen';
  else if (/\+?\s*50\s*SPF|SPF\s*\+?\s*50|50\s*SPF/i.test(upper)) core = 'SPF 50 Sunscreen';
  else if (/MICELLAR\s*WATER/i.test(upper)) core = 'Micellar Cleansing Water';
  else if (/HYA|HYALURON|HYALURONIC/i.test(upper)) core = 'Hyaluronic Acid Serum';
  else if (/VIT\s*C|VITAMIN\s*C|V\.C/i.test(upper)) core = 'Vitamin C Serum';
  else if (/RETINOL/i.test(upper)) core = 'Retinol Serum';
  else if (/COLLAGEN/i.test(upper)) core = 'Collagen Serum';
  else if (/NIACINAMIDE/i.test(upper)) core = 'Niacinamide Serum';
  else if (/CLEANSER|FACE\s*WASH|WASH/i.test(upper)) core = 'Face Wash';
  else if (/TONER/i.test(upper)) core = 'Facial Toner';
  else if (/CREAM/i.test(upper)) core = 'Face Cream';
  else if (/LOTION/i.test(upper)) core = 'Body Lotion';
  else if (/SPRAY/i.test(upper)) core = 'Facial Spray';
  else if (/SHAMPOO/i.test(upper)) core = 'Shampoo';
  else if (/DEODOR/i.test(upper)) core = 'Deodorant';
  else if (size) core = inferCoreFromSize(size, barcode);
  else return null;
  const nameEn = formatEnglishName(`${brandEn} ${core}${size ? ` ${size}` : ''}`.trim(), brandEn);
  if (!isConfidentName(nameEn) && !size) return null;
  const nameAr = translateToArabic(nameEn, brandAr);
  return { brandEn, brandAr, nameEn, nameAr, source: 'pos-garbled' };
}

const BRAND_RULES = [
  [/dr\.?\s*clinic|nippon/i, 'Dr.Clinic', 'دكتور كلينيك'],
  [/sadoer|sadder/i, 'Sadoer', 'سادور'],
  [/bioaqua/i, 'Bioaqua', 'بيوأكوا'],
  [/fayankou|fayankoy/i, 'Fayankou', 'فايانكو'],
  [/estelin/i, 'Estelin', 'إستيلين'],
  [/bioliq/i, 'Bioliq', 'بيوليك'],
  [/nivea/i, 'Nivea', 'نيفيا'],
  [/garnier/i, 'Garnier', 'غارنييه'],
  [/l'?oré?al|loreal/i, "L'Oréal Paris", 'لوريال باريس'],
  [/simple/i, 'Simple', 'سيمبل'],
  [/the ordinary|ordinaru/i, 'The Ordinary', 'ذا أورديناري'],
  [/embryolisse/i, 'Embryolisse', 'أمبريوليس'],
  [/eucerin/i, 'Eucerin', 'يوسيرين'],
  [/vaseline/i, 'Vaseline', 'فازلين'],
  [/obagi/i, 'Obagi', 'أوباجي'],
  [/revitalash/i, 'RevitaLash', 'ريفيتالاش'],
  [/tizo/i, 'TiZO', 'تيزو'],
  [/dermedic/i, 'Dermedic', 'ديرميديك'],
  [/\bqv\b/i, 'QV', 'كيو في'],
  [/dr\.?\s*davey/i, 'Dr.Davey', 'دكتور ديفي'],
  [/dr\.?\s*rashel/i, 'Dr.Rashel', 'دكتور راشيل'],
  [/derma\s*101/i, 'Derma 101', 'ديرما 101'],
  [/floxia/i, 'Floxia', 'فلوكسيا'],
  [/panoxyl/i, 'PanOxyl', 'بانوكسيل'],
  [/foltene/i, 'Foltene', 'فولتين'],
  [/eveline/i, 'Eveline', 'إيفيلين'],
  [/beauty formulas/i, 'Beauty Formulas', 'بيوتي فورميولاز'],
  [/glysolid/i, 'Glysolid', 'جليسوليد'],
  [/dissar/i, 'Dissar', 'ديسار'],
  [/fair lady/i, 'Fair Lady', 'فير ليدي'],
  [/triderma/i, 'TriDerma', 'تراي ديرما'],
  [/\byc\b|alpha arbutin/i, 'YC', 'واي سي'],
  [/neutrogena/i, 'Neutrogena', 'نيوتروجينا'],
  [/aveeno/i, 'Aveeno', 'أفينو'],
  [/missha/i, 'Missha', 'ميشا'],
  [/babaria/i, 'Babaria', 'باباريا'],
  [/essence/i, 'essence', 'إيسنس'],
  [/la\s*cabine|lacabine/i, 'La Cabine', 'لا كابين'],
  [/cosmaline/i, 'Cosmaline', 'كوزمالين'],
  [/soskin/i, 'Soskin', 'سوسكين'],
  [/secret\s*key/i, 'Secret Key', 'سيكريت كي'],
  [/now\s*foods|\bnow\b/i, 'Now Foods', 'ناو فودز'],
  [/pfb\s*vanish|\bpfb\b/i, 'PFB Vanish', 'بي إف بي فانيش'],
  [/\bgosh\b/i, 'Gosh', 'غوش'],
  [/beautybomb/i, 'Beautybomb', 'بيوتي بومب'],
  [/eveline/i, 'Eveline', 'إيفيلين'],
  [/biovene/i, 'Biovene', 'بيوفين'],
  [/t-moly|tmoly/i, 'T-Moly', 'تي مولي'],
  [/cat eye/i, 'Cat Eye', 'كات آي'],
  [/\bonly\b/i, 'Only', 'أونلي'],
];

function isDrClinicBarcode(barcode = '') {
  const b = String(barcode);
  if (b.startsWith('868092333') || b.startsWith('868092334')) return true;
  const extra = new Set([
    '8680923352206', '8680923353210', '8680923353227', '8680923353234',
    '8680923353296', '8680923353753', '8680923356211', '8680923356228',
    '8680923356242', '8680923357218', '8680923359922', '8680923360317',
  ]);
  return extra.has(b);
}

function detectBrand(text = '', barcode = '') {
  if (isDrClinicBarcode(barcode)) return { brandEn: 'Dr.Clinic', brandAr: 'دكتور كلينيك' };
  for (const [re, brandEn, brandAr] of BRAND_RULES) {
    if (re.test(text)) return { brandEn, brandAr };
  }
  // Fallback: readable English POS with a known product-type word
  const clean = cleanText(text);
  const letters = (clean.match(/[A-Za-z]/g) || []).length;
  if (letters >= 12 && /\b(serum|cream|toner|cleanser|wash|lotion|shampoo|sunscreen|spf|mask|gel|oil|balm|spray)\b/i.test(clean)) {
    const m = clean.match(/^([A-Za-z][A-Za-z0-9'.]*(?:\s+[A-Za-z][A-Za-z0-9'.]*)?)/);
    if (m) {
      const brandEn = m[1].replace(/\s+/g, ' ').trim();
      if (brandEn.length >= 2 && brandEn.length <= 24) {
        return { brandEn, brandAr: brandArOf(brandEn) || brandEn };
      }
    }
  }
  return null;
}

function brandArOf(brandEn = '') {
  const key = brandEn.toLowerCase().trim();
  if (BRAND_AR[key]) return BRAND_AR[key];
  // Never return Latin as Arabic brand — approximate phonetic for common tokens
  const approx = {
    derma: 'ديرما',
    farmstay: 'فارسماي',
    kokuryu: 'كوكوريو',
    soothing: 'مهدئ',
    strenghtening: 'مقوّي',
    strengthening: 'مقوّي',
  };
  const parts = key.split(/\s+/).map((w) => approx[w] || '');
  const joined = parts.filter(Boolean).join(' ');
  return joined || 'عناية';
}

function extractSize(text = '') {
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(ml|g|mg|مل|جم)\b/i)
    || String(text).match(/(\d+(?:\.\d+)?)(ml|g|mg)\b/i);
  if (!m) return '';
  const unit = /مل|ml/i.test(m[2]) ? 'ml' : /جم|g/i.test(m[2]) ? 'g' : m[2];
  return `${m[1]} ${unit}`;
}

function sizeAr(size) {
  if (!size) return 'حسب المنتج';
  return size.replace(/\s*ml\b/i, ' مل').replace(/\s*g\b/i, ' جم');
}

function detectTypeKey(text = '') {
  const t = text.toLowerCase();
  if (/sun\s*(screen|cream|protect|shield)|spf/.test(t)) return 'sunscreen';
  if (/shampoo/.test(t)) return 'shampoo';
  if (/conditioner/.test(t)) return 'conditioner';
  if (/deodorant|anti-?perspirant|deodoranti/.test(t)) return 'deodorant';
  if (/shower gel|body wash|feminine wash|intimate/.test(t)) return 'body-wash';
  if (/hand cream/.test(t)) return 'hand-cream';
  if (/heel|foot cream|foot care/.test(t)) return 'body-cream';
  if (/body (cream|lotion)|body jelly|petroleum jelly|blue seal/.test(t)) return 'body-cream';
  if (/eye cream|eye care|eyelash|lash|brow/.test(t)) return 'eye-cream';
  if (/lip mask|lip scrub|lip care/.test(t)) return 'lip-balm';
  if (/mask|masque/.test(t) && !/sheet/.test(t)) return 'face-mask';
  if (/scrub|exfoliat/.test(t)) return 'scrub';
  if (/\btoner\b/.test(t)) return 'toner';
  if (/cleanser|face wash|foam|micellar|cleansing water|makeup remo/.test(t)) return 'cleanser';
  if (/\bserum\b/.test(t)) return 'serum';
  if (/\bhyaluronic\b/i.test(t) && !/cleanser|toner|wash|cream|lotion|spray/.test(t)) return 'serum';
  if (/cream|crème|gel cream/.test(t)) return 'cream';
  if (/lotion|moistur|hydrat|jelly/.test(t)) return 'moisturizer';
  return 'moisturizer';
}

function categoryFor(typeKey, brandEn = '') {
  const korean = /bioaqua|fayankou|estelin|derma 101|missha|mooyam|sadoer|dissar/i.test(brandEn);
  const derma = /eucerin|qv|embryolisse|bioderma|cetaphil|la roche|dermedic|floxia|panoxyl|obagi|aveeno|neutrogena|glysolid/i.test(brandEn);

  if (typeKey === 'sunscreen') {
    return {
      sub: korean ? ['care-korean-skincare-6', 'care-face-care', 'care-sun-care'] : derma ? ['care-derma-hub', 'care-face-care', 'care-sun-care'] : ['care-face-care', 'care-sun-care'],
      tert: ['care-sun-care-sunscreen'],
      catEn: 'Sun protection',
      catAr: 'حماية من الشمس',
    };
  }
  if (['shampoo', 'conditioner'].includes(typeKey)) {
    return { sub: ['care-hair-care'], tert: ['care-hair-care-shampoo-conditioners'], catEn: 'Hair care', catAr: 'العناية بالشعر' };
  }
  if (typeKey === 'deodorant') {
    return { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-deodorant'], catEn: 'Body care', catAr: 'العناية بالجسم' };
  }
  if (typeKey === 'body-wash') {
    return { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-cleansers'], catEn: 'Body care', catAr: 'العناية بالجسم' };
  }
  if (typeKey === 'body-cream') {
    return { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'], catEn: 'Body care', catAr: 'العناية بالجسم' };
  }
  if (typeKey === 'hand-cream') {
    return { sub: ['care-hand-care'], tert: ['care-hand-care-hand-moisturizer'], catEn: 'Hand care', catAr: 'العناية باليدين' };
  }
  if (typeKey === 'eye-cream') {
    return {
      sub: derma ? ['care-derma-hub', 'care-face-care'] : ['care-face-care'],
      tert: ['care-face-care-eye-care'],
      catEn: 'Eye care',
      catAr: 'العناية بالعين',
    };
  }
  if (typeKey === 'lip-balm') {
    return { sub: ['care-face-care'], tert: ['care-face-care-lip-care'], catEn: 'Lip care', catAr: 'العناية بالشفاه' };
  }
  if (typeKey === 'face-mask') {
    return { sub: ['care-face-care'], tert: ['care-face-care-face-masks'], catEn: 'Face care', catAr: 'العناية بالوجه' };
  }
  if (typeKey === 'scrub') {
    return { sub: ['care-face-care'], tert: ['care-face-care-face-scrubs'], catEn: 'Face care', catAr: 'العناية بالوجه' };
  }
  if (typeKey === 'cleanser' || typeKey === 'toner') {
    return {
      sub: korean ? ['care-korean-skincare-6', 'care-face-care'] : derma ? ['care-derma-hub', 'care-face-care'] : ['care-face-care'],
      tert: ['care-face-care-cleansers-toners'],
      catEn: 'Face care',
      catAr: 'العناية بالوجه',
    };
  }
  // serum / cream / moisturizer
  return {
    sub: korean ? ['care-korean-skincare-6', 'care-face-care'] : derma ? ['care-derma-hub', 'care-face-care'] : ['care-face-care'],
    tert: ['care-face-care-face-moisturizer'],
    catEn: 'Face care',
    catAr: 'العناية بالوجه',
  };
}

function typeLabels(typeKey) {
  const map = {
    cleanser: ['Facial cleanser', 'غسول للوجه'],
    toner: ['Facial toner', 'تونر للوجه'],
    serum: ['Face serum', 'سيروم للوجه'],
    cream: ['Face cream', 'كريم للوجه'],
    moisturizer: ['Moisturiser', 'مرطب'],
    sunscreen: ['Sunscreen', 'واقي شمس'],
    scrub: ['Facial scrub', 'مقشر للوجه'],
    'body-cream': ['Body moisturiser', 'مرطب للجسم'],
    'body-wash': ['Body cleanser', 'غسول للجسم'],
    deodorant: ['Deodorant', 'مزيل عرق'],
    shampoo: ['Shampoo', 'شامبو'],
    conditioner: ['Conditioner', 'بلسم شعر'],
    'hand-cream': ['Hand cream', 'كريم يدين'],
    'eye-cream': ['Eye cream', 'كريم عين'],
    'lip-balm': ['Lip care', 'عناية بالشفاه'],
    'face-mask': ['Face mask', 'قناع وجه'],
  };
  return map[typeKey] || ['Skincare product', 'منتج عناية'];
}

function benefitsFor(typeKey, nameEn = '') {
  const t = nameEn.toLowerCase();
  const en = [];
  const ar = [];
  if (/vitamin c|vit\.?\s*c/.test(t)) { en.push('Vitamin C radiance'); ar.push('إشراقة فيتامين سي'); }
  if (/niacinamide/.test(t)) { en.push('Niacinamide balance'); ar.push('توازن النياسيناميد'); }
  if (/salicylic|acne/.test(t)) { en.push('Blemish care'); ar.push('عناية بالحبوب'); }
  if (/hyaluron|hydrat|moistur/.test(t)) { en.push('Hydration'); ar.push('ترطيب'); }
  if (/collagen/.test(t)) { en.push('Collagen support'); ar.push('دعم الكولاجين'); }
  if (/retinol/.test(t)) { en.push('Skin renewal'); ar.push('تجديد البشرة'); }
  if (/spf|sun/.test(t)) { en.push('UV protection'); ar.push('حماية من الشمس'); }
  if (/micellar|cleanser|wash|foam/.test(t)) { en.push('Gentle cleanse'); ar.push('تنظيف لطيف'); }
  if (/toner/.test(t)) { en.push('Skin prep'); ar.push('تهيئة البشرة'); }
  if (!en.length) { en.push('Daily care', 'Quality formula'); ar.push('عناية يومية', 'تركيبة موثوقة'); }
  while (en.length < 3) { en.push('Routine essential'); ar.push('أساسي للروتين'); }
  return { en: en.slice(0, 3), ar: ar.slice(0, 3) };
}

function translateToArabic(english = '', brandAr = '') {
  let s = cleanText(english);
  // strip leading brand repeats
  s = s.replace(/^(dr\.?\s*clinic|nippon|sadoer|sadder|bioaqua|fayankou|fayankoy|estelin|bioliq|nivea|garnier|l'?oré?al(?:\s*paris)?|loreal(?:\s*paris)?|simple|the ordinary|embryolisse|eucerin|vaseline|obagi|qv|derma\s*101|floxia|panoxyl|foltene|beauty formulas|glysolid|dissar|fair lady|triderma|yc|dermedic|revitalash|tizo|dr\.?\s*davey|dr\.?\s*rashel|neutrogena|skinceuticals|biovene|t-moly|cat eye|snow white|micellar water)\s+/gi, '');
  s = s.replace(/\bB5\b/gi, '§B5§');
  for (const [re, ar] of AR_MAP) s = s.replace(re, ar);
  s = s.replace(/§B5§/g, 'ب5');
  // cleanup leftover latin fragments (keep SPF and numbers)
  s = s.replace(/L'|l'/g, '');
  s = s.replace(/\b(?!SPF\b)[A-Za-z]{2,}\b/g, '');
  s = s.replace(/[A-Za-z]/g, '');
  s = s.replace(/\s*([+/])\s*/g, ' $1 ').replace(/[-–—]+$/g, '').replace(/\s+/g, ' ').trim();
  if (!s) s = 'منتج عناية';
  return normalizeBrandAr(brandAr ? `${brandAr} ${s}` : s, brandAr);
}

function polishStoreArabic(nameAr = '', brandAr = '', nameEn = '') {
  let s = cleanText(nameAr).replace(/[-–—]+$/g, '').trim();
  if (!s) return translateToArabic(nameEn, brandAr);
  // strip latin except SPF
  if (hasLatinInArabic(s)) {
    // if mostly latin, rebuild from English
    const latin = (s.match(/[A-Za-z]/g) || []).length;
    const arabic = (s.match(/[\u0600-\u06FF]/g) || []).length;
    if (latin > arabic) return translateToArabic(nameEn, brandAr);
    s = s.replace(/L'|l'/g, '');
    s = s.replace(/\b(?!SPF\b)[A-Za-z]{2,}\b/g, '');
    s = s.replace(/[A-Za-z]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
  }
  if (brandAr) {
    // normalize brand naming from store (e.g. Nivea → نيفيا)
    s = s.replace(/^(Nivea|Garnier|Loreal|L'Oréal|Simple|Eucerin|Vaseline)\s+/i, '');
    if (!s.startsWith(brandAr)) s = `${brandAr} ${s}`;
    const esc = brandAr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`^(${esc}\\s*)+`), `${brandAr} `);
  }
  s = s.replace(/[-–—]+$/g, '').replace(/\s+/g, ' ').trim();
  return normalizeBrandAr(s, brandAr);
}

function isMostlyArabic(text = '') {
  const ar = (String(text).match(/[\u0600-\u06FF]/g) || []).length;
  const lat = (String(text).match(/[A-Za-z]/g) || []).length;
  return ar >= 8 && ar > lat;
}

function cleanEnglishName(raw = '', brandEn = '') {
  let s = cleanText(raw)
    .replace(/[\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  s = expandPosAbbreviations(s);
  if (brandEn) {
    const esc = brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`^(?:${esc}\\s*)+`, 'i'), '');
    s = s.replace(/^(?:l'?oré?al(?:\s*paris)?|loreal(?:\s*paris)?)\s+/i, '');
    s = `${brandEn} ${s}`.replace(/\s+/g, ' ').trim();
    s = s.replace(new RegExp(`^(${esc}\\s+){2,}`, 'i'), `${brandEn} `);
  }
  return formatEnglishName(s, brandEn);
}

function isConfidentName(nameEn = '') {
  const n = cleanText(nameEn);
  if (n.length < 12) return false;
  const letters = (n.match(/[A-Za-z]/g) || []).length;
  if (letters < 10) return false;
  // reject near-empty after brand
  const withoutBrand = n.replace(/^[A-Za-z0-9.'.\s&+-]+?\s/, '');
  if (withoutBrand.length < 4 && !/spf/i.test(n)) return false;
  if (/^(micellar water)\s*-?\s*\d+$/i.test(n)) return false;
  if (/\bFAYANKOY\b/i.test(n) && n.split(/\s+/).length <= 3) return false;
  return true;
}

function hasLatinInArabic(nameAr = '') {
  const stripped = String(nameAr)
    .replace(/SPF\s*\+?\d+\+?/gi, '')
    .replace(/\b\d+\s*%/g, '')
    .replace(/\+/g, '')
    .replace(/ب5/g, '');
  return /[a-zA-Z]{2,}/.test(stripped);
}

function buildDescriptions({ nameEn, nameAr, brandEn, typeKey, catEn, catAr, size }) {
  const [typeEn, typeAr] = typeLabels(typeKey);
  const benefits = benefitsFor(typeKey, nameEn);
  const sizeEn = size || 'As listed';
  const sizeA = sizeAr(size);
  const introEn = `${nameEn} delivers targeted ${typeEn.toLowerCase()} care for daily routines.`;
  const introAr = `${nameAr} يقدّم عناية ${typeAr} مركّزة ضمن الروتين اليومي.`;
  return {
    descriptionEn: `${introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: ${benefits.en.join(' · ')}\n◆ Suitable for: Daily care routines\n◆ Size: ${sizeEn}`,
    descriptionAr: `${introAr}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: ${benefits.ar.join(' · ')}\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${sizeA}`,
  };
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { done: {}, skipped: {}, failed: {} };
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); }
  catch { return { done: {}, skipped: {}, failed: {} }; }
}

function saveState(state) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function findProduct(barcode) {
  const res = await api(`/products?limit=5&search=${encodeURIComponent(barcode)}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  return items.find((p) => String(p.sku || p.barcode || '').trim() === barcode) || null;
}

async function loadBrands() {
  const brands = await api('/brands?limit=500');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const bySlug = new Map();
  for (const b of list) {
    if (b.slug) bySlug.set(b.slug.toLowerCase(), b.id);
  }
  return { list, bySlug };
}

function brandSlug(name = '') {
  return String(name).toLowerCase().trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function resolveBrandId(cache, brandEn, brandAr) {
  const EXACT = {
    'dr.clinic': ['dr-clinic', 'drclinic'],
    "l'oréal paris": ['loreal', 'loreal-paris'],
    'the ordinary': ['the-ordinary'],
    'beauty formulas': ['beauty-formulas'],
    'derma 101': ['derma-101'],
    'dr.davey': ['dr-davey'],
    'dr.rashel': ['dr-rashel'],
    'the body shop': ['the-body-shop'],
    'la roche-posay': ['la-roche-posay'],
    'fair lady': ['fair-lady'],
  };
  const key = brandEn.toLowerCase().trim();
  const candidates = EXACT[key] || [brandSlug(brandEn)];
  for (const slug of candidates) {
    if (cache.bySlug.has(slug)) return cache.bySlug.get(slug);
  }
  const exact = cache.list.find((b) => {
    const names = [b.nameEn, b.nameAr, b.name].filter(Boolean).map((s) => s.trim().toLowerCase());
    return names.includes(key) || names.includes(brandAr.toLowerCase());
  });
  if (exact) return exact.id;
  if (DRY_RUN) return `dry-${candidates[0]}`;
  const slug = candidates[0];
  const created = await api('/brands', { method: 'POST', body: { name: brandEn, slug } });
  cache.bySlug.set(slug, created.id);
  cache.list.push({ id: created.id, slug, nameEn: brandEn, nameAr: brandAr });
  return created.id;
}

async function liveLookup(barcode) {
  try {
    const hits = await miraayaAdapter.searchBarcode(barcode);
    if (hits?.[0]) {
      const h = hits[0];
      return {
        nameEn: h.nameEn || h.name,
        nameAr: h.nameAr,
        brandEn: h.brandEn || h.manufacturerEn,
        brandAr: h.brandAr || h.manufacturer,
        source: 'miraaya',
      };
    }
  } catch { /* ignore */ }
  try {
    const hits = await elryanAdapter.searchBarcode(barcode);
    if (hits?.[0]) {
      const h = hits[0];
      return {
        nameEn: h.nameEn || h.name,
        nameAr: h.nameAr,
        brandEn: h.brandEn || h.manufacturerEn,
        brandAr: h.brandAr || h.manufacturer,
        source: 'elryan',
      };
    }
  } catch { /* ignore */ }
  return null;
}

function identify({ barcode, posName, storeRow, live }) {
  const store = live || storeRow?.miraaya || storeRow?.elryan || null;
  const pos = cleanText(posName || '');

  if (store?.nameEn || store?.nameAr) {
    let brandEn = store.brandEn || detectBrand(`${store.nameEn} ${store.nameAr} ${pos}`, barcode)?.brandEn;
    let brandAr = store.brandAr || detectBrand(`${store.nameEn} ${store.nameAr} ${pos}`, barcode)?.brandAr;
    if (!brandEn) {
      const d = detectBrand(pos, barcode) || extractBrandFromGarbled(pos);
      brandEn = d?.brandEn;
      brandAr = d?.brandAr;
    }
    if (!brandEn) return inferProductFromGarbled(pos, barcode);

    const posBrand = detectBrand(pos, barcode) || extractBrandFromGarbled(pos);
    if (posBrand && store.brandEn && !new RegExp(posBrand.brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(store.brandEn || '')) {
      brandEn = posBrand.brandEn;
      brandAr = posBrand.brandAr;
      const built = finalizeNames({
        nameEn: cleanEnglishName(isReadablePosName(pos) ? pos : store.nameEn || '', brandEn),
        nameAr: translateToArabic(cleanEnglishName(isReadablePosName(pos) ? pos : store.nameEn || '', brandEn), brandAr),
        brandEn,
        brandAr,
      });
      if (!isConfidentName(built.nameEn)) return inferProductFromGarbled(pos, barcode);
      return { brandEn, brandAr, ...built, source: 'pos-override' };
    }

    brandAr = brandArOf(brandEn) || brandAr || brandEn;
    let rawEn = store.nameEn || '';
    if (isMostlyArabic(rawEn) || isMostlyArabic(store.nameAr || '')) {
      if (isReadablePosName(pos)) rawEn = pos;
      else {
        const garbled = inferProductFromGarbled(pos, barcode);
        if (garbled) return garbled;
        rawEn = pos;
      }
    }
    let nameEn = cleanEnglishName(rawEn || store.nameAr || '', brandEn);
    if (barcode.startsWith('868092') && isDrClinicBarcode(barcode)) {
      brandEn = 'Dr.Clinic';
      brandAr = 'دكتور كلينيك';
      nameEn = cleanEnglishName(String(rawEn || store.nameEn || '').replace(/^Nippon\s+/i, ''), 'Dr.Clinic');
    } else if (barcode.startsWith('868092')) {
      brandEn = 'Nippon';
      brandAr = 'نيبون';
      nameEn = cleanEnglishName(String(rawEn || store.nameEn || ''), 'Nippon');
    }
    let nameAr = polishStoreArabic(store.nameAr || '', brandAr, nameEn);
    if (!nameAr || hasLatinInArabic(nameAr) || nameAr.length < 10 || isMostlyArabic(nameEn)) {
      nameAr = translateToArabic(nameEn, brandAr);
    }
    const built = finalizeNames({ nameEn, nameAr, brandEn, brandAr });
    if (!isConfidentName(built.nameEn)) return inferProductFromGarbled(pos, barcode);
    return { brandEn, brandAr, ...built, source: store.source || 'store' };
  }

  if (isReadablePosName(pos)) {
    const brand = detectBrand(pos, barcode) || extractBrandFromGarbled(pos);
    if (!brand) return inferProductFromGarbled(pos, barcode);
    const built = finalizeNames({
      nameEn: cleanEnglishName(pos, brand.brandEn),
      nameAr: translateToArabic(cleanEnglishName(pos, brand.brandEn), brand.brandAr),
      brandEn: brand.brandEn,
      brandAr: brand.brandAr,
    });
    if (!isConfidentName(built.nameEn)) return inferProductFromGarbled(pos, barcode);
    return { brandEn: brand.brandEn, brandAr: brand.brandAr, ...built, source: 'pos' };
  }

  return inferProductFromGarbled(pos, barcode);
}

function buildOverride(barcode, id) {
  const finalized = finalizeNames({
    nameEn: id.nameEn,
    nameAr: id.nameAr,
    brandEn: id.brandEn,
    brandAr: id.brandAr,
  });
  const typeKey = detectTypeKey(finalized.nameEn);
  const cat = categoryFor(typeKey, id.brandEn);
  const size = extractSize(finalized.nameEn);
  const desc = buildDescriptions({
    nameEn: finalized.nameEn,
    nameAr: finalized.nameAr,
    brandEn: id.brandEn,
    typeKey,
    catEn: cat.catEn,
    catAr: cat.catAr,
    size,
  });
  return {
    barcode,
    brandEn: id.brandEn,
    brandAr: id.brandAr,
    nameEn: finalized.nameEn,
    nameAr: finalized.nameAr,
    typeKey,
    subcategorySlugs: cat.sub,
    tertiarySlugs: cat.tert,
    ...desc,
    _source: id.source,
  };
}

async function upsertProduct(brandCache, override, existing) {
  const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories('', {
    barcode: override.barcode,
    brandEn: override.brandEn,
    brandAr: override.brandAr,
    typeKey: override.typeKey,
  });

  // Prefer override slugs via fake resolve: inject through getCareOverride path
  // resolveCareCategories reads overrides — we pass subcategory via direct slug map
  const { CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } = await import('../lib/core/care-category-map.js');
  const subIds = (override.subcategorySlugs || [])
    .map((s) => CARE_SUB_SLUGS[s])
    .filter(Boolean);
  const tertIds = (override.tertiarySlugs || [])
    .map((s) => CARE_TERTIARY_SLUGS[s])
    .filter(Boolean);

  const body = {
    name: override.nameAr,
    nameAr: override.nameAr,
    nameEn: override.nameEn,
    description: override.descriptionAr,
    descriptionAr: override.descriptionAr,
    descriptionEn: override.descriptionEn,
    subcategoryIds: subIds.length ? subIds : subcategoryIds,
    tertiaryCategoryIds: tertIds.length ? tertIds : tertiaryCategoryIds,
  };

  if (DRY_RUN) return { id: existing?.id || 'dry', action: existing ? 'patch' : 'post' };

  if (existing?.id) {
    await api(`/products/${existing.id}`, { method: 'PATCH', body });
    return { id: existing.id, action: 'patch' };
  }

  const brandId = await resolveBrandId(brandCache, override.brandEn, override.brandAr);
  const created = await api('/products', {
    method: 'POST',
    body: {
      sku: override.barcode,
      barcode: override.barcode,
      slug: slugify(`${override.nameEn}-${override.barcode}`),
      brandId,
      categoryId: CARE_CATEGORY_ID,
      ingredients: '',
      howToUse: '',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      stock: 0,
      isActive: true,
      isNew: false,
      imageIds: [],
      ...body,
    },
  });
  return { id: created.id, action: 'post' };
}

async function verify(barcode, override) {
  const p = await findProduct(barcode);
  if (!p?.id) return { ok: false, reason: 'not found after upsert' };
  if (p.nameEn !== override.nameEn) return { ok: false, reason: `nameEn mismatch: ${p.nameEn}` };
  if (p.nameAr !== override.nameAr) return { ok: false, reason: `nameAr mismatch: ${p.nameAr}` };
  if (hasLatinInArabic(p.nameAr)) return { ok: false, reason: `latin in Arabic: ${p.nameAr}` };
  return { ok: true, id: p.id };
}

function counter(i, total, status, barcode, detail = '') {
  const pct = ((i / total) * 100).toFixed(1);
  const line = `[${i}/${total}] ${pct}% | ${status} | ${barcode}${detail ? ` | ${detail}` : ''}`;
  console.log(line);
}

async function main() {
  const barcodes = [...new Set(
    readFileSync(BARCODES_FILE, 'utf8').trim().split(/\s+/).filter(Boolean),
  )];
  const research = JSON.parse(readFileSync(RESEARCH_FILE, 'utf8'));
  const byResearch = Object.fromEntries(research.rows.map((r) => [r.barcode, r]));
  let storeRows = {};
  if (existsSync(STORE_FILE)) {
    const sl = JSON.parse(readFileSync(STORE_FILE, 'utf8'));
    for (const r of sl.rows || []) storeRows[r.barcode] = r;
  }

  // Queue: stock>=1 OR already in catalog (need repair), unique order from file
  const queue = barcodes.filter((bc) => {
    const r = byResearch[bc];
    if (!r) return false;
    if (ONLY_BARCODES.length && !ONLY_BARCODES.includes(bc)) return false;
    if (r.inApp) return true;
    return (r.stock ?? 0) >= MIN_STOCK;
  });

  const startIdx = START - 1;
  const endIdx = LIMIT > 0 ? Math.min(queue.length, startIdx + LIMIT) : queue.length;
  const slice = queue.slice(startIdx, endIdx);

  console.log('══════════════════════════════════════════════════');
  console.log(`Care batch repair ONE-BY-ONE`);
  console.log(`Total queue: ${queue.length} | This run: ${slice.length} (start=${START})`);
  console.log(`Delay: ${DELAY_MS}ms | Dry: ${DRY_RUN ? 'yes' : 'no'}`);
  console.log('══════════════════════════════════════════════════\n');

  await getToken();
  const brandCache = await loadBrands();
  const state = loadState();

  // Keep building full overrides file as we go
  let overridesAll = [];
  if (existsSync(OVERRIDES_OUT)) {
    try { overridesAll = JSON.parse(readFileSync(OVERRIDES_OUT, 'utf8')); } catch { overridesAll = []; }
  }
  const overrideMap = new Map(overridesAll.map((p) => [p.barcode, p]));

  const stats = { ok: 0, skip: 0, fail: 0, patched: 0, created: 0 };

  for (let i = 0; i < slice.length; i += 1) {
    const barcode = slice[i];
    const globalN = startIdx + i + 1;
    const total = queue.length;

    if (i > 0) await sleep(DELAY_MS);

    // Resume: already done this run with good verification
    if (state.done[barcode]?.verified && process.env.FORCE !== '1') {
      stats.skip += 1;
      counter(globalN, total, 'SKIP-DONE', barcode, state.done[barcode].nameAr?.slice(0, 40));
      continue;
    }

    const row = byResearch[barcode] || {};
    let storeRow = storeRows[barcode];

    // Try POS/cached store first; live-lookup only if still no confident id
    let live = null;
    let id = identify({
      barcode,
      posName: row.posName,
      storeRow: storeRows[barcode],
      live: null,
    });

    if (!id && !storeRow?.miraaya && !storeRow?.elryan) {
      counter(globalN, total, 'LOOKUP', barcode, 'searching Miraaya/Elryan...');
      live = await liveLookup(barcode);
      if (live) {
        storeRows[barcode] = { barcode, [live.source]: live };
        writeFileSync(STORE_FILE, JSON.stringify({
          updatedAt: Date.now(),
          found: Object.values(storeRows).filter((r) => r.miraaya || r.elryan).length,
          rows: Object.values(storeRows),
        }, null, 2));
        id = identify({
          barcode,
          posName: row.posName,
          storeRow: storeRows[barcode],
          live,
        });
      }
    }

    if (!id) {
      const existing = await findProduct(barcode);
      if (existing?.nameEn && cleanText(existing.nameEn).length >= 12) {
        const brand = detectBrand(existing.nameEn, barcode) || extractBrandFromGarbled(existing.nameEn);
        if (brand?.brandEn) {
          const built = finalizeNames({
            nameEn: existing.nameEn,
            nameAr: existing.nameAr || translateToArabic(existing.nameEn, brand.brandAr),
            brandEn: brand.brandEn,
            brandAr: brand.brandAr,
          });
          if (isConfidentName(built.nameEn)) {
            id = { ...built, brandEn: brand.brandEn, brandAr: brand.brandAr, source: 'existing' };
          }
        }
      }
    }

    if (!id) {
      stats.skip += 1;
      state.skipped[barcode] = { reason: 'no confident id', posName: row.posName, at: Date.now() };
      saveState(state);
      counter(globalN, total, 'SKIP-ID', barcode, cleanText(row.posName || '').slice(0, 40));
      continue;
    }

    const override = buildOverride(barcode, id);

    // Quality gates — force pure Arabic (except SPF)
    if (hasLatinInArabic(override.nameAr)) {
      override.nameAr = translateToArabic(override.nameEn, override.brandAr);
    }
    if (hasLatinInArabic(override.nameAr)) {
      // last resort: strip every latin char except keep SPF tokens
      override.nameAr = override.nameAr
        .replace(/SPF\s*\+?\d+\+?/gi, (m) => `§${m}§`)
        .replace(/[A-Za-z]/g, '')
        .replace(/§(SPF\s*\+?\d+\+?)§/gi, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      if (override.brandAr && !override.nameAr.startsWith(override.brandAr)) {
        override.nameAr = `${override.brandAr} ${override.nameAr}`.replace(/\s+/g, ' ').trim();
      }
    }
    if (hasLatinInArabic(override.nameAr) || override.nameAr.length < 8) {
      stats.fail += 1;
      state.failed[barcode] = { reason: 'arabic still has latin', nameAr: override.nameAr, at: Date.now() };
      saveState(state);
      counter(globalN, total, 'FAIL-AR', barcode, override.nameAr.slice(0, 50));
      continue;
    }

    try {
      const existing = await findProduct(barcode);
      const result = await upsertProduct(brandCache, override, existing);

      // verify
      await sleep(400);
      const v = DRY_RUN ? { ok: true, id: result.id } : await verify(barcode, override);
      if (!v.ok) {
        stats.fail += 1;
        state.failed[barcode] = { reason: v.reason, at: Date.now() };
        saveState(state);
        counter(globalN, total, 'FAIL-VERIFY', barcode, v.reason);
        continue;
      }

      overrideMap.set(barcode, {
        barcode: override.barcode,
        brandEn: override.brandEn,
        brandAr: override.brandAr,
        nameEn: override.nameEn,
        nameAr: override.nameAr,
        typeKey: override.typeKey,
        subcategorySlugs: override.subcategorySlugs,
        tertiarySlugs: override.tertiarySlugs,
        descriptionEn: override.descriptionEn,
        descriptionAr: override.descriptionAr,
      });
      writeFileSync(OVERRIDES_OUT, `${JSON.stringify([...overrideMap.values()], null, 2)}\n`);

      if (!DRY_RUN) {
        state.done[barcode] = {
          id: v.id,
          action: result.action,
          verified: true,
          nameEn: override.nameEn,
          nameAr: override.nameAr,
          at: Date.now(),
        };
        delete state.failed[barcode];
        delete state.skipped[barcode];
        saveState(state);
      }

      stats.ok += 1;
      if (result.action === 'patch') stats.patched += 1;
      else stats.created += 1;

      counter(
        globalN,
        total,
        result.action === 'patch' ? 'OK-PATCH' : 'OK-CREATE',
        barcode,
        override.nameAr.slice(0, 55),
      );
    } catch (err) {
      stats.fail += 1;
      state.failed[barcode] = { reason: err.message, at: Date.now() };
      saveState(state);
      counter(globalN, total, 'FAIL', barcode, err.message.slice(0, 60));
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`Done this run: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
  console.log(`  patched=${stats.patched} created=${stats.created}`);
  console.log(`State: ${STATE_FILE}`);
  console.log(`Overrides: ${OVERRIDES_OUT} (${overrideMap.size} products)`);
  console.log('══════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

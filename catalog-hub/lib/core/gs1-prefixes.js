import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREFIX_FILE = path.join(__dirname, '..', '..', 'data', 'gs1-prefixes.json');

/**
 * بادئات GS1 مبذورة يدوياً — تربط بادئة شركة الباركود باسم الماركة كما يظهر في Typesense.
 * تُستخدم كتلميح فقط: المسح عبر v2 يتحقق من الباركود الفعلي، فالخطأ هنا لا يعطي نتيجة خاطئة.
 */
const SEED_PREFIXES = {
  '0077802': 'Wet N Wild', // Markwins Beauty Brands
  '0609332': 'E.L.F',
  // L'Oréal Group / Maybelline (GS1 France 360…)
  '3600531': 'Maybelline',
  '3600522': 'Maybelline',
  '3600523': 'Loreal Paris',
  '3600520': 'Loreal Paris',
  '3600521': 'Loreal Paris',
  '3600524': 'Garnier',
  '3600540': 'Garnier',
  '0712493': 'Maybelline', // US Maybelline
  '0415540': 'Loreal Paris',
  '0030987': 'NYX',
  '0800892': 'NYX',
  '3600530': 'Maybelline',
  '4005808': 'Nivea',
  '4005900': 'Nivea',
  '4250587': 'Essence',
  '4250232': 'Catrice',
  '8690604': 'Flormar',
  '8690605': 'Flormar',
  '8682532': 'Note',
  '8680191': 'Golden Rose',
  '8003510': 'Pupa Milano',
  '8003515': 'Deborah',
  '5057566': 'Revolution',
  '5060422': 'Revolution',
  '6291106': 'Huda Beauty',
  '8809647': 'Beauty Of Joseon',
  '8809416': 'COSRX',
  '8806182': 'Etude',
  '3337871': 'La Roche Posay',
  '3337875': 'CeraVe',
  '0704626': 'Neutrogena',
  '3014260': 'Bourjois',
  '3614225': 'Bourjois',
  '0854141': 'The Ordinary',
  '0769661': 'Revlon',
  '0761318': 'Revlon',
};

/** ماركات شائعة في مسواگ (تجميل + عطور + عناية) — مسح موجّه عند غياب metadata */
export const BEAUTY_BRAND_SWEEP = [
  // تجميل عالمي
  'Maybelline',
  'Loreal Paris',
  'NYX',
  'E.L.F',
  'Wet N Wild',
  'Essence',
  'Catrice',
  'Flormar',
  'Note',
  'Golden Rose',
  'Revolution',
  'Huda Beauty',
  'Pupa Milano',
  'Deborah',
  'Bourjois',
  'Garnier',
  'Nivea',
  'The Ordinary',
  'CeraVe',
  'Beauty Of Joseon',
  'COSRX',
  'Etude',
  'Anastasia Beverly Hills',
  'CLINIQUE',
  'Sephora',
  'Max Factor',
  'Revlon',
  'La Roche Posay',
  'Neutrogena',
  // عطور وعناية خليجية
  'Rasasi',
  'Lattafa',
  'Ard Al Zaafaran',
  'Ajmal',
  'Al-Rehab',
  'Swiss Arabian',
  'IBRAQ',
  'Nabeel',
  'Armaf',
];

/**
 * اختر ماركات محتملة حسب بادئة البلد/الشركة GS1 — نطاقات كاملة.
 * يدعم EAN-13 / UPC-A (12–14 أرقام) وEAN-8 (8 أرقام).
 */
export function guessBrandsByCountryPrefix(barcode = '') {
  const d = String(barcode || '').replace(/\D/g, '');

  // EAN-8: 8 أرقام — أول رقمين كبادئة بلد تقريبية
  if (d.length === 8) {
    const p2 = Number(d.slice(0, 2));
    if (p2 <= 13) return ['Maybelline', 'NYX', 'E.L.F', 'Wet N Wild', 'Revlon', 'The Ordinary', 'Neutrogena'];
    if (p2 >= 30 && p2 <= 37) return ['Loreal Paris', 'Maybelline', 'Garnier', 'Bourjois', 'La Roche Posay'];
    if (p2 >= 40 && p2 <= 44) return ['Essence', 'Catrice', 'Nivea'];
    if (p2 >= 50 && p2 <= 50) return ['Revolution', 'Rimmel'];
    if (p2 >= 62 && p2 <= 63) return ['Huda Beauty', 'IBRAQ', 'Lattafa'];
    if (p2 >= 86 && p2 <= 87) return ['Flormar', 'Note', 'Golden Rose'];
    if (p2 === 88) return ['Beauty Of Joseon', 'COSRX', 'Etude'];
    // بادئة غير معروفة — جرّب أشهر الماركات الأمريكية والأوروبية
    return ['Maybelline', 'Loreal Paris', 'NYX', 'Essence', 'Catrice'];
  }

  const gtin = toGtin13(barcode);
  if (!gtin) return [];
  const cc = Number(gtin.slice(0, 3));

  // فرنسا 300–379 (لوريال، مايبيلين، غارنييه، بورجوا...)
  if (cc >= 300 && cc <= 379) {
    return ['Loreal Paris', 'Maybelline', 'Garnier', 'Bourjois', 'La Roche Posay', 'CeraVe', 'Vichy'];
  }
  // ألمانيا 400–440 (إيسنس، كاتريس، نيفيا، ماكس فاكتور...)
  if (cc >= 400 && cc <= 440) {
    return ['Essence', 'Catrice', 'Nivea', 'Max Factor'];
  }
  // تركيا 868–869 (فلورمار، نوت، غولدن روز...)
  if (cc >= 868 && cc <= 869) {
    return ['Flormar', 'Note', 'Golden Rose', 'Deborah'];
  }
  // كوريا الجنوبية 880
  if (cc === 880) {
    return ['Beauty Of Joseon', 'COSRX', 'Etude', 'Missha', 'The Face Shop'];
  }
  // إيطاليا 800–839
  if (cc >= 800 && cc <= 839) {
    return ['Pupa Milano', 'Deborah'];
  }
  // بريطانيا 500–509
  if (cc >= 500 && cc <= 509) {
    return ['Revolution', 'Rimmel'];
  }
  // الدول العربية 621–629 (السعودية 628، الإمارات 629، الكويت 626، لبنان 625...)
  // عطور وتجميل خليجية: رصاصي، لطافة، أرض الزعفران، أجمل، الرحاب، هدى بيوتي...
  if (cc >= 621 && cc <= 629) {
    return ['Rasasi', 'Lattafa', 'Ard Al Zaafaran', 'Ajmal', 'Al-Rehab', 'Huda Beauty', 'IBRAQ', 'Swiss Arabian'];
  }
  // أمريكا الشمالية 000–139
  if (cc <= 139) {
    return ['Maybelline', 'NYX', 'E.L.F', 'Wet N Wild', 'Revlon', 'The Ordinary', 'Neutrogena', 'Clinique'];
  }
  return [];
}

let learnedCache = null;
let persistTimer = null;

function loadLearned() {
  if (learnedCache) return learnedCache;
  try {
    learnedCache = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8')) || {};
  } catch {
    learnedCache = {};
  }
  return learnedCache;
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      fs.mkdirSync(path.dirname(PREFIX_FILE), { recursive: true });
      fs.writeFileSync(PREFIX_FILE, JSON.stringify(learnedCache, null, 2));
    } catch { /* غير قاتل */ }
  }, 300);
  persistTimer.unref?.();
}

function toGtin13(digits = '') {
  const d = String(digits).replace(/\D/g, '');
  if (d.length === 12) return `0${d}`;
  if (d.length === 13) return d;
  if (d.length === 14) return d.slice(1);
  return '';
}

/** أطول بادئة معروفة أولاً (9 → 6 أرقام) */
export function lookupBrandByPrefix(barcode) {
  const gtin = toGtin13(barcode);
  if (!gtin) return '';
  const learned = loadLearned();
  for (let len = 9; len >= 6; len -= 1) {
    const key = gtin.slice(0, len);
    if (learned[key]?.brand) return learned[key].brand;
    if (SEED_PREFIXES[key]) return SEED_PREFIXES[key];
  }
  return '';
}

/** تعلّم بادئة → ماركة من كل مطابقة ناجحة (يجعل البحث القادم لنفس الشركة مباشراً) */
export function learnPrefixBrand(barcode, brand) {
  const gtin = toGtin13(barcode);
  const value = String(brand || '').trim();
  if (!gtin || !value) return;

  const learned = loadLearned();
  for (const len of [7, 8]) {
    const key = gtin.slice(0, len);
    learned[key] = { brand: value, updatedAt: Date.now() };
  }
  schedulePersist();
}

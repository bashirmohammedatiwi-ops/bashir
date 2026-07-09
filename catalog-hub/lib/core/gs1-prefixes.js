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

/** ماركات جمال شائعة في مسواگ — مسح موجّه عند غياب metadata */
export const BEAUTY_BRAND_SWEEP = [
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
];

/** اختر ماركات محتملة حسب بادئة البلد/الشركة */
export function guessBrandsByCountryPrefix(barcode = '') {
  const gtin = toGtin13(barcode);
  if (!gtin) return [];
  const cc = gtin.slice(0, 3);
  if (cc === '360' || cc === '300' || cc === '301' || cc === '333' || cc === '361') {
    return ['Maybelline', 'Loreal Paris', 'Garnier', 'Bourjois', 'La Roche Posay', 'CeraVe'];
  }
  if (cc === '400' || cc === '401' || cc === '402' || cc === '403' || cc === '404' || cc === '425') {
    return ['Essence', 'Catrice', 'Nivea', 'Max Factor'];
  }
  if (cc === '869' || cc === '868') {
    return ['Flormar', 'Note', 'Golden Rose', 'Deborah'];
  }
  if (cc === '880') {
    return ['Beauty Of Joseon', 'COSRX', 'Etude', 'Missha', 'The Face Shop'];
  }
  if (cc === '800' || cc === '801' || cc === '802' || cc === '803') {
    return ['Pupa Milano', 'Deborah'];
  }
  if (cc === '505' || cc === '506') {
    return ['Revolution'];
  }
  if (cc === '629' || cc === '628') {
    return ['Huda Beauty', 'IBRAQ', 'Lattafa', 'Rasasi'];
  }
  if (gtin.startsWith('0')) {
    return ['Maybelline', 'NYX', 'E.L.F', 'Wet N Wild', 'Revlon', 'The Ordinary', 'Neutrogena'];
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

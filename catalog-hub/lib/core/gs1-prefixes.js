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
};

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

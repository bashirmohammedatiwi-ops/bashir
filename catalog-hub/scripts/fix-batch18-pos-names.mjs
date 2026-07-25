#!/usr/bin/env node
/** Fix batch18 meta names from POS when Sarah metadata is missing. */
import { readFileSync, writeFileSync } from 'fs';

const META_PATH = new URL('../data/sarah-pos-batch18-meta.json', import.meta.url).pathname;
const CAND_PATH = new URL('../data/sarah-pos-candidates-care-batch18.json', import.meta.url).pathname;
const meta = JSON.parse(readFileSync(META_PATH, 'utf8'));
const byBc = new Map(JSON.parse(readFileSync(CAND_PATH, 'utf8')).map((c) => [c.barcode, c]));

const PREFIXES = [
  ['HUDA BEAUTY', 'Huda Beauty', 'هدى بيوتي'],
  ['HUDABEAUTY', 'Huda Beauty', 'هدى بيوتي'],
  ['HUDA BEUTY', 'Huda Beauty', 'هدى بيوتي'],
  ['H.B ', 'Huda Beauty', 'هدى بيوتي'],
  ['HB ', 'Huda Beauty', 'هدى بيوتي'],
  ['BOURJOIS', 'Bourjois', 'بورجو'],
  ['BRJ ', 'Bourjois', 'بورجو'],
  ['CLARINS', 'Clarins', 'كلارنس'],
  ['CLAR-', 'Clarins', 'كلارنس'],
  ['CLA-', 'Clarins', 'كلارنس'],
  ['KERASTASE', 'Kérastase', 'كérastase'],
  ['PALMERS', "Palmer's", 'بالمرز'],
  ['PALMER', "Palmer's", 'بالمرز'],
  ['PHYTO ', 'Phyto', 'فيتو'],
  ['NYX ', 'NYX', 'نيكس'],
  ['SVR ', 'SVR', 'إس في آر'],
  ['CHANEL', 'Chanel', 'شanel'],
  ['CH ', 'Carolina Herrera', 'كarolina herrera'],
  ['LANCOME', 'Lancôme', 'لancome'],
  ['LANCOM', 'Lancôme', 'لancome'],
  ['LA ROCHE', 'La Roche-Posay', 'لaroche-posay'],
  ['LOREAL', "L'Oréal Paris", 'لoréal'],
  ['VIP ', 'Carolina Herrera', 'كarolina herrera'],
  ['212 ', 'Carolina Herrera', 'كarolina herrera'],
];

function cleanPos(s = '') {
  return String(s).replace(/[\u200e\u200f\u202a-\u202e\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();
}

function parsePos(pos = '') {
  const u = cleanPos(pos).toUpperCase();
  for (const [prefix, brandEn, brandAr] of PREFIXES) {
    if (u.startsWith(prefix)) {
      const rest = cleanPos(pos).slice(prefix.length).trim();
      return { brandEn, brandAr, productEn: rest || cleanPos(pos) };
    }
  }
  const m = cleanPos(pos).match(/^([A-Z][A-Za-z0-9&.'\- ]{1,28}?)\s+(.+)$/);
  if (m) return { brandEn: m[1].trim(), brandAr: m[1].trim(), productEn: m[2].trim() };
  return { brandEn: cleanPos(pos), brandAr: cleanPos(pos), productEn: '' };
}

function titleCase(s = '') {
  return String(s).replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bMl\b/g, 'ml').replace(/\bSpf\b/g, 'SPF');
}

function toArProduct(en = '') {
  return String(en)
    .replace(/\bML\b/gi, 'مل')
    .replace(/\bG\b/g, 'جم')
    .replace(/\bSPF\s*\+?\s*(\d+)/gi, 'SPF$1')
    .replace(/\bNO\.?\s*/gi, 'رقم ')
    .replace(/\bDEO\.?\b/gi, 'مزيل عرق')
    .replace(/\bSHP\b/gi, 'شامبو')
    .replace(/\bSHAMPOO\b/gi, 'شامبو')
    .replace(/\bFND\b/gi, 'أساس')
    .replace(/\bPOWDER\b/gi, 'بودرة')
    .replace(/\bPALETTE\b/gi, 'باليت')
    .replace(/\bLIPSTICK\b/gi, 'أحمر شفاه')
    .replace(/\bEYE SHADOW\b/gi, 'ظلال عيون')
    .replace(/\bGEL\b/gi, 'جل')
    .replace(/\bCREAM\b/gi, 'كريم')
    .replace(/\bSERUM\b/gi, 'سيروم')
    .replace(/\bCLEANSER\b/gi, 'غسول')
    .replace(/\bDEODRANT\b/gi, 'مزيل عرق')
    .replace(/\bSTICK\b/gi, 'ستick')
    .replace(/\bSPRAY\b/gi, 'بخاخ')
    .trim();
}

const BRAND_AR_FIX = {
  'Huda Beauty': 'هدى بيوتي',
  'Bourjois': 'بورجو',
  'Clarins': 'كلارنس',
  'Kérastase': 'كérastase',
  "Palmer's": 'Palmer\'s',
  'Phyto': 'فيتo',
  'NYX': 'نيكس',
  'SVR': 'إس في آر',
  'Chanel': 'شanel',
  'Lancôme': 'لancome',
  'La Roche-Posay': 'لaroche-posay',
  "L'Oréal Paris": 'لoréal باريس',
  'Carolina Herrera': 'Carolina Herrera',
};

for (const [bc, m] of Object.entries(meta)) {
  const row = byBc.get(bc);
  if (!row?.posName) continue;
  if (row.nameAr && /[\u0600-\u06FF]{4,}/.test(row.nameAr)) continue;
  const { brandEn, brandAr, productEn } = parsePos(row.posName);
  const fixedBrandAr = BRAND_AR_FIX[brandEn] || brandAr;
  const nameEn = productEn ? `${brandEn} ${titleCase(productEn)}` : brandEn;
  const productAr = toArProduct(productEn || row.posName.replace(new RegExp(`^${brandEn}`, 'i'), '').trim());
  m.brandEn = brandEn;
  m.nameEn = nameEn.slice(0, 120);
  m.brandAr = fixedBrandAr;
  m.nameAr = productAr ? `${fixedBrandAr} - ${productAr}` : fixedBrandAr;
  if (m.descriptionEn?.startsWith('HUDA') || m.descriptionEn?.startsWith('BOURJOIS') || !m.descriptionEn?.includes(nameEn.slice(0, 20))) {
    if (m.kind === 'makeup') {
      m.descriptionEn = `${m.nameEn} delivers reliable makeup performance for everyday looks.\n\n◆ Category: Makeup\n◆ Product type: Eye/Face/Lip makeup\n◆ Key benefits: Easy application · Buildable result · Everyday wear\n◆ Suitable for: Daily makeup`;
      m.descriptionAr = `${m.nameAr} — منتج مكياج عملي لإطلالات يومية.\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: مكياج\n◆ الفوائد الرئيسية: سهل التطبيق · تغطية قابلة للبناء · للاستخدام اليومي\n◆ الأنسب لـ: إطلالات يومية`;
    } else if (m.kind === 'care') {
      m.descriptionEn = `${m.nameEn} supports daily care with a trusted formula for regular use.\n\n◆ Category: Skincare\n◆ Key benefits: Daily care · Trusted formula · Regular use\n◆ Suitable for: Daily care routines`;
      m.descriptionAr = `${m.nameAr} — منتج عناية يومي بتركيبة موثوقة.\n\n◆ التصنيف: العناية\n◆ الفوائد الرئيسية: عناية يومية · تركيبة موثوقة · للاستخدام المنتظم\n◆ الأنسب لـ: الروتين اليومي`;
    }
  }
}

writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Fixed POS-derived names for', Object.keys(meta).length, 'products');

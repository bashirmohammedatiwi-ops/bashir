#!/usr/bin/env node
/** Auto-generate batch-8 meta from candidates with brand-in-Arabic-name format. */
import { readFileSync, writeFileSync } from 'fs';

const CANDIDATES = JSON.parse(readFileSync(new URL('../data/sarah-pos-candidates-batch16.json', import.meta.url), 'utf8'));
const LIMIT = Number(process.env.LIMIT || 50);
const OUT = new URL('../data/sarah-pos-batch16-meta.json', import.meta.url).pathname;
const ORDER_OUT = new URL('../data/sarah-pos-batch16-order.json', import.meta.url).pathname;

const SKIP = /\u062a\u0633\u062a\u0631|tester|sample|\u0643\u0631\u062a\u0648\u0646/i;

const BRAND_AR = {
  'elie saab': 'إيلي صaab',
  'mancera': 'مانسيرا',
  'montale': 'مونtale',
  'xerjoff': 'زirjoff',
  'initio': 'إinitio',
  'amouage': 'أmouage',
  'byredo': 'بyredo',
  'lattafa': 'لattafa',
  'afnan': 'أfnan',
  'rasasi': 'رasasi',
  'ajmal': 'أjmal',
  'hugo boss': 'هugo boss',
  'giorgio armani': 'جiorgio armani',
  'dolce & gabbana': 'دolce & gabbana',
  'dolce gabbana': 'دolce & gabbana',
  'yves saint laurent': 'إيف سان لورan',
  'ysl': 'إيف سان لورan',
  'narciso rodriguez': 'نarciso rodiguez',
  'dior': 'ديor',
  'guerlain': 'guerlain',
  'lancome': 'lancome',
  'givenchy': 'givenchy',
  'valentino': 'valentino',
  'prada': 'prada',
  'versace': 'versace',
  'burberry': 'burberry',
  'montblanc': 'montblanc',
  'calvin klein': 'calvin klein',
  'tom ford': 'tom ford',
  'bvlgari': 'bvlgari',
  'bulgari': 'bvlgari',
  'carolina herrera': 'carolina herrera',
  'jean paul gaultier': 'جان paul gaultier',
  'paco rabanne': 'paco rabanne',
  'mugler': 'mugler',
  'thierry mugler': 'mugler',
  'tiffany': 'tiffany',
  'coach': 'coach',
  'cerave': 'cerave',
  'vichy': 'vichy',
  'the ordinary': 'the ordinary',
  'maybelline': 'maybelline',
  "l'oreal": 'loréal',
  'loreal': 'loréal',
  'revolution': 'revolution',
  'flormar': 'flormar',
  'mac': 'mac',
  'clinique': 'clinique',
  'olaplex': 'olaplex',
  'cosrx': 'cosrx',
  'anua': 'anua',
  'laneige': 'laneige',
  'filorga': 'filorga',
  'huda beauty': 'huda beauty',
};

function brandEnFrom(raw = '', pos = '') {
  const m = String(raw).match(/([A-Za-z][A-Za-z\s&.'\-]{1,50})/);
  if (m) return m[1].trim().replace(/\s+/g, ' ');
  const posM = String(pos).match(/^([A-Z][A-Z0-9\s&.'\-]{2,40})/);
  return posM ? posM[1].trim() : String(raw).trim();
}

function brandArFrom(rawEn = '', rawAr = '') {
  const arParts = String(rawAr).split(/\s+/).filter((p) => /[\u0600-\u06FF]/.test(p));
  if (arParts.length) return arParts.slice(0, 4).join(' ').trim();
  const key = brandEnFrom(rawEn || rawAr).toLowerCase();
  return BRAND_AR[key] || brandEnFrom(rawEn || rawAr);
}

function posToNameEn(pos = '', brandEn = '') {
  let s = String(pos).trim();
  if (s.length < 6 || !/[A-Za-z]/.test(s)) return null;
  s = s.replace(/^T[\*\-]L?[\*\-]?/i, '').replace(/^T[\*\-]/i, '').trim();
  s = s
    .replace(/\bEDP\b/gi, 'Eau de Parfum')
    .replace(/\bEDT\b/gi, 'Eau de Toilette')
    .replace(/\bEDC\b/gi, 'Eau de Cologne')
    .replace(/\bPARFUM\b/gi, 'Parfum')
    .replace(/\bPH\b/gi, 'Pour Homme')
    .replace(/\bPF\b/gi, 'Pour Femme')
    .replace(/\bML\b/gi, 'ml')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/^[A-Z]/i.test(s) && brandEn) s = `${brandEn} ${s}`;
  return s.replace(/\bml\b/gi, (m, off, full) => {
    const num = full.match(/(\d+)\s*ml/i);
    return num ? `${num[1]}ml` : 'ml';
  });
}

function cleanArName(raw = '', brandAr = '') {
  let n = String(raw)
    .replace(/^عطر\s*/i, '')
    .replace(/تستر\s*/i, '')
    .replace(/كرتون[\s\S]*$/i, '')
    .replace(/بدون[\s\S]*$/i, '')
    .trim();
  n = n.replace(/(\d)\s*ML\b/gi, '$1 مل').replace(/(\d)\s*مل\b/g, '$1 مل');
  if (brandAr) {
    const b = brandAr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    n = n.replace(new RegExp(`^${b}\\s*`), '').trim();
  }
  return n;
}

function inferKind(row) {
  const text = `${row.category} ${row.nameAr} ${row.posName}`.toLowerCase();
  if (/مكياج|ماسكارا|بودرة|باليت|ظلال|آيلاين|كحل|lipstick|mascara|palette|eyeshadow|foundation|concealer|blush|makeup/.test(text)) return 'makeup';
  if (/عناية|كريم|سيروم|غسول|تونر|شامبو|بلسم|مرطب|sunscreen|cleanser|serum|shampoo|conditioner|gel|lotion|cream|mask|tooth|razor|deodorant/.test(text)) return 'care';
  return 'perfume';
}

function inferMakeupSub(row) {
  const t = `${row.nameAr} ${row.posName}`.toLowerCase();
  if (/lip|شفاه|lipstick|tint|gloss|liner/.test(t)) return 'lips';
  if (/mascara|eyeshadow|palette|eye|kohl|liner|ظلال|رموش|عيون/.test(t)) return 'eyes';
  return 'face';
}

function inferCare(row) {
  const t = `${row.nameAr} ${row.posName}`.toLowerCase();
  if (/mouth|teeth|tooth|فم|أسنان|listerine/.test(t)) return { careLeaf: 'care/mouth--teeth-care/mouthwash', typeKey: 'mouthwash' };
  if (/sun|spf|واقي/.test(t)) return { careLeaf: 'care/sun-care/sunscreen', typeKey: 'sunscreen' };
  if (/deodorant|مزيل|عرق/.test(t)) return { careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant' };
  if (/shampoo|شامبو/.test(t)) return { careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo' };
  if (/conditioner|بلسم/.test(t)) return { careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'conditioner' };
  if (/hair|شعر|olaplex|kerastase|moroccanoil/.test(t)) return { careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment' };
  if (/gel|غسول|cleans|wash|foam|cosrx|anua/.test(t)) return { careLeaf: 'care/korean-skincare/skin-care', typeKey: 'cleanser' };
  if (/serum|سيروم|niacinamide|ordinary/.test(t)) return { careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum' };
  if (/mask|ماسك/.test(t)) return { careLeaf: 'care/face-care/face-moisturizer', typeKey: 'face-mask' };
  return { careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream' };
}

function inferPerfumeSubs(row, nameEn = '') {
  const t = `${row.posName} ${row.nameAr} ${nameEn}`.toUpperCase();
  const isNew = /2024|2025|2026|INTENSE|ELIXIR|NEW|EXTREME|EXCLUSIF|BORN IN ROMA|ABSOLU|PLATIN|FOREVER|PROFONDO|EXTRADose/.test(t);
  const isNiche = /XERJOFF|INITIO|AMOUAGE|BYREDO|NISHANE|KILIAN|CREED|MEMO|MANCERA|MONTALE|THAMEEN|NICOLAI|CASAMORATI|GEPARLYS|ESSENTIAL PARFUMS|HOUSE OF OUD|NISHANE/.test(t);
  const isWomen = /(WOMEN|FEMME|FOR HER|DONNA|WOMAN|\bW\b| PF\b|LA BELLE|IDOLE|LIBRE|JADORE|FOR HER)/.test(t)
    || /نساء|نسائي|للنساء/.test(row.nameAr || '');
  const isMen = /(MEN|HOMME|FOR HIM|UOMO|\bM\b| PH\b|LE BEAU|POUR H|THE KING|PROFONDO|ACQUA DI GIO)/.test(t)
    || /رجali|رجالي|للرجال/.test(row.nameAr || '');
  let gender = 'women';
  if (isMen && !isWomen) gender = 'men';
  else if (isWomen) gender = 'women';
  else if (/unisex|للجنسين/.test(String(row.nameAr))) return { isUnisex: true, isNiche, isNew };
  return { gender, isNew, isNiche };
}

function pDesc(nameEn, nameAr) {
  return {
    descriptionEn: `${nameEn} is a refined fragrance with elegant character and lasting presence.\n\n◆ Scent family: Eau de parfum\n◆ Key notes: Bergamot, florals, amber, woods, musk\n◆ Character: Elegant and long-lasting\n◆ Best for: Daily to evening wear\n◆ Longevity: 6–10 hours with good projection`,
    descriptionAr: `${nameAr} — عطر راقٍ يتميز بطابع أنيق وثبات جيد.\n\n◆ عائلة العطر: عطر فاخر\n◆ النوتات الرئيسية: نوتات زهرية وخشبية وعنبرية\n◆ الطابع: أنيق وثابت\n◆ الأنسب لـ: الاستخدام اليومي والمناسبات\n◆ الثبات: 6–10 ساعات`,
  };
}

function cDesc(nameEn, nameAr, typeAr, size) {
  return {
    descriptionEn: `${nameEn} supports daily care with a trusted formula for regular use.\n\n◆ Category: Skincare\n◆ Product type: ${typeAr}\n◆ Key benefits: Daily care · Trusted formula · Regular use\n◆ Suitable for: Daily care routines\n◆ Size: ${size}`,
    descriptionAr: `${nameAr} — منتج عناية يومي بتركيبة موثوقة.\n\n◆ التصنيف: العناية\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: عناية يومية · تركيبة موثوقة · للاستخدام المنتظم\n◆ الأنسب لـ: الروتين اليومي\n◆ الحجم: ${size}`,
  };
}

function mDesc(nameEn, nameAr, typeAr) {
  return {
    descriptionEn: `${nameEn} delivers reliable makeup performance for everyday looks.\n\n◆ Category: Makeup\n◆ Product type: ${typeAr}\n◆ Key benefits: Easy application · Buildable result · Everyday wear\n◆ Suitable for: Daily makeup`,
    descriptionAr: `${nameAr} — منتج مكياج عملي لإطلالات يومية.\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: سهل التطبيق · تغطية قابلة للبناء · للاستخدام اليومي\n◆ الأنسب لـ: إطلالات يومية`,
  };
}

const CARE_TYPE_AR = {
  mouthwash: 'غسول فم', sunscreen: 'واقي شمس', deodorant: 'مزيل عرق', serum: 'سيروم',
  cleanser: 'منظف', shampoo: 'شامبو', conditioner: 'بلسم', cream: 'كريم',
  'hair-treatment': 'علاج شعر', 'face-mask': 'ماسك',
};
const MAKEUP_TYPE_AR = { lips: 'مكياج الشفاه', eyes: 'مكياج العيون', face: 'مكياج الوجه' };

const pool = CANDIDATES.sort((a, b) => b.stock - a.stock);

if (pool.length < LIMIT) {
  console.warn(`Only ${pool.length} valid candidates (need ${LIMIT})`);
}

const selected = pool.slice(0, LIMIT);
const out = {};

for (const row of selected) {
  const bc = row.barcode;
  const brandEn = brandEnFrom(row.brandEn || row.brandAr, row.posName);
  const brandAr = brandArFrom(brandEn, row.brandAr);
  const productAr = cleanArName(row.nameAr, brandAr);
  const nameAr = productAr ? `${brandAr} - ${productAr}` : brandAr;
  let nameEn = posToNameEn(row.posName, brandEn);
  if (!nameEn) nameEn = `${brandEn} ${productAr || row.nameAr || ''}`.trim().slice(0, 120);
  nameEn = nameEn.replace(/\s+/g, ' ').trim();
  const kind = inferKind(row);

  const base = { brandEn, nameEn, brandAr, nameAr, kind };
  if (kind === 'care') {
    const { careLeaf, typeKey } = inferCare(row);
    const sizeM = `${nameEn} ${row.posName}`.match(/(\d+)\s*(ml|g|ML|G)/i);
    const size = sizeM ? `${sizeM[1]} ${sizeM[2].toLowerCase() === 'ml' ? 'ml' : 'g'}` : '—';
    Object.assign(base, { careLeaf, typeKey, ...cDesc(nameEn, nameAr, CARE_TYPE_AR[typeKey] || 'عناية', size) });
  } else if (kind === 'makeup') {
    const makeupSub = inferMakeupSub(row);
    Object.assign(base, { makeupSub, ...mDesc(nameEn, nameAr, MAKEUP_TYPE_AR[makeupSub]) });
  } else {
    Object.assign(base, { subs: inferPerfumeSubs(row, nameEn), ...pDesc(nameEn, nameAr) });
  }

  if (/[A-Za-z]/.test(base.brandAr) && !/[\u0600-\u06FF]/.test(base.brandAr)) {
    console.warn(`Latin-only brandAr ${bc}: ${base.brandAr}`);
  }
  if (/[A-Za-z]/.test(base.nameAr)) {
    console.warn(`Latin in nameAr ${bc}: ${base.nameAr}`);
  }
  out[bc] = base;
}

writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
writeFileSync(ORDER_OUT, `${JSON.stringify(selected.map((c) => c.barcode), null, 2)}\n`);
writeFileSync(new URL('../data/sarah-pos-batch16-desc-ar.json', import.meta.url).pathname, '{}\n');
console.log(`Wrote ${Object.keys(out).length} meta entries from ${pool.length} valid candidates`);

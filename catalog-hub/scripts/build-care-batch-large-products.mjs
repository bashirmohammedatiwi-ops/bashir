#!/usr/bin/env node
/**
 * Build care-batch-large-products.json from POS research + Miraaya/Elryan lookup.
 * Only emits products with confident identification (readable name or store hit).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEARCH = path.join(__dirname, '../data/care-batch-large-research.json');
const STORE_LOOKUP = path.join(__dirname, '../data/care-batch-large-store-lookup.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);

function arabicSize(size) {
  if (!size || size === 'حسب المنتج') return 'حسب المنتج';
  return String(size)
    .replace(/\s*ml\b/gi, ' مل')
    .replace(/\s*g\b/gi, ' جم')
    .replace(/\s*mg\b/gi, ' مج');
}

function fixArabic(text) {
  return String(text)
    .replace(/جel/g, 'جل')
    .replace(/بريbiotic/gi, 'بروبيوتيك')
    .replace(/كولagen/gi, 'كولاجين')
    .replace(/niacinamide/gi, 'نياسيناميد')
    .replace(/hyaluronic/gi, 'الهيالورونيك')
    .replace(/Hyaluronic/gi, 'الهيالورونيك')
    .replace(/retinol/gi, 'ريتينول')
    .replace(/Retinol/gi, 'ريتينول')
    .replace(/glutathione/gi, 'جلوتاثيون')
    .replace(/glycolic/gi, 'جليكوليك')
    .replace(/salicylic/gi, 'الساليسيليك')
    .replace(/vitamin\s*c/gi, 'فيتامين سي')
    .replace(/vit\s*c/gi, 'فيتامين سي')
    .replace(/vit\s*c/gi, 'فيتامين سي')
    .replace(/فا[iy]?an[kك]?ou/gi, 'فايانكو')
    .replace(/تفتi(?!ح)/g, 'تفتيح');
}

function desc({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size }) {
  const sizeAr = arabicSize(size);
  const sizeEn = size === 'حسب المنتج' ? 'As listed' : size;
  return {
    descriptionEn: `${introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: ${benefitsEn.join(' · ')}\n◆ Suitable for: Daily care routines\n◆ Size: ${sizeEn}`,
    descriptionAr: `${fixArabic(introAr)}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${fixArabic(typeAr)}\n◆ الفوائد الرئيسية: ${benefitsAr.map(fixArabic).join(' · ')}\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${sizeAr}`,
  };
}

function cleanPosName(name = '') {
  return String(name)
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isReadableName(name = '') {
  const n = cleanPosName(name);
  if (!n || n.length < 6) return false;
  if (extractBrandFromGarbled(n)) return true;
  if (!/[A-Za-z]{3,}/.test(n)) return false;
  const letters = (n.match(/[A-Za-z]/g) || []).length;
  const weird = (n.match(/[^\x20-\x7E\u0600-\u06FF]/g) || []).length;
  return letters >= 10 && weird < 2;
}

const TOKEN_BRANDS = [
  ['SADOER', 'Sadoer', 'سادور'],
  ['SADDER', 'Sadoer', 'سادور'],
  ['FAYANKOY', 'Fayankou', 'فايانكو'],
  ['BIOAQUA', 'Bioaqua', 'بيوأكوا'],
  ['DISSAR', 'Dissar', 'ديسار'],
  ['ONLY', 'Only', 'أونلي'],
  ['FOLTENE', 'Foltene', 'فولتين'],
  ['FAIR LADY', 'Fair Lady', 'فير ليدي'],
  ['DERMA 101', 'Derma 101', 'ديرما 101'],
  ['TRIDERMA', 'TriDerma', 'تراي ديرما'],
  ['GLYSOLID', 'Glysolid', 'جليسوليد'],
  ['WARDAH', 'Wardah', 'وردة'],
  ['HIMALAYA', 'Himalaya', 'هيمالايا'],
  ['POND', 'Pond\'s', 'بوندز'],
  ['PONDS', 'Pond\'s', 'بوندز'],
  ['BIOLIQ', 'Bioliq', 'بيوليك'],
  ['ESTELIN', 'Estelin', 'إستيلين'],
  ['MICELLAR WATER', 'Micellar Water', 'ماء ميسيلار'],
  ['PONDS', 'Pond\'s', 'بوندز'],
  ['POND\'S', 'Pond\'s', 'بوندز'],
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
  ['BEAUTY FORMULAS', 'Beauty Formulas', 'بيوتي فورميولا'],
  ['SKIN CEUTICALS', 'SkinCeuticals', 'سكين سيوتيكالز'],
  ['MISHA', 'Missha', 'ميشا'],
  ['MISSHA', 'Missha', 'ميشا'],
  ['ESSENCE', 'essence', 'إيسنس'],
  ['BABARIA', 'Babaria', 'باباريا'],
  ['ESTELIN', 'Estelin', 'إستيلين'],
  ['BIOLIQ', 'Bioliq', 'بيوليك'],
];

function extractBrandFromGarbled(text = '') {
  const upper = cleanPosName(text).toUpperCase();
  for (const [token, brandEn, brandAr] of TOKEN_BRANDS) {
    if (upper.includes(token)) return { brandEn, brandAr, token };
  }
  return null;
}

function cleanGarbledProductName(text = '', brandEn = '') {
  let n = cleanPosName(text)
    .replace(/[\u200e\u200f\u202a-\u202e\x00-\x1f]/g, '')
    .replace(/[^\x20-\x7E\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  n = n.replace(new RegExp(`^${brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '');
  return n.trim() || text;
}

function extractSize(text = '') {
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(ml|g|mg|جم|مل)\b/i);
  if (!m) return 'حسب المنتج';
  return `${m[1]} ${m[2].toLowerCase().replace('جم', 'g').replace('مل', 'ml')}`;
}

const BRAND_RULES = [
  { re: /\bdr\.?\s*clinic\b/i, brandEn: 'Dr.Clinic', brandAr: 'دكتور كلينيك' },
  { re: /\bsadoer\b|\bsadder\b/i, brandEn: 'Sadoer', brandAr: 'سادور' },
  { re: /\bbioaqua\b/i, brandEn: 'Bioaqua', brandAr: 'بيوأكوا' },
  { re: /\bfayankou\b/i, brandEn: 'Fayankou', brandAr: 'فايانكو' },
  { re: /\bnivea\b/i, brandEn: 'Nivea', brandAr: 'نيفيا' },
  { re: /\bgarnier\b/i, brandEn: 'Garnier', brandAr: 'غارنييه' },
  { re: /\bloreal\b|\bl'oreal\b/i, brandEn: "L'Oréal Paris", brandAr: 'لوريال باريس' },
  { re: /\bsimple\b/i, brandEn: 'Simple', brandAr: 'سيمبل' },
  { re: /\bobagi\b/i, brandEn: 'Obagi', brandAr: 'أوباجي' },
  { re: /\bthe ordinary\b|\bordinaru\b/i, brandEn: 'The Ordinary', brandAr: 'ذا أورديناري' },
  { re: /\bembryolisse\b/i, brandEn: 'Embryolisse', brandAr: 'أمبريوليس' },
  { re: /\brevitalash\b/i, brandEn: 'RevitaLash', brandAr: 'ريفيتالاش' },
  { re: /\btizo\b/i, brandEn: 'TiZO', brandAr: 'تيزو' },
  { re: /\bdermedic\b/i, brandEn: 'Dermedic', brandAr: 'ديرميديك' },
  { re: /\bqv\b/i, brandEn: 'QV', brandAr: 'كيو في' },
  { re: /\bdr\.?\s*davey\b/i, brandEn: 'Dr.Davey', brandAr: 'دكتور ديفي' },
  { re: /\bdr\.?\s*rashel\b/i, brandEn: 'Dr.Rashel', brandAr: 'دكتور راشيل' },
  { re: /\bderma\s*101\b/i, brandEn: 'Derma 101', brandAr: 'ديرما 101' },
  { re: /\bfloxia\b/i, brandEn: 'Floxia', brandAr: 'فلوكسيا' },
  { re: /\bpanoxyl\b/i, brandEn: 'PanOxyl', brandAr: 'بانوكسيل' },
  { re: /\bfoltene\b/i, brandEn: 'Foltene', brandAr: 'فولتين' },
  { re: /\beveline\b/i, brandEn: 'Eveline', brandAr: 'إيفيلين' },
  { re: /\bbeauty formulas\b/i, brandEn: 'Beauty Formulas', brandAr: 'بيوتي فورميولا' },
  { re: /\bthe body shop\b/i, brandEn: 'The Body Shop', brandAr: 'ذا بودي شوب' },
  { re: /\bolay\b/i, brandEn: 'Olay', brandAr: 'أولاي' },
  { re: /\bmario badescu\b/i, brandEn: 'Mario Badescu', brandAr: 'ماريو بديسكو' },
  { re: /\belizavecca\b/i, brandEn: 'Elizavecca', brandAr: 'إليزافيكا' },
  { re: /\bneutrogena\b/i, brandEn: 'Neutrogena', brandAr: 'نيوتروجينا' },
  { re: /\baveeno\b/i, brandEn: 'Aveeno', brandAr: 'أفينو' },
  { re: /\bcantu\b/i, brandEn: 'Cantu', brandAr: 'كانتو' },
  { re: /\bbioderma\b/i, brandEn: 'Bioderma', brandAr: 'بيوديرما' },
  { re: /\bessence\b/i, brandEn: 'essence', brandAr: 'إيسنس' },
  { re: /\bmooyam\b/i, brandEn: 'Mooyam', brandAr: 'مويام' },
  { re: /\bmissha\b/i, brandEn: 'Missha', brandAr: 'ميشا' },
  { re: /\bbabaria\b/i, brandEn: 'Babaria', brandAr: 'باباريا' },
  { re: /\bwardah\b/i, brandEn: 'Wardah', brandAr: 'وردة' },
  { re: /\bhimalaya\b/i, brandEn: 'Himalaya', brandAr: 'هيمالايا' },
  { re: /\bskin\s*ceuticals\b/i, brandEn: 'SkinCeuticals', brandAr: 'سكين سيوتيكالز' },
  { re: /\bpura natura\b/i, brandEn: 'Pura Natura', brandAr: 'بورا ناتورا' },
  { re: /\balpha arbutin\b|\byc\b/i, brandEn: 'YC', brandAr: 'واي سي' },
  { re: /\bsnow white\b/i, brandEn: 'Snow White', brandAr: 'سنو وايت' },
  { re: /\bcollistar\b/i, brandEn: 'Collistar', brandAr: 'كوليستار' },
];

function detectBrand(text = '', barcode = '') {
  for (const rule of BRAND_RULES) {
    if (rule.re.test(text)) return { brandEn: rule.brandEn, brandAr: rule.brandAr };
  }
  if (String(barcode).startsWith('868092')) {
    return { brandEn: 'Dr.Clinic', brandAr: 'دكتور كلينيك' };
  }
  return null;
}

const TYPE_RULES = [
  { key: 'sunscreen', re: /sun\s*screen|spf|sun\s*shield|sun\s*cream/i },
  { key: 'cleanser', re: /cleanser|face\s*wash|foam|micellar|make\s*up\s*clean/i },
  { key: 'toner', re: /\btoner\b|exfoliating\s*toner/i },
  { key: 'serum', re: /\bserum\b/i },
  { key: 'scrub', re: /scrub|exfoliat/i },
  { key: 'cream', re: /\bcream\b|crème|gel\s*cream/i },
  { key: 'moisturizer', re: /moistur|lotion|hydrat/i },
  { key: 'body-cream', re: /body\s*(cream|lotion)|heel\s*balm|hand\s*cream/i },
  { key: 'deodorant', re: /deodorant|deodora/i },
  { key: 'hair-mask', re: /masque|hair\s*mask/i },
  { key: 'shampoo', re: /shampoo/i },
  { key: 'conditioner', re: /conditioner/i },
];

function detectTypeKey(text = '') {
  for (const rule of TYPE_RULES) {
    if (rule.re.test(text)) return rule.key;
  }
  return 'moisturizer';
}

function categoryFor(typeKey) {
  const face = ['cleanser', 'toner', 'serum', 'scrub', 'cream', 'moisturizer', 'sunscreen'];
  const body = ['body-cream', 'deodorant'];
  const hair = ['shampoo', 'conditioner', 'hair-mask'];
  if (sunscreen(typeKey)) return { sub: ['care-face-care', 'care-sun-care'], tert: ['care-sun-care-sunscreen'], catEn: 'Sun protection', catAr: 'حماية من الشمس' };
  if (face.includes(typeKey)) return { sub: ['care-face-care'], tert: typeKey === 'cleanser' || typeKey === 'toner' ? ['care-face-care-cleansers-toners'] : ['care-face-care-face-moisturizer'], catEn: 'Face care', catAr: 'العناية بالوجه' };
  if (body.includes(typeKey)) return { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'], catEn: 'Body care', catAr: 'العناية بالجسم' };
  if (hair.includes(typeKey)) return { sub: ['care-hair-care'], tert: ['care-hair-care-hair-treatment'], catEn: 'Hair care', catAr: 'العناية بالشعر' };
  return { sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'], catEn: 'Face care', catAr: 'العناية بالوجه' };
}

function sunscreen(typeKey) { return typeKey === 'sunscreen'; }

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
    deodorant: ['Deodorant', 'مزيل عرق'],
    'hair-mask': ['Hair mask', 'قناع للشعر'],
    shampoo: ['Shampoo', 'شامبو'],
    conditioner: ['Conditioner', 'بلسم شعر'],
  };
  return map[typeKey] || ['Skincare product', 'منتج عناية'];
}

function buildNameEn(brandEn, rawName) {
  const n = cleanPosName(rawName);
  if (new RegExp(`^${brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(n)) return n;
  return `${brandEn} ${n}`;
}

function buildNameAr(brandAr, rawNameEn) {
  const n = cleanPosName(rawNameEn);
  const stripped = n.replace(/^[A-Za-z0-9.'\s&]+?\s{1,2}/, '').trim() || n;
  return fixArabic(`${brandAr} ${stripped}`);
}

function identify(row, storeRow) {
  const bc = row.barcode;
  const store = storeRow?.miraaya || storeRow?.elryan;
  if (store?.nameEn || store?.nameAr) {
    let brandEn = store.brandEn || detectBrand(store.nameEn || '')?.brandEn || 'Care';
    let brandAr = store.brandAr || detectBrand(store.nameEn || '')?.brandAr || 'عناية';
    let nameEn = cleanPosName(store.nameEn || store.nameAr || '');
    let nameAr = cleanPosName(store.nameAr || store.nameEn || '');

    if (bc.startsWith('868092')) {
      brandEn = 'Dr.Clinic';
      brandAr = 'دكتور كلينيك';
      nameEn = nameEn.replace(/^Nippon\s+/i, '').replace(/^Dr\.?\s*Clinic\s+/i, '');
      nameEn = `Dr.Clinic ${nameEn}`.replace(/^Dr\.Clinic\s+Dr\.Clinic/i, 'Dr.Clinic');
      nameAr = nameAr.replace(/^نيبون\s+/i, '').replace(/^دكتور كلينيك\s+/i, '');
      nameAr = `دكتور كلينيك ${nameAr}`.replace(/^دكتور كلينيك\s+دكتور كلينيك/i, 'دكتور كلينيك');
    }

    const posBrand = extractBrandFromGarbled(row.posName || '');
    if (posBrand && store.brandEn && !new RegExp(posBrand.brandEn, 'i').test(store.brandEn)) {
      const core = cleanGarbledProductName(row.posName || '', posBrand.brandEn);
      return {
        source: 'pos-override',
        brandEn: posBrand.brandEn,
        brandAr: posBrand.brandAr,
        nameEn: buildNameEn(posBrand.brandEn, core || row.posName || ''),
        nameAr: buildNameAr(posBrand.brandAr, buildNameEn(posBrand.brandEn, core || row.posName || '')),
      };
    }

    if (!isValidProductName(nameEn)) return null;
    nameEn = nameEn.replace(new RegExp(`^(${brandEn}\\s+){2,}`, 'i'), `${brandEn} `);
    return { source: 'store', brandEn, brandAr, nameEn, nameAr };
  }
  const pos = cleanPosName(row.posName || '');
  const garbled = extractBrandFromGarbled(pos);
  if (garbled || isReadableName(pos)) {
    const brand = detectBrand(pos, row.barcode) || (garbled ? { brandEn: garbled.brandEn, brandAr: garbled.brandAr } : null) || { brandEn: 'Care', brandAr: 'عناية' };
    if (brand.brandEn === 'Care') return null;
    const core = cleanGarbledProductName(pos, brand.brandEn);
    const nameEn = buildNameEn(brand.brandEn, core || pos);
    const nameAr = buildNameAr(brand.brandAr, nameEn);
    if (!isValidProductName(nameEn)) return null;
    return { source: garbled ? 'pos-token' : 'pos', brandEn: brand.brandEn, brandAr: brand.brandAr, nameEn, nameAr };
  }
  return null;
}

function isValidProductName(nameEn = '') {
  const n = cleanPosName(nameEn);
  const letters = (n.match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
  return n.length >= 12 && letters >= 8 && !/[!@#$%^&*]{2,}/.test(n);
}

function buildProduct(row, id) {
  const typeKey = detectTypeKey(id.nameEn);
  const cat = categoryFor(typeKey);
  const [typeEn, typeAr] = typeLabels(typeKey);
  const size = extractSize(id.nameEn);
  const introEn = `${id.nameEn} supports your daily skincare routine with targeted care.`;
  const introAr = `${id.nameAr} يدعم روتين العناية اليومي بعناية مركّزة.`;
  return {
    barcode: row.barcode,
    brandEn: id.brandEn,
    brandAr: id.brandAr,
    nameEn: id.nameEn,
    nameAr: id.nameAr,
    typeKey,
    subcategorySlugs: cat.sub,
    tertiarySlugs: cat.tert,
    ...desc({
      introEn, introAr,
      catEn: cat.catEn, catAr: cat.catAr,
      typeEn, typeAr,
      benefitsEn: ['Daily care', 'Quality formula', 'Routine essential'],
      benefitsAr: ['عناية يومية', 'تركيبة موثوقة', 'أساسي للروتين'],
      size,
    }),
    _source: id.source,
  };
}

function main() {
  const { rows } = JSON.parse(readFileSync(RESEARCH, 'utf8'));
  let storeRows = {};
  if (existsSync(STORE_LOOKUP)) {
    const sl = JSON.parse(readFileSync(STORE_LOOKUP, 'utf8'));
    for (const r of sl.rows || []) storeRows[r.barcode] = r;
  }

  const eligible = rows.filter((r) => (r.stock ?? 0) >= MIN_STOCK && !r.inApp);
  const products = [];
  const skipped = [];

  for (const row of eligible) {
    const id = identify(row, storeRows[row.barcode]);
    if (!id?.nameEn) {
      skipped.push({ barcode: row.barcode, reason: 'no confident id', posName: row.posName });
      continue;
    }
    products.push(buildProduct(row, id));
  }

  writeFileSync(OUT, `${JSON.stringify(products, null, 2)}\n`);
  console.log(`Eligible: ${eligible.length} | Built: ${products.length} | Skipped: ${skipped.length}`);
  console.log(`Wrote ${OUT}`);
  if (skipped.length) {
    const skipFile = path.join(__dirname, '../data/care-batch-large-skipped.json');
    writeFileSync(skipFile, JSON.stringify(skipped, null, 2));
    console.log(`Skipped details → ${skipFile}`);
  }
}

main();

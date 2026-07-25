#!/usr/bin/env node
/**
 * Build fix entries for care-user-review-barcodes.txt
 * Priority: manual fixes > miraaya > elryan > current override > POS
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIST = path.join(__dirname, '../data/care-user-review-barcodes.txt');
const MANUAL = path.join(__dirname, '../data/care-user-list-manual-fixes.json');
const NIPPON = path.join(__dirname, '../data/care-nippon-drclinic-fixes.json');
const BATCH2 = path.join(__dirname, '../data/care-skipped-fixes-batch2.json');
const PRODUCTS = path.join(__dirname, '../data/care-batch-large-products.json');
const STORE = path.join(__dirname, '../data/care-batch-large-store-lookup.json');
const RESEARCH = path.join(__dirname, '../data/care-batch-large-research.json');
const OUT = path.join(__dirname, '../data/care-user-list-fixes.json');

const BRAND_AR = {
  simple: 'سيمبل', nivea: 'نيفيا', garnier: 'غارنييه', "l'oréal paris": 'لوريال باريس',
  loreal: 'لوريال باريس', eucerin: 'يوسيرين', neutrogena: 'نيوتروجينا', bioliq: 'بيوليك',
  qv: 'كيو في', foltene: 'فولتين فارما', 'foltene pharma': 'فولtين فارma',
  'st. ives': 'سانت آيفز', gosh: 'غوش', eveline: 'إيفيلين', 'eveline cosmetics': 'إيفيلين',
  sadoer: 'سادور', bioaqua: 'بيوأكوا', fayankou: 'فايانكو', dissar: 'ديسار', only: 'أونلي',
  nippon: 'نيبون', vaseline: 'فازلين', "johnson's": 'جونسون', catrice: 'كاتريس',
  ponds: 'بوندز', "pond's": 'بوندز', now: 'ناو فودز', 'now foods': 'ناو فودز',
};

function loadJson(p, fb) {
  if (!existsSync(p)) return fb;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; }
}

function clean(s = '') {
  return String(s).replace(/[\u200e\u200f\u202a-\u202e\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();
}

function brandArOf(brandEn = '') {
  return BRAND_AR[brandEn.toLowerCase()] || brandEn;
}

function canonBrand(raw = '') {
  const b = clean(raw).toLowerCase();
  if (!b) return '';
  if (/l.?oreal|loreal/.test(b)) return "L'Oréal Paris";
  if (/ego qv|^qv$/.test(b)) return 'QV';
  if (/^now$/.test(b)) return 'Now Foods';
  if (/foltene/.test(b)) return 'Foltene Pharma';
  if (/st\.?\s*ives/.test(b)) return 'St. Ives';
  if (/eveline/.test(b)) return 'Eveline Cosmetics';
  if (/johnson/.test(b)) return "Johnson's";
  if (/pond/.test(b)) return "Pond's";
  return clean(raw).split(' ').map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}

function genericDesc(p) {
  return /delivers targeted|Daily care · Quality formula|Targeted formula · Daily care · Visible results|Routine essential · Routine essential/.test(p?.descriptionEn || '');
}

function detectTypeKey(nameEn = '') {
  const n = nameEn.toLowerCase();
  if (/shampoo|hair fall|anti-dandruff/i.test(n)) return { typeKey: 'shampoo', sub: ['care-hair-care'], tert: ['care-hair-care-shampoo-conditioners'] };
  if (/roll.?on|antiperspirant|deodorant/i.test(n)) return { typeKey: 'deodorant', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-deodorant'] };
  if (/shower gel|body wash/i.test(n)) return { typeKey: 'body-wash', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-cleansers'] };
  if (/feminine wash|intimate/i.test(n)) return { typeKey: 'body-wash', sub: ['care-women-care'], tert: ['care-women-care-intimate-wash'] };
  if (/spf|sunscreen|sun protect|sun spray|sun kids/i.test(n)) return { typeKey: 'sunscreen', sub: ['care-face-care', 'care-sun-care'], tert: ['care-sun-care-sunscreen'] };
  if (/lip mask|lip scrub|lip balm|lip moistur/i.test(n)) return { typeKey: 'lip-balm', sub: ['care-face-care'], tert: ['care-face-care-lip-care'] };
  if (/eye serum|eye cream|eye care|eyelash|eyebrow/i.test(n)) return { typeKey: 'eye-cream', sub: ['care-face-care'], tert: ['care-face-care-eye-care'] };
  if (/micellar|cleansing water|face wash|cleanser|cleansing foam|cleansing gel|facial wash|wash gel|gel wash|foam|face gel/i.test(n)) return { typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'] };
  if (/toner|facial tonic/i.test(n)) return { typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'] };
  if (/serum|booster|ampoule/i.test(n)) return { typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'] };
  if (/scrub|exfoliat|peeling/i.test(n)) return { typeKey: 'scrub', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'] };
  if (/body cream|body lotion|heel balm|foot cream|moisturis/i.test(n) && !/face/i.test(n)) return { typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'] };
  if (/hair treatment|ampoule.*hair|scalp treatment/i.test(n)) return { typeKey: 'serum', sub: ['care-hair-care'], tert: ['care-hair-care-hair-treatment'] };
  if (/powder|blush|mascara|brow pen|makeup/i.test(n)) return { typeKey: 'makeup', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'] };
  if (/cream|moistur|lotion|gel cream/i.test(n)) return { typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'] };
  return { typeKey: 'moisturizer', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'] };
}

function formatEn(name, brandEn) {
  let s = clean(name).replace(/[\u0600-\u06FF]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (brandEn) {
    const esc = brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`^(?:${esc}\\s*)+`, 'i'), '');
    s = `${brandEn} ${s}`.replace(/\s+/g, ' ').trim();
  }
  s = s.replace(/\b(\d+(?:\.\d+)?)\s*(ml|g|pcs)\b/gi, (_, n, u) => `${n}${u.toLowerCase()}`);
  return s;
}

function formatAr(nameAr, brandAr, nameEn) {
  let s = clean(nameAr || nameEn);
  if (brandAr && !s.startsWith(brandAr)) s = `${brandAr} ${s.replace(new RegExp(`^${brandAr}\\s*`), '')}`;
  s = s.replace(/(\d)\s*مل/g, '$1 مل').replace(/(\d)\s*جم/g, '$1 جم').replace(/(\d)\s*غ/g, '$1 جم');
  return s.replace(/\s+/g, ' ').trim();
}

function pickStore(barcode, storeRow, guessBrand) {
  const m = storeRow?.miraaya;
  const e = storeRow?.elryan;
  const simpleBc = barcode.startsWith('501145') || barcode.startsWith('871090') || barcode.startsWith('871044');

  if (simpleBc && e?.nameEn && m?.brandEn && !/^simple/i.test(m.brandEn)) {
    return { ...e, brandEn: 'Simple', brandAr: 'سيمبل', source: 'elryan' };
  }
  if (barcode === '8013134009384' && m?.brandEn && /^tarte/i.test(m.brandEn)) return null;
  if (barcode === '5011451103870' && m?.brandEn && /^loreal/i.test(m.brandEn)) {
    return { ...e, brandEn: 'Simple', brandAr: 'سيمبل', source: 'elryan' };
  }
  if (m?.nameEn && !(guessBrand && /foltene/i.test(guessBrand) && /^tarte/i.test(m.brandEn || ''))) {
    return { ...m, source: 'miraaya' };
  }
  if (e?.nameEn || (e?.nameAr && e.nameAr.length > 8)) return { ...e, source: 'elryan' };
  return null;
}

function introFromName(nameEn, nameAr, typeKey) {
  const n = nameEn.toLowerCase();
  if (/micellar/i.test(n)) {
    return {
      introEn: `${nameEn} gently removes makeup and impurities without harsh rubbing.`,
      introAr: `${nameAr} يزيل المكياج والشوائب بلطف دون حاجة للشطف.`,
    };
  }
  if (/vitamin c/i.test(n)) {
    return {
      introEn: `${nameEn} brightens dull skin and supports a more even-looking complexion.`,
      introAr: `${nameAr} يفتح البشرة الباهتة ويدعم مظهراً أكثر تجانساً.`,
    };
  }
  if (/hyaluronic|hydro boost|pentavitin/i.test(n)) {
    return {
      introEn: `${nameEn} delivers deep hydration for plumper, smoother-looking skin.`,
      introAr: `${nameAr} يرطب بعمق لمظهر أكثر امتلاءً ونعومة.`,
    };
  }
  if (/niacinamide/i.test(n)) {
    return {
      introEn: `${nameEn} helps refine pores and balance uneven-looking skin tone.`,
      introAr: `${nameAr} يساعد على تنقية المسام وتوحيد لون البشرة.`,
    };
  }
  if (/retinol|revitalift|anti.?aging|anti.?spot/i.test(n)) {
    return {
      introEn: `${nameEn} supports skin renewal and helps reduce the look of fine lines.`,
      introAr: `${nameAr} يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة.`,
    };
  }
  if (/sunscreen|spf|sun protect|sun spray/i.test(n)) {
    return {
      introEn: `${nameEn} shields skin from UV rays with a formula suited for daily use.`,
      introAr: `${nameAr} يحمي البشرة من أشعة الشمس بتركيبة مناسبة للاستخدام اليومي.`,
    };
  }
  if (/shampoo|hair fall|dandruff/i.test(n)) {
    return {
      introEn: `${nameEn} cleanses the scalp and supports healthier-looking hair.`,
      introAr: `${nameAr} ينظف فروة الرأس ويدعم مظهراً أصح للشعر.`,
    };
  }
  if (/cleanser|face wash|cleansing|facial wash|foam|wash gel/i.test(n)) {
    return {
      introEn: `${nameEn} gently cleanses skin and removes daily impurities.`,
      introAr: `${nameAr} ينظف البشرة بلطف ويزيل الشوائب اليومية.`,
    };
  }
  if (/toner|tonic/i.test(n)) {
    return {
      introEn: `${nameEn} refreshes skin and helps restore balance after cleansing.`,
      introAr: `${nameAr} ينعش البشرة ويساعد على استعادة توازنها بعد التنظيف.`,
    };
  }
  if (/serum|booster|ampoule/i.test(n)) {
    return {
      introEn: `${nameEn} delivers concentrated care for visible skin improvement.`,
      introAr: `${nameAr} يقدّم عناية مركّزة لتحسين مظهر البشرة.`,
    };
  }
  if (/cream|moistur|lotion|gel cream/i.test(n)) {
    return {
      introEn: `${nameEn} nourishes skin and supports daily hydration and comfort.`,
      introAr: `${nameAr} يغذّي البشرة ويدعم الترطيب والراحة اليومية.`,
    };
  }
  if (/deodorant|roll.?on|antiperspirant/i.test(n)) {
    return {
      introEn: `${nameEn} provides long-lasting protection against wetness and odour.`,
      introAr: `${nameAr} يمنح حماية طويلة من التعرق والرائحة.`,
    };
  }
  const map = {
    cleanser: ['gently cleanses and refreshes skin.', 'ينظف وينعش البشرة بلطف.'],
    cream: ['nourishes and hydrates for softer skin.', 'يغذّي ويرطب لبشرة أكثر نعومة.'],
    serum: ['delivers targeted daily care.', 'يقدّم عناية يومية مركّزة.'],
  };
  const [en, ar] = map[typeKey] || map.cream;
  return { introEn: `${nameEn} ${en}`, introAr: `${nameAr} ${ar}` };
}

function posToName(pos, brandEn) {
  const p = clean(pos);
  if (!p || p.length < 5) return '';
  return formatEn(p, brandEn);
}

function buildFix(barcode, manualMap, knownFixes, products, storeRow, researchRow) {
  if (manualMap.has(barcode)) return { ...manualMap.get(barcode), _why: 'manual' };

  const cur = products.get(barcode);
  const known = knownFixes.get(barcode);
  if (known) return { ...known, _why: 'known-batch' };

  const store = pickStore(barcode, storeRow, researchRow?.guessBrand);
  let brandEn = canonBrand(store?.brandEn || cur?.brandEn || researchRow?.guessBrand || '');
  let nameEn = '';
  let nameAr = '';

  if (store?.nameEn) {
    brandEn = canonBrand(store.brandEn || brandEn);
    nameEn = formatEn(store.nameEn, brandEn);
    nameAr = formatAr(store.nameAr, brandArOf(brandEn), nameEn);
  } else if (cur?.nameEn) {
    brandEn = canonBrand(cur.brandEn || brandEn);
    nameEn = formatEn(cur.nameEn, brandEn);
    nameAr = formatAr(cur.nameAr, cur.brandAr || brandArOf(brandEn), nameEn);
  } else if (researchRow?.posName) {
    brandEn = canonBrand(researchRow.guessBrand || brandEn);
    nameEn = posToName(researchRow.posName, brandEn);
    nameAr = formatAr('', brandArOf(brandEn), nameEn);
  } else {
    return null;
  }

  if (!nameEn || nameEn.length < 10) return null;

  const { typeKey, sub, tert } = detectTypeKey(nameEn);
  const { introEn, introAr } = introFromName(nameEn, nameAr, typeKey);

  const needs = !cur || genericDesc(cur) || (store && cur && cur.nameEn !== nameEn);
  if (!needs && cur && !genericDesc(cur)) return null;

  return {
    barcode,
    brandEn,
    brandAr: brandArOf(brandEn),
    nameEn,
    nameAr,
    typeKey,
    sub,
    tert,
    introEn,
    introAr,
    _why: store?.source || (cur ? 'desc-upgrade' : 'pos'),
  };
}

const barcodes = [...new Set(readFileSync(LIST, 'utf8').trim().split(/\s+/).filter(Boolean))];
const manualArr = loadJson(MANUAL, []);
const manualMap = new Map(manualArr.map((f) => [f.barcode, f]));
const knownFixes = new Map([
  ...loadJson(NIPPON, []).map((f) => [f.barcode, f]),
  ...loadJson(BATCH2, []).map((f) => [f.barcode, f]),
]);
const products = new Map(loadJson(PRODUCTS, []).map((p) => [p.barcode, p]));
const storeRows = Object.fromEntries((loadJson(STORE, { rows: [] }).rows || []).map((r) => [r.barcode, r]));
const researchRows = Object.fromEntries((loadJson(RESEARCH, { rows: [] }).rows || []).map((r) => [r.barcode, r]));

const fixes = [];
const skipped = [];
for (const b of barcodes) {
  const fix = buildFix(b, manualMap, knownFixes, products, storeRows[b], researchRows[b]);
  if (fix) {
    delete fix._why;
    fixes.push(fix);
  } else {
    skipped.push(b);
  }
}

writeFileSync(OUT, `${JSON.stringify(fixes, null, 2)}\n`);
console.log(`Built ${fixes.length} fixes, skipped ${skipped.length} (already OK)`);
console.log('Sample:', fixes.slice(0, 3).map((f) => `${f.barcode} | ${f.nameEn.slice(0, 50)}`));

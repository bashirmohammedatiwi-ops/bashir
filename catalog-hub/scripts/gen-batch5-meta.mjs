#!/usr/bin/env node
/** Generate hand-verified bilingual metadata for Sarah POS batch 5. */
import { readFileSync, writeFileSync } from 'fs';

const BARCODES = [
  '50064861', '850035582251', '854102006763', '737052351100', '9314839020742',
  '8809864766884', '079625014921', '3432240506641', '3349668579839', '3760294350621',
  '3595471024787', '3600531584696', '3274872421554', '3274872428829', '3516641717315',
  '3760294350652', '3616304249716', '3346470304925', '3386460011600', '3349668622009',
  '614514780497', '7640233340721', '7640233341414', '3274872420625', '8411061088166',
  '8057971183661', '3595471024800', '854102006787', '3346133203671', '3616301794639',
  '8435137764730', '8034097956928', '3508441001275', '3614273790840', '3274872396197',
  '3274872423398', '3274872423336', '027131017752', '027131020424', '744109218965',
  '7702018070732', '689304184595', '3700550218227', '3616303452247', '3616303470654',
  '3616302038916', '3616301776154', '3616302038947', '3616304668722', '3386460132916',
];

function pDesc(d) {
  return {
    descriptionEn: `${d.introEn}\n\n◆ Scent family: ${d.familyEn}\n◆ Key notes: ${d.notesEn}\n◆ Character: ${d.charEn}\n◆ Best for: ${d.bestEn}\n◆ Longevity: ${d.longEn}`,
    descriptionAr: `${d.introAr}\n\n◆ عائلة العطر: ${d.familyAr}\n◆ النوتات الرئيسية: ${d.notesAr}\n◆ الطابع: ${d.charAr}\n◆ الأنسب لـ: ${d.bestAr}\n◆ الثبات: ${d.longAr}`,
  };
}

function cDesc(d) {
  return {
    descriptionEn: `${d.introEn}\n\n◆ Category: ${d.catEn}\n◆ Product type: ${d.typeEn}\n◆ Key benefits: ${d.benefitsEn.join(' · ')}\n◆ Suitable for: ${d.suitEn}\n◆ Size: ${d.sizeEn}`,
    descriptionAr: `${d.introAr}\n\n◆ التصنيف: ${d.catAr}\n◆ نوع المنتج: ${d.typeAr}\n◆ الفوائد الرئيسية: ${d.benefitsAr.join(' · ')}\n◆ الأنسب لـ: ${d.suitAr}\n◆ الحجم: ${d.sizeAr}`,
  };
}

function mDesc(d) {
  return {
    descriptionEn: `${d.introEn}\n\n◆ Category: Makeup\n◆ Product type: ${d.typeEn}\n◆ Key benefits: ${d.benefitsEn.join(' · ')}\n◆ Suitable for: ${d.suitEn}`,
    descriptionAr: `${d.introAr}\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: ${d.typeAr}\n◆ الفوائد الرئيسية: ${d.benefitsAr.join(' · ')}\n◆ الأنسب لـ: ${d.suitAr}`,
  };
}

const candidatesPath = new URL('../data/sarah-pos-candidates-batch5.json', import.meta.url);
const candidates = JSON.parse(readFileSync(candidatesPath, 'utf8'));
const byBc = new Map(candidates.map((c) => [c.barcode, c]));

function brandAr(raw = '') {
  return String(raw).split(/\s+/).filter((p) => /[\u0600-\u06FF]/.test(p)).slice(0, 4).join(' ').trim();
}

function cleanNameAr(raw = '', nameEn = '') {
  let n = String(raw).replace(/^عطر\s*/u, '').trim();
  if (nameEn && /[A-Za-z]/.test(nameEn)) n = `${n} ${nameEn}`.trim();
  n = n.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+–\s+/g, ' ').replace(/\s+-\s+/g, ' ');
  n = n.replace(/\s+من\s+[\u0600-\u06FF][\u0600-\u06FF\s]*?(?=\s+\d|\s*$)/gu, ' ');
  n = n.replace(/^عطر\s+/u, '').replace(/\s*عطر\s+/gu, ' ');
  n = n.replace(/\s*V34\s*/gi, ' ');
  n = n.replace(/\s+/g, ' ').trim();
  n = n.replace(/(\d)\s*ML\b/gi, '$1 مل').replace(/(\d)\s*مل\b/g, '$1 مل');
  n = n.replace(/(\d)\s*جم\b/g, '$1 جم').replace(/(\d)\s*جرام\b/g, '$1 جم');
  n = n.replace(/(\d)\s*حم\b/g, '$1 جم');
  return n.replace(/\s+/g, ' ').trim();
}

const BRAND_OVERRIDE = JSON.parse(String.raw`{
  "737052351100":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633","9314839020742":"\u0643\u064a\u0648 \u0641\u064a","3432240506641":"\u0643\u0627\u0631\u062a\u064a\u064a\u0647",
  "3349668579839":"\u0628\u0627\u0643\u0648 \u0631\u0627\u0628\u0627\u0646","3349668622009":"\u0628\u0627\u0643\u0648 \u0631\u0627\u0628\u0627\u0646","3760294350621":"\u0630\u0627 \u0648\u0648\u062f\u0632 \u0643\u0648\u0644\u064a\u0643\u0634\u0646",
  "3760294350652":"\u0630\u0627 \u0648\u0648\u062f\u0632 \u0643\u0648\u0644\u064a\u0643\u0634\u0646","3595471024787":"\u0645\u0631\u0633\u064a\u062f\u0633 \u0628\u0646\u0632","3595471024800":"\u0645\u0631\u0633\u064a\u062f\u0633 \u0628\u0646\u0632",
  "3274872428829":"\u062c\u064a\u0641\u0646\u0634\u064a","3274872396197":"\u062c\u064a\u0641\u0646\u0634\u064a","3386460011600":"\u0627\u0633 \u062a\u064a \u062f\u064a\u0628\u0648\u0646",
  "3346470304925":"\u062c\u064a\u0631\u0644\u0627\u0646","614514780497":"\u0627\u0644\u0631\u0635\u0627\u0635\u064a","7640233340721":"\u0625\u064a\u0644\u064a \u0635\u0639\u0628",
  "7640233341414":"\u0625\u064a\u0644\u064a \u0635\u0639\u0628","8057971183661":"\u062f\u0648\u0644\u062a\u0634\u064a \u063a\u0627\u0628\u0627\u0646\u0627","8034097956928":"\u0627\u0646\u063a\u0627\u0631\u0648",
  "3508441001275":"\u0643\u0631\u064a\u062f","744109218965":"\u0647\u0627\u064a \u0633\u0645\u0627\u064a\u0644","7702018070732":"\u062c\u064a\u0644\u064a\u062a \u0641\u064a\u0646\u0648\u0633",
  "3700550218227":"\u0643\u064a\u0644\u064a\u0627\u0646","3616303452247":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","3616303470654":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a",
  "3616302038916":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","3616301776154":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","3616302038947":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a",
  "3616304668722":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","3386460132916":"\u0641\u0627\u0646 \u0643\u0644\u064a\u0641"
}`);

const NAME_OVERRIDE = JSON.parse(String.raw`{
  "50064861":"\u0645\u0631\u0637\u0628 \u0648\u0645\u0648\u0631\u062f \u0627\u0644\u0634\u0641\u0627\u0647 20 \u062c\u0645","850035582251":"\u0628\u0644\u0633\u0645 \u0645\u0642\u0648\u064a \u0644\u0644\u0634\u0639\u0631 \u0628\u0625\u0643\u0644\u064a\u0644 \u0627\u0644\u062c\u0628\u0644 \u0648\u0627\u0644\u0646\u0639\u0646\u0627\u0639 355 \u0645\u0644",
  "854102006763":"\u0642\u0646\u0627\u0639 \u0631\u0648\u0632\u0645\u0627\u0631\u064a \u0648\u0646\u0639\u0646\u0627\u0639 \u0644\u062a\u0642\u0648\u064a\u0629 \u0627\u0644\u0634\u0639\u0631 340 \u062c\u0645","737052351100":"\u0628\u0648\u062a\u0644\u062f \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 100 \u0645\u0644",
  "9314839020742":"\u0643\u0631\u064a\u0645 \u0645\u0631\u0637\u0628 \u0644\u0644\u0628\u0634\u0631\u0629 \u0634\u062f\u064a\u062f \u0627\u0644\u062c\u0641\u0627\u0641 500 \u062c\u0645","8809864766884":"\u0642\u0644\u0645 \u062d\u0645\u0627\u064a\u0629 \u0645\u0646 \u0627\u0644\u0634\u0645\u0633 \u0645\u0637\u0641\u064a 18 \u062c\u0645",
  "079625014921":"\u0645\u062c\u0645\u0648\u0639\u0629 \u0627\u0633\u0641\u0646\u062c \u0645\u064a\u0646\u064a \u0645\u064a\u0631\u0643\u0644 4 \u0642\u0637\u0639","3432240506641":"\u0644\u0627 \u0628\u0627\u0646\u062a\u064a\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644",
  "3349668579839":"\u0648\u0627\u0646 \u0645\u0644\u064a\u0648\u0646 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644","3760294350621":"\u0646\u0627\u062a\u0634\u0648\u0631\u0627\u0644 \u0628\u0644\u0648\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644",
  "3600531584696":"\u0645\u0627\u0633\u0643\u0627\u0631\u0627 \u0641\u0627\u0644\u0633\u064a\u0633 \u0644\u0627\u0634 \u0644\u064a\u0641\u062a \u0623\u0633\u0648\u062f","8411061088166":"212 \u0641\u064a \u0622\u064a \u0628\u064a \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 100 \u0645\u0644",
  "744109218965":"\u0633\u064a\u0631\u0648\u0645 \u0644\u062a\u0628\u064a\u064a\u0636 \u0627\u0644\u0623\u0633\u0646\u0627\u0646 30 \u0645\u0644","7702018070732":"\u0645\u0648\u0633 \u062d\u0644\u0627\u0642\u0629 \u0633\u064a\u0645\u0628\u0644\u064a 3 \u0644\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0648\u0627\u062d\u062f 12 \u0642\u0637\u0639\u0629",
  "689304184595":"\u0628\u0627\u0644\u064a\u062a \u0643\u0648\u0646\u062a\u0648\u0631 \u0628\u0627\u0648\u062f\u0631 \u0644\u0627\u064a\u062a \u062a\u0648 \u0645\u062f\u064a\u0648\u0645"
}`);

function resolveAr(barcode) {
  const src = byBc.get(barcode);
  const b = BRAND_OVERRIDE[barcode] || brandAr(src?.brandAr || '');
  const n = NAME_OVERRIDE[barcode] || cleanNameAr(src?.nameAr || '', src?.nameEn || '');
  if (/[A-Za-z]/.test(b) || /[A-Za-z]/.test(n)) {
    throw new Error(`Latin in Arabic fields for ${barcode}`);
  }
  return { brandAr: b, nameAr: n };
}

/** @type {Record<string, object>} */
const DEFS = JSON.parse(readFileSync(new URL('./batch5-meta-defs.json', import.meta.url), 'utf8'));

/** @type {Record<string, object>} */
const PRODUCTS = {};
for (const bc of BARCODES) {
  const def = DEFS[bc];
  if (!def) throw new Error(`Missing DEFS for ${bc}`);
  const { brandAr: bAr, nameAr: nAr } = resolveAr(bc);
  const base = { brandEn: def.brandEn, brandAr: bAr, nameEn: def.nameEn, nameAr: nAr, kind: def.kind };
  if (def.kind === 'perfume') {
    PRODUCTS[bc] = { ...base, subs: def.subs, ...pDesc(def.p) };
  } else if (def.kind === 'care') {
    PRODUCTS[bc] = { ...base, careLeaf: def.careLeaf, typeKey: def.typeKey, ...cDesc(def.c) };
  } else {
    PRODUCTS[bc] = { ...base, makeupSub: def.makeupSub, ...mDesc(def.m) };
  }
}

for (const bc of BARCODES) {
  if (!byBc.has(bc)) throw new Error(`Barcode not in candidates: ${bc}`);
  if (!PRODUCTS[bc]) throw new Error(`Missing PRODUCTS entry: ${bc}`);
}
const extra = Object.keys(PRODUCTS).filter((k) => !BARCODES.includes(k));
if (extra.length) throw new Error(`Extra PRODUCTS keys: ${extra.join(', ')}`);

/** @type {Record<string, object>} */
const out = {};
for (const bc of BARCODES) out[bc] = PRODUCTS[bc];

const outPath = new URL('../data/sarah-pos-batch5-meta.json', import.meta.url);
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log('Key count:', Object.keys(out).length);

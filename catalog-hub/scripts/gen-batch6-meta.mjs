#!/usr/bin/env node
/** Generate hand-verified bilingual metadata for Sarah POS batch 6. */
import { readFileSync, writeFileSync } from 'fs';

const BARCODES = [
  '3337871324599', '773602710683', '3606000537699', '850045076085', '689304348423',
  '072140020491', '3337875722827', '3337875597395', '381371020652', '3760294351178',
  '3606000534919', '8011003872077', '614514410103', '689304188890', '7640111502791',
  '8057971188727', '3614228899376', '3616303048181', '3337875583626', '8018365500037',
  '3614228954051', '8011003858552', '3700550216094', '3337875597357', '3274872448780',
  '3355992004596', '3760294350881', '3614274017069', '8809913830641', '681619815997',
  '3346130018926', '8809576261868', '3614274217155', '3614274217148', '855732733210',
  '5060150185168', '8809875906477', '3349668614523', '3700134403957', '602004146151',
  '072140634827', '888066024082', '088300162543', '783320411168', '3386460126014',
  '8681008055258', '607845070085', '8681008055074', '8683608070617', '8683608070594',
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

const candidatesPath = new URL('../data/sarah-pos-candidates-batch6.json', import.meta.url);
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
  "773602710683":"\u0645\u0627\u0643","3606000537699":"\u0633\u064a\u0631\u0627\u0641\u064a","850045076085":"\u0623\u0648\u0644\u0627\u0628\u0644\u0643\u0633",
  "689304348423":"\u0623\u0646\u0627\u0633\u062a\u0627\u0633\u064a\u0627","3337875722827":"\u0644\u0627\u0631\u0648\u0634 \u0628\u0648\u0632\u064a\u0647","3337875597395":"\u0633\u064a\u0631\u0627\u0641\u064a",
  "3606000534919":"\u0633\u064a\u0631\u0627\u0641\u064a","614514410103":"\u0627\u0644\u0631\u0635\u0627\u0635\u064a","689304188890":"\u0623\u0646\u0627\u0633\u062a\u0627\u0633\u064a\u0627",
  "7640111502791":"\u0644\u0627\u0644\u064a\u0643","8057971188727":"\u062f\u0648\u0644\u062a\u0634\u064a \u063a\u0627\u0628\u0627\u0646\u0627","3614228899376":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a",
  "3616303048181":"\u0642\u0648\u062a\u0634\u064a","3337875583626":"\u0644\u0627\u0631\u0648\u0634 \u0628\u0648\u0632\u064a\u0647","8018365500037":"\u0641\u0631\u0632\u0627\u062a\u0634\u064a",
  "3614228954051":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","8011003858552":"\u0641\u0631\u0632\u0627\u062a\u0634\u064a","3700550216094":"\u0643\u064a\u0644\u064a\u0627\u0646",
  "3337875597357":"\u0633\u064a\u0631\u0627\u0641\u064a","3274872448780":"\u062c\u064a\u0641\u0646\u0634\u064a","3355992004596":"\u062a\u064a\u062f \u0644\u0627\u0628\u064a\u062f\u0648\u0633",
  "3760294351178":"\u0630\u0627 \u0648\u0648\u062f\u0632 \u0643\u0648\u0644\u064a\u0643\u0634\u0646","3760294350881":"\u0630\u0627 \u0648\u0648\u062f\u0632 \u0643\u0648\u0644\u064a\u0643\u0634\u0646",
  "3614274017069":"\u0645\u064a\u0632\u0648\u0646 \u0645\u0627\u0631\u062c\u064a\u064a\u0644\u0627","8809913830641":"\u0633\u0643\u064a\u0646 1004","681619815997":"\u0630\u0627 \u0628\u0627\u0644\u0645",
  "3346130018926":"\u0647\u064a\u0631\u0645\u064a\u0633","8809576261868":"\u0633\u0643\u064a\u0646 1004","3614274217155":"\u0641\u0627\u0644\u0646\u062a\u064a\u0646\u0648",
  "3614274217148":"\u0641\u0627\u0644\u0646\u062a\u064a\u0646\u0648","855732733210":"\u0645\u064a\u0646 \u0646\u064a\u0648\u064a\u0648\u0631\u0643","5060150185168":"\u0643\u0648\u0644\u0648\u0631 \u0648\u0627\u0648",
  "8809875906477":"\u0628\u064a\u0648\u062a\u064a \u0623\u0648\u0641 \u062c\u0648\u0633\u0648\u0646","3349668614523":"\u0628\u0627\u0643\u0648 \u0631\u0627\u0628\u0627\u0646","3700134403957":"\u0627\u0644\u0631\u0635\u0627\u0635\u064a",
  "602004146151":"\u0628\u0646\u0641\u062a","072140634827":"\u064a\u0648\u0633\u064a\u0631\u064a\u0646","888066024082":"\u062a\u0648\u0645 \u0641\u0648\u0631\u062f",
  "088300162543":"\u0643\u0627\u0644\u0641\u0646 \u0643\u0644\u0627\u064a\u0646","783320411168":"\u0628\u0648\u0644\u063a\u0627\u0631\u064a","3386460126014":"\u0641\u0627\u0646 \u0643\u0644\u064a\u0641",
  "8681008055258":"\u0646\u064a\u0634\u0627\u0646\u064a","607845070085":"\u0646\u0627\u0631\u0633","8681008055074":"\u0646\u064a\u0634\u0627\u0646\u064a",
  "8683608070617":"\u0646\u064a\u0634\u0627\u0646\u064a","8683608070594":"\u0646\u064a\u0634\u0627\u0646\u064a","8011003872077":"\u0641\u0631\u0632\u0627\u062a\u0634\u064a",
  "381371020652":"\u062c\u0648\u0646\u0633\u0648\u0646","3337871324599":"\u0641\u064a\u0634\u064a","072140020491":"\u064a\u0648\u0633\u064a\u0631\u064a\u0646"
}`);

const NAME_OVERRIDE = JSON.parse(String.raw`{
  "773602710683":"\u0645\u062b\u0628\u062a \u0641\u064a\u0643\u0633 \u0628\u0644\u0633 100 \u0645\u0644",
  "850045076085":"\u0632\u064a\u062a \u0623\u0648\u0644\u0627\u0628\u0644\u0643\u0633 \u0631\u0642\u0645 7 \u0644\u0644\u0631\u0628\u0637 30 \u0645\u0644",
  "3337875597357":"\u0633\u064a\u0631\u0627\u0641\u064a \u063a\u0633\u0648\u0644 \u0631\u063a\u0648\u064a \u0644\u0644\u0648\u062c\u0647 473 \u0645\u0644",
  "681619815997":"\u0637\u0642\u0645 \u0623\u062d\u0645\u0631 \u0634\u0641\u0627\u0647 \u0645\u064a\u0646\u064a \u0645\u064a\u062a \u0645\u0627\u062a \u0627\u0644\u0625\u0635\u062f\u0627\u0631 13",
  "855732733210":"\u0644\u0648\u0646\u062c \u0628\u0648\u0631\u062f \u0623\u0648 \u062f\u064a \u0628\u0627\u0631\u0641\u064a\u0648\u0645 75 \u0645\u0644",
  "783320411168":"\u0633\u0628\u0644\u0646\u062f\u064a\u062f\u0627 \u0628\u0627\u062a\u0634\u0648\u0644\u064a \u062a\u0645\u0628\u062a\u064a\u0634\u0646 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644",
  "8683608070617":"\u0647\u0627\u0633\u064a\u0641\u0627\u062a \u0625\u0643\u0633 \u062a\u064a\u0631\u0648 \u0625\u0643\u0633\u062a\u0631\u064a\u062a 100 \u0645\u0644",
  "8683608070594":"\u0647\u0627\u0633\u064a\u0641\u0627\u062a \u0625\u0643\u0633 \u0643\u0631\u064a\u062f\u0648 \u0625\u0643\u0633\u062a\u0631\u064a\u062a 100 \u0645\u0644"
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
const DEFS = JSON.parse(readFileSync(new URL('./batch6-meta-defs.json', import.meta.url), 'utf8'));

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

const outPath = new URL('../data/sarah-pos-batch6-meta.json', import.meta.url);
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

const mix = { care: 0, makeup: 0, perfume: 0 };
for (const bc of BARCODES) mix[PRODUCTS[bc].kind]++;
console.log('Key count:', Object.keys(out).length);
console.log('Mix:', mix);

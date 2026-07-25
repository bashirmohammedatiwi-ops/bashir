#!/usr/bin/env node
/** Generate hand-verified bilingual metadata for Sarah POS batch 7. */
import { readFileSync, writeFileSync } from 'fs';

const BARCODES = [
  '737052352060', '8011530810023', '7640163970029', '3614274143751', '737052041353',
  '8690604111053', '3348901786393', '3348901786331', '3614221031735', '3274872456341',
  '3386460088190', '3614273673846', '3423222012700', '3581000018679', '3386460066075',
  '8005610328799', '3423478812154', '724120095653', '3614274350753', '3574661177137',
  '3606000537460', '8051277318536', '8051277318642', '8056669925897', '3616303445584',
  '3614272898301', '5057566220828', '3614271717092', '7640111494027', '3600524070113',
  '3605521651587', '30144224', '3614272544444', '3614225358463', '3700134410542',
  '3770010614616', '3348901426961', '769915194951', '8809634610027', '783320403897',
  '3423222092245', '3423222092252', '8005610298894', '3386460057059', '3614273604833',
  '764302316091', '8033488153281', '8681008055227', '3614222793458', '3614272865235',
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

const candidatesPath = new URL('../data/sarah-pos-candidates-batch7.json', import.meta.url);
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

function resolveAr(barcode, def) {
  if (def?.brandAr && def?.nameAr) {
    if (/[A-Za-z]/.test(def.brandAr) || /[A-Za-z]/.test(def.nameAr)) {
      throw new Error(`Latin in Arabic fields for ${barcode}`);
    }
    return { brandAr: def.brandAr, nameAr: def.nameAr };
  }
  const src = byBc.get(barcode);
  const b = brandAr(src?.brandAr || '');
  const n = cleanNameAr(src?.nameAr || '', src?.nameEn || '');
  if (/[A-Za-z]/.test(b) || /[A-Za-z]/.test(n)) {
    throw new Error(`Latin in Arabic fields for ${barcode}`);
  }
  return { brandAr: b, nameAr: n };
}

/** @type {Record<string, object>} */
const DEFS = JSON.parse(readFileSync(new URL('./batch7-meta-defs.json', import.meta.url), 'utf8'));

/** @type {Record<string, object>} */
const PRODUCTS = {};
for (const bc of BARCODES) {
  const def = DEFS[bc];
  if (!def) throw new Error(`Missing DEFS for ${bc}`);
  const { brandAr: bAr, nameAr: nAr } = resolveAr(bc, def);
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

const outPath = new URL('../data/sarah-pos-batch7-meta.json', import.meta.url);
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

const mix = { care: 0, makeup: 0, perfume: 0 };
for (const bc of BARCODES) mix[PRODUCTS[bc].kind]++;
console.log('Key count:', Object.keys(out).length);
console.log('Mix:', mix);

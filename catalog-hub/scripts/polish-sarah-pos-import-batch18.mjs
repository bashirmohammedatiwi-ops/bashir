#!/usr/bin/env node
/** Polish batch-8 — verified EN names, Sarah AR names, bilingual descriptions. */
import { readFileSync, writeFileSync } from 'fs';
import { CATEGORIES } from '../lib/core/app-categories.js';

const PRODUCTS = new URL('../data/sarah-pos-import-products-batch18.json', import.meta.url).pathname;
const CANDIDATES = new URL(process.env.CANDIDATES_FILE || '../data/sarah-pos-candidates-care-batch18.json', import.meta.url).pathname;
const products = JSON.parse(readFileSync(PRODUCTS, 'utf8'));
const byBc = new Map(JSON.parse(readFileSync(CANDIDATES, 'utf8')).map((c) => [c.barcode, c]));

const PERFUMES = CATEGORIES.perfumes;
const META = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch18-meta.json', import.meta.url), 'utf8'));
const DESC_AR = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch18-desc-ar.json', import.meta.url), 'utf8'));

function brandAr(raw = '') {
  return String(raw).split(/\s+/).filter((p) => /[\u0600-\u06FF]/.test(p)).slice(0, 3).join(' ').trim();
}

function nameAr(raw = '') {
  let n = String(raw).replace(/^عطر\s*/,'').trim();
  n = n.replace(/\s+ESTEE[\s\S]*$/i,'').replace(/\s+[A-Z]{4,}[\s\S]*$/,'').trim();
  return n.replace(/(\d)\s*ML\b/gi,'$1 مل').replace(/(\d)مل\b/g,'$1 مل');
}

function perfumeDescAr(nameAr) {
  return `${nameAr} — عطر راقٍ يتميز بطابع أنيق وثبات جيد.\n\n◆ عائلة العطر: عطر فاخر\n◆ النوتات الرئيسية: نوتات زهرية وخشبية وعنبرية\n◆ الطابع: أنيق وثابت\n◆ الأنسب لـ: الاستخدام اليومي والمناسبات\n◆ الثبات: 6–10 ساعات`;
}

function careDescAr(nameAr, size = '—') {
  return `${nameAr} — منتج عناية يومي بتركيبة موثوقة للاستخدام المنتظم.\n\n◆ التصنيف: العناية بالبشرة\n◆ نوع المنتج: عناية\n◆ الفوائد الرئيسية: عناية يومية · تركيبة موثوقة · مناسب للروتين\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${size}`;
}

function makeupDescAr(nameAr) {
  return `${nameAr} — منتج مكياج عملي لإطلالات يومية.\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: مكياج\n◆ الفوائد الرئيسية: سهل التطبيق · تغطية قابلة للبناء · للاستخدام اليومي\n◆ الأنسب لـ: إطلالات يومية`;
}

for (const p of products) {
  const src = byBc.get(p.barcode);
  const meta = META[p.barcode];
  if (meta) {
    p.brandEn = meta.brandEn;
    p.nameEn = meta.nameEn;
    if (meta.brandAr) p.brandAr = meta.brandAr;
    if (meta.nameAr) {
      p.nameAr = meta.nameAr;
      if (meta.brandAr && !String(meta.nameAr).startsWith(meta.brandAr)) {
        p.nameAr = `${meta.brandAr} - ${meta.nameAr}`;
      }
    }
  } else if (src?.nameAr) p.nameAr = nameAr(src.nameAr);
  else p.nameAr = p.nameEn;
  if (!meta?.brandAr) {
    if (src?.brandAr) p.brandAr = brandAr(src.brandAr) || p.brandEn;
    else p.brandAr = p.brandEn;
  }

  if (meta?.descriptionAr) {
    p.descriptionAr = meta.descriptionAr;
    if (meta.descriptionEn) p.descriptionEn = meta.descriptionEn;
  } else if (DESC_AR[p.barcode]) {
    p.descriptionAr = DESC_AR[p.barcode];
  } else if (p.categoryId === PERFUMES) {
    p.descriptionAr = perfumeDescAr(p.nameAr);
  } else if (p.categoryId === CATEGORIES.makeup) {
    p.descriptionAr = makeupDescAr(p.nameAr);
  } else {
    const sizeM = p.descriptionEn?.match(/Size: (.+)/);
    p.descriptionAr = careDescAr(p.nameAr, sizeM?.[1] || '—');
  }
}

writeFileSync(PRODUCTS, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Polished ${products.length} batch18 products`);

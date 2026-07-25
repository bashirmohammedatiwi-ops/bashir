#!/usr/bin/env node
/**
 * Generate data/care-batch140-products.json (140 entries)
 * Run: node scripts/gen-care-batch140.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/care-batch140-products.json');

const HC = 'care-hair-care';

function desc({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size }) {
  const sizeEn = size === 'حسب المنتج' ? 'As listed' : size;
  return {
    introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size,
    descriptionEn: `${introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: ${benefitsEn.join(' · ')}\n◆ Suitable for: Daily hair care routines\n◆ Size: ${sizeEn}`,
    descriptionAr: `${introAr}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: ${benefitsAr.join(' · ')}\n◆ الأنسب لـ: روتين العناية اليومي بالشعر\n◆ الحجم: ${size}`,
  };
}

/** @type {Record<string, {brandEn:string,brandAr:string,nameEn:string,nameAr:string,typeKey:string,tertiary:string,size:string}>} */
const MAP = JSON.parse(readFileSync(path.join(__dirname, 'care-batch140-map.json'), 'utf8'));

const BARCODES = readFileSync(path.join(__dirname, 'care-batch140-barcodes.txt'), 'utf8')
  .trim().split(/\s+/);

const TYPE_META = {
  shampoo: { typeEn: 'Shampoo', typeAr: 'شامبو', tertiary: 'care-hair-care-shampoo-conditioners', catEn: 'Hair cleansing', catAr: 'تنظيف الشعر' },
  conditioner: { typeEn: 'Conditioner', typeAr: 'بلسم', tertiary: 'care-hair-care-shampoo-conditioners', catEn: 'Hair conditioning', catAr: 'ترطيب الشعر' },
  'hair-mask': { typeEn: 'Hair mask', typeAr: 'قناع شعر', tertiary: 'care-hair-care-oil-masks', catEn: 'Intensive treatment', catAr: 'علاج مكثف' },
  'hair-oil': { typeEn: 'Hair oil', typeAr: 'زيت شعر', tertiary: 'care-hair-care-oil-masks', catEn: 'Hair oil care', catAr: 'زيوت الشعر' },
  'leave-in': { typeEn: 'Leave-in treatment', typeAr: 'علاج بدون شطف', tertiary: 'care-hair-care-hair-treatment', catEn: 'Leave-in care', catAr: 'عناية بدون شطف' },
  'hair-spray': { typeEn: 'Hair spray', typeAr: 'سبراي شعر', tertiary: 'care-hair-care-hair-styling', catEn: 'Hair styling', catAr: 'تصفيف الشعر' },
  'hair-color': { typeEn: 'Hair color', typeAr: 'صبغة شعر', tertiary: 'care-hair-care-hair-coloring', catEn: 'Hair coloring', catAr: 'صبغ الشعر' },
  'heat-protectant': { typeEn: 'Heat protectant', typeAr: 'حماية من الحرارة', tertiary: 'care-hair-care-hair-treatment', catEn: 'Heat protection', catAr: 'حماية حرارية' },
};

function defaultBenefits(typeKey) {
  const m = {
    shampoo: [['Gentle cleanse', 'Daily use', 'Salon-quality care'], ['تنظيف لطيف', 'استخدام يومي', 'عناية بجودة الصالون']],
    conditioner: [['Detangling', 'Softness', 'Nourishing care'], ['فك التشابك', 'نعومة', 'عناية مغذية']],
    'hair-mask': [['Deep repair', 'Intensive nourishment', 'Salon treatment'], ['إصلاح عميق', 'تغذية مكثفة', 'علاج صالون']],
    'hair-oil': [['Shine & nourishment', 'Lightweight finish', 'Heat-friendly'], ['لمعان وتغذية', 'لمسة خفيفة', 'مناسب للتصفيف']],
    'leave-in': [['No-rinse care', 'Manageability', 'Daily protection'], ['عناية دون شطف', 'سهولة التسريح', 'حماية يومية']],
    'hair-spray': [['Instant refresh', 'Light hold', 'Styling finish'], ['انتعاش فوري', 'ثبات خفيف', 'لمسة تصفيف']],
    'hair-color': ['100% grey coverage', 'Professional result', 'Nourishing oils'],
    'heat-protectant': [['Heat protection', 'Smooth finish', 'Frizz control'], ['حماية حرارية', 'لمسة ناعمة', 'ضبط الهيشان']],
  };
  const hit = m[typeKey] || m.shampoo;
  if (typeKey === 'hair-color') return [['100% grey coverage', 'Professional result', 'Nourishing oils'], ['تغطية كاملة للشيب', 'نتيجة احترافية', 'زيوت مغذية']];
  return hit;
}

const products = [];
const uncertain = [];

for (const barcode of BARCODES) {
  const hit = MAP[barcode];
  if (!hit) {
    uncertain.push(barcode);
    continue;
  }
  const meta = TYPE_META[hit.typeKey] || TYPE_META.shampoo;
  const tertiary = hit.tertiary || meta.tertiary;
  const [benefitsEn, benefitsAr] = hit.benefitsEn ? [hit.benefitsEn, hit.benefitsAr] : defaultBenefits(hit.typeKey);
  const introEn = hit.introEn || `${hit.nameEn} delivers professional hair care for daily routines.`;
  const introAr = hit.introAr || `${hit.nameAr} يقدم عناية احترافية للشعر ضمن الروتين اليومي.`;
  const sizeAr = hit.sizeAr || (hit.size.includes('مل') || hit.size.includes('قط') ? hit.size : `${hit.size} مل`);
  products.push({
    barcode,
    brandEn: hit.brandEn,
    brandAr: hit.brandAr,
    nameEn: hit.nameEn,
    nameAr: hit.nameAr,
    typeKey: hit.typeKey,
    subcategorySlugs: [HC],
    tertiarySlugs: [tertiary],
    size: hit.size,
    ...desc({
      introEn, introAr,
      catEn: hit.catEn || meta.catEn,
      catAr: hit.catAr || meta.catAr,
      typeEn: hit.typeEn || meta.typeEn,
      typeAr: hit.typeAr || meta.typeAr,
      benefitsEn, benefitsAr,
      size: sizeAr,
    }),
  });
  if (hit.uncertain) uncertain.push(barcode);
}

writeFileSync(OUT, JSON.stringify(products, null, 2) + '\n');
console.log('Written', products.length, 'products to', OUT);
if (uncertain.length) console.log('Uncertain/missing:', uncertain.join(', '));

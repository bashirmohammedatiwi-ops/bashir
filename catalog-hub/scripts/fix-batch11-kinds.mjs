#!/usr/bin/env node
/** Fix batch-11 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch11-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '311845147578': { brandEn: 'Mason Natural', nameEn: 'Mason Natural Collagen Beauty Cream 57g', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream', brandAr: 'ماسون', nameAr: 'ماسون - كريم الجمال بالكولاجين 57غ' },
  '3386460085823': { brandEn: 'Montblanc', nameEn: 'Montblanc Emblem Absolu Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3605521816658': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Si Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3760294351390': { brandEn: 'The Woods Collection', nameEn: 'The Woods Collection By Natural Eclipse Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true }, brandAr: 'ذا وودز كوليكشن', nameAr: 'ذا وودز كوليكشن - باي ناتشورال ايكلبس أو دو بارفيوم 100 مل' },
  '6284001000021': { brandEn: 'Nora Bo Awadh', nameEn: 'Nora Bo Awadh Eyeliner Brush', kind: 'makeup', makeupSub: 'eyes', brandAr: 'نورة بوعوض', nameAr: 'نورة بوعوض - فرشاة eyeliner' },
  '3548752203166': { brandEn: 'Make Up For Ever', nameEn: 'Make Up For Ever HD Skin Face Essentials Palette', kind: 'makeup', makeupSub: 'face', brandAr: 'ميك أب فور إيفر', nameAr: 'ميك أب فور إيفر - مجموعة بلاشر وكونتور كريمي' },
  '098691047718': { brandEn: 'Juicy Couture', nameEn: 'Juicy Couture Viva La Juicy Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '719346167062': { brandEn: 'Juicy Couture', nameEn: 'Juicy Couture Viva La Juicy Noir Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3607342401426': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein CK One Shock For Him Eau de Toilette 200ml', kind: 'perfume', subs: { gender: 'men' } },
  '3454960020917': { brandEn: 'Lalique', nameEn: 'Lalique Le Parfum Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '7640111508243': { brandEn: 'Bentley', nameEn: 'Bentley For Men Absolute Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '769915190670': { brandEn: 'The Ordinary', nameEn: 'The Ordinary Caffeine Solution 5% + EGCG 30ml', kind: 'care', careLeaf: 'care/face-care/eye-care', typeKey: 'serum', brandAr: 'ذا أورديناري', nameAr: 'ذا أورديناري - سيروم كافين 5% + EGCG' },
  '816457022652': { brandEn: 'Oz Naturals', nameEn: 'Oz Naturals Vitamin C Serum 30ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum', brandAr: 'أوز ناتشورال', nameAr: 'أوز ناتشورال - سيروم فيتامين سي 30 مل' },
  '3145891269901': { brandEn: 'Chanel', nameEn: 'Chanel Chance Hair Mist 35ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'شانيل', nameAr: 'شانيل - معطر شعر شانس 35 مل' },
  '681619807503': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.1', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم', nameAr: 'ذا بالم - طقم أرواج ميني الإصدار الأول' },
};

for (const [bc, fix] of Object.entries(FIX)) {
  if (!meta[bc]) continue;
  const m = meta[bc];
  Object.assign(m, fix);
  if (fix.kind === 'makeup') {
    delete m.careLeaf;
    delete m.typeKey;
    delete m.subs;
  } else if (fix.kind === 'care') {
    delete m.makeupSub;
    delete m.subs;
  } else if (fix.kind === 'perfume') {
    delete m.makeupSub;
    delete m.careLeaf;
    delete m.typeKey;
  }
}

writeFileSync(new URL('../data/sarah-pos-batch11-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

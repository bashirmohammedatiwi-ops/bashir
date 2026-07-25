#!/usr/bin/env node
/** Fix batch-13 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch13-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '8809686383566': { brandEn: 'Isntree', nameEn: 'Isntree Hyaluronic Acid Water Gel Cream 100ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream', brandAr: 'ازنتري', nameAr: 'ازنتري - كريم جل مائي بحمض الهيالورونيك 100 مل' },
  '8691190121327': { brandEn: 'Golden Rose', nameEn: 'Golden Rose Mini Lip Set', kind: 'makeup', makeupSub: 'lips', brandAr: 'قولدن روز', nameAr: 'قولدن روز - مجموعة أرواج ميني' },
  '8411061945308': { brandEn: 'Carolina Herrera', nameEn: 'Carolina Herrera 212 VIP Rose Hair Mist 30ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'كارولينا هerrera', nameAr: 'كarolina herrera - 212 VIP Rose معطر شعر 30 مل' },
  '3614271987952': { brandEn: 'Yves Saint Laurent', nameEn: 'Yves Saint Laurent Black Opium Hair Mist 30ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'إيف سان لورan', nameAr: 'إيف سان لورan - Black Opium معطر شعر 30 مل' },
  '033200191223': { brandEn: 'Arm & Hammer', nameEn: 'Arm & Hammer Essentials Fresh Deodorant 28g', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant', brandAr: 'ارم اند هامer', nameAr: 'arm & hammer - مzيل مضاد التعرق Fresh 28 ج' },
  '8809422285871': { brandEn: 'Nora Bo Awadh', nameEn: 'Nora Bo Awadh Makeup Fixer Spray', kind: 'makeup', makeupSub: 'face', brandAr: 'نورة بوعوض', nameAr: 'نورة بوعوض - بخاخ تثبيت مكياج Fixer Spray' },
  '041608002577': { brandEn: "Summer's Eve", nameEn: "Summer's Eve Night-Time Sensitive Wash", kind: 'care', careLeaf: 'care/women-care/intimate-wash', typeKey: 'cleanser', brandAr: 'سمرز إiv', nameAr: 'سummer\'s eve - غsول ليلي للمنطقة الحساسة' },
  '088300601400': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Eternity Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '783320833700': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Pour Homme Extreme Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '783320409592': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Splendida Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '7640163971613': { brandEn: 'Jaguar', nameEn: 'Jaguar Pace Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '737052522487': { brandEn: 'Gucci', nameEn: 'Gucci Flora Gorgeous Gardenia Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3386460118941': { brandEn: 'Van Cleef & Arpels', nameEn: "Van Cleef & Arpels Bois d'Amande Eau de Parfum 75ml", kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3700578501981': { brandEn: 'Parfums de Marly', nameEn: 'Parfums de Marly Delina Exclusif Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women', isNiche: true } },
  '4250587739084': { brandEn: 'Essence', nameEn: 'Essence I Love Crazy Volume Mascara', kind: 'makeup', makeupSub: 'eyes' },
  '6294018400875': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Warm Obsessions Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes', brandAr: 'هدى بيوتي', nameAr: 'هدى بيوتي - باليت Warm Obsessions' },
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

writeFileSync(new URL('../data/sarah-pos-batch13-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

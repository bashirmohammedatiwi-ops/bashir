#!/usr/bin/env node
/** Fix batch-15 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch15-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '769915194791': { brandEn: 'The Ordinary', nameEn: 'The Ordinary Squalane Cleanser 50ml', kind: 'care', careLeaf: 'care/face-care/cleansers--toners', typeKey: 'cleanser', brandAr: 'ذا أورديناري', nameAr: 'ذا أورديناري - غسول منظف Squalane 50 مل' },
  '769915190311': { brandEn: 'The Ordinary', nameEn: 'The Ordinary Niacinamide 10% + Zinc 1% 30ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum', brandAr: 'ذا أورديناري', nameAr: 'ذا أورديناري - سيروم Niacinamide 10% + Zinc 1%' },
  '6291106034264': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Nude Obsessions Light Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes', brandAr: 'هدى بيوتي', nameAr: 'هدى بيوتي - باليت Nude Obsessions Light' },
  '3548752106535': { brandEn: 'Make Up For Ever', nameEn: 'Make Up For Ever Ultra HD Loose Powder', kind: 'makeup', makeupSub: 'face', brandAr: 'ميك أب فور إيفر', nameAr: 'ميك أب فور إيفr - بودرة شفافة' },
  '3348901497282': { brandEn: 'Dior', nameEn: "Dior J'adore Hair Mist 40ml", kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'ديor', nameAr: "ديor - J'adore معطر شعر 40 مل" },
  '607845066088': { brandEn: 'NARS', nameEn: 'NARS Natural Radiant Longwear Foundation Medium 30ml', kind: 'makeup', makeupSub: 'face', brandAr: 'نars', nameAr: 'نars - كريم أساس Natural Radiant 30 مل' },
  '602004034670': { brandEn: 'Benefit', nameEn: 'Benefit The POREfessional Face Primer 22ml', kind: 'makeup', makeupSub: 'face', brandAr: 'بnefit', nameAr: 'بnefit - برايmer The POREfessional 22 مل' },
  '3600530941278': { brandEn: 'Maybelline', nameEn: 'Maybelline Baby Skin Pore Eraser Primer', kind: 'makeup', makeupSub: 'face', brandAr: 'مaybelline', nameAr: 'مaybelline - برايmer Baby Skin' },
  '3605521816580': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Si Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3360372058878': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Acqua di Gio Homme Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '719346232890': { brandEn: 'Juicy Couture', nameEn: 'Juicy Couture Oui Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3386460066181': { brandEn: 'Montblanc', nameEn: 'Montblanc Lady Emblem Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '783320427152': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Aqva Pour Homme Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '783320461002': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Man Wood Essence Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3607342837911': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Reveal For Him Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '716393019054': { brandEn: 'Liz Claiborne', nameEn: 'Liz Claiborne Vivid Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'لiz claiborne', nameAr: 'لiz claiborne - Vivid أو دو تواليت 100 مل' },
  '842185115205': { brandEn: 'Le Labo', nameEn: 'Le Labo Another 13 Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true }, brandAr: 'لي لابo', nameAr: 'لي لابo - Another 13 أو دو بارفيوم 100 مل' },
  '3700578518149': { brandEn: 'Parfums de Marly', nameEn: 'Parfums de Marly Layton Exclusif Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'men', isNiche: true }, brandAr: 'مارلي', nameAr: 'مارلي - Layton Exclusif أو دو بارفيوم 75 مل' },
  '6074000141012': { brandEn: 'Oman Luxury', nameEn: 'Oman Luxury Oud Aquilaria Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true }, brandAr: 'عمان لوكjury', nameAr: 'عمان luxury - Oud Aquilaria 100 مل' },
  '3614225327698': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Uomo La Notte Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' }, brandAr: 'روبرto cavalli', nameAr: 'روبرto cavalli - Uomo La Notte 100 مل' },
  '3614227742642': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Uomo Deep Desire Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' }, brandAr: 'روبرto cavalli', nameAr: 'روبرto cavalli - Uomo Deep Desire 100 مل' },
  '3600524104726': { brandEn: "L'Oreal Paris", nameEn: "L'Oreal Paris Infallible Setting Spray 75ml", kind: 'makeup', makeupSub: 'face', brandAr: 'لoreal', nameAr: "لoreal - بخاخ تثبيت مكياج 36 ساعة 75 مل" },
  '689304181754': { brandEn: 'Anastasia Beverly Hills', nameEn: 'Anastasia Beverly Hills Norvina Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes', brandAr: 'انstazia beverly hills', nameAr: 'انstazia - باليت Norvina' },
  '602004089557': { brandEn: 'Benefit', nameEn: 'Benefit Badgal Bang Mascara Mini 4ml', kind: 'makeup', makeupSub: 'eyes', brandAr: 'بnefit', nameAr: 'بnefit - ماسkara Badgal Bang Mini' },
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

writeFileSync(new URL('../data/sarah-pos-batch15-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

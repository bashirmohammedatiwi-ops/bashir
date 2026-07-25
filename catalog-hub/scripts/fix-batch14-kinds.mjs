#!/usr/bin/env node
/** Fix batch-14 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch14-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '3145891369908': { brandEn: 'Chanel', nameEn: 'Chanel Chance Eau Fraiche Hair Mist 35ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'شانيل', nameAr: 'شانيل - معطر شعر Chance Fraiche 35 مل' },
  '3145891266603': { brandEn: 'Chanel', nameEn: 'Chanel Chance Eau Vive Hair Mist 35ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'شانيل', nameAr: 'شانيل - معطر شعر Chance Eau Vive 35 مل' },
  '3274872419339': { brandEn: 'Givenchy', nameEn: 'Givenchy Irresistible Hair Mist 35ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'جivenchy', nameAr: 'جivenchy - Irresistible معطر شعر 35 مل' },
  '681619813795': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.4', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم', nameAr: 'ذا بالm - طقم أرواج ميني الإصدار الرابع' },
  '3592495840027': { brandEn: 'Forever 52', nameEn: 'Forever 52 Daily Life Highlighter ILU002', kind: 'makeup', makeupSub: 'face', brandAr: 'فورايفر 52', nameAr: 'فورaيفr 52 - إضاءة Daily Life ILU002' },
  '9329370165579': { brandEn: 'Ulta3', nameEn: 'Ulta3 Magic Lipstick', kind: 'makeup', makeupSub: 'lips', brandAr: 'الta3', nameAr: 'الta3 - روج سحري' },
  '3403800008936': { brandEn: 'Nora Bo Awadh', nameEn: 'Nora Bo Awadh Banana Powder', kind: 'makeup', makeupSub: 'face', brandAr: 'نورة بوعوض', nameAr: 'نورة بوعوض - بنana بودr' },
  '887167485488': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Advanced Night Repair Serum 50ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum' },
  '3439600056921': { brandEn: 'Thierry Mugler', nameEn: 'Thierry Mugler Alien Eau de Parfum 60ml', kind: 'perfume', subs: { gender: 'women' } },
  '3605532612768': { brandEn: 'Lancôme', nameEn: 'Lancôme La Vie Est Belle Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '701666410447': { brandEn: 'Amouage', nameEn: 'Amouage Search Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3614271994806': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Si Passione Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3607346236543': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Just Cavalli Eau de Toilette 75ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'روبرto cavalli', nameAr: 'روبرto cavalli - Just Cavalli 75 مل' },
  '3616302038909': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Paradiso Azzurro Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'روبرto cavalli', nameAr: 'روبرto cavalli - Paradiso Azzurro 100 مل' },
  '3348900425309': { brandEn: 'Dior', nameEn: 'Dior Hypnotic Poison Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '8717774840832': { brandEn: 'Orto Parisi', nameEn: 'Orto Parisi Boccanera Parfum 50ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '693102800113': { brandEn: 'Ofra', nameEn: 'Ofra Soul Highlighting & Contouring Palette', kind: 'makeup', makeupSub: 'face' },
  '689304181853': { brandEn: 'Anastasia Beverly Hills', nameEn: 'Anastasia Beverly Hills Carli Bybel Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes', brandAr: 'انستازيا بevrly hills', nameAr: 'انستازيا - باليت Carli Bybel' },
  '689304181846': { brandEn: 'Anastasia Beverly Hills', nameEn: 'Anastasia Beverly Hills Jackie Aina Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes', brandAr: 'انstazia beverly hills', nameAr: 'انstazia - باليت Jackie Aina' },
  '4250947501245': { brandEn: 'Essence', nameEn: 'Essence Lash Princess Volume Mascara', kind: 'makeup', makeupSub: 'eyes' },
  '6294018404507': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Creamy Eyeshadow & Mascara Set', kind: 'makeup', makeupSub: 'eyes', brandAr: 'هدى بيوتي', nameAr: 'هدى بيوتي - طقم ظلال كريمي + ماسkara' },
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

writeFileSync(new URL('../data/sarah-pos-batch14-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

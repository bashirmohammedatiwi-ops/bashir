#!/usr/bin/env node
/** Fix batch-16 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch16-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '6283001100007': { brandEn: 'Nora Bo Awadh', nameEn: 'Nora Bo Awadh Ya Aini Mascara', kind: 'makeup', makeupSub: 'eyes', brandAr: 'نورة بوعوض', nameAr: 'نورة بوعوض - ماسكara يا عيني' },
  '3137370207016': { brandEn: 'Nina Ricci', nameEn: 'Nina Ricci Lair du Temps Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'نina ricci', nameAr: 'نina ricci - L\'Air du Temps 100 مل' },
  '3700578501967': { brandEn: 'Parfums de Marly', nameEn: 'Parfums de Marly Delina La Rosée Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women', isNiche: true }, brandAr: 'مارلي', nameAr: 'مارلي - Delina La Rosée 75 مل' },
  '3700578505002': { brandEn: 'Parfums de Marly', nameEn: 'Parfums de Marly Godolphin Eau de Parfum 125ml', kind: 'perfume', subs: { gender: 'men', isNiche: true }, brandAr: 'مارلي', nameAr: 'مارلي - Godolphin 125 مل' },
  '3614228899253': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Florence Blossom Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'روبرto cavalli', nameAr: 'روبرto cavalli - Florence Blossom 75 مل' },
  '3614225106866': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Florence Amber Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'روبرto cavalli', nameAr: 'روبرto cavalli - Florence Amber 75 مل' },
  '719346131148': { brandEn: 'Mariah Carey', nameEn: 'Mariah Carey Forever Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'ماريا كاري', nameAr: 'ماريا كاري - Forever 100 مل' },
  '887167157149': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Modern Muse Le Rouge Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'إstée lauder', nameAr: 'إstée lauder - Modern Muse Le Rouge 100 مل' },
  '027131261629': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Modern Muse Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'إstée lauder', nameAr: 'إstée lauder - Modern Muse 100 مل' },
  '783320977336': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Splendida Rose Rose Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '783320971556': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Man Extreme Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '783320977367': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Splendida Iris d\'Or Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3386460018050': { brandEn: 'Van Cleef & Arpels', nameEn: 'Van Cleef & Arpels Bois d\'Iris Eau de Parfum 75ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3386460018005': { brandEn: 'Van Cleef & Arpels', nameEn: 'Van Cleef & Arpels Collection Extraordinaire Gardenia Petale 75ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3386460034951': { brandEn: 'Van Cleef & Arpels', nameEn: 'Van Cleef & Arpels Precious Oud Eau de Parfum 75ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '8435415011556': { brandEn: 'Jean Paul Gaultier', nameEn: 'Jean Paul Gaultier Classique Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3432240036261': { brandEn: 'Cartier', nameEn: 'Cartier La Panthere Legere Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '3432240501103': { brandEn: 'Cartier', nameEn: 'Cartier La Panthere Edition Soir Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '3423222015916': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana The One Luminous Night Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men', isNiche: true } },
  '3614271566577': { brandEn: 'Yves Saint Laurent', nameEn: 'Yves Saint Laurent Black Opium Floral Shock Eau de Parfum 90ml', kind: 'perfume', subs: { gender: 'women' } },
  '3365440332522': { brandEn: 'Yves Saint Laurent', nameEn: 'Yves Saint Laurent Y Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3365440226708': { brandEn: 'Yves Saint Laurent', nameEn: 'Yves Saint Laurent Manifesto Eau de Parfum 90ml', kind: 'perfume', subs: { gender: 'women' } },
  '3274879282356': { brandEn: 'Givenchy', nameEn: 'Givenchy Hot Couture Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3386460002554': { brandEn: 'S.T. Dupont', nameEn: 'S.T. Dupont Blanc Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3439600056976': { brandEn: 'Thierry Mugler', nameEn: 'Thierry Mugler Alien Eau de Parfum 90ml Tester', kind: 'perfume', subs: { gender: 'women' }, nameAr: 'ثierry mugler - Alien تستr 90 مل' },
  '3760168592263': { brandEn: 'Etat Libre d\'Orange', nameEn: 'Etat Libre d\'Orange Experimentum Crucis Eau de Parfum Tester', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
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

writeFileSync(new URL('../data/sarah-pos-batch16-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

#!/usr/bin/env node
/** Fix batch-12 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch12-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '689304181785': { brandEn: 'Anastasia Beverly Hills', nameEn: 'Anastasia Beverly Hills Riviera Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes', brandAr: 'انستازيا بيڤرلي هيلز', nameAr: 'انستازيا بيڤرلي هيلز - باليت ظلال ريفيرا' },
  '3274870303166': { brandEn: 'Givenchy', nameEn: 'Givenchy Pour Homme Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' }, brandAr: 'جivenchy', nameAr: 'جivenchy - بور أوم أو دو تواليت 100 مل' },
  '3349668021345': { brandEn: 'Paco Rabanne', nameEn: 'Paco Rabanne Invictus Green Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3616301623373': { brandEn: 'Hugo Boss', nameEn: 'Hugo Boss Hugo Energise Eau de Toilette 75ml', kind: 'perfume', subs: { gender: 'men' } },
  '3274878122561': { brandEn: 'Givenchy', nameEn: 'Givenchy Amarige Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '4589546892226': { brandEn: 'Hask', nameEn: 'Hask Honey Repair Moisturizing Shampoo 440ml', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo', brandAr: 'هask', nameAr: 'هask - شامبو إصلاح مرطب بالعسل 440 مل' },
  '6085010094151': { brandEn: 'Armaf', nameEn: 'Armaf Club de Nuit Woman Eau de Parfum 105ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'ارماف', nameAr: 'ارماف - كلوب دي نوي النسائي أو دو بارفيوم 105 مل' },
  '3700559603116': { brandEn: 'Maison Francis Kurkdjian', nameEn: 'Maison Francis Kurkdjian Baccarat Rouge 540 Eau de Parfum 70ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true }, brandAr: 'ميسون فرansis كurkdjian', nameAr: 'ميسون فرansis كurkdjian - بaccarat روج 540 أو دو بارفيوم 70 مل' },
  '3614273313162': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Si Intense Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3548752196376': { brandEn: 'Make Up For Ever', nameEn: 'Make Up For Ever Mist & Fix Setting Spray 100ml', kind: 'makeup', makeupSub: 'face', brandAr: 'ميك أب فور إيفر', nameAr: 'ميك أب فور إيفر - مثبت مكياج Fix Plus 100 مل' },
  '681619810176': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.2', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم', nameAr: 'ذا بالم - طقم أرواج ميني الإصدار الثاني' },
  '3403800009056': { brandEn: 'Nora Bo Awadh', nameEn: 'Nora Bo Awadh Magic Lashes Set', kind: 'makeup', makeupSub: 'eyes', brandAr: 'نورة بوعوض', nameAr: 'نورة بوعوض - طقم رموش Magic Lashes' },
  '3380810334357': { brandEn: 'Clarins', nameEn: 'Clarins Plant Gold Revitalizing Emulsion 35ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream', brandAr: 'كلarins', nameAr: 'كلarins - مستحلب Plant Gold 35 مل' },
  '8717774840870': { brandEn: 'Orto Parisi', nameEn: 'Orto Parisi Megamare Parfum 50ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '609332833203': { brandEn: 'e.l.f.', nameEn: 'e.l.f. Contour Palette', kind: 'makeup', makeupSub: 'face', brandAr: 'elf', nameAr: 'elf - باليت كونتور' },
  '887167095885': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Super Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '4250035271180': { brandEn: 'Essence', nameEn: 'Essence Lash & Brow Gel Mascara', kind: 'makeup', makeupSub: 'eyes' },
  '3439600021813': { brandEn: 'Thierry Mugler', nameEn: 'Thierry Mugler Alien Hair Mist 30ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'تيery mugler', nameAr: 'تيery mugler - Alien معطر شعر 30 مل' },
  '088300193530': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Euphoria Intense Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '893689001266': { brandEn: 'RevitaLash', nameEn: 'RevitaLash Advanced Eyebrow Conditioner', kind: 'care', careLeaf: 'care/face-care/eye-care', typeKey: 'serum', brandAr: 'ريvitalash', nameAr: 'ريvitalash - سيروم حواجب Advanced' },
  '7640163970012': { brandEn: 'Bentley', nameEn: 'Bentley For Men Infinite Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3607342221208': { brandEn: 'Marc Jacobs', nameEn: 'Marc Jacobs Daisy Eau So Fresh Eau de Toilette 125ml', kind: 'perfume', subs: { gender: 'women' } },
  '3439600056914': { brandEn: 'Thierry Mugler', nameEn: 'Thierry Mugler Alien Eau de Parfum 30ml', kind: 'perfume', subs: { gender: 'women' } },
  '5060486000005': { brandEn: 'Ameera London', nameEn: 'Ameera London Liquid Gold Argan Oil 30ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', brandAr: 'اميرة لندن', nameAr: 'اميرة لندن - زيت الأرgan النقي 30 مل' },
  '816457022614': { brandEn: 'Oz Naturals', nameEn: 'Oz Naturals Hyaluronic Acid Serum 30ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum', brandAr: 'أوز ناتشورال', nameAr: 'أوز ناتشورال - سيروم hyaluronic 30 مل' },
  '020714001940': { brandEn: 'Clinique', nameEn: 'Clinique Aromatics Elixir Eau de Parfum 45ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'كlinique', nameAr: 'كlinique - Aromatics Elixir 45 مل' },
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

writeFileSync(new URL('../data/sarah-pos-batch12-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

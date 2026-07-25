#!/usr/bin/env node
/** Fix batch-10 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch10-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '8809668022933': { brandEn: 'Etude House', nameEn: 'Etude House Dear Darling Water Gel Tint 01 Strawberry', kind: 'makeup', makeupSub: 'lips' },
  '5907587149779': { brandEn: 'Inglot', nameEn: 'Inglot AMC Eyeliner Gel 77', kind: 'makeup', makeupSub: 'eyes' },
  '083078010188': { brandEn: 'Carmex', nameEn: 'Carmex Classic Lip Balm Strawberry', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream' },
  '8691190121440': { brandEn: 'Golden Rose', nameEn: 'Golden Rose Makeup Fixing Spray 120ml', kind: 'makeup', makeupSub: 'face' },
  '8018365070462': { brandEn: 'Versace', nameEn: 'Versace Crystal Noir Eau de Parfum 90ml', kind: 'perfume', subs: { gender: 'women' } },
  '3607342333444': { brandEn: 'Rimmel London', nameEn: 'Rimmel London Scandal Eyes Mascara Orange', kind: 'makeup', makeupSub: 'eyes' },
  '079625017861': { brandEn: 'Real Techniques', nameEn: 'Real Techniques Everyday Essentials Brush Set 5pcs', kind: 'makeup', makeupSub: 'face' },
  '085805390600': { brandEn: 'Elizabeth Arden', nameEn: 'Elizabeth Arden 5th Avenue Eau de Parfum 125ml', kind: 'perfume', subs: { gender: 'women' } },
  '7618900931091': { brandEn: 'Mavala', nameEn: 'Mavala Double-Lash Serum 10ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum' },
  '305210287303': { brandEn: 'Vaseline', nameEn: 'Vaseline Cocoa Butter Body Oil 200ml', kind: 'care', careLeaf: 'care/skin-and-body-care/body-lotion', typeKey: 'body-lotion' },
  '6291107573458': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Empowered Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes' },
  '020714222857': { brandEn: 'Clinique', nameEn: 'Clinique Dramatically Different Moisturizing Gel 125ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream' },
  '693102800076': { brandEn: 'Ofra', nameEn: 'Ofra Glow Up Highlighter Palette', kind: 'makeup', makeupSub: 'face' },
  '608940582206': { brandEn: 'Billie Eilish', nameEn: 'Billie Eilish Eilish Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'بيلي ايليش', nameAr: 'بيلي ايليش - ايليش أو دو برفيوم 100 مل' },
  '8809668022940': { brandEn: 'Etude House', nameEn: 'Etude House Dear Darling Water Gel Tint 02 Cherry', kind: 'makeup', makeupSub: 'lips' },
  '073930681106': { brandEn: 'DUO', nameEn: 'DUO Dark Tone Eyelash Adhesive 7g', kind: 'makeup', makeupSub: 'eyes' },
  '033200197249': { brandEn: 'Arm & Hammer', nameEn: 'Arm & Hammer Essentials Fresh Deodorant 73g', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant' },
  '085715801067': { brandEn: 'Dunhill', nameEn: 'Dunhill Desire Red Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '7640233340066': { brandEn: 'Elie Saab', nameEn: 'Elie Saab Le Parfum Essentiel Eau de Parfum 90ml', kind: 'perfume', subs: { gender: 'women' } },
  '4809013300017': { brandEn: 'Kojie San', nameEn: 'Kojie San Kojic Acid Whitening Soap', kind: 'care', careLeaf: 'care/face-care/cleansers--toners', typeKey: 'cleanser' },
  '020714598907': { brandEn: 'Clinique', nameEn: 'Clinique Dramatically Different Moisturizing Lotion 125ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream' },
  '083078113148': { brandEn: 'Carmex', nameEn: 'Carmex Classic Medicated Lip Balm 10g', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream' },
  '7618900995093': { brandEn: 'Mavala', nameEn: 'Mavala Scientifique Nail Hardener 5ml', kind: 'care', careLeaf: 'care/nails-care/nail-treatment', typeKey: 'nail-treatment' },
  '681619815102': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Nude', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم' },
  '3607342401860': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein CK One Shock For Her Eau de Toilette 200ml', kind: 'perfume', subs: { gender: 'women' } },
  '681619815034': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.7', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم' },
  '3414202000572': { brandEn: 'Davidoff', nameEn: 'Davidoff Cool Water Man Eau de Toilette 125ml', kind: 'perfume', subs: { gender: 'men' } },
  '7640233340257': { brandEn: 'Elie Saab', nameEn: 'Elie Saab Girl of Now Shine Eau de Parfum 90ml', kind: 'perfume', subs: { gender: 'women' } },
  '088300162505': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Euphoria Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '5907587120211': { brandEn: 'Inglot', nameEn: 'Inglot Kohl Pencil 01 Black', kind: 'makeup', makeupSub: 'eyes' },
  '8011003823536': { brandEn: 'Versace', nameEn: 'Versace Eros Pour Femme Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '681619814556': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.6', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم' },
  '8018365140103': { brandEn: 'Versace', nameEn: "Versace L'Homme Eau de Toilette 100ml", kind: 'perfume', subs: { gender: 'men' }, brandAr: 'فرزاتشي', nameAr: "فرزاتشي - لاهوم أو دو تواليت 100 مل" },
  '8809685797173': { brandEn: 'Laneige', nameEn: 'Laneige Lip Sleeping Mask Berry 20g', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'face-mask', brandAr: 'لانيج' },
  '3607344163773': { brandEn: 'Davidoff', nameEn: 'Davidoff Hot Water Eau de Toilette 110ml', kind: 'perfume', subs: { gender: 'men' } },
  '3614228412537': { brandEn: 'Bourjois', nameEn: 'Bourjois Twist Up The Volume Mascara Extreme', kind: 'makeup', makeupSub: 'eyes' },
  '022548199046': { brandEn: 'Aramis', nameEn: 'Aramis Devin Eau de Cologne 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '8057971180493': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana The One Gold Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '800897828837': { brandEn: 'NYX', nameEn: 'NYX Angel Veil Skin Perfecting Primer 30ml', kind: 'makeup', makeupSub: 'face' },
  '817513019876': { brandEn: 'Cantu', nameEn: 'Cantu Avocado Hydrating Shampoo 400ml', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo' },
  '085715806192': { brandEn: 'Dunhill', nameEn: 'Dunhill Icon Absolute Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '693102350113': { brandEn: 'Ofra', nameEn: 'Ofra All Of The Lights Highlighter Palette', kind: 'makeup', makeupSub: 'face' },
  '817513010132': { brandEn: 'Cantu', nameEn: 'Cantu Shea Butter Leave-In Conditioning Cream 340g', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment' },
  '681619810800': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.3 6pcs', kind: 'makeup', makeupSub: 'lips', brandAr: 'ذا بالم' },
  '6291106036442': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Naughty Nude Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes' },
  '800897813710': { brandEn: 'NYX', nameEn: 'NYX Matte Finish Setting Spray 60ml', kind: 'makeup', makeupSub: 'face' },
  '3607340213267': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Beauty Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '088300178278': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Euphoria Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '022548006719': { brandEn: 'Aramis', nameEn: 'Aramis Classic Eau de Toilette 110ml', kind: 'perfume', subs: { gender: 'men' } },
  '737052130729': { brandEn: 'Hugo Boss', nameEn: 'Hugo Boss Hugo XX Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' }, brandAr: 'هugo بوس', nameAr: 'هugo بوس - XX أو دو تواليت 100 مل' },
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

writeFileSync(new URL('../data/sarah-pos-batch10-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);

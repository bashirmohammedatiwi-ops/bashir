// خطة عالم «طقوس العناية» الجديدة — مصدر واحد للمعاينة والنشر.
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const BRAND = {
  evoluderm: '413cdae6-b64e-4aea-99f1-c83a80635c06',
};
const SUB = { face: '07661898-571a-4a88-aa6c-76dcdbf53029', hair: '150a633e-80a7-4cb3-8f2d-8eab90a99190', body: '23aaaa07-91ee-4937-847e-d7866a9e937a' };
const TER = { bodyWash: '35be991e-3062-4fbd-8f0a-2393bf806524', faceWash: '05028a17-da64-4c66-b25f-73c758acc2f8', bodyOil: 'a898f04c-03d4-4ab6-baa7-bb64cf0d2e3e' };
const q = (o) => Object.entries(o).map(([k, v]) => `${k}=${k === 'title' ? encodeURIComponent(v) : v}`).join('&');
const evoQ = (extra, title) => q({ brandId: BRAND.evoluderm, ...extra, title });

// منتجات إيفولوديرم: المختارة أولاً ثم تنويع حسب الفئة (متوفر، فعّال، له صورة)
function evoProducts(n = 14) {
  const picked = JSON.parse(fs.readFileSync(path.join(HERE, 'picked.json'), 'utf8')).evo.hero.map((p) => p.id);
  const all = JSON.parse(fs.readFileSync(path.join(HERE, 'evo.json'), 'utf8')).filter((p) => p.active && p.stock > 0 && p.img);
  const out = picked.filter((id) => all.some((p) => p.id === id));
  const byCat = {};
  for (const p of all.sort((a, b) => b.stock - a.stock)) (byCat[p.cat] ||= []).push(p.id);
  const cats = Object.keys(byCat);
  for (let r = 0; out.length < n && r < 10; r++) for (const c of cats) { const id = byCat[c][r]; if (id && !out.includes(id) && out.length < n) out.push(id); }
  return out;
}

// أقوى عروض الجمعة السوداء: أعلى نسب كل براند
function bfTop() {
  const c = JSON.parse(fs.readFileSync(path.join(HERE, 'bf-created.json'), 'utf8')).lists;
  const take = [['lierac_50', 4], ['bioderma_50', 3], ['phyto_50', 2], ['beesline_50', 4], ['revox_40', 3], ['dermolab_40', 3], ['lierac_25', 1]];
  const out = [];
  for (const [k, n] of take) for (const id of (c[k] || []).slice(0, n)) if (!out.includes(id)) out.push(id);
  return out;
}

const TILES = [
  ['t_face', 'subcategory', SUB.face],
  ['t_hair', 'subcategory', SUB.hair],
  ['t_body', 'subcategory', SUB.body],
  ['t_sun', 'subcategory', '25dc8086-bffa-47af-aaf7-64d503e58a9f'],
  ['t_korean', 'subcategory', '7d2bfaec-d963-404b-b9b5-04b64a82bf29'],
  ['t_derma', 'subcategory', '09146169-f9c4-4649-a365-ca1b8cda365f'],
];
const EVO_CARDS = [
  ['e_face', 'products', evoQ({ subcategoryId: SUB.face }, 'إيفولوديرم — العناية بالوجه')],
  ['e_cleanse', 'products', evoQ({ tertiaryCategoryId: TER.faceWash }, 'إيفولوديرم — غسولات الوجه')],
  ['e_hair', 'products', evoQ({ subcategoryId: SUB.hair }, 'إيفولوديرم — العناية بالشعر')],
  ['e_shower', 'products', evoQ({ tertiaryCategoryId: TER.bodyWash }, 'إيفولوديرم — جل الاستحمام')],
  ['e_body', 'products', evoQ({ subcategoryId: SUB.body }, 'إيفولوديرم — العناية بالجسم')],
  ['e_oils', 'products', evoQ({ tertiaryCategoryId: TER.bodyOil }, 'إيفولوديرم — زيوت الجسم')],
];
// بطاقات البراندات بالترتيب (slug)
const BRAND_CARDS = [
  ['b_cerave', 'cerave'], ['b_lrp', 'la-roche-posay'], ['b_bioderma', 'bioderma'], ['b_avene', 'avene'], ['b_eucerin', 'eucerin'],
  ['b_lierac', 'lierac'], ['b_ordinary', 'the-ordinary'], ['b_anua', 'anua'], ['b_beesline', 'beesline'], ['b_kerastase', 'kerastase'], ['b_lpro', 'loreal-professionnel'],
];
// البنرات العلوية الدائمة (تبدأ بعد الجمعة السوداء)
const EVERGREEN = [
  ['h_cerave', 'سيرافي — روتين التجديد الليلي', 'cerave'],
  ['h_lrp', 'لاروش بوزيه — للبشرة الحساسة', 'la-roche-posay'],
  ['h_eucerin', 'يوسيرين — هيالورون فيلر', 'eucerin'],
  ['h_avene', 'أفين — سيكالفات+', 'avene'],
  ['h_ordinary', 'ذا أورديناري — العلم ببساطة', 'the-ordinary'],
  ['h_anua', 'أنوا — العناية الكورية', 'anua'],
  ['h_kerastase', 'كيراستاس — جينيسيس', 'kerastase'],
];
const EVO_LINK = evoQ({}, 'إيفولوديرم الفرنسية');

module.exports = { BRAND, SUB, TER, evoProducts, bfTop, TILES, EVO_CARDS, BRAND_CARDS, EVERGREEN, EVO_LINK };

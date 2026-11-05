// designs2.json = designs.json بمقاسات أكبر + صور حملات للبنرات العريضة.
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(__dirname + '/designs.json', 'utf8'));
const PHOTO = {
  f_wide: ['eucerin/eucerin_model_cream_on_cheek_warm_landscape.jpg', '62% 35%'],
  h_wide: ['loreal-professionnel/curly-hair-model-portrait.jpg', '50% 30%'],
  b_wide: ['avene/avene-thermal-water-shoulder-drops.jpg', '45% 40%'],
  s_wide: ['bioderma/bioderma_photoderm_sun_model_sky_portrait.jpg', '50% 55%'],
  k_wide: ['anua/peach-serum-peaches-portrait.jpg', '50% 50%'],
  d_wide: ['la-roche-posay/lrp-model-face-blue.jpg', '62% 40%'],
  x_wide: ['lierac/lierac_premium_model_black_suit_gold_rays_square.jpg', '50% 25%'],
};
const K = { wide: 1.12, square: 1.22, small: 1.18 };
for (const x of d) {
  const k = K[x.tpl];
  if (x.hs) x.hs = x.hs.map((h) => Math.round(h * k));
  if (x.maxW) x.maxW = x.maxW.map((w) => Math.round(w * k));
  else x.maxW = x.tpl === 'wide' ? [260, 280, 260] : x.tpl === 'square' ? [290, 310, 290] : [240, 240];
  if (PHOTO[x.key]) { x.photo = PHOTO[x.key][0]; x.focus = PHOTO[x.key][1]; }
  if (x.tpl === 'wide') { x.title = x.title; x.textW = 760; }
}
// نصوص أقصر للعريض مع النافذة
const set = (k, o) => Object.assign(d.find((x) => x.key === k), o);
set('f_wide', { brand: undefined, kicker: 'SKIN RITUALS', title: 'بشرة صحية<br>بروتين بسيط', sub: 'غسول • علاج • ترطيب', p: ['b_cerave:0', 'b_lrp:3', 'b_eucerin:3'], hs: [470, 500, 400], maxW: [280, 200, 340] });
set('h_wide', { brand: undefined, kicker: 'HAIR RITUALS', title: 'شعر صحي<br>بلمعة الصالون', sub: 'كيراستاس • OGX • ناشي أرغان', p: ['b_ogx:5', 'b_kerastase:1', 'b_nashi:5'], hs: [430, 520, 420] });
set('b_wide', { title: 'طقوس الاستحمام<br>بنعومة تدوم', sub: 'مقشرات وزبدة جسم مرطّبة' });
set('k_wide', { brand: undefined, kicker: 'K-BEAUTY', title: 'العناية الكورية<br>بخطوات لطيفة', sub: 'أنوا • دكتور ألثيا • ميديكيوب', p: ['b_anua:0', 'b_althea:3', 'b_medicube:2'], hs: [500, 430, 360], maxW: [240, 240, 300] });
set('x_wide', { title: 'على براندات<br>العناية', pct: 50, pctLabel: 'خصم حتى', kicker: 'BLACK FRIDAY', sub: 'في المحل وعلى التطبيق • حتى 28/11' });
fs.writeFileSync(__dirname + '/designs2.json', JSON.stringify(d, null, 1));
console.log(d.length);

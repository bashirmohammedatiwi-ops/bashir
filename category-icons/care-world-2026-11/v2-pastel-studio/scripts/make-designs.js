// يكتب designs.json لكل لوحات «طقوس العناية» (46 تصميماً).
const fs = require('fs');
const F = 'face', Hh = 'hair', B = 'body', S = 'sun', K = 'kor', M = 'derma', X = 'bf';
const d = [];
const w = (o) => d.push({ tpl: 'wide', ...o }), q = (o) => d.push({ tpl: 'square', ...o }), m = (o) => d.push({ tpl: 'small', ...o });
// الفهرس الملوّن
m({ key: 'i_face', pal: F, title: 'العناية<br>بالوجه', titleSize: 92, p: ['b_cerave:0', 'b_lrp:3'], hs: [330, 320] });
m({ key: 'i_hair', pal: Hh, title: 'العناية<br>بالشعر', titleSize: 92, p: ['b_kerastase:1', 'b_ogx:5'], hs: [330, 320] });
m({ key: 'i_body', pal: B, title: 'العناية<br>بالجسم', titleSize: 92, p: ['b_vaseline:0', 't_bodyScrub:2'], hs: [340, 250], maxW: [200, 260] });
m({ key: 'i_sun', pal: S, title: 'واقي<br>الشمس', titleSize: 92, p: ['sun_lrp:1', 'sun_isdin:2'], hs: [320, 330] });
m({ key: 'i_kor', pal: K, title: 'العناية<br>الكورية', titleSize: 92, p: ['b_anua:0', 'b_althea:3'], hs: [340, 280] });
m({ key: 'i_derma', pal: M, title: 'العناية<br>الطبية', titleSize: 92, p: ['b_qv:1', 'b_pharm:2'], hs: [330, 280] });
// الوجه
w({ key: 'f_wide', pal: F, brand: 'cerave', kicker: 'DEVELOPED WITH DERMATOLOGISTS', title: 'بشرة نظيفة<br>بلا جفاف', sub: 'غسولات سيرافي بالسيراميدات', p: ['b_cerave:0', 'b_cerave:5', 'b_cerave:4'], hs: [460, 470, 420], maxW: [300, 260, 260] });
q({ key: 'f_sq1', pal: F, brand: 'la-roche-posay', title: 'للبشرة الدهنية<br>والمعرّضة للحبوب', p: ['b_lrp:0', 'b_lrp:3', 'b_lrp:5'], hs: [430, 450, 330] });
q({ key: 'f_sq2', pal: F, brand: 'eucerin', title: 'توحيد اللون<br>وتفتيح البقع', p: ['b_eucerin:0', 'b_eucerin:3'], hs: [460, 380], maxW: [260, 330] });
m({ key: 'f_s1', pal: F, title: 'غسولات الوجه', p: ['b_bioderma:1', 'b_bioderma:3'], hs: [340, 330] });
m({ key: 'f_s2', pal: F, title: 'ترطيب الوجه', p: ['b_qv:3', 'b_althea:5'], hs: [320, 260], maxW: [220, 240] });
m({ key: 'f_s3', pal: F, title: 'ماسكات الوجه', p: ['t_mask:2', 't_mask:4'], hs: [330, 300] });
m({ key: 'f_s4', pal: F, title: 'العناية بالعين', p: ['t_eye:5', 'b_isis:5'], hs: [260, 330], maxW: [230, 200] });
// الشعر
w({ key: 'h_wide', pal: Hh, brand: 'kerastase', kicker: 'PARIS', title: 'عناية الصالونات<br>في بيتك', sub: 'شامبو وعلاجات كيراستاس', p: ['b_kerastase:1', 'b_kerastase:3', 'b_kerastase:5'], hs: [460, 480, 450] });
q({ key: 'h_sq1', pal: Hh, brand: 'NASHI ARGAN', title: 'زيت الأرغان<br>لشعر لامع', p: ['b_nashi:0', 'b_nashi:5', 'b_nashi:2'], hs: [440, 330, 450] });
q({ key: 'h_sq2', pal: Hh, brand: 'OGX', title: 'ترطيب عميق<br>بزيت الأرغان', p: ['b_ogx:2', 'b_ogx:5'], hs: [400, 450] });
m({ key: 'h_s1', pal: Hh, title: 'شامبو وبلسم', p: ['b_elvive:2', 'b_elvive:5'], hs: [350, 340] });
m({ key: 'h_s2', pal: Hh, title: 'زيوت وماسكات', p: ['b_ogx:4', 't_hairOil:3'], hs: [330, 300] });
m({ key: 'h_s3', pal: Hh, title: 'علاجات الشعر', p: ['t_hairTreat:1', 't_hairTreat:5'], hs: [340, 330] });
m({ key: 'h_s4', pal: Hh, title: 'تصفيف الشعر', p: ['t_styling:4', 't_styling:3'], hs: [230, 340], maxW: [270, 200] });
// الجسم
w({ key: 'b_wide', pal: B, kicker: 'BODY RITUALS', title: 'طقوس الاستحمام<br>بروائح الفواكه', sub: 'مقشرات وزبدة جسم ترطّب وتنعّم', p: ['t_bodyScrub:1', 't_bodyScrub:2', 't_bodyMoist:5'], hs: [380, 440, 340], maxW: [320, 340, 420] });
q({ key: 'b_sq1', pal: B, brand: 'VASELINE', title: 'ترطيب عميق<br>للبشرة الجافة', p: ['b_vaseline:0', 'b_vaseline:3', 'b_vaseline:5'], hs: [450, 300, 360], maxW: [260, 320, 260] });
q({ key: 'b_sq2', pal: B, brand: 'beesline', title: 'انتعاش يدوم<br>طوال اليوم', p: ['t_deo:0', 't_deo:2', 't_deo:4'], hs: [400, 420, 400] });
m({ key: 'b_s1', pal: B, title: 'مرطبات الجسم', p: ['t_bodyMoist:4', 'b_nivea:3'], hs: [350, 320] });
m({ key: 'b_s2', pal: B, title: 'غسول الجسم', p: ['t_bodyWash:1', 't_bodyWash:2'], hs: [350, 350] });
m({ key: 'b_s3', pal: B, title: 'مقشر الجسم', p: ['t_bodyScrub:4', 't_bodyScrub:5'], hs: [220, 230], maxW: [260, 280] });
m({ key: 'b_s4', pal: B, title: 'مزيل العرق', p: ['t_deo:1', 't_deo:3'], hs: [300, 330] });
// الشمس
w({ key: 's_wide', pal: S, kicker: 'SPF 50+', title: 'واقي الشمس<br>كل يوم وكل فصل', sub: 'حماية عالية لكل نوع بشرة', p: ['sun_lrp:1', 'sun_isdin:2', 'sun_eucerin:0'], hs: [430, 470, 440] });
m({ key: 's_s1', pal: S, brand: 'la-roche-posay', title: 'أنثيليوس', p: ['sun_lrp:0', 'sun_lrp:3'], hs: [340, 340] });
m({ key: 's_s2', pal: S, brand: 'bioderma', title: 'فوتوديرم', p: ['sun_bioderma:3', 'sun_bioderma:2'], hs: [340, 280] });
m({ key: 's_s3', pal: S, brand: 'eucerin', title: 'واقيات يوسيرين', p: ['sun_eucerin:2', 'sun_eucerin:3'], hs: [330, 280], maxW: [240, 280] });
m({ key: 's_s4', pal: S, brand: 'ISDIN', title: 'فوتوبروتيكتور', p: ['sun_isdin:1', 'sun_isdin:3'], hs: [300, 340] });
// الكورية
w({ key: 'k_wide', pal: K, brand: 'anua', kicker: 'K-BEAUTY', title: 'العناية الكورية<br>بخطوات لطيفة', sub: 'زيت تنظيف • غسول • جل منظّف', p: ['b_anua:0', 'b_anua:4', 'b_anua:1'], hs: [460, 470, 400] });
m({ key: 'k_s1', pal: K, brand: 'DR.ALTHEA', title: 'تهدئة البشرة', p: ['b_althea:5', 'b_althea:3'], hs: [260, 320], maxW: [260, 200] });
m({ key: 'k_s2', pal: K, brand: 'MEDICUBE', title: 'نضارة وكولاجين', p: ['b_medicube:2', 'b_medicube:5'], hs: [300, 280] });
m({ key: 'k_s3', pal: K, brand: 'EQQUALBERRY', title: 'تونر وسيروم', p: ['b_eqq:2', 'b_eqq:5'], hs: [310, 330] });
// الطبية
w({ key: 'd_wide', pal: M, kicker: 'DERMO-COSMETICS', title: 'العناية الطبية<br>للبشرة الحساسة', sub: 'تركيبات جلدية لطيفة وفعّالة', p: ['b_qv:1', 'b_pharm:2', 'b_isis:0'], hs: [440, 400, 450] });
m({ key: 'd_s1', pal: M, brand: 'QV', title: 'ترطيب لطيف', p: ['b_qv:2', 'b_qv:0'], hs: [300, 330] });
m({ key: 'd_s2', pal: M, brand: 'PHARMACERIS', title: 'سيرومات مركّزة', p: ['b_pharm:1', 'b_pharm:3'], hs: [320, 330] });
m({ key: 'd_s3', pal: M, brand: 'ISISPHARMA', title: 'لتوحيد اللون', p: ['b_isis:4', 'b_isis:1'], hs: [330, 340] });
m({ key: 'd_s4', pal: M, brand: 'SEBAMED', title: 'للبشرة الحساسة', p: ['b_sebamed:0', 'b_sebamed:2'], hs: [340, 340] });
// الجمعة السوداء
w({ key: 'x_wide', pal: X, kicker: 'BLACK FRIDAY', title: 'خصومات حتى 50%<br>على براندات العناية', sub: 'في المحل وعلى التطبيق • حتى 28 تشرين الثاني', p: ['bf_beesline_50:1', 'bf_lierac_50:2', 'bf_bioderma_50:3'], hs: [420, 440, 420], cta: 'تسوّقي العروض' });
q({ key: 'x_sq1', pal: X, brand: 'lierac', title: 'خصم حتى', pct: 50, p: ['bf_lierac_50:2', 'bf_lierac_50:1', 'bf_lierac_50:3'], hs: [440, 460, 340] });
q({ key: 'x_sq2', pal: X, brand: 'bioderma', title: 'خصم حتى', pct: 50, p: ['bf_bioderma_50:1', 'bf_bioderma_50:3'], hs: [440, 420] });
m({ key: 'x_s1', pal: X, brand: 'beesline', title: 'خصم حتى', pct: 50, p: ['bf_beesline_50:1', 'bf_beesline_50:2'], hs: [320, 320] });
m({ key: 'x_s2', pal: X, brand: 'PHYTO', title: 'خصم حتى', pct: 50, p: ['bf_phyto_50:0'], hs: [220], maxW: [400] });
m({ key: 'x_s3', pal: X, brand: 'REVOX', title: 'خصم', pct: 40, p: ['bf_revox_40:1', 'bf_revox_40:3'], hs: [330, 290] });
m({ key: 'x_s4', pal: X, brand: 'DERMOLAB', title: 'خصم', pct: 40, p: ['bf_dermolab_40:3', 'bf_dermolab_40:1'], hs: [320, 340] });
fs.writeFileSync(__dirname + '/designs.json', JSON.stringify(d, null, 1));
console.log(d.length);

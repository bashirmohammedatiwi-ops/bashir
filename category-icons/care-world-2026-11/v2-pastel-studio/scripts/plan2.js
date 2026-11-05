// خطة العالم v2: مجموعات ملوّنة لكل قسم (عريض + مربعان + صف صغير + منتجات) — مصدر واحد للمعاينة والنشر.
const ids = require('./ids.json');
const { B, T, S } = ids;
const CARE = '9f99dbf3-15c4-4561-8f53-1499a8743a47';
const t = (s) => encodeURIComponent(s);
const L = {
  sub: (id) => ['subcategory', id], ter: (id) => ['tertiary', id], brand: (slug) => ['brand', slug],
  q: (o, title) => ['products', Object.entries(o).map(([k, v]) => `${k}=${v}`).join('&') + `&title=${t(title)}`],
};
const promo = (brand, ar) => L.q({ brandId: brand, isPromo: 1 }, `عروض ${ar} — الجمعة السوداء`);

// لون المجموعة (أفتح من خلفية اللوحات) ولون العنوان
const G = {
  bf: { bg: '#F5F1F6', ink: '#1C1820' }, face: { bg: '#FBF2EE', ink: '#8E3B27' }, hair: { bg: '#F5F0F9', ink: '#55306B' },
  body: { bg: '#FAF4EC', ink: '#6E4527' }, sun: { bg: '#FCF6E6', ink: '#8A4F06' }, kor: { bg: '#EFF8F4', ink: '#22604A' }, derma: { bg: '#F0F5F9', ink: '#24496B' },
};

const INDEX = [['i_face', L.sub(S.face)], ['i_hair', L.sub(S.hair)], ['i_body', L.sub(S.body)], ['i_sun', L.sub(S.sun)], ['i_kor', L.sub(S.kor)], ['i_derma', L.sub(S.derma)]];

const GROUPS = [
  { key: 'bf', title: 'عروض الجمعة السوداء', sub: 'في المحل وعلى التطبيق • حتى 28 تشرين الثاني', until: '2026-11-28T20:59:59.000Z',
    wide: ['x_wide', L.q({ categoryId: CARE, isPromo: 1 }, 'عروض العناية — الجمعة السوداء')],
    sq: [['x_sq1', promo(B.lierac, 'ليراك')], ['x_sq2', promo(B.bioderma, 'بيوديرما')]],
    sm: [['x_s1', promo(B.beesline, 'بيزلين')], ['x_s2', promo(B.phyto, 'فيتو')], ['x_s3', promo(B.revox, 'ريفوكس')], ['x_s4', promo(B.dermolab, 'ديرمولاب')]],
    list: { listTitle: 'أقوى العروض', bf: true } },
  { key: 'face', title: 'العناية بالوجه', sub: 'غسول، ترطيب، ماسكات وعناية العين',
    wide: ['f_wide', L.sub(S.face)], sq: [['f_sq1', L.brand('la-roche-posay')], ['f_sq2', L.brand('eucerin')]],
    sm: [['f_s1', L.ter(T.faceWash)], ['f_s2', L.ter(T.faceMoist)], ['f_s3', L.ter(T.mask)], ['f_s4', L.ter(T.eye)]],
    list: { listTitle: 'الأكثر طلباً للوجه', subcategoryId: S.face } },
  { key: 'hair', title: 'العناية بالشعر', sub: 'شامبو، زيوت، علاجات وتصفيف',
    wide: ['h_wide', L.sub(S.hair)], sq: [['h_sq1', L.brand('nashi-argan')], ['h_sq2', L.brand('ogx')]],
    sm: [['h_s1', L.ter(T.shampoo)], ['h_s2', L.ter(T.hairOil)], ['h_s3', L.ter(T.hairTreat)], ['h_s4', L.ter(T.styling)]],
    list: { listTitle: 'الأكثر طلباً للشعر', subcategoryId: S.hair } },
  { key: 'body', title: 'العناية بالجسم', sub: 'ترطيب، استحمام، تقشير وانتعاش',
    wide: ['b_wide', L.sub(S.body)], sq: [['b_sq1', L.brand('vaseline')], ['b_sq2', L.q({ brandId: B.beesline, tertiaryCategoryId: T.deo }, 'مزيلات عرق بيزلين')]],
    sm: [['b_s1', L.ter(T.bodyMoist)], ['b_s2', L.ter(T.bodyWash)], ['b_s3', L.ter(T.bodyScrub)], ['b_s4', L.ter(T.deo)]],
    list: { listTitle: 'الأكثر طلباً للجسم', subcategoryId: S.body } },
  { key: 'sun', title: 'واقي الشمس', sub: 'حماية يومية SPF 50+',
    wide: ['s_wide', L.sub(S.sun)],
    sm: [['s_s1', L.q({ brandId: B.lrp, subcategoryId: S.sun }, 'واقيات لاروش بوزيه')], ['s_s2', L.q({ brandId: B.bioderma, subcategoryId: S.sun }, 'واقيات بيوديرما')],
      ['s_s3', L.q({ brandId: B.eucerin, subcategoryId: S.sun }, 'واقيات يوسيرين')], ['s_s4', L.q({ brandId: B.isdin, subcategoryId: S.sun }, 'واقيات ISDIN')]],
    list: { listTitle: 'واقيات الشمس', subcategoryId: S.sun } },
  { key: 'kor', title: 'العناية الكورية', sub: 'خطوات لطيفة لبشرة نضرة',
    wide: ['k_wide', L.sub(S.kor)], sm: [['k_s1', L.brand('dr-althea')], ['k_s2', L.brand('medicube')], ['k_s3', L.brand('eqqualberry')]],
    list: { listTitle: 'الأكثر طلباً من الكورية', subcategoryId: S.kor } },
  { key: 'derma', title: 'العناية الطبية', sub: 'تركيبات جلدية للبشرة الحساسة',
    wide: ['d_wide', L.sub(S.derma)], sm: [['d_s1', L.brand('qv')], ['d_s2', L.brand('PHARMACERIS')], ['d_s3', L.brand('isispharma')], ['d_s4', L.brand('sebamed')]],
    list: { listTitle: 'الأكثر طلباً طبياً', subcategoryId: S.derma } },
];
module.exports = { INDEX, GROUPS, G, CARE };

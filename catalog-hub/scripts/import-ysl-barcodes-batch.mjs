#!/usr/bin/env node
import { CATEGORIES, perfumeSubs } from '../lib/core/app-categories.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const BRAND_ID = 'b610d576-9fb9-4b21-a6a2-74e71b471474';
const CATEGORY_ID = CATEGORIES.perfumes;

const PRODUCTS = [
  {
    barcode: '3614274151701',
    nameEn: 'Yves Saint Laurent Libre Flowers & Flames Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر فلاورز آند فليمز أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: 'A bold floral-oriental flanker from the Libre collection, blending coco palm tree flower and lily flower with the signature Libre lavender and orange blossom. Warm, radiant and sensual with excellent longevity for evening wear.',
    descriptionAr: 'إصدار زهري شرقي جريء من مجموعة ليبر، يمزج زهرة نخيل جوز الهند وزهرة الزنبق مع اللافندر وزهر البرتقال المميزين في ليبر. دافئ ومشرق وحسي بثبات ممتاز للمساء.',
  },
  {
    barcode: '3614272648425',
    nameEn: 'Yves Saint Laurent Libre Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: 'The iconic feminine Libre Eau de Parfum with lavender from Provence, orange blossom from Morocco and warm vanilla. A modern contrast of masculinity and femininity in a couture-inspired bottle.',
    descriptionAr: 'العطر النسائي الأيقوني ليبر أو دو برفوم بلافندر بروفانس وزهر البرتقال المغربي والفانيليا الدافئة. تباين عصري بين الأنوثة والرجولة في زجاجة مستوحاة من الأزياء الراقية.',
  },
  {
    barcode: '3614273924030',
    nameEn: 'Yves Saint Laurent Libre Absolu Platine Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر أبسولو بلاتين أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: 'An ultra-concentrated Libre Absolu Platine with amplified lavender and orange blossom wrapped in creamy vanilla and white musk. Intense, luminous and long-lasting.',
    descriptionAr: 'نسخة ليبر أبسولو بلاتين فائقة التركيز بلافندر وزهر برتقال مكثفين مع فانيليا كريمية ومسك أبيض. عطر لامع مكثف يدوم طويلاً.',
  },
  {
    barcode: '3614273069557',
    nameEn: 'Yves Saint Laurent Libre Intense Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر إنتنس أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: 'A deeper, richer Libre Intense with lavender, orange blossom, orchid accord and vanilla absolute. Bold, sensual and unmistakably Libre with stronger projection.',
    descriptionAr: 'نسخة ليبر إنتنس أعمق وأغنى باللافندر وزهر البرتقال ونفحات الأوركيد والفانيليا المطلقة. جريء وحسي ولا يُخطئ تعريف ليبر بثبات أقوى.',
  },
  {
    barcode: '3614273776127',
    nameEn: 'Yves Saint Laurent Libre Le Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر لو بارفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: 'The most concentrated Libre Le Parfum with saffron, lavender, orange blossom and vanilla orchid. Luxurious, enveloping and made for statement evenings.',
    descriptionAr: 'أكثر تركيزات ليبر لو بارفوم بالزعفران واللافندر وزهر البرتقال وأوركيد الفانيليا. فاخر وغني ومصمم للأمسيات المميزة.',
  },
  {
    barcode: '3614274241006',
    nameEn: 'Yves Saint Laurent Libre L\'Eau Nue Alcohol-Free Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر لو نو بدون كحول 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: 'An alcohol-free Libre interpretation with green mandarin, bergamot and the Libre floral signature. Soft on skin, modern and ideal for sensitive users who want Libre without alcohol.',
    descriptionAr: 'تفسير ليبر خالٍ من الكحول باليوسفي الأخضر والبرغموت والتوقيع الزهري لـ ليبر. لطيف على البشرة وعصري ومثالي لمن يريدون ليبر بدون كحول.',
  },
  {
    barcode: '3614274521238',
    nameEn: 'Yves Saint Laurent Libre Berry Crush Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران ليبر بيري كراش أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: 'A fruity-floral Libre flanker with crushed berry accords over lavender and orange blossom. Playful, juicy and feminine with a vibrant modern twist.',
    descriptionAr: 'إصدار ليبر فاكهي زهري بنفحات التوت المطحون فوق اللافندر وزهر البرتقال. مرح وعصيري وأنثوي بلمسة عصرية نابضة.',
  },
  {
    barcode: '3614274114645',
    nameEn: 'Yves Saint Laurent MYSLF Le Parfum 100ml',
    nameAr: 'إيف سان لوران ماي سيلف لو بارفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: 'MYSLF Le Parfum for men with black pepper, orange blossom, patchouli, bourbon vanilla, amber and woods. Woody-oriental, refined and deeply long-lasting.',
    descriptionAr: 'ماي سيلف لو بارفوم للرجال بالفلفل الأسود وزهر البرتقال والباتشولي وفانيليا بوربون والعنبر والأخشاب. عطر خشبي شرقي راقي بثبات عميق.',
  },
  {
    barcode: '3614273852814',
    nameEn: 'Yves Saint Laurent MYSLF Eau de Parfum 100ml',
    nameAr: 'إيف سان لوران ماي سيلف أو دو برفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: 'A modern masculine MYSLF Eau de Parfum celebrating self-expression with orange blossom, patchouli and warm woods. Clean, confident and effortlessly elegant.',
    descriptionAr: 'عطر ماي سيلف الرجالي العصري يحتفي بالتعبير عن الذات بزهر البرتقال والباتشولي والأخشاب الدافئة. نظيف وواثق وأنيق بلا مجهود.',
  },
  {
    barcode: '3614274329384',
    nameEn: 'Yves Saint Laurent MYSLF L\'Absolu Parfum 100ml',
    nameAr: 'إيف سان لوران ماي سيلف لابسولو بارفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: 'MYSLF L\'Absolu Parfum intensifies the line with ginger, orange blossom and rich woods. A bolder, more sensual expression of modern masculinity.',
    descriptionAr: 'ماي سيلف لابسولو بارفوم يكثف الخط بالزنجبيل وزهر البرتقال والأخشاب الغنية. تعبير أجرأ وأكثر حسية عن الرجولة العصرية.',
  },
  {
    barcode: '3614274184785',
    nameEn: 'Yves Saint Laurent Le Vestiaire des Parfums Tuxedo Eau de Parfum 125ml',
    nameAr: 'إيف سان لوران لو فستيير دو بارفوم توكسيدو أو دو برفوم 125 مل',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNiche: true }),
    descriptionEn: 'Le Vestiaire des Parfums Tuxedo is a unisex haute parfumerie scent with sharp patchouli, black pepper and magnetic amber. Inspired by YSL\'s iconic tuxedo silhouette.',
    descriptionAr: 'توكسيدو من لو فستيير دو بارفوم عطر فاخر للجنسين بباتشولي حاد وفلفل أسود وعنبر مغناطيسي، مستوحى من بدلة التوكسيدو الأيقونية لإيف سان لوران.',
  },
  {
    barcode: '3614274184792',
    nameEn: 'Yves Saint Laurent Le Vestiaire des Parfums Babycat Raw Bourbon Eau de Parfum 125ml',
    nameAr: 'إيف سان لوران لو فستيير دو بارفوم بيبي كات رو باوربون أو دو برفوم 125 مل',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNiche: true, isNew: true }),
    isNew: true,
    descriptionEn: 'Babycat Raw Bourbon is a powerful unisex oriental woody fragrance with pink and black pepper, saffron, olibanum, vanilla, suede and cedarwood from Le Vestiaire des Parfums.',
    descriptionAr: 'بيبي كات رو باوربون عطر شرقي خشبي قوي للجنسين بالفلفل الوردي والأسود والزعفران واللبان والفانيليا والسويدي وخشب الأرز من مجموعة لو فستيير دو بارفوم.',
  },
  {
    barcode: '3614273683401',
    nameEn: 'Yves Saint Laurent Y Eau de Toilette 100ml',
    nameAr: 'إيف سان لوران واي أو دو تواليت 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: 'Y Eau de Toilette opens with fresh ginger, sage and juniper berries over crisp apple and tonka bean. A bright, versatile everyday masculine scent.',
    descriptionAr: 'واي أو دو تواليت يفتتح بالزنجبيل المنعش والميرمية وتوت العرعر مع تفاحة مقرمشة وفول التونكا. عطر رجالي يومي مشرق ومتعدد الاستخدامات.',
  },
  {
    barcode: '3614273898478',
    nameEn: 'Yves Saint Laurent Y Eau de Parfum Intense 100ml',
    nameAr: 'إيف سان لوران واي أو دو برفوم إنتنس 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: 'Y Eau de Parfum Intense amplifies the Y signature with lavender, ginger, juniper and apple on a deeper woody-amber base. Stronger, richer and longer lasting.',
    descriptionAr: 'واي أو دو برفوم إنتنس يعزز توقيع واي باللافندر والزنجبيل والعرعر والتفاح على قاعدة خشبية عنبرية أعمق. أقوى وأغنى وأطول ثباتاً.',
  },
  {
    barcode: '3614272050358',
    nameEn: 'Yves Saint Laurent Y Eau de Parfum 100ml',
    nameAr: 'إيف سان لوران واي أو دو برفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: 'The signature Y Eau de Parfum for men blends lavender, ginger, apple and woody-amber notes. Fresh yet sophisticated, perfect for day and night.',
    descriptionAr: 'العطر الرجالي واي أو دو برفوم يمزج اللافندر والزنجبيل والتفاح ونفحات خشبية عنبرية. منعش وراقٍ في آن واحد، مثالي للنهار والمساء.',
  },
  {
    barcode: '3614274266801',
    nameEn: 'Yves Saint Laurent Y Le Parfum 100ml',
    nameAr: 'إيف سان لوران واي لو بارفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: 'Y Le Parfum is the most concentrated Y fragrance with intensified lavender, ginger and deep woody-amber accords. Bold, elegant and powerfully masculine.',
    descriptionAr: 'واي لو بارفوم هو أكثر تركيزات عطر واي بلافندر وزنجبيل مكثفين ونفحات خشبية عنبرية عميقة. جريء وأنيق ورجولي بقوة.',
  },
  {
    barcode: '3365440025578',
    nameEn: 'Yves Saint Laurent Opium Pour Homme Eau de Toilette 100ml',
    nameAr: 'إيف سان لوران أوبيوم بور هوم أو دو تواليت 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: 'A classic masculine Opium Pour Homme Eau de Toilette with star anise, blackcurrant, galangal, coffee, vanilla and liquorice. Spicy, aromatic and timeless.',
    descriptionAr: 'الكلاسيكي أوبيوم بور هوم أو دو تواليت بنجمة اليانسون والكشمش الأسود والجلنغان والقهوة والفانيليا والعرقسوس. متبل وعطري وخالد عبر الزمن.',
  },
];

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || json?.message || res.statusText);
  return json?.data ?? json;
}

async function main() {
  const token = (await api('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })).accessToken;
  let ok = 0;
  for (const p of PRODUCTS) {
    const payload = {
      sku: p.barcode,
      barcode: p.barcode,
      name: p.nameAr,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      slug: slugify(p.nameEn),
      brandId: BRAND_ID,
      categoryId: CATEGORY_ID,
      subcategoryIds: [...new Set(p.subcategoryIds)],
      description: p.descriptionAr,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      ingredients: '',
      howToUse: '',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      stock: 0,
      isActive: true,
      isNew: !!p.isNew,
      imageIds: [],
    };
    try {
      const created = await api('/products', { method: 'POST', token, body: payload });
      ok += 1;
      console.log(`OK ${p.barcode} -> ${created.id}`);
    } catch (err) {
      console.error(`FAIL ${p.barcode}: ${err.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${PRODUCTS.length}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });

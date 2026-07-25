#!/usr/bin/env node
import { lookupBarcodeProductMeta } from '../lib/core/barcode-meta.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';

const BRAND_ID = process.env.BRAND_ID || '6260d08f-b87d-4d87-a4ca-fce8ee81a2b4'; // Emporio Armani
const CATEGORY_ID = process.env.CATEGORY_ID || '975e0e23-edd2-4181-ad6d-ecade6452b95'; // Perfumes
const SUB = {
  men: '8dca642a-1194-4101-b5cc-486ca1664e89',
  women: '1ba9f472-af81-4708-9304-07f3435b6b24',
  unisex: 'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a',
  niche: '92a95f2e-d855-4943-9875-b85e684f746a',
  new: '07d0e8c3-3369-47b7-bb34-d430ca4a26d4',
};

const PRODUCTS = [
  {
    barcode: '3614272225718',
    nameEn: 'Emporio Armani Stronger With You Intensely Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو إنتنسلي أو دو برفوم 100 مل',
    gender: 'men',
    extraSubs: ['niche'],
    descriptionEn: 'A deeper, more intense interpretation of Stronger With You with warm vanilla, amber and chestnut for long-lasting masculine elegance.',
    descriptionAr: 'نسخة أعمق وأكثر تركيزاً من سترونغر ويذ يو بتركيبة دافئة من الفانيليا والعنبر والكستناء لأناقة رجالية تدوم طويلاً.',
  },
  {
    barcode: '3614274184631',
    nameEn: 'Emporio Armani Stronger With You Sandalwood Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو صندل وود أو دو برفوم 100 مل',
    gender: 'unisex',
    extraSubs: ['new'],
    descriptionEn: 'An oriental woody fragrance blending sandalwood warmth with the signature Stronger With You sweetness.',
    descriptionAr: 'عطر شرقي خشبي يمزج دفء خشب الصندل مع الحلاوة المميزة لخط سترونغر ويذ يو.',
  },
  {
    barcode: '3614274219579',
    nameEn: 'Emporio Armani Stronger With You Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو بارفوم 100 مل',
    gender: 'men',
    extraSubs: ['niche', 'new'],
    descriptionEn: 'A rich parfum concentration with vanilla, leather and lavender for bold, long-lasting masculine allure.',
    descriptionAr: 'تركيز بارفوم غني بالفانيليا والجلد واللافندر لإطلالة رجالية جريئة تدوم طويلاً.',
  },
  {
    barcode: '3614273665018',
    nameEn: 'Emporio Armani Stronger With You Oud Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو عود أو دو برفوم 100 مل',
    gender: 'men',
    extraSubs: ['niche'],
    descriptionEn: 'A luxurious oud interpretation of Stronger With You with deep woody warmth and sensual sweetness.',
    descriptionAr: 'تفسير فاخر بالعود لسترونغر ويذ يو بدفء خشبي عميق وحلاوة حسية.',
  },
  {
    barcode: '3614273336383',
    nameEn: 'Emporio Armani Stronger With You Absolutely Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو أبسولوتلي بارفوم 100 مل',
    gender: 'men',
    extraSubs: ['niche', 'new'],
    descriptionEn: 'An absolutely intense parfum with rum, cedarwood and vanilla for maximum depth and longevity.',
    descriptionAr: 'بارفوم مكثف للغاية بروم وأخشاب الأرز والفانيليا لعمق وثبات استثنائيين.',
  },
  {
    barcode: '3614274040067',
    nameEn: 'Emporio Armani Stronger With You Tobacco Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو توباكو أو دو برفوم 100 مل',
    gender: 'unisex',
    extraSubs: ['new'],
    descriptionEn: 'A smoky tobacco-infused fragrance that adds warm sophistication to the Stronger With You DNA.',
    descriptionAr: 'عطر بنفحات التبغ الدافئة يضيف لمسة راقية إلى روح سترونغر ويذ يو.',
  },
  {
    barcode: '3614273762120',
    nameEn: 'Emporio Armani Stronger With You Amber Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو أمبر أو دو برفوم 100 مل',
    gender: 'unisex',
    extraSubs: ['new'],
    descriptionEn: 'An amber fougere with lavender, amber accord and bourbon vanilla in a warm unisex composition.',
    descriptionAr: 'عطر أمبري فوجيري باللافندر والعنبر وفانيليا بوربون في تركيبة دافئة للجنسين.',
  },
  {
    barcode: '3614274624380',
    nameEn: 'Emporio Armani Stronger With You Spices Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو سبايسز أو دو برفوم 100 مل',
    gender: 'men',
    extraSubs: ['niche', 'new'],
    descriptionEn: 'A spicy masculine edition of Stronger With You with bold warmth and addictive sweetness.',
    descriptionAr: 'إصدار رجالي متبل من سترونغر ويذ يو بدفء جريء وحلاوة مُدمنة.',
  },
  {
    barcode: '3614274752717',
    nameEn: 'Emporio Armani Power of You Eau de Parfum 90ml',
    nameAr: 'إمبوريو أرماني باور أوف يو أو دو برفوم 90 مل',
    gender: 'women',
    extraSubs: ['niche', 'new'],
    descriptionEn: 'A vibrant feminine fragrance with passion fruit and floral brightness celebrating confident femininity.',
    descriptionAr: 'عطر نسائي نابض بحمض الباشن فروت وإشراقة زهرية يحتفي بالأنوثة الواثقة.',
  },
  {
    barcode: '3614274747058',
    nameEn: 'Emporio Armani Stronger With You Powerfully Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو باورفولي أو دو برفوم 100 مل',
    gender: 'men',
    extraSubs: ['niche', 'new'],
    descriptionEn: 'A powerful cherry-laced interpretation of Stronger With You with intense projection and warmth.',
    descriptionAr: 'تفسير قوي بنفحات الكرز لسترونغر ويذ يو بثبات عالٍ ودفء مكثف.',
  },
  {
    barcode: '3614272225671',
    nameEn: 'Giorgio Armani In Love With You Eau de Parfum 100ml',
    nameAr: 'جورجيو أرماني إن لوف ويذ يو أو دو برفوم 100 مل',
    gender: 'women',
    extraSubs: ['niche'],
    descriptionEn: 'A romantic feminine fragrance from the You collection with vibrant florals and modern elegance.',
    descriptionAr: 'عطر نسائي رومانسي من مجموعة يو بزهور نابضة وأناقة عصرية.',
  },
  {
    barcode: '3605522041486',
    nameEn: 'Emporio Armani Because It\'s You Eau de Parfum 100ml',
    nameAr: 'إمبوريو أرماني بيكوز إتس يو أو دو برفوم 100 مل',
    gender: 'women',
    extraSubs: [],
    descriptionEn: 'A sparkling feminine fragrance with rose, raspberry and vanilla for a joyful, feminine signature.',
    descriptionAr: 'عطر نسائي متألق بالورد والتوت والفانيليا لتوقيع أنثوي مبهج.',
  },
  {
    barcode: '3614273628983',
    nameEn: 'Emporio Armani Stronger With You Only Eau de Toilette 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو أونلي أو دو تواليت 100 مل',
    gender: 'men',
    extraSubs: [],
    descriptionEn: 'A fresher eau de toilette version of Stronger With You with chestnut, vanilla and soft spice.',
    descriptionAr: 'نسخة أو دو تواليت منعشة من سترونغر ويذ يو بالكستناء والفانيليا ولمسة توابل خفيفة.',
  },
  {
    barcode: '3605522040588',
    nameEn: 'Emporio Armani Stronger With You Eau de Toilette 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو أو دو تواليت 100 مل',
    gender: 'men',
    extraSubs: [],
    descriptionEn: 'The iconic masculine eau de toilette with chestnut, vanilla and warm fougere accords.',
    descriptionAr: 'العطر الرجالي الأيقوني أو دو تواليت بالكستناء والفانيليا ونفحات فوجير دافئة.',
  },
  {
    barcode: '3614272889590',
    nameEn: 'Emporio Armani Stronger With You Freeze Eau de Toilette 100ml',
    nameAr: 'إمبوريو أرماني سترونغر ويذ يو فريز أو دو تواليت 100 مل',
    gender: 'men',
    extraSubs: ['new'],
    descriptionEn: 'A fresh aromatic fougere with lime, ginger, lavender and bourbon vanilla for energetic daily wear.',
    descriptionAr: 'عطر فوجير عطري منعش بالليمون والزنجبيل واللافندر وفانيليا بوربون للاستخدام اليومي النشط.',
  },
];

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || `product-${Date.now()}`;
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return json?.data ?? json;
}

async function login() {
  const data = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!data.accessToken) throw new Error('Login failed');
  return data.accessToken;
}

function subcategoryIdsFor(product) {
  const ids = [];
  if (product.gender === 'unisex') ids.push(SUB.unisex);
  else if (product.gender) ids.push(SUB[product.gender]);
  for (const k of product.extraSubs || []) {
    if (k === 'men' || k === 'women') continue;
    if (SUB[k]) ids.push(SUB[k]);
  }
  return [...new Set(ids)];
}

async function main() {
  const token = await login();
  const results = [];

  for (const product of PRODUCTS) {
    const subcategoryIds = subcategoryIdsFor(product);
    const payload = {
      sku: product.barcode,
      barcode: product.barcode,
      name: product.nameAr,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      slug: slugify(product.nameEn),
      brandId: BRAND_ID,
      categoryId: CATEGORY_ID,
      subcategoryIds,
      description: product.descriptionAr,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      ingredients: '',
      howToUse: '',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      stock: 0,
      isActive: true,
      isNew: (product.extraSubs || []).includes('new'),
      imageIds: [],
    };

    try {
      const created = await api('/products', { method: 'POST', token, body: payload });
      results.push({ barcode: product.barcode, ok: true, id: created.id, nameEn: product.nameEn });
      console.log(`OK ${product.barcode} -> ${created.id}`);
    } catch (err) {
      results.push({ barcode: product.barcode, ok: false, error: err.message });
      console.error(`FAIL ${product.barcode}: ${err.message}`);
    }
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nDone: ${ok}/${results.length} products created`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

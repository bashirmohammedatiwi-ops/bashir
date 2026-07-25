#!/usr/bin/env node
const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';

const CAT = {
  perfumes: '975e0e23-edd2-4181-ad6d-ecade6452b95',
  makeup: 'd3c24d19-dde5-41e5-b0a9-bede45393795',
};
const SUB = {
  men: '8dca642a-1194-4101-b5cc-486ca1664e89',
  women: '1ba9f472-af81-4708-9304-07f3435b6b24',
  unisex: 'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a',
  niche: '92a95f2e-d855-4943-9875-b85e684f746a',
  new: '07d0e8c3-3369-47b7-bb34-d430ca4a26d4',
  lips: '56da5b82-c847-4e9b-9cea-cc901236189f',
};
const TER = {
  lipTint: '5c279f28-2833-42d7-9211-8f72f2c4522f',
};

// تصنيفات صحيحة حسب شجرة التطبيق — نيش فقط لـ Le Vestiaire
const FIXES = {
  // YSL Libre — نسائي
  '3614274151701': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women, SUB.new] },
  '3614272648425': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women] },
  '3614273924030': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women, SUB.new] },
  '3614273069557': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women] },
  '3614273776127': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women, SUB.new] },
  '3614274241006': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women, SUB.new] },
  '3614274521238': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women, SUB.new] },
  // YSL MYSLF + Y — رجالي
  '3614274114645': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614273852814': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614274329384': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614273683401': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3614273898478': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3614272050358': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3614274266801': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3365440025578': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  // YSL Le Vestiaire — نيش + يونيسكس
  '3614274184785': { categoryId: CAT.perfumes, subcategoryIds: [SUB.niche, SUB.unisex] },
  '3614274184792': { categoryId: CAT.perfumes, subcategoryIds: [SUB.niche, SUB.unisex, SUB.new] },
  // YSL نسائي آخر
  '3614272225671': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women] },
  '3605522041486': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women] },
  // Emporio Armani — رجالي
  '3614272225718': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3614274219579': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614273665018': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3614273336383': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614274624380': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614274747058': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  '3614273628983': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3605522040588': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men] },
  '3614272889590': { categoryId: CAT.perfumes, subcategoryIds: [SUB.men, SUB.new] },
  // Emporio Armani — يونيسكس
  '3614274184631': { categoryId: CAT.perfumes, subcategoryIds: [SUB.unisex, SUB.new] },
  '3614274040067': { categoryId: CAT.perfumes, subcategoryIds: [SUB.unisex, SUB.new] },
  '3614273762120': { categoryId: CAT.perfumes, subcategoryIds: [SUB.unisex, SUB.new] },
  // Emporio Armani — نسائي
  '3614274752717': { categoryId: CAT.perfumes, subcategoryIds: [SUB.women, SUB.new] },
};

const PRODUCT_IDS = {
  '972672c9-d6cc-4be7-ad07-d579057a429d': {
    categoryId: CAT.makeup,
    subcategoryIds: [SUB.lips],
    tertiaryCategoryIds: [TER.lipTint],
  },
};

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

  const barcodeToId = new Map();
  for (let page = 1; page <= 30; page++) {
    const j = await api(`/products?limit=100&page=${page}`, { token });
    const items = Array.isArray(j) ? j : (j.items || []);
    if (!items.length) break;
    for (const p of items) {
      if (FIXES[p.barcode]) barcodeToId.set(p.barcode, p.id);
    }
  }

  let ok = 0;
  for (const [barcode, fix] of Object.entries(FIXES)) {
    const id = barcodeToId.get(barcode);
    if (!id) { console.error('MISSING', barcode); continue; }
    try {
      await api(`/products/${id}`, { method: 'PATCH', token, body: { ...fix, tertiaryCategoryIds: [] } });
      ok += 1;
      console.log('OK', barcode);
    } catch (err) {
      console.error('FAIL', barcode, err.message);
    }
  }

  for (const [id, fix] of Object.entries(PRODUCT_IDS)) {
    try {
      await api(`/products/${id}`, { method: 'PATCH', token, body: fix });
      ok += 1;
      console.log('OK product', id);
    } catch (err) {
      console.error('FAIL product', id, err.message);
    }
  }

  console.log(`\nFixed ${ok} products`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });

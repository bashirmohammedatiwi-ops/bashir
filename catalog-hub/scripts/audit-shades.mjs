#!/usr/bin/env node
/**
 * اختبار تدرجات الألوان لكل متجر:
 * بحث عن منتج مكياج بدرجات → جلب التفاصيل → قياس السرعة وتغطية (اسم/لون/باركود) لكل درجة.
 * Usage: node scripts/audit-shades.mjs
 */
import { fetchStoreProduct } from '../lib/adapters/index.js';

import { searchProducts as niceoneSearch } from '../lib/api.js';
import { searchProducts as miraayaSearch } from '../lib/miraaya-api.js';
import { searchProducts as facesSearch } from '../lib/faces-api.js';
import { searchProducts as amazonSearch } from '../lib/amazon-api.js';
import { searchProducts as miswagSearch } from '../lib/miswag-api.js';
import { searchProducts as orisdiSearch } from '../lib/orisdi-api.js';
import { searchProducts as beautywaySearch } from '../lib/beautyway-api.js';
import { searchProducts as vaneersaSearch } from '../lib/vaneersa-api.js';
import { searchProducts as najdSearch } from '../lib/najd-api.js';

const KW = ['lipstick', 'أحمر شفاه', 'foundation', 'كريم اساس', 'eyeshadow'];

const STORES = {
  niceone: niceoneSearch,
  miraaya: miraayaSearch,
  faces: facesSearch,
  amazon: amazonSearch,
  miswag: miswagSearch,
  orisdi: orisdiSearch,
  beautyway: beautywaySearch,
  vaneersa: vaneersaSearch,
  najd: najdSearch,
};

const idOf = (it) =>
  it.id || it.sku || it.asin || it.productId || it.entity_id || it.product_id || '';
const shadeCountOf = (it) =>
  it.shadeCount ?? it.optionsCount ?? (it.hasOptions ? 2 : 0) ?? 0;

for (const [store, searchFn] of Object.entries(STORES)) {
  process.stdout.write(`\n[${store}] `);
  let picked = null;
  try {
    for (const kw of KW) {
      const res = await searchFn(kw, 1, 20).catch(() => null);
      const items = res?.items || res?.products || [];
      const shaded = items.find((it) => shadeCountOf(it) > 1 && idOf(it));
      if (shaded) { picked = shaded; break; }
      if (!picked && items.length && idOf(items[0])) picked = items[0];
    }
  } catch (e) {
    console.log(`search ERR: ${e.message}`);
    continue;
  }
  if (!picked) { console.log('no products found'); continue; }

  const t = Date.now();
  let p = null;
  try {
    p = await fetchStoreProduct(store, idOf(picked), { light: false });
  } catch (e) {
    console.log(`fetch ERR: ${e.message}`);
    continue;
  }
  const ms = Date.now() - t;
  const sh = p?.shades || [];
  const withName = sh.filter((s) => s.nameAr || s.nameEn).length;
  const withColor = sh.filter((s) => s.hex || s.image || s.swatchImage).length;
  const withBc = sh.filter((s) => s.barcode).length;
  console.log(
    `${ms}ms · ${(p?.nameAr || p?.nameEn || '(no name)').slice(0, 35)} · shades=${sh.length}` +
    (sh.length ? ` name=${withName} color=${withColor} bc=${withBc}` : ''),
  );
}
console.log('\ndone');

#!/usr/bin/env node
/**
 * تحقق شامل — كل متجر: API + بحث باركود + جلب منتج
 * Usage: node scripts/verify-all-stores.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { warmupBarcodeSearch } from '../lib/barcode-engine.js';
import {
  searchNiceOneByBarcode,
  searchElryanByBarcode,
  searchMiraayaByBarcode,
  searchFacesByBarcode,
  searchAmazonByBarcode,
  searchMiswagByBarcode,
  searchOrisdiByBarcode,
  searchBeautywayByBarcode,
  searchVaneersaByBarcode,
  searchNajdByBarcode,
  STORE_META,
} from '../lib/adapters/store-barcode-search.js';
import { fetchImportProduct } from '../lib/catalog-import.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUB = process.env.CATALOG_HUB_ORIGIN || 'http://127.0.0.1:10000';

const SEARCHERS = {
  niceone: searchNiceOneByBarcode,
  elryan: searchElryanByBarcode,
  miraaya: searchMiraayaByBarcode,
  faces: searchFacesByBarcode,
  amazon: searchAmazonByBarcode,
  miswag: searchMiswagByBarcode,
  orisdi: searchOrisdiByBarcode,
  beautyway: searchBeautywayByBarcode,
  vaneersa: searchVaneersaByBarcode,
  najd: searchNajdByBarcode,
};

const API_CHECKS = {
  niceone: '/api/health',
  elryan: '/api/elryan/health',
  miraaya: '/api/miraaya/health',
  faces: '/api/faces/health',
  amazon: '/api/amazon/health',
  miswag: '/api/miswag/health',
  orisdi: '/api/orisdi/health',
  beautyway: '/api/beautyway/health',
  vaneersa: '/api/vaneersa/health',
  najd: '/api/najd/health',
};

// باركودات معروفة لكل متجر (من الفهرس أو اختبارات سابقة)
const STORE_TEST_BARCODES = {
  niceone: ['6291106035360', '3337875597180'],
  elryan: ['3337875597180', '3348901571449'],
  miraaya: ['5056446651868', '3337875597180'],
  faces: ['3474636692408', '3348901571449'],
  amazon: ['3348901571449', '3337875597180'],
  miswag: ['3337875597180', '3348901571449'],
  orisdi: ['3337875597180', '3348901571449'],
  beautyway: ['8057971188727', '3348901571449', '3337875597180'],
  vaneersa: ['3348901571449', '3337875597180'],
  najd: ['3348901571449', '3337875597180'],
};

function loadLookupSamples() {
  try {
    const lookup = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/barcode-lookup.json'), 'utf8'));
    for (const e of Object.values(lookup)) {
      const store = e.store;
      const bc = String(e.barcode || '').replace(/\D/g, '');
      if (!store || !bc) continue;
      if (!STORE_TEST_BARCODES[store]) STORE_TEST_BARCODES[store] = [];
      if (!STORE_TEST_BARCODES[store].includes(bc)) STORE_TEST_BARCODES[store].unshift(bc);
    }
  } catch { /* optional */ }
}

async function checkApi(store, baseUrl) {
  const path = API_CHECKS[store];
  if (!path) return { ok: false, error: 'no health path' };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl}${path}`, { signal: ctrl.signal });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(t);
  }
}

async function testStoreSearch(store, fn) {
  const barcodes = STORE_TEST_BARCODES[store] || [];
  for (const barcode of barcodes) {
    const t0 = Date.now();
    try {
      const hits = await Promise.race([
        fn(barcode),
        new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت مهلة البحث')), 60_000)),
      ]);
      if (hits?.length) {
        return { ok: true, barcode, ms: Date.now() - t0, hit: hits[0] };
      }
    } catch (err) {
      if (barcode === barcodes[barcodes.length - 1]) {
        return { ok: false, error: err.message, barcode };
      }
      /* جرّب الباركود التالي */
    }
  }
  return { ok: false, error: 'لا نتائج لأي باركود اختباري', barcodes };
}

async function testStoreImport(store, hit, barcode) {
  const id = hit.id || hit.sku;
  if (!id) return { ok: false, error: 'لا معرّف منتج' };
  const t0 = Date.now();
  try {
    const r = await Promise.race([
      fetchImportProduct(store, id, { hubOrigin: HUB, barcode }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت مهلة الجلب')), 90_000)),
    ]);
    const ms = Date.now() - t0;
    if (r.error) return { ok: false, error: r.error, ms };
    const p = r.product;
    if (!p?.nameAr && !p?.nameEn) return { ok: false, error: 'منتج بدون اسم', ms };
    return {
      ok: true,
      ms,
      shades: p.shades?.length || 0,
      images: p.images?.length || 0,
      name: (p.nameAr || p.nameEn || '').slice(0, 50),
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

loadLookupSamples();
warmupBarcodeSearch();

const results = [];
let failed = 0;

console.log(`\nتحقق شامل من المتاجر — ${HUB}\n${'='.repeat(60)}`);

for (const store of Object.keys(SEARCHERS)) {
  const label = STORE_META[store]?.label || store;
  process.stdout.write(`\n[${store}] ${label}\n`);

  const api = await checkApi(store, HUB);
  if (api.ok) {
    console.log(`  API        ✓ health OK`);
  } else {
    console.log(`  API        ✗ ${api.error || `status ${api.status}`}`);
    results.push({ store, api: false, search: false, import: false });
    failed += 1;
    continue;
  }

  const search = await testStoreSearch(store, SEARCHERS[store]);
  if (search.ok) {
    console.log(`  Search     ✓ ${search.ms}ms · barcode ${search.barcode} · ${(search.hit.name || '').slice(0, 40)}`);
  } else {
    console.log(`  Search     ✗ ${search.error}`);
    results.push({ store, api: true, search: false, import: false });
    failed += 1;
    continue;
  }

  const imp = await testStoreImport(store, search.hit, search.barcode);
  if (imp.ok) {
    console.log(`  Import     ✓ ${imp.ms}ms · ${imp.images} imgs · ${imp.shades} shades · ${imp.name}`);
    results.push({ store, api: true, search: true, import: true });
  } else {
    console.log(`  Import     ✗ ${imp.error}`);
    results.push({ store, api: true, search: true, import: false });
    failed += 1;
  }
}

console.log(`\n${'='.repeat(60)}`);
const ok = results.filter((r) => r.api && r.search && r.import).length;
console.log(`النتيجة: ${ok}/${Object.keys(SEARCHERS).length} متاجر تعمل بالكامل`);
if (failed) {
  console.log(`فشل: ${failed} اختبار(ات)`);
  process.exit(1);
}
console.log('ALL STORES OK');
process.exit(0);

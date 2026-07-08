#!/usr/bin/env node
/**
 * اختبار كل متجر على حدة — بحث باركود + جلب منتج + تدرجات
 * Usage: node scripts/audit-all-stores.mjs
 */
import { warmupBarcodeSearch, SEARCHERS } from '../lib/barcode-engine.js';
import { fetchImportProduct } from '../lib/catalog-import.js';

const HUB = process.argv[2] || 'http://127.0.0.1:10000';

/** باركودات معروفة لكل متجر — تُحدَّث من الفهرس */
const STORE_TEST_BARCODES = {
  niceone: ['8025272636490', '6291106035360'],
  elryan: ['3337875597180', '3348901571449'],
  miraaya: ['3337875597180', '5056446651868'],
  faces: ['3474636692408', '3145891262704'],
  amazon: ['3348901571449', '3337875597180'],
  miswag: ['3348901571449', '3337875597180'],
  orisdi: ['3348901571449', '3337875597180'],
  beautyway: ['8057971183739', '3348901571449'],
  vaneersa: ['3348901571449', '3337875597180'],
  najd: ['3348901571449', '3337875597180'],
};

warmupBarcodeSearch();

let failed = 0;
const results = [];

console.log(`\nPer-Store Audit — ${new Date().toISOString()}\n${'='.repeat(60)}`);

for (const { store, fn, timeoutMs } of SEARCHERS) {
  const barcodes = STORE_TEST_BARCODES[store] || [];
  let storeOk = false;
  let storeErr = '';
  let bestHit = null;
  let searchMs = 0;
  let importMs = 0;
  let shades = 0;
  let imgs = 0;
  let name = '';

  process.stdout.write(`\n[${store}] `);

  for (const barcode of barcodes) {
    const t0 = Date.now();
    try {
      const hits = await Promise.race([
        fn(barcode, {}),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs + 5000)),
      ]);
      searchMs = Date.now() - t0;

      if (!hits?.length) {
        process.stdout.write(`search(${barcode})=0 `);
        continue;
      }

      const hit = hits[0];
      bestHit = hit;
      const t1 = Date.now();
      const r = await fetchImportProduct(store, hit.id || hit.sku, {
        hubOrigin: HUB,
        barcode,
      });
      importMs = Date.now() - t1;

      if (r.error) {
        storeErr = r.error;
        process.stdout.write(`import-FAIL `);
        continue;
      }

      const p = r.product;
      shades = p?.shades?.length || 0;
      imgs = p?.images?.length || 0;
      name = (p?.nameAr || p?.nameEn || '').slice(0, 45);
      if (!name) {
        storeErr = 'no name';
        continue;
      }
      storeOk = true;
      break;
    } catch (err) {
      storeErr = err.message;
      process.stdout.write(`ERR(${barcode}) `);
    }
  }

  if (storeOk) {
    const shadeTag = shades > 0 ? ` · ${shades} shades` : '';
    console.log(`OK search=${searchMs}ms import=${importMs}ms · imgs=${imgs}${shadeTag} · ${name}`);
    results.push({ store, ok: true, searchMs, importMs, shades, imgs, barcode: bestHit?.barcode });
  } else {
    console.log(`FAIL — ${storeErr || 'no hits for test barcodes'}`);
    results.push({ store, ok: false, error: storeErr || 'no hits' });
    failed += 1;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log('Summary:');
for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.store}${r.ok ? ` (${r.searchMs + r.importMs}ms, shades=${r.shades})` : ` — ${r.error}`}`);
}
console.log(failed ? `\nFAILED: ${failed}/${SEARCHERS.length} stores` : `\nALL ${SEARCHERS.length} STORES OK`);
process.exit(failed ? 1 : 0);

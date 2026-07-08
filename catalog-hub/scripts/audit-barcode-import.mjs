#!/usr/bin/env node
/**
 * اختبار شامل — بحث باركود + جلب منتج + تدرجات لكل متجر
 * Usage: node scripts/audit-barcode-import.mjs [barcode]
 */
import { warmupBarcodeSearch, searchBarcodeAllStores } from '../lib/barcode-engine.js';
import { fetchImportProduct } from '../lib/catalog-import.js';

const BARCODE = process.argv[2] || '800897268985';
const HUB = process.argv[3] || 'http://127.0.0.1:10000';

warmupBarcodeSearch();

console.log(`\nBarcode Import Audit — ${BARCODE}\n${'='.repeat(55)}`);

const t0 = Date.now();
const search = await searchBarcodeAllStores(BARCODE);
console.log(`Search: ${search.results?.length || 0} hits from ${Object.keys(search.byStore || {}).filter((k) => search.byStore[k]?.length).length} stores (${Date.now() - t0}ms)\n`);

let failed = 0;

for (const hit of search.results || []) {
  const sourceId = hit.sku || hit.id;
  const label = `${hit.store} (${sourceId})`;
  process.stdout.write(`[${label}] `);
  const t1 = Date.now();
  try {
    const r = await fetchImportProduct(hit.store, sourceId, {
      hubOrigin: HUB,
      barcode: BARCODE,
    });
    const ms = Date.now() - t1;
    if (r.error) {
      console.log(`FAIL import: ${r.error}`);
      failed += 1;
      continue;
    }
    const p = r.product;
    const shades = p?.shades?.length || 0;
    const imgs = p?.images?.length || 0;
    console.log(`OK ${ms}ms · shades=${shades} · imgs=${imgs} · ${p?.nameAr?.slice(0, 40) || p?.nameEn?.slice(0, 40)}`);
    if (!p?.nameAr && !p?.nameEn) {
      console.log('  WARN: no product name');
      failed += 1;
    }
  } catch (err) {
    console.log(`ERR ${err.message}`);
    failed += 1;
  }
}

console.log(`\n${'='.repeat(55)}`);
console.log(failed ? `FAILED: ${failed} issue(s)` : 'ALL IMPORTS OK');
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
/**
 * بحث باركود لدرجة لون — كل المصادر المتاحة
 * مثال: node scripts/lookup-shade-barcode.js 24263 "N60"
 */
import { fetchProductDetail, extractBarcodeFromImage } from '../lib/api.js';
import {
  enrichShadesFromDatabase,
  enrichShadesDeep,
  lookupExternalBarcode,
  getBarcodeCacheStats,
} from '../lib/barcodes.js';

const [productId, shadeNameFilter] = process.argv.slice(2);
if (!productId) {
  console.error('الاستخدام: node scripts/lookup-shade-barcode.js PRODUCT_ID [SHADE_NAME] [--deep]');
  process.exit(1);
}

const deep = process.argv.includes('--deep');
const detail = await fetchProductDetail(productId);
const shades = (deep
  ? await enrichShadesDeep(detail)
  : await enrichShadesFromDatabase(detail)
).filter((s) =>
  !shadeNameFilter || s.name.toLowerCase().includes(shadeNameFilter.toLowerCase())
    || (s.nameEn || '').toLowerCase().includes(shadeNameFilter.toLowerCase())
);

console.log(`\n${detail.manufacturer} — ${detail.name}`);
console.log(`en: ${detail.en_name || '—'}`);
console.log(`isbn API: ${detail.isbn || '—'}\n`);
console.log('الدرجة'.padEnd(14), 'EAN'.padEnd(16), 'SKU'.padEnd(12), 'المصدر');
console.log('─'.repeat(60));

for (const shade of shades) {
  let ean = shade.ean || '';
  let source = shade.barcodeSource || 'none';

  if (!ean && deep) {
    const ext = await lookupExternalBarcode(
      detail.manufacturer,
      detail.en_name || detail.name,
      shade.name,
      shade.nameEn,
      shade.sku,
    );
    if (ext?.ean) {
      ean = ext.ean;
      source = ext.source;
    }
  }

  const imgHint = extractBarcodeFromImage(shade.image, detail.id);
  console.log(
    shade.name.padEnd(14),
    (ean || '—').padEnd(16),
    (shade.sku || '—').padEnd(12),
    source + (imgHint && !ean ? ` (صورة: ${imgHint})` : ''),
  );
}

console.log('\nكاش:', getBarcodeCacheStats());

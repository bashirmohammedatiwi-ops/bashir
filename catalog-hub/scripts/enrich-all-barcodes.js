#!/usr/bin/env node
/**
 * إثراء باركودات كل المنتجات والدرجات — الحل النهائي
 *
 * الاستخدام:
 *   node scripts/enrich-all-barcodes.js              # كل التصنيفات (بطيء)
 *   node scripts/enrich-all-barcodes.js --slug foundation
 *   node scripts/enrich-all-barcodes.js --limit 50   # أول 50 منتج بدرجات
 *   node scripts/enrich-all-barcodes.js --resume     # تخطي المنتجات المفهرسة حديثاً
 */
import {
  fetchHomeCategories,
  mapCategoryNode,
  flattenLeaves,
  fetchCategoryProducts,
  fetchProductDetail,
  extractBarcode,
  enrichShades,
} from '../lib/api.js';
import {
  enrichShadesDeep,
  enrichShadesCached,
  saveProductToIndex,
  getBarcodeCacheStats,
  loadBarcodeIndex,
} from '../lib/barcodes.js';

const args = process.argv.slice(2);
const slugFilter = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0;
const resume = args.includes('--resume');
const delayMs = Number(process.env.BARCODE_DELAY_MS) || 300;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRecent(entry, hours = 24) {
  if (!entry?.updatedAt) return false;
  return Date.now() - entry.updatedAt < hours * 60 * 60 * 1000;
}

async function main() {
  console.log('=== إثراء باركودات Nice One ===\n');

  const raw = await fetchHomeCategories('en');
  const leaves = flattenLeaves(raw.map((c) => mapCategoryNode(c)));
  const targets = slugFilter ? leaves.filter((l) => l.slug === slugFilter) : leaves;

  if (!targets.length) {
    console.error(slugFilter ? `تصنيف غير موجود: ${slugFilter}` : 'لا توجد تصنيفات');
    process.exit(1);
  }

  console.log(`تصنيفات: ${targets.length}${slugFilter ? ` (${slugFilter})` : ''}`);
  console.log(`تأخير بين المنتجات: ${delayMs}ms\n`);

  const index = loadBarcodeIndex();
  let processed = 0;
  let withShades = 0;
  let totalShades = 0;
  let totalEan = 0;
  let skipped = 0;

  for (const leaf of targets) {
    if (limit && processed >= limit) break;

    let page = 1;
    while (true) {
      if (limit && processed >= limit) break;

      const data = await fetchCategoryProducts(leaf.slug, { page, limit: 30 });
      const products = data.products || [];
      if (!products.length) break;

      for (const p of products) {
        if (limit && processed >= limit) break;

        const id = String(p.id);
        const existing = index.products?.[id];

        if (resume && existing && isRecent(existing)) {
          skipped += 1;
          continue;
        }

        await sleep(delayMs);

        try {
          const detail = await fetchProductDetail(id);

          if (detail.has_option) {
            const shades = await enrichShadesDeep(detail);
            const eanCount = shades.filter((s) => s.ean).length;
            withShades += 1;
            totalShades += shades.length;
            totalEan += eanCount;
            console.log(
              `[${processed + 1}] ${id} ${(detail.name || '').slice(0, 40)} — ${eanCount}/${shades.length} باركود`
            );
          } else {
            const ean = extractBarcode(detail);
            saveProductToIndex(id, detail, enrichShadesCached(detail));
            if (ean) totalEan += 1;
            console.log(`[${processed + 1}] ${id} ${(detail.name || '').slice(0, 40)} — ${ean || 'لا باركود'}`);
          }
          processed += 1;
        } catch (err) {
          console.warn(`  ⚠ ${id}: ${err.message}`);
        }
      }

      if (products.length < 30) break;
      page += 1;
      await sleep(delayMs);
    }
  }

  const stats = getBarcodeCacheStats();
  console.log('\n=== اكتمل ===');
  console.log(`منتجات معالجة: ${processed} (تخطي: ${skipped})`);
  console.log(`منتجات بدرجات: ${withShades}`);
  console.log(`درجات: ${totalShades} | بباركود EAN: ${totalEan}`);
  console.log(`فهرس: ${stats.indexProducts} منتج | ${stats.indexShadesWithEan}/${stats.indexShades} درجة`);
  console.log(`كاش: ${stats.cacheWithEan}/${stats.cacheEntries} إدخال`);
  console.log(`\nالملفات:\n  ${stats.indexFile}\n  ${stats.cacheFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

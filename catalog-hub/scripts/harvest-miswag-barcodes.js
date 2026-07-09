#!/usr/bin/env node
/**
 * حصاد باركودات مسواگ مسبقاً — يبني فهرساً شاملاً (data/barcode-index.json)
 * لكل منتجات ماركات الجمال (باركود الأب + كل التدرجات) عبر API v2.
 *
 * الهدف: البحث بالباركود على السيرفر يصبح فورياً (بحث O(1) في الفهرس)
 * بدل مسح v2 مباشر يتجاوز مهلة السيرفر ويُفعّل حجب 403 من مسواگ.
 *
 * لطيف مع الخادم: تزامن منخفض + مهلة بين الطلبات + تراجع تدريجي عند 403/429.
 *
 * الاستخدام:
 *   node scripts/harvest-miswag-barcodes.js                 # كل ماركات الجمال
 *   node scripts/harvest-miswag-barcodes.js "NYX" "Essence" # ماركات محددة
 *   FORCE=1 node scripts/harvest-miswag-barcodes.js         # أعد حصاد المنتجات المفهرسة أيضاً
 *   RATE_MS=250 CONCURRENCY=2 node scripts/harvest-miswag-barcodes.js
 *
 * قابل للاستئناف: يتخطى المنتجات التي سبق تسجيل باركوداتها ما لم يُضبط FORCE=1.
 */
import { typesenseMultiSearch, miswagFetch } from '../lib/stores/miswag/client.js';
import { listVariationIds } from '../lib/stores/miswag/barcode-scan.js';
import { extractBarcodeFromV2Detail, isValidEan } from '../lib/stores/miswag/v2-barcode.js';
import { BEAUTY_BRAND_SWEEP } from '../lib/core/gs1-prefixes.js';
import {
  bulkUpsertBarcodeIndex,
  loadBarcodeIndex,
  findBarcodesForProduct,
} from '../lib/core/barcode-index.js';

const FORCE = process.env.FORCE === '1' || process.env.FORCE === 'true';
const CONCURRENCY = Number(process.env.CONCURRENCY || 2);
const RATE_MS = Number(process.env.RATE_MS || 200);
const argBrands = process.argv.slice(2).filter(Boolean);
const brands = argBrands.length ? argBrands : BEAUTY_BRAND_SWEEP;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(...args) {
  console.log(...args);
}

/**
 * منظّم معدّل عالمي — طلب واحد كل RATE_MS، مع تراجع تدريجي عند 403/429.
 * كل طلبات v2 تمرّ عبره لتجنّب حجب مسواگ.
 */
const limiter = {
  queue: Promise.resolve(),
  penalty: 0,
  consecutive403: 0,
  async run(fn) {
    const task = this.queue.then(async () => {
      if (this.penalty > 0) await sleep(this.penalty);
      await sleep(RATE_MS);
      return fn();
    });
    // لا تكسر السلسلة عند فشل مهمة
    this.queue = task.then(() => {}, () => {});
    return task;
  },
  hit403() {
    this.consecutive403 += 1;
    this.penalty = Math.min(30_000, 1_000 * 2 ** Math.min(this.consecutive403, 5));
  },
  ok() {
    if (this.consecutive403 > 0) this.consecutive403 = 0;
    if (this.penalty > 0) this.penalty = Math.max(0, this.penalty - 500);
  },
};

/** جلب باركود v2 عبر المنظّم — يرمي عند 403 ليتراجع الحاصد */
async function pacedV2Barcode(id) {
  return limiter.run(async () => {
    try {
      const detail = await miswagFetch(`/content/v2/items/${encodeURIComponent(id)}`, {
        retries: 0,
        timeoutMs: 10_000,
      });
      limiter.ok();
      return extractBarcodeFromV2Detail(detail);
    } catch (err) {
      const msg = String(err?.message || '');
      if (/403|Forbidden|429/i.test(msg)) {
        limiter.hit403();
        throw new Error('throttled');
      }
      return '';
    }
  });
}

/** كل معرّفات منتجات ماركة من Typesense (مع ترقيم الصفحات) */
async function fetchBrandProductIds(brand) {
  const ids = [];
  for (let page = 1; page <= 20; page += 1) {
    const [result = {}] = await typesenseMultiSearch([{
      q: '*',
      query_by: 'title_AR',
      filter_by: `brand:=\`${String(brand).replace(/`/g, '')}\``,
      per_page: 250,
      page,
    }]).catch(() => [{}]);
    const hits = result.hits || [];
    for (const hit of hits) {
      const id = String(hit.document?.id || '').trim();
      if (id) ids.push(id);
    }
    if (hits.length < 250) break;
  }
  return [...new Set(ids)];
}

/** احصد باركود الأب + كل التدرجات لمنتج واحد وأدرجها في الفهرس */
async function harvestProduct(productId) {
  const pid = String(productId || '').trim();
  if (!pid) return { added: 0 };

  const rows = [];

  const parentBc = await pacedV2Barcode(pid);
  if (isValidEan(parentBc)) {
    rows.push({ barcode: parentBc, store: 'miswag', productId: pid, matchType: 'v2_scan' });
  }

  const variations = await listVariationIds(pid).catch(() => []);
  for (const variation of variations) {
    const bc = await pacedV2Barcode(variation.id).catch(() => '');
    if (!isValidEan(bc)) continue;
    rows.push({
      barcode: bc,
      store: 'miswag',
      productId: pid,
      shadeName: variation.name || '',
      matchType: 'v2_shade',
    });
  }

  if (rows.length) bulkUpsertBarcodeIndex(rows);
  return { added: rows.length };
}

async function runPool(items, worker, concurrency) {
  let cursor = 0;
  let done = 0;
  const total = items.length;
  const runners = Array.from({ length: Math.min(concurrency, total || 1) }, async () => {
    while (cursor < total) {
      const idx = cursor;
      cursor += 1;
      await worker(items[idx]);
      done += 1;
      if (done % 10 === 0 || done === total) {
        process.stdout.write(`\r    ${done}/${total} منتج (penalty=${limiter.penalty}ms)   `);
      }
    }
  });
  await Promise.all(runners);
  if (total) process.stdout.write('\n');
}

async function main() {
  log(`==> حصاد باركودات مسواگ — ${brands.length} ماركة (FORCE=${FORCE ? 'on' : 'off'}, concurrency=${CONCURRENCY}, rate=${RATE_MS}ms)`);
  loadBarcodeIndex({ force: true });

  let grandBarcodes = 0;
  let grandProducts = 0;

  for (const brand of brands) {
    const ids = await fetchBrandProductIds(brand);
    if (!ids.length) {
      log(`  - ${brand}: لا منتجات`);
      continue;
    }

    const pending = FORCE
      ? ids
      : ids.filter((id) => findBarcodesForProduct('miswag', id).length === 0);

    log(`  - ${brand}: ${ids.length} منتج (${pending.length} بحاجة للحصاد)`);
    if (!pending.length) continue;

    let brandBarcodes = 0;
    await runPool(pending, async (id) => {
      const { added } = await harvestProduct(id).catch(() => ({ added: 0 }));
      brandBarcodes += added;
    }, CONCURRENCY);

    grandBarcodes += brandBarcodes;
    grandProducts += pending.length;
    log(`    ✓ ${brand}: +${brandBarcodes} باركود`);
  }

  const { entries } = loadBarcodeIndex();
  log(`\n==> اكتمل: +${grandBarcodes} باركود من ${grandProducts} منتج`);
  log(`==> إجمالي الفهرس الآن: ${Object.keys(entries).length} باركود`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('فشل الحصاد:', err);
  process.exit(1);
});

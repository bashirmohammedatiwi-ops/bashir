#!/usr/bin/env node
/**
 * إزالة صورة placeholder الافتراضية (alhayaa-product-placeholder-v1) من المنتجات.
 * المنتجات التي تبقى بدون صور ستظهر بدون صورة حتى يُرفع لها صورة حقيقية.
 *
 * Usage:
 *   node scripts/remove-product-placeholders.mjs
 *   DRY_RUN=1 node scripts/remove-product-placeholders.mjs
 */
import { api, getToken } from '../lib/core/api-auth.js';

const DRY_RUN = process.env.DRY_RUN === '1';
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);

function isPlaceholderImage(img = {}) {
  if (!img) return false;
  if (img.id === 'placeholder' || img?.media?.id === 'placeholder') return true;
  if (img?.media?.hash === 'alhayaa-product-placeholder-v1') return true;
  if (img?.media?.storagePath === 'placeholder') return true;
  return false;
}

function realImageIds(product = {}) {
  return (product.images || [])
    .filter((img) => !isPlaceholderImage(img))
    .map((img) => img.media?.id || img.id)
    .filter((id) => id && id !== 'placeholder');
}

function hasPlaceholderOnly(product = {}) {
  const imgs = product.images || [];
  if (!imgs.length) return false;
  return realImageIds(product).length === 0;
}

async function fetchAllProducts() {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    out.push(...items);
  }
  return out;
}

async function runPool(items, worker, concurrency) {
  let idx = 0;
  let cleared = 0;
  async function loop() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      const p = items[i];
      try {
        if (DRY_RUN) {
          cleared += 1;
          console.log(`DRY ${p.barcode} — would clear placeholder`);
          continue;
        }
        await api(`/products/${p.id}`, { method: 'PATCH', body: { imageIds: [] } });
        cleared += 1;
        console.log(`CLEARED ${p.barcode} — removed placeholder`);
      } catch (err) {
        console.log(`FAIL ${p.barcode} — ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => loop()));
  return cleared;
}

async function main() {
  await getToken();
  const all = await fetchAllProducts();
  const targets = all.filter((p) => p.barcode && hasPlaceholderOnly(p));

  console.log(`Remove placeholders: ${targets.length} products with placeholder-only images`);
  if (DRY_RUN) console.log('DRY_RUN=1 — no changes will be made\n');

  const cleared = await runPool(targets, null, CONCURRENCY);
  console.log(`\nDone: ${cleared} products ${DRY_RUN ? 'would be ' : ''}cleared`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

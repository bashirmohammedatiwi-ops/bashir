#!/usr/bin/env node
/** Scan all Niceone care leaves for POS-backed products missing content overrides. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { extractBarcode } from '../lib/stores/niceone/client.js';
import { barcodeFromImageUrl } from '../lib/stores/niceone/barcodes.js';
import { collectCareLeaves } from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { api } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 2);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 4);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const SKIP_SHADES = process.env.SKIP_SHADES !== '0';
const OUT = path.join(__dirname, '../data/care-pos-pending.json');
const STATE_FILE = path.join(__dirname, '../data/care-pos-import-state.json');

const catsJson = JSON.parse(readFileSync(path.join(__dirname, '../data/niceone-categories.json'), 'utf8'));
const CARE_LEAVES = collectCareLeaves(catsJson);

function loadState() {
  if (!existsSync(STATE_FILE)) return { imported: {} };
  return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
}

function quickBarcode(item) {
  return extractBarcode(item?.barcode || '') || barcodeFromImageUrl(item?.thumb || '');
}

async function enrichItemBarcode(item) {
  const existing = quickBarcode(item);
  if (existing) return { ...item, barcode: existing };
  const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
  if (!detail) return item;
  let barcode = extractBarcode(detail.barcode || '');
  if (!barcode && detail.shades?.length === 1) barcode = extractBarcode(detail.shades[0]?.barcode || '');
  return {
    ...item,
    barcode: barcode || item.barcode,
    brandEn: item.brandEn || detail.brandEn,
    brandAr: item.brandAr || detail.brandAr,
    nameEn: item.nameEn || detail.nameEn,
    nameAr: item.nameAr || detail.nameAr,
    thumb: item.thumb || detail.images?.[0] || detail.thumb,
  };
}

async function runPool(items, worker, n) {
  const results = [];
  let i = 0;
  async function loop() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => loop()));
  return results;
}

async function scanLeaf(leaf, state, existing) {
  const pending = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const listing = await listCategoryProducts(leaf, { page, limit: LIST_LIMIT, arOnly: true });
    const items = listing.items || [];
    const ready = [];
    const needDetail = [];
    for (const it of items) {
      if (quickBarcode(it)) ready.push({ ...it, barcode: quickBarcode(it) });
      else needDetail.push(it);
    }
    const enriched = needDetail.length
      ? await runPool(needDetail, enrichItemBarcode, DETAIL_CONCURRENCY)
      : [];
    const all = [...ready, ...enriched].filter((it) => {
      const bc = extractBarcode(it.barcode || '');
      if (!bc) return false;
      if (existing.has(bc) || state.imported[bc]) return false;
      if (getCareOverride(bc)) return false;
      if (SKIP_SHADES && it.hasOptions && it.shadeCount > 1) return false;
      return true;
    });
    if (all.length) {
      const barcodes = all.map((it) => extractBarcode(it.barcode));
      const posMap = {};
      for (let i = 0; i < barcodes.length; i += POS_BATCH) {
        const chunk = barcodes.slice(i, i + POS_BATCH);
        const batch = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: chunk } });
        Object.assign(posMap, batch.items || {});
      }
      for (const item of all) {
        const bc = extractBarcode(item.barcode);
        const hit = posMap[bc];
        if (!hit?.pos || hit.pos.stock < MIN_STOCK) continue;
        if (hit.inApp?.id) continue;
        pending.push({
          barcode: bc,
          niceoneId: item.id,
          leaf,
          stock: hit.pos.stock,
          posName: hit.pos.name || '',
          nameEn: item.nameEn || '',
          nameAr: item.nameAr || '',
          brandEn: item.brandEn || '',
          brandAr: item.brandAr || '',
        });
      }
    }
    hasMore = listing.hasMore;
    page += 1;
  }
  return pending;
}

async function main() {
  const state = loadState();
  const existing = new Set();
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    for (const p of items) if (p.barcode) existing.add(p.barcode);
  }

  console.log(`Scanning ${CARE_LEAVES.length} leaves…`);
  const all = [];
  let idx = 0;
  async function worker() {
    while (idx < CARE_LEAVES.length) {
      const i = idx++;
      const leaf = CARE_LEAVES[i];
      const found = await scanLeaf(leaf, state, existing);
      if (found.length) console.log(`  ${leaf}: ${found.length} pending`);
      all.push(...found);
    }
  }
  await Promise.all(Array.from({ length: Math.min(LEAF_CONCURRENCY, CARE_LEAVES.length) }, () => worker()));

  const byBc = new Map();
  for (const p of all) byBc.set(p.barcode, p);
  const list = [...byBc.values()].sort((a, b) => b.stock - a.stock);
  writeFileSync(OUT, JSON.stringify({ scannedAt: Date.now(), count: list.length, items: list }, null, 2));
  console.log(`\nPending with POS stock: ${list.length} → ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

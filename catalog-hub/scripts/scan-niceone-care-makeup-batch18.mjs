#!/usr/bin/env node
/** Scan Niceone care+makeup leaves for POS stock not yet imported (batch18 supplement). */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCategoryProducts, fetchProductDetail } from '../lib/stores/niceone/products.js';
import { extractBarcode } from '../lib/stores/niceone/client.js';
import { barcodeFromImageUrl } from '../lib/stores/niceone/barcodes.js';
import { collectCareLeaves } from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/sarah-pos-candidates-care-batch18-niceone.json');
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const LIST_LIMIT = Number(process.env.LIST_LIMIT || 30);
const LEAF_CONCURRENCY = Number(process.env.LEAF_CONCURRENCY || 3);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 4);
const POS_BATCH = Number(process.env.POS_BATCH || 80);
const SKIP_SHADES = process.env.SKIP_SHADES !== '0';
const TARGET = Number(process.env.TARGET || 40);

const PERF = /parfum|perfume|eau de|edt|edp|edc|cologne|\boud\b|عطر|برفيوم|fragrance/i;

const catsJson = JSON.parse(readFileSync(path.join(__dirname, '../data/niceone-categories.json'), 'utf8'));
const CARE_LEAVES = collectCareLeaves(catsJson);

function collectMakeupLeaves(categoriesJson) {
  const leaves = [];
  const roots = categoriesJson.tree || categoriesJson.categories || categoriesJson;
  const walk = (nodes = []) => {
    for (const node of nodes) {
      if (!node.niceoneId?.startsWith('makeup')) continue;
      if (node.children?.length) walk(node.children);
      else leaves.push(node.niceoneId);
    }
  };
  walk(Array.isArray(roots) ? roots : [roots]);
  return [...new Set(leaves)];
}

const LEAVES = [...new Set([...CARE_LEAVES, ...collectMakeupLeaves(catsJson)])];

const EXCLUDE = new Set();
for (let i = 0; i <= 17; i++) {
  const n = i === 0 ? 'sarah-pos-import-state.json' : `sarah-pos-import-state-batch${i + 1}.json`;
  const p = path.join(__dirname, '../data', n);
  if (!existsSync(p)) continue;
  for (const bc of Object.keys(JSON.parse(readFileSync(p, 'utf8')).imported || {})) EXCLUDE.add(bc);
}
try {
  for (const bc of Object.keys(JSON.parse(readFileSync(path.join(__dirname, '../data/care-pos-import-state.json'), 'utf8')).imported || {})) EXCLUDE.add(bc);
} catch {}

function isPerfume(row) {
  const t = `${row.nameAr || ''} ${row.nameEn || ''} ${row.posName || ''}`;
  return PERF.test(t) && !/deodorant|body lotion|hair mist|shampoo|cream|serum|mask|cleanser|makeup|mascara|lip/i.test(t);
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

async function scanLeaf(leaf, existing) {
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
    const enriched = needDetail.length ? await runPool(needDetail, enrichItemBarcode, DETAIL_CONCURRENCY) : [];
    const all = [...ready, ...enriched].filter((it) => {
      const bc = extractBarcode(it.barcode || '');
      if (!bc || EXCLUDE.has(bc) || existing.has(bc)) return false;
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
        const row = {
          barcode: bc,
          niceoneId: item.id,
          leaf,
          sarahId: '',
          nameAr: item.nameAr || '',
          nameEn: item.nameEn || '',
          brandAr: item.brandAr || '',
          brandEn: item.brandEn || '',
          category: leaf.startsWith('makeup') ? 'makeup' : 'care',
          url: '',
          stock: hit.pos.stock,
          posName: hit.pos.name || '',
          thumb: item.thumb || '',
        };
        if (isPerfume(row)) continue;
        pending.push(row);
      }
    }
    hasMore = listing.hasMore;
    page += 1;
  }
  return pending;
}

await getToken();
const existing = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) existing.add(p.barcode);
}
console.log(`Scanning ${LEAVES.length} Niceone leaves, exclude ${EXCLUDE.size}, in-app ${existing.size}`);

const all = [];
let idx = 0;
async function worker() {
  while (idx < LEAVES.length) {
    const i = idx++;
    const leaf = LEAVES[i];
    const found = await scanLeaf(leaf, existing);
    if (found.length) console.log(`  ${leaf}: ${found.length}`);
    for (const r of found) {
      if (!EXCLUDE.has(r.barcode)) all.push(r);
    }
    if (all.length >= TARGET * 2) break;
  }
}
await Promise.all(Array.from({ length: Math.min(LEAF_CONCURRENCY, LEAVES.length) }, () => worker()));

const byBc = new Map();
for (const p of all) if (!byBc.has(p.barcode)) byBc.set(p.barcode, p);
const list = [...byBc.values()].sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(list.slice(0, TARGET), null, 2)}\n`);
console.log(`Saved ${Math.min(list.length, TARGET)} Niceone candidates -> ${OUT}`);

#!/usr/bin/env node
/** Exhaustive Sarah scan for batch-8 — all listings, min stock 1. */
import { readFileSync, writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url).pathname;
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 10);

const STATE_FILES = [
  '../data/sarah-pos-import-state.json',
  '../data/sarah-pos-import-state-batch2.json',
  '../data/sarah-pos-import-state-batch3.json',
  '../data/sarah-pos-import-state-batch4.json',
  '../data/sarah-pos-import-state-batch5.json',
  '../data/sarah-pos-import-state-batch6.json',
  '../data/sarah-pos-import-state-batch7.json',
  '../data/sarah-pos-import-state-batch8.json',
  '../data/sarah-pos-import-state-batch9.json',
];

const EXCLUDE = new Set([
  '3616306115965', '3346475561910', '3346475547280',
  ...STATE_FILES.flatMap((f) => Object.keys(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).imported || {})),
]);

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `scan10-${Date.now()}` });
const salla = createSallaProductsApi(client);

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

function parseCursor(nextUrl = '') {
  try { return new URL(String(nextUrl)).searchParams.get('cursor') || ''; } catch { return ''; }
}

async function lookupPosBatch(barcodes) {
  if (!barcodes.length) return {};
  const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes } });
  return res.items || {};
}

async function runPool(items, worker, n) {
  const out = new Array(items.length);
  let i = 0;
  async function loop() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => loop()));
  return out;
}

await getToken();
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}
console.log(`In-app: ${inApp.size}, exclude: ${EXCLUDE.size}`);

const seenIds = new Set();
const listHits = [];
let cursor = '';
for (;;) {
  const params = { per_page: 50 };
  if (cursor) params.cursor = cursor;
  const res = await client.sallaFetch('/products', { params, ttl: 0 }).catch(() => ({ data: [] }));
  const chunk = res.data || [];
  for (const hit of chunk) {
    const id = String(hit.id || '');
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    listHits.push(hit);
  }
  cursor = parseCursor(res.cursor?.next || '');
  if (!cursor || !chunk.length) break;
  if (listHits.length % 500 === 0) console.log(`Listed ${listHits.length}...`);
}
console.log(`Sarah listings: ${listHits.length}`);

const hits = [];
const checkedBc = new Set();
const pending = [];

for (let offset = 0; offset < listHits.length; offset += 50) {
  const chunk = listHits.slice(offset, offset + 50);
  const details = await runPool(chunk, async (hit) => {
    const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
    const detail = await salla.fetchProductDetail(slug).catch(() => null)
      || await salla.fetchProductDetail(hit.id).catch(() => null);
    const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
    if (bc.length < 8 || checkedBc.has(bc) || EXCLUDE.has(bc)) return null;
    checkedBc.add(bc);
    return {
      barcode: bc,
      sarahId: slugFromUrl(hit.url || detail?.productUrl || '', slug),
      nameAr: detail?.nameAr || hit.name,
      nameEn: detail?.nameEn || '',
      brandAr: detail?.brandAr || hit.brand?.name || '',
      brandEn: detail?.brandEn || hit.brand?.name || '',
      category: hit.category?.name || '',
      url: hit.url || detail?.productUrl || '',
    };
  }, DETAIL_CONCURRENCY);

  for (const row of details) {
    if (row) pending.push(row);
  }

  while (pending.length >= 50) {
    const batch = pending.splice(0, 50);
    const items = await lookupPosBatch(batch.map((r) => r.barcode));
    for (const r of batch) {
      const row = items[r.barcode];
      if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
      if (row.inApp?.id || inApp.has(r.barcode)) continue;
      hits.push({ ...r, stock: row.pos.stock, posName: row.pos.name });
    }
    hits.sort((a, b) => b.stock - a.stock);
    console.log(`offset=${offset} hits=${hits.length}`);
  }
}

if (pending.length) {
  const items = await lookupPosBatch(pending.map((r) => r.barcode));
  for (const r of pending) {
    const row = items[r.barcode];
    if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
    if (row.inApp?.id || inApp.has(r.barcode)) continue;
    hits.push({ ...r, stock: row.pos.stock, posName: row.pos.name });
  }
}

hits.sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(hits, null, 2)}\n`);
const skip = /تستر|tester|sample|كرتون|T\*|T\*L|T\*M|T\*S|T-L-/i;
const valid = hits.filter((x) => !skip.test(`${x.nameAr || ''} ${x.posName || ''}`));
console.log(`Saved ${hits.length} total, ${valid.length} valid non-tester`);

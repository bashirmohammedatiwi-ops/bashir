#!/usr/bin/env node
/** Expand batch-9 pool — relaxed tester filter (nameAr only). */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch9.json', import.meta.url).pathname;
const MIN_STOCK = 1;
const SKIP = /تستر|tester|sample|كرتون/i;

const STATE_FILES = [
  '../data/sarah-pos-import-state.json', '../data/sarah-pos-import-state-batch2.json',
  '../data/sarah-pos-import-state-batch3.json', '../data/sarah-pos-import-state-batch4.json',
  '../data/sarah-pos-import-state-batch5.json', '../data/sarah-pos-import-state-batch6.json',
  '../data/sarah-pos-import-state-batch7.json', '../data/sarah-pos-import-state-batch8.json',
];
const EXCLUDE = new Set([
  '3616306115965', '3346475561910', '3346475547280',
  ...STATE_FILES.flatMap((f) => Object.keys(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).imported || {})),
]);

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `expand9-${Date.now()}` });
const salla = createSallaProductsApi(client);

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}
function parseCursor(u = '') {
  try { return new URL(String(u)).searchParams.get('cursor') || ''; } catch { return ''; }
}

await getToken();
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}

const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const byBc = new Map(existing.map((r) => [r.barcode, r]));

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
}
console.log('Listings', listHits.length);

const pending = [];
for (let i = 0; i < listHits.length; i += 40) {
  const chunk = listHits.slice(i, i + 40);
  await Promise.all(chunk.map(async (hit) => {
    const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
    const detail = await salla.fetchProductDetail(slug).catch(() => null)
      || await salla.fetchProductDetail(hit.id).catch(() => null);
    const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
    if (bc.length < 8 || EXCLUDE.has(bc) || byBc.has(bc)) return;
    pending.push({
      barcode: bc,
      sarahId: slugFromUrl(hit.url || detail?.productUrl || '', slug),
      nameAr: detail?.nameAr || hit.name,
      nameEn: detail?.nameEn || '',
      brandAr: detail?.brandAr || hit.brand?.name || '',
      brandEn: detail?.brandEn || hit.brand?.name || '',
      category: hit.category?.name || '',
      url: hit.url || detail?.productUrl || '',
    });
  }));
  if (pending.length >= 40) {
    const batch = pending.splice(0, pending.length);
    const items = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: batch.map((r) => r.barcode) } }).then((r) => r.items || {});
    for (const r of batch) {
      const row = items[r.barcode];
      if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
      if (row.inApp?.id || inApp.has(r.barcode)) continue;
      if (SKIP.test(r.nameAr || '')) continue;
      byBc.set(r.barcode, { ...r, stock: row.pos.stock, posName: row.pos.name });
    }
    console.log('hits', byBc.size);
  }
}
if (pending.length) {
  const items = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: pending.map((r) => r.barcode) } }).then((r) => r.items || {});
  for (const r of pending) {
    const row = items[r.barcode];
    if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
    if (row.inApp?.id || inApp.has(r.barcode)) continue;
    if (SKIP.test(`${r.nameAr || ''} ${r.posName || ''}`)) continue;
    byBc.set(r.barcode, { ...r, stock: row.pos.stock, posName: row.pos.name });
  }
}

const merged = [...byBc.values()].sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Saved ${merged.length} candidates`);

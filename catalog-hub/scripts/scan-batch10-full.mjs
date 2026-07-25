#!/usr/bin/env node
/** Full Sarah scan for batch-10 with rate-limit friendly pacing. */
import { readFileSync, writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url).pathname;
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const PACE_MS = Number(process.env.PACE_MS || 350);
const INCLUDE_TESTERS = process.env.INCLUDE_TESTERS !== '0';
const TESTER = /\u062a\u0633\u062a\u0631|tester|sample|\u0643\u0631\u062a\u0648\u0646|\u0639\u064a\u0646\u0629/i;

const STATE_FILES = [];
for (let i = 1; i <= 9; i++) {
  STATE_FILES.push(i === 1 ? '../data/sarah-pos-import-state.json' : `../data/sarah-pos-import-state-batch${i}.json`);
}
const EXCLUDE = new Set([
  ...STATE_FILES.flatMap((f) => Object.keys(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).imported || {})),
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `full10-${Date.now()}` });
const salla = createSallaProductsApi(client);

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}
function parseCursor(nextUrl = '') {
  try { return new URL(String(nextUrl)).searchParams.get('cursor') || ''; } catch { return ''; }
}

await getToken();
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}
console.log(`In-app ${inApp.size}, exclude ${EXCLUDE.size}`);

const seenIds = new Set();
const listHits = [];
let cursor = '';
for (;;) {
  await sleep(PACE_MS);
  const params = { per_page: 50 };
  if (cursor) params.cursor = cursor;
  const res = await client.sallaFetch('/products', { params, ttl: 0 }).catch((e) => {
    console.warn('list', e.message?.slice(0, 40));
    return { data: [] };
  });
  for (const hit of res.data || []) {
    const id = String(hit.id || '');
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    listHits.push(hit);
  }
  cursor = parseCursor(res.cursor?.next || '');
  if (!cursor || !(res.data || []).length) break;
  if (listHits.length % 500 === 0) console.log(`Listed ${listHits.length}...`);
}
console.log(`Sarah listings ${listHits.length}`);

const hits = [];
const checkedBc = new Set();
const pending = [];

for (let offset = 0; offset < listHits.length; offset += 30) {
  const chunk = listHits.slice(offset, offset + 30);
  await Promise.all(chunk.map(async (hit) => {
    await sleep(PACE_MS);
    const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
    const detail = await salla.fetchProductDetail(slug).catch(() => null)
      || await salla.fetchProductDetail(hit.id).catch(() => null);
    const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
    if (bc.length < 8 || checkedBc.has(bc) || EXCLUDE.has(bc)) return;
    checkedBc.add(bc);
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

  while (pending.length >= 40) {
    const batch = pending.splice(0, 40);
    const items = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: batch.map((r) => r.barcode) } }).then((r) => r.items || {});
    for (const r of batch) {
      const row = items[r.barcode];
      if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
      if (row.inApp?.id || inApp.has(r.barcode)) continue;
      const isTester = TESTER.test(`${r.nameAr || ''} ${row.pos.name || ''}`);
      if (!INCLUDE_TESTERS && isTester) continue;
      hits.push({ ...r, stock: row.pos.stock, posName: row.pos.name, isTester });
    }
    hits.sort((a, b) => b.stock - a.stock);
    if (offset % 300 === 0) console.log(`offset=${offset} hits=${hits.length}`);
  }
}
if (pending.length) {
  const items = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: pending.map((r) => r.barcode) } }).then((r) => r.items || {});
  for (const r of pending) {
    const row = items[r.barcode];
    if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
    if (row.inApp?.id || inApp.has(r.barcode)) continue;
    const isTester = TESTER.test(`${r.nameAr || ''} ${row.pos.name || ''}`);
    if (!INCLUDE_TESTERS && isTester) continue;
    hits.push({ ...r, stock: row.pos.stock, posName: row.pos.name, isTester });
  }
}

hits.sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(hits, null, 2)}\n`);
const testers = hits.filter((h) => h.isTester);
console.log(`Saved ${hits.length} (${testers.length} testers, ${hits.length - testers.length} regular)`);

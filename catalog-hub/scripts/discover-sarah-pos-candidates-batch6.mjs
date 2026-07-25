#!/usr/bin/env node
/** Discover batch-6 Sarah+POS candidates (excludes batches 1-5). */
import { readFileSync, writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const MIN_STOCK = Number(process.env.MIN_STOCK || 2);
const TARGET = Number(process.env.TARGET || 90);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 8);
const OUT = new URL('../data/sarah-pos-candidates-batch6.json', import.meta.url).pathname;

const EXCLUDE = new Set([
  '3616306115965', '3346475561910', '3346475547280', // testers
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch2.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch3.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch4.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch5.json', import.meta.url), 'utf8')).imported || {}),
]);

const client = createSallaClient(process.env.SALLA_STORE || 'sarahmakeup37.com', { cachePrefix: `sarah-discover-b6-${Date.now()}` });
const salla = createSallaProductsApi(client);

function parseCursor(nextUrl = '') {
  try { return new URL(String(nextUrl)).searchParams.get('cursor') || ''; } catch { return ''; }
}

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
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

async function main() {
  await getToken();
  const inApp = new Set();
  for (let page = 1; page <= 80; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    for (const p of items) if (p.barcode) inApp.add(p.barcode);
  }
  console.log(`In-app barcodes: ${inApp.size}, exclude set: ${EXCLUDE.size}`);

  const seenIds = new Set();
  const listHits = [];
  let cursor = '';
  for (let round = 0; round < 200; round++) {
    const params = { per_page: 50 };
    if (cursor) params.cursor = cursor;
    const res = await client.sallaFetch('/products', { params, ttl: 0 }).catch(() => ({ data: [] }));
    for (const hit of res.data || []) {
      const id = String(hit.id || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      listHits.push(hit);
    }
    cursor = parseCursor(res.cursor?.next || '');
    if (!cursor || !(res.data || []).length) break;
  }

  const queries = [
    'Montale', 'Mancera', 'Niche', 'Bath and Body', 'Victoria Secret', 'Sol de Janeiro',
    'Moroccanoil', 'Olaplex', 'Kérastase', 'Redken', 'Schwarzkopf', 'Tigi', 'Wella',
    'MAC', 'Benefit', 'NARS', 'Urban Decay', 'Too Faced', 'Charlotte Tilbury', 'Fenty',
    'Solgar', 'Swiss Image', 'Filorga', 'Filorga', 'Filorga', 'Isdin', 'Avene', 'Uriage',
    'Biore', 'Simple', 'Pantene', 'Head Shoulders', 'Tresemme', 'OGX', 'Batiste',
    'Davidoff', 'Jaguar', 'Afnan', 'Lattafa', 'Rasasi', 'Ajmal', 'Swiss Arabian',
    'Tom Ford', 'Bulgari', 'Bvlgari', 'Tiffany', 'Lalique', 'Mugler', 'Thierry Mugler',
    'Narciso', 'Armani', 'Burberry', 'Chanel', 'Dior', 'Lancome', 'YSL', 'Montblanc',
    'Color Wow', 'Flormar', 'The Balm', 'Skin1004', 'Cosrx', 'Anua', 'CeraVe', 'Vichy',
    'عطر', 'كريم', 'سيروم', 'شامبو', 'بلسم', 'مكياج', 'بودرة', 'مرطب', 'واقي',
  ];
  for (const q of queries) {
    const { data = [] } = await client.sallaFetch('/products/search', { params: { query: q, per_page: 25 }, ttl: 0 }).catch(() => ({ data: [] }));
    for (const hit of data) {
      const id = String(hit.id || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      listHits.push(hit);
    }
  }

  console.log(`Sarah unique listings: ${listHits.length}`);

  const hits = [];
  const checkedBc = new Set();
  const pendingPos = [];

  async function flushPos() {
    if (pendingPos.length < 40 && hits.length < TARGET) return;
    const batch = pendingPos.splice(0, pendingPos.length);
    const items = await lookupPosBatch(batch.map((r) => r.barcode));
    for (const r of batch) {
      const row = items[r.barcode];
      if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
      if (row.inApp?.id || inApp.has(r.barcode) || EXCLUDE.has(r.barcode)) continue;
      hits.push({ ...r, stock: row.pos.stock, posName: row.pos.name });
    }
    hits.sort((a, b) => b.stock - a.stock);
    console.log(`POS matches so far: ${hits.length}`);
  }

  for (let offset = 0; offset < listHits.length && hits.length < TARGET; offset += 40) {
    const chunk = listHits.slice(offset, offset + 40);
    const details = await runPool(chunk, async (hit) => {
      const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
      const detail = await salla.fetchProductDetail(slug).catch(() => null)
        || await salla.fetchProductDetail(hit.id).catch(() => null);
      const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
      if (bc.length < 8 || checkedBc.has(bc) || EXCLUDE.has(bc)) return null;
      checkedBc.add(bc);
      const url = hit.url || detail?.productUrl || '';
      return {
        barcode: bc,
        sarahId: slugFromUrl(url, slug),
        nameAr: detail?.nameAr || hit.name,
        nameEn: detail?.nameEn || '',
        brandAr: detail?.brandAr || hit.brand?.name || '',
        brandEn: detail?.brandEn || hit.brand?.name || '',
        category: hit.category?.name || '',
        url,
      };
    }, DETAIL_CONCURRENCY);

    for (const row of details) {
      if (row) pendingPos.push(row);
    }
    await flushPos();
  }
  await flushPos();

  writeFileSync(OUT, `${JSON.stringify(hits, null, 2)}\n`);
  console.log(`Saved ${hits.length} candidates → ${OUT}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

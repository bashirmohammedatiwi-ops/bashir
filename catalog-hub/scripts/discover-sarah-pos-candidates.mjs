#!/usr/bin/env node
/** Discover Sarah products with POS stock >= MIN_STOCK not yet in app. */
import { writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const MIN_STOCK = Number(process.env.MIN_STOCK || 2);
const TARGET = Number(process.env.TARGET || 60);
const DETAIL_CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 8);
const OUT = new URL('../data/sarah-pos-candidates.json', import.meta.url).pathname;

const client = createSallaClient(process.env.SALLA_STORE || 'sarahmakeup37.com', { cachePrefix: 'sarah-discover' });
const salla = createSallaProductsApi(client);

function parseCursor(nextUrl = '') {
  try {
    return new URL(String(nextUrl)).searchParams.get('cursor') || '';
  } catch {
    return '';
  }
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
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    for (const p of items) if (p.barcode) inApp.add(p.barcode);
  }

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
    'The Ordinary', 'CeraVe', 'Cosrx', 'Anua', 'Laneige', 'Nivea', 'Garnier', 'Eucerin',
    'La Roche', 'Vichy', 'Bioderma', 'Neutrogena', 'Dove', 'Essence', 'Maybelline', 'Huda',
    'Dior', 'Chanel', 'Gucci', 'YSL', 'Armani', 'Dr.Althea', 'Medicube', 'Skin1004',
    'Embryolisse', 'Uriage', 'Avene', 'Cetaphil', 'Panoxyl', 'Beauty of Joseon', 'Missha',
    'سيروم', 'كريم', 'غسول', 'تونر', 'واقي', 'شامبو', 'عطر', 'بودرة', 'مكياج',
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
      if (row.inApp?.id || inApp.has(r.barcode)) continue;
      hits.push({ ...r, stock: row.pos.stock, posName: row.pos.name });
    }
    hits.sort((a, b) => b.stock - a.stock);
    console.log(`POS matches so far: ${hits.length}`);
  }

  for (let offset = 0; offset < listHits.length && hits.length < TARGET; offset += 40) {
    const chunk = listHits.slice(offset, offset + 40);
    const details = await runPool(chunk, async (hit) => {
      const detail = await salla.fetchProductDetail(hit.id).catch(() => null);
      const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
      if (bc.length < 8 || checkedBc.has(bc)) return null;
      checkedBc.add(bc);
      return {
        barcode: bc,
        sarahId: hit.id,
        nameAr: detail?.nameAr || hit.name,
        nameEn: detail?.nameEn || '',
        brandAr: detail?.brandAr || hit.brand?.name || '',
        brandEn: detail?.brandEn || hit.brand?.name || '',
        category: hit.category?.name || '',
        url: hit.url || detail?.productUrl || '',
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

#!/usr/bin/env node
/** Slow supplemental Sarah search to avoid 429 — append new batch6 candidates. */
import { readFileSync, writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const OUT = new URL('../data/sarah-pos-candidates-batch6.json', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXCLUDE = new Set([
  '3616306115965', '3346475561910', '3346475547280',
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch2.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch3.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch4.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch5.json', import.meta.url), 'utf8')).imported || {}),
]);

const QUERIES = [
  'Montale', 'Mancera', 'Xerjoff', 'Initio', 'Amouage', 'Byredo', 'Nishane',
  'Parfums de Marly', 'Memo Paris', 'Ex Nihilo', 'Le Labo', 'Maison Francis',
  'Bath and Body Works', 'Victoria Secret', 'Sol de Janeiro', 'Moroccanoil', 'Olaplex',
  'Kerastase', 'Redken', 'MAC', 'NARS', 'Urban Decay', 'Charlotte Tilbury', 'Fenty',
  'Solgar', 'Filorga', 'Isdin', 'Avene', 'Uriage', 'Biore', 'CeraVe', 'Neutrogena',
  'Davidoff', 'Jaguar', 'Afnan', 'Lattafa', 'Ajmal', 'Swiss Arabian', 'Armani',
  'Burberry', 'Lancome', 'Montblanc', 'Mugler', 'Narciso Rodriguez', 'Coach',
  'Escada', 'Hollister', 'Abercrombie', 'Zadig', 'Zadig & Voltaire', 'Mancera',
];

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

async function lookupPosBatch(barcodes) {
  if (!barcodes.length) return {};
  const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes } });
  return res.items || {};
}

async function main() {
  await getToken();
  const existing = JSON.parse(readFileSync(OUT, 'utf8'));
  const have = new Set(existing.map((x) => x.barcode));
  EXCLUDE.forEach((b) => have.add(b));

  const inApp = new Set();
  for (let page = 1; page <= 80; page++) {
    const items = await api(`/products?limit=100&page=${page}`);
    if (!items?.length) break;
    for (const p of items) if (p.barcode) inApp.add(p.barcode);
  }

  const client = createSallaClient(process.env.SALLA_STORE || 'sarahmakeup37.com', {
    cachePrefix: `sarah-supplement-b6-${Date.now()}`,
  });
  const salla = createSallaProductsApi(client);
  const found = [];

  console.log(`Starting supplement search (MIN_STOCK=${MIN_STOCK}), existing=${existing.length}`);
  await sleep(90000);

  for (const q of QUERIES) {
    try {
      const { data = [] } = await client.sallaFetch('/products/search', {
        params: { query: q, per_page: 20 },
        ttl: 0,
      });
      for (const hit of data.slice(0, 12)) {
        const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
        const detail = await salla.fetchProductDetail(slug).catch(() => null)
          || await salla.fetchProductDetail(hit.id).catch(() => null);
        const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
        if (bc.length < 8 || have.has(bc)) continue;
        have.add(bc);
        const url = hit.url || detail?.productUrl || '';
        found.push({
          barcode: bc,
          sarahId: slugFromUrl(url, slug),
          nameAr: detail?.nameAr || hit.name,
          nameEn: detail?.nameEn || '',
          brandAr: detail?.brandAr || hit.brand?.name || '',
          brandEn: detail?.brandEn || hit.brand?.name || '',
          category: hit.category?.name || '',
          url,
          stock: 0,
          posName: '',
        });
      }
    } catch (err) {
      console.warn(`Query "${q}" failed:`, err.message || err);
    }
    await sleep(4000);
  }

  console.log(`Sarah hits to POS-check: ${found.length}`);
  for (let i = 0; i < found.length; i += 30) {
    const batch = found.slice(i, i + 30);
    const items = await lookupPosBatch(batch.map((r) => r.barcode));
    for (const r of batch) {
      const row = items[r.barcode];
      if (!row?.pos || row.pos.stock < MIN_STOCK) continue;
      if (row.inApp?.id || inApp.has(r.barcode)) continue;
      r.stock = row.pos.stock;
      r.posName = row.pos.name;
      existing.push(r);
    }
  }

  existing.sort((a, b) => b.stock - a.stock);
  writeFileSync(OUT, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(`Saved ${existing.length} total candidates`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';

const PRODUCTS = JSON.parse(readFileSync(new URL('../data/sarah-pos-import-products-batch17.json', import.meta.url), 'utf8'));
const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `enrich17-${Date.now()}` });
const salla = createSallaProductsApi(client);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let found = 0;
for (const p of PRODUCTS) {
  if (p.sarahId && p.url) continue;
  await sleep(700);
  const hits = await salla.searchBarcode(p.barcode).catch(() => []);
  const hit = Array.isArray(hits) ? hits[0] : hits;
  if (!hit) continue;
  p.sarahId = String(hit.url || hit.productUrl || '').match(/\/ar\/([^/?#]+)/)?.[1] || hit.id || hit.slug || '';
  p.url = hit.url || hit.productUrl || '';
  if (hit.nameAr) p.nameAr = p.nameAr || hit.nameAr;
  found++;
  console.log('Sarah hit', p.barcode, p.sarahId);
}

writeFileSync(new URL('../data/sarah-pos-import-products-batch17.json', import.meta.url).pathname, `${JSON.stringify(PRODUCTS, null, 2)}\n`);
console.log(`Enriched ${found}/${PRODUCTS.length} with Sarah IDs`);

#!/usr/bin/env node
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `dbg-${Date.now()}` });
const salla = createSallaProductsApi(client);
await getToken();

const { items = [] } = await salla.searchProducts('مكياج', { page: 1, limit: 10 });
const rows = [];
for (const hit of items.slice(0, 8)) {
  await sleep(500);
  const slug = String(hit.url || '').match(/\/ar\/([^/?#]+)/)?.[1] || hit.id;
  const detail = await salla.fetchProductDetail(slug).catch(() => null);
  const bc = String(detail?.barcode || detail?.sku || hit.gtin || '').replace(/\D/g, '');
  rows.push({ slug, bc, name: detail?.nameAr || hit.nameAr, sku: detail?.sku, gtin: hit.gtin });
}
console.log('Sarah samples:', rows);

const bcs = rows.map((r) => r.bc).filter((b) => b.length >= 8);
const lookup = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: bcs } });
console.log('POS lookup:', JSON.stringify(lookup.items || lookup, null, 2));

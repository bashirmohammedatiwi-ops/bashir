#!/usr/bin/env node
/** Sarah search for batch18 care/makeup only — supplements index discovery. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-care-batch18-sarah.json', import.meta.url).pathname;
const SEED = new URL('../data/sarah-pos-candidates-care-batch18.json', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXCLUDE = new Set();
for (let i = 0; i <= 17; i++) {
  const n = i === 0 ? 'sarah-pos-import-state.json' : `sarah-pos-import-state-batch${i + 1}.json`;
  const p = new URL(`../data/${n}`, import.meta.url);
  if (!existsSync(p)) continue;
  for (const bc of Object.keys(JSON.parse(readFileSync(p, 'utf8')).imported || {})) EXCLUDE.add(bc);
}
try {
  for (const bc of Object.keys(JSON.parse(readFileSync(new URL('../data/care-pos-import-state.json', import.meta.url), 'utf8')).imported || {})) EXCLUDE.add(bc);
} catch {}

const PERF = /عطر|perfume|parfum|eau de|edt|edp|edc|cologne|\boud\b|برفيوم|fragrance|scent/i;
const QUERIES = [
  'مكياج', 'عناية', 'كريم', 'سيروم', 'شامبو', 'بلسم', 'مرطب', 'غسول', 'ماسك', 'ماسكرا',
  'باليت', 'ظلال', 'بودرة', 'برايمر', 'مزيل عرق', 'واقي شمس', 'تونر', 'غسول فم',
  'Huda Beauty', 'NYX', 'Essence', 'Maybelline', 'Loreal', 'Inglot', 'Ofra', 'Bourjois',
  'The Ordinary', 'CeraVe', 'Cantu', 'Laneige', 'Anastasia', 'Benefit', 'NARS', 'MAC',
  'Real Techniques', 'Golden Rose', 'Clinique', 'Clarins', 'Phyto', 'Kerastase', 'SVR',
  'La Roche', 'Eucerin', 'Vichy', 'Bioderma', 'Filorga', 'Cosrx', 'Anua', 'Isntree',
  'Revolution', 'Flormar', 'Kiko', 'Sephora', 'Fenty', 'Rare Beauty', 'Charlotte Tilbury',
  'mascara', 'foundation', 'concealer', 'lipstick', 'lip gloss', 'eyeliner', 'blush',
  'highlighter', 'setting spray', 'makeup remover', 'face wash', 'sunscreen', 'deodorant',
];

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}
function isPerfume(row) {
  const t = `${row.nameAr || ''} ${row.posName || ''} ${row.category || ''}`;
  return PERF.test(t) && !/معطر شعر|deodorant|مزيل|شامبو|كريم|ماسكر|باليت|setting spray|fixer|body mist|body lotion/i.test(t);
}

await getToken();
const existing = existsSync(SEED) ? JSON.parse(readFileSync(SEED, 'utf8')) : [];
const have = new Set([...EXCLUDE, ...existing.map((x) => x.barcode)]);
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}
console.log(`Seed ${existing.length}, exclude ${EXCLUDE.size}`);

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `fast18-${Date.now()}` });
const salla = createSallaProductsApi(client);
const pending = [];

for (const q of QUERIES) {
  try {
    await sleep(800);
    const { data = [] } = await client.sallaFetch('/products/search', { params: { query: q, per_page: 50 }, ttl: 0 });
    for (const hit of data) {
      const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
      const detail = await salla.fetchProductDetail(slug).catch(() => null)
        || await salla.fetchProductDetail(hit.id).catch(() => null);
      const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
      if (bc.length < 8 || have.has(bc)) continue;
      have.add(bc);
      const row = {
        barcode: bc,
        sarahId: slugFromUrl(hit.url || detail?.productUrl || '', slug),
        nameAr: detail?.nameAr || hit.name,
        nameEn: detail?.nameEn || '',
        brandAr: detail?.brandAr || hit.brand?.name || '',
        brandEn: detail?.brandEn || hit.brand?.name || '',
        category: hit.category?.name || q,
        url: hit.url || detail?.productUrl || '',
        stock: 0,
        posName: '',
      };
      if (isPerfume(row)) continue;
      pending.push(row);
    }
  } catch (e) {
    console.warn(q, String(e.message).slice(0, 50));
  }
  if (pending.length % 30 === 0 && pending.length) console.log(`query=${q} pending=${pending.length}`);
}

console.log('Sarah hits:', pending.length);
const validated = [...existing];
for (let i = 0; i < pending.length; i += 30) {
  await sleep(350);
  const batch = pending.slice(i, i + 30);
  const items = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: batch.map((r) => r.barcode) } }).then((r) => r.items || {});
  for (const r of batch) {
    const row = items[r.barcode];
    if (!row?.pos || row.pos.stock < 1) continue;
    if (row.inApp?.id || inApp.has(r.barcode)) continue;
    r.stock = row.pos.stock;
    r.posName = row.pos.name;
    validated.push(r);
  }
  console.log(`POS ${Math.min(i + 30, pending.length)}/${pending.length} -> ${validated.length}`);
}

const byBc = new Map();
for (const row of validated) if (!EXCLUDE.has(row.barcode) && !isPerfume(row)) byBc.set(row.barcode, row);
const merged = [...byBc.values()].sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`total=${merged.length}`);

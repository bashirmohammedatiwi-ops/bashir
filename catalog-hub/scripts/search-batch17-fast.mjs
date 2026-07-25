#!/usr/bin/env node
/** Fast Sarah search for batch-17 — supplements full scan when rate-limited. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch17.json', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STATE_FILES = [
  '../data/sarah-pos-import-state.json',
  ...Array.from({ length: 16 }, (_, i) => `../data/sarah-pos-import-state-batch${i + 2}.json`),
];
const EXCLUDE = new Set();
for (const f of STATE_FILES) {
  const p = new URL(f, import.meta.url);
  if (!existsSync(p)) continue;
  for (const bc of Object.keys(JSON.parse(readFileSync(p, 'utf8')).imported || {})) EXCLUDE.add(bc);
}

const QUERIES = [
  'Guerlain', 'Jean Paul Gaultier', 'Lancôme', 'Lancome', 'Carolina Herrera', 'Chanel', 'Dior',
  'Givenchy', 'YSL', 'Yves Saint Laurent', 'Cartier', 'Hermes', 'Prada', 'Gucci', 'Versace',
  'Armani', 'Burberry', 'Chloe', 'Narciso', 'Montblanc', 'Bvlgari', 'Bulgari', 'Dolce',
  'Valentino', 'Hugo Boss', 'Davidoff', 'Paco Rabanne', 'Calvin Klein', 'Elie Saab', 'Mancera',
  'Montale', 'Parfums de Marly', 'Xerjoff', 'Amouage', 'Byredo', 'Le Labo', 'Kilian', 'Creed',
  'Huda Beauty', 'Anastasia', 'NARS', 'MAC', 'Benefit', 'Essence', 'NYX', 'Maybelline',
  'Loreal', 'Clinique', 'Estee Lauder', 'The Ordinary', 'CeraVe', 'Cantu', 'Olaplex',
  'Inglot', 'Ofra', 'Golden Rose', 'Real Techniques', 'Laneige', 'Isntree', 'Roberto Cavalli',
  'Roberto', 'Jaguar', 'Azzaro', 'Ralph Lauren', 'Coach', 'Escada', 'Mugler', 'Thierry Mugler',
  'Alien', 'La Panthere', 'Chance', 'Bleu', 'Sauvage', 'Jadore', 'Miss Dior', 'Si Armani',
  'Acqua di Gio', 'Eros', 'One Million', 'Invictus', 'Good Girl', 'Black Opium', 'Libre',
  'عطر', 'تستر', 'كريم', 'سيروم', 'شامبو', 'مكياج', 'باليت', 'ماسكارا', 'مرطب', 'غسول',
];

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

await getToken();
const seed = existsSync(new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url))
  ? JSON.parse(readFileSync(new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url), 'utf8'))
  : [];
const existing = [...seed.filter((x) => !EXCLUDE.has(x.barcode))];
const have = new Set(existing.map((x) => x.barcode));
EXCLUDE.forEach((b) => have.add(b));

const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}
console.log(`Seed ${existing.length}, exclude ${EXCLUDE.size}, in-app ${inApp.size}`);

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `fast17-${Date.now()}` });
const salla = createSallaProductsApi(client);
const pending = [];

for (const q of QUERIES) {
  try {
    await sleep(700);
    const { data = [] } = await client.sallaFetch('/products/search', { params: { query: q, per_page: 50 }, ttl: 0 });
    for (const hit of data) {
      const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
      const detail = await salla.fetchProductDetail(slug).catch(() => null)
        || await salla.fetchProductDetail(hit.id).catch(() => null);
      const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
      if (bc.length < 8 || have.has(bc)) continue;
      have.add(bc);
      pending.push({
        barcode: bc,
        sarahId: slugFromUrl(hit.url || detail?.productUrl || '', slug),
        nameAr: detail?.nameAr || hit.name,
        nameEn: detail?.nameEn || '',
        brandAr: detail?.brandAr || hit.brand?.name || '',
        brandEn: detail?.brandEn || hit.brand?.name || '',
        category: hit.category?.name || '',
        url: hit.url || detail?.productUrl || '',
        stock: 0,
        posName: '',
      });
    }
  } catch (e) {
    console.warn(q, String(e.message).slice(0, 50));
  }
  if (pending.length && pending.length % 20 === 0) console.log(`query=${q} pending=${pending.length}`);
}

console.log('Sarah search hits:', pending.length);
for (let i = 0; i < pending.length; i += 30) {
  await sleep(300);
  const batch = pending.slice(i, i + 30);
  const items = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: batch.map((r) => r.barcode) } }).then((r) => r.items || {});
  for (const r of batch) {
    const row = items[r.barcode];
    if (!row?.pos || row.pos.stock < 1) continue;
    if (row.inApp?.id || inApp.has(r.barcode)) continue;
    r.stock = row.pos.stock;
    r.posName = row.pos.name;
    existing.push(r);
  }
}

const TESTER = /\u062a\u0633\u062a\u0631|tester|sample|\u0643\u0631\u062a\u0648\u0646|\u0639\u064a\u0646\u0629/i;
const byBc = new Map();
for (const row of existing) {
  if (EXCLUDE.has(row.barcode)) continue;
  if (!byBc.has(row.barcode)) {
    byBc.set(row.barcode, { ...row, isTester: !!row.isTester || TESTER.test(`${row.nameAr || ''} ${row.posName || ''}`) });
  }
}
const merged = [...byBc.values()].sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(merged, null, 2)}\n`);
const testers = merged.filter((x) => x.isTester);
console.log(`total=${merged.length} (${testers.length} testers, ${merged.length - testers.length} regular)`);

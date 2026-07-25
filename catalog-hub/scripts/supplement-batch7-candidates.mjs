#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch7.json', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXCLUDE = new Set([
  '3616306115965', '3346475561910', '3346475547280',
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch2.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch3.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch4.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch5.json', import.meta.url), 'utf8')).imported || {}),
  ...Object.keys(JSON.parse(readFileSync(new URL('../data/sarah-pos-import-state-batch6.json', import.meta.url), 'utf8')).imported || {}),
]);

const QUERIES = [
  'Montale', 'Mancera', 'Xerjoff', 'Initio', 'Amouage', 'Byredo', 'Nishane', 'Parfums de Marly',
  'Memo Paris', 'Le Labo', 'Maison Francis', 'Bath and Body Works', 'Victoria Secret', 'Sol de Janeiro',
  'Moroccanoil', 'Olaplex', 'Kerastase', 'Redken', 'Schwarzkopf', 'Wella', 'MAC', 'Benefit', 'NARS',
  'Urban Decay', 'Charlotte Tilbury', 'Fenty', 'Filorga', 'Isdin', 'Avene', 'Uriage', 'CeraVe',
  'Neutrogena', 'Coach', 'Escada', 'Mugler', 'Narciso Rodriguez', 'Armani', 'Burberry', 'Lancome',
  'Montblanc', 'Afnan', 'Lattafa', 'Ajmal', 'Davidoff', 'Jaguar', 'Zadig', 'Swiss Arabian', 'Biore',
  'Simple', 'Pantene', 'OGX', 'Batiste', 'Solgar', 'Flormar', 'Ralph Lauren', 'Guess', 'Hugo Boss',
  'Calvin Klein', 'Dior', 'Chanel', 'YSL', 'Prada', 'Armaf', 'Rasasi', 'Swiss Image', 'Cosrx', 'Anua',
  'Torriden', 'Laneige', 'Innisfree', 'Maybelline', "L'Oreal", 'Garnier', 'Head Shoulders', 'Tresemme',
  'Clinique', 'Estee Lauder', 'Clarins', 'Shiseido', 'Bioderma', 'Eucerin', 'Vichy', 'La Roche',
  'The Ordinary', 'Revolution', 'Huda Beauty', 'Rare Beauty', 'Kiko', 'Essence', 'Catrice', 'Guerlain',
  'Givenchy', 'Kenzo', 'Carolina Herrera', 'Thierry Mugler', 'Jean Paul Gaultier', 'Boucheron',
  'عطر', 'كريم', 'سيروم', 'شامبو', 'بلسم', 'مكياج', 'بودرة', 'مرطب', 'واقي', 'ماسكارا',
];

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

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

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `supp7-${Date.now()}` });
const salla = createSallaProductsApi(client);
const pending = [];

for (const q of QUERIES) {
  try {
    const { data = [] } = await client.sallaFetch('/products/search', { params: { query: q, per_page: 25 }, ttl: 0 });
    for (const hit of data) {
      const hitSlug = slugFromUrl(hit.url || '', String(hit.id || ''));
      const detail = await salla.fetchProductDetail(hitSlug).catch(() => null)
        || await salla.fetchProductDetail(hit.id).catch(() => null);
      const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
      if (bc.length < 8 || have.has(bc)) continue;
      have.add(bc);
      pending.push({
        barcode: bc,
        sarahId: slugFromUrl(hit.url || detail?.productUrl || '', hitSlug),
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
    console.warn(q, e.message);
  }
  await sleep(2500);
}

console.log('Sarah hits:', pending.length);
for (let i = 0; i < pending.length; i += 30) {
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

existing.sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(existing, null, 2)}\n`);
const skip = /تستر|tester|sample|كرتون|T\*|T\*L|T\*M|T\*S/i;
const valid = existing.filter((x) => !skip.test((x.nameAr || '') + (x.posName || '')));
console.log(`total=${existing.length} valid=${valid.length}`);

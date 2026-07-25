#!/usr/bin/env node
/** Fast Sarah search supplement for batch-9. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SKIP = /تستر|tester|sample|كرتون|T\*|T\*L|T\*M|T\*S|T-L-/i;

const STATE_FILES = [
  '../data/sarah-pos-import-state.json', '../data/sarah-pos-import-state-batch2.json',
  '../data/sarah-pos-import-state-batch3.json', '../data/sarah-pos-import-state-batch4.json',
  '../data/sarah-pos-import-state-batch5.json', '../data/sarah-pos-import-state-batch6.json',
  '../data/sarah-pos-import-state-batch7.json', '../data/sarah-pos-import-state-batch8.json',
  '../data/sarah-pos-import-state-batch9.json',
];
const EXCLUDE = new Set(STATE_FILES.flatMap((f) =>
  Object.keys(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).imported || {}),
));

const QUERIES = [
  'Versace', 'Montale', 'Mancera', 'Armaf', 'Lattafa', 'Rasasi', 'Ajmal', 'Swiss Arabian', 'Afnan',
  'Initio', 'Amouage', 'Byredo', 'Nishane', 'Kilian', 'Creed', 'Memo', 'Parfums de Marly', 'Xerjoff',
  'Bath Body Works', 'Victoria Secret', 'Sol de Janeiro', 'Moroccanoil', 'Olaplex', 'Kerastase',
  'Redken', 'Wella', 'Schwarzkopf', 'Tigi', 'Color Wow', 'Living Proof', 'Bumble and Bumble',
  'MAC', 'NARS', 'Benefit', 'Urban Decay', 'Too Faced', 'Charlotte Tilbury', 'Fenty', 'Rare Beauty',
  'Filorga', 'Isdin', 'Avene', 'Uriage', 'Bioderma', 'Eucerin', 'Vichy', 'La Roche', 'Neutrogena',
  'Skin1004', 'Torriden', 'Beauty of Joseon', 'Round Lab', 'Medicube', 'Anua', 'Cosrx', 'Laneige',
  'Innisfree', 'Kiko', 'Essence', 'Catrice', 'Flormar', 'Revolution', 'Huda', 'Solgar', 'Swiss Image',
  'Elie Saab', 'Maison Margiela', 'Maison Francis', 'Le Labo', 'Penhaligon', 'Acqua di Parma',
  'Trussardi', 'Bentley', 'Mercedes', 'Azzaro', 'Cerruti', 'Police', 'Replay', 'Trussardi',
  'Coach', 'Escada', 'Montblanc', 'Davidoff', 'Jaguar', 'Zadig', 'Ralph Lauren', 'Guess', 'Tom Ford',
  'Kenzo', 'Issey Miyake', 'Hermes', 'Chloe', 'Chloe', 'Mugler', 'Lanvin', 'Cacharel', 'Rochas',
  'Biotherm', 'Clarins', 'Shiseido', 'Clinique', 'Estee Lauder', 'Shiseido', 'Garnier', 'Pantene',
  'Head Shoulders', 'Tresemme', 'OGX', 'Batiste', 'Simple', 'Biore', 'Garnier', 'Maybelline',
  'عطر رجالي', 'عطر نسائي', 'عطر نيش', 'كريم', 'سيروم', 'شامبو', 'بلسم', 'مكياج', 'بودرة', 'مرطب',
  'واقي', 'ماسكارا', 'آيلاينر', 'باليت', 'ظلال', 'مزيل عرق', 'غسول', 'تونر', 'ماسك',
];

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

await getToken();
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const have = new Set(existing.map((x) => x.barcode));
EXCLUDE.forEach((b) => have.add(b));

const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `fast10-${Date.now()}` });
const salla = createSallaProductsApi(client);
const pending = [];

for (const q of QUERIES) {
  try {
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
    console.warn(q, e.message);
  }
  if (q.length % 10 === 0) console.log(`query=${q} pending=${pending.length}`);
  await sleep(600);
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

const byBc = new Map();
for (const row of existing) {
  if (EXCLUDE.has(row.barcode) || SKIP.test(`${row.nameAr || ''} ${row.posName || ''}`)) continue;
  if (!byBc.has(row.barcode)) byBc.set(row.barcode, row);
}
const merged = [...byBc.values()].sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`total=${merged.length} valid candidates`);

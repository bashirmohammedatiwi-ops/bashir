#!/usr/bin/env node
/** Discover Sarah care+makeup (non-perfume) with POS stock for batch-17. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-care-batch17.json', import.meta.url).pathname;
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const PACE_MS = Number(process.env.PACE_MS || 800);
const TARGET = Number(process.env.TARGET || 60);

const CARE_MAKEUP_CATS = [
  { id: 'ePGoa', name: 'مكياج' },
  { id: 'mQRmY', name: 'عناية' },
  { id: 'jREdnY', name: 'العناية الكورية' },
];

const QUERIES = [
  'مكياج', 'عناية', 'كريم', 'سيروم', 'شامبو', 'بلسم', 'مرطب', 'غسول', 'ماسك',
  'ماسكرا', 'باليت', 'ظلال', 'بودرة', 'برايمر', 'مزيل عرق', 'واقي شمس',
  'Huda Beauty', 'NYX', 'Essence', 'Maybelline', 'Loreal', 'Inglot', 'Ofra',
  'The Ordinary', 'CeraVe', 'Cantu', 'Laneige', 'Anastasia', 'Benefit', 'NARS',
  'Real Techniques', 'Golden Rose', 'Carmex', 'Clinique', 'MAC', 'e.l.f',
];

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

const PERFUME = /عطر|perfume|parfum|eau de|edt|edp|edc|cologne|\boud\b|برفيوم|تواليت|بارفيوم|colonge/i;
const CARE_MAKEUP = /مكياج|كريم|سيروم|شامبو|بلسم|مرطب|غسول|ماسك|ماسكر|باليت|ظلال|بودرة|برايمر|مزيل|عناية|lip|mascara|palette|foundation|cleanser|conditioner|cream|serum|shampoo|makeup|sunscreen|deodorant|highlighter|concealer|blush|eyeliner|lipstick|toner|moistur|lotion|gel|mask|scrub|toothpaste|hair|body|face|eye|nail|sponge|brush|fixer|setting spray/i;
const TESTER = /\u062a\u0633\u062a\u0631|tester|sample|\u0643\u0631\u062a\u0648\u0646|\u0639\u064a\u0646\u0629/i;

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

function isPerfume(row) {
  const t = `${row.nameAr || ''} ${row.posName || ''} ${row.category || ''}`;
  if (PERFUME.test(t) && !/معطر شعر|hair mist|deodorant|مزيل|شامبو|كريم|ماسكر|باليت|غسول|سيروم|مرطب|body mist/i.test(t)) return true;
  if (/^[A-Z0-9][A-Z0-9\s\-./'&]+ED[TP]\b/i.test(String(row.posName || '').trim())) return true;
  return false;
}

function isCareOrMakeup(row) {
  const t = `${row.nameAr || ''} ${row.posName || ''} ${row.category || ''}`;
  return CARE_MAKEUP.test(t) || !PERFUME.test(t);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `care17-${Date.now()}` });
const salla = createSallaProductsApi(client);

await getToken();
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}
console.log(`Exclude ${EXCLUDE.size}, in-app ${inApp.size}`);

const seen = new Set();
const pending = [];

async function addFromSearch(query) {
  await sleep(PACE_MS);
  let page = 1;
  for (let round = 0; round < 5; round++) {
    const { items = [], hasMore } = await salla.searchProducts(query, { page, limit: 50 }).catch(() => ({ items: [] }));
    for (const hit of items) {
      const slug = slugFromUrl(hit.url || '', String(hit.id || ''));
      const key = slug || String(hit.id || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      await sleep(PACE_MS);
      const detail = await salla.fetchProductDetail(slug).catch(() => null)
        || await salla.fetchProductDetail(hit.id).catch(() => null);
      const bc = String(detail?.barcode || detail?.sku || hit.gtin || hit.sku || '').replace(/\D/g, '');
      if (bc.length < 8 || EXCLUDE.has(bc) || seen.has(`bc:${bc}`)) continue;
      seen.add(`bc:${bc}`);
      const row = {
        barcode: bc,
        sarahId: slugFromUrl(hit.url || detail?.productUrl || '', slug),
        nameAr: detail?.nameAr || hit.nameAr || hit.name || '',
        nameEn: detail?.nameEn || hit.nameEn || '',
        brandAr: detail?.brandAr || hit.brandAr || '',
        brandEn: detail?.brandEn || hit.brandEn || '',
        category: hit.category || detail?.category || query,
        url: hit.url || detail?.productUrl || '',
        posName: '',
        stock: 0,
      };
      if (isPerfume(row)) continue;
      if (!isCareOrMakeup(row)) continue;
      if (TESTER.test(`${row.nameAr} ${row.posName}`)) continue;
      pending.push(row);
    }
    if (!hasMore || pending.length >= TARGET * 3) break;
    page += 1;
    await sleep(PACE_MS);
  }
}

for (const cat of CARE_MAKEUP_CATS) {
  console.log(`Category ${cat.name}...`);
  await addFromSearch(cat.name);
  console.log(`  pending ${pending.length}`);
}
for (const q of QUERIES) {
  if (pending.length >= TARGET * 3) break;
  await addFromSearch(q);
  if (pending.length % 25 === 0) console.log(`query=${q} pending=${pending.length}`);
}

console.log(`Sarah hits (pre-POS): ${pending.length}`);
const validated = [];
const byBc = new Map();
for (const r of pending) if (!byBc.has(r.barcode)) byBc.set(r.barcode, r);
const list = [...byBc.values()];

for (let i = 0; i < list.length; i += 30) {
  await sleep(400);
  const batch = list.slice(i, i + 30);
  const items = await api('/sync/inventory/lookup-barcodes', {
    method: 'POST',
    body: { barcodes: batch.map((r) => r.barcode) },
  }).then((r) => r.items || {});
  for (const row of batch) {
    const hit = items[row.barcode];
    if (!hit?.pos || hit.pos.stock < MIN_STOCK) continue;
    if (hit.inApp?.id || inApp.has(row.barcode)) continue;
    row.stock = hit.pos.stock;
    row.posName = hit.pos.name || '';
    if (isPerfume(row)) continue;
    validated.push(row);
  }
  console.log(`POS ${Math.min(i + 30, list.length)}/${list.length} -> ${validated.length}`);
  if (validated.length >= TARGET) break;
}

validated.sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(validated, null, 2)}\n`);
console.log(`Saved ${validated.length} care/makeup candidates -> ${OUT}`);

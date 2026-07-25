#!/usr/bin/env node
/** Discover care/makeup via POS lookup on barcode indexes (not perfumes). */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { api, getToken } from '../lib/core/api-auth.js';

const BATCH = process.env.BATCH || '18';
const OUT = new URL(`../data/sarah-pos-candidates-care-batch${BATCH}.json`, import.meta.url).pathname;
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const TARGET = Number(process.env.TARGET || 60);
const PACE_MS = Number(process.env.PACE_MS || 600);

const PERF = /parfum|perfume|eau-de|eau_de|edp|edt|edc|cologne|\boud\b|عطر|برفيوم|تواليت|بارفيوم|fragrance|scent/i;
const CARE = /cream|serum|shampoo|mascara|lipstick|foundation|concealer|blush|mask|cleanser|moistur|sunscreen|deodorant|conditioner|toner|gel|lotion|makeup|balm|gloss|palette|powder|primer|eyeliner|brush|sponge|scrub|treatment|hair|body|face|eye|lip|nail|wash|soap|tooth|razor|shaving|sun|spf|fixer|setting|remover|highlighter|contour|bronzer|brow|كريم|شامبو|مرطب|مكياج|سيروم|غسول|بلسم|ماسك|ماسكر|باليت|بودرة|ظلال|مزيل|عناية|شفاه|عيون|وجه|شعر|فم|أسنان|واقي/i;

function loadIndex(name) {
  try {
    const raw = JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
    return Object.values(raw.entries || raw);
  } catch {
    return [];
  }
}

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

function slugText(e) {
  return `${e.slug || ''} ${e.shadeName || ''} ${e.title || ''} ${e.titleEn || ''}`.toLowerCase();
}

function isCareSlug(e) {
  const t = slugText(e);
  if (PERF.test(t) && !/body-lotion|body lotion|hair mist|deodorant|shampoo|cream|serum|mask|cleanser|moistur|hand cream|lip|mascara|foundation|makeup|setting spray|fixer/i.test(t)) return false;
  return CARE.test(t);
}

const entries = [...loadIndex('waheteter-barcode-index.json'), ...loadIndex('orisdi-barcode-index.json')];
const byBc = new Map();
for (const e of entries) {
  const bc = String(e.barcode || '').replace(/\D/g, '');
  if (bc.length < 8 || EXCLUDE.has(bc) || byBc.has(bc)) continue;
  if (!isCareSlug(e)) continue;
  byBc.set(bc, { barcode: bc, slugHint: e.slug || '', shadeName: e.shadeName || '', store: e.store || '' });
}
console.log(`Care/makeup barcodes from indexes: ${byBc.size}, exclude ${EXCLUDE.size}`);

await getToken();
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}

const list = [...byBc.values()];
const validated = [];
for (let i = 0; i < list.length; i += 40) {
  const batch = list.slice(i, i + 40);
  const items = await api('/sync/inventory/lookup-barcodes', {
    method: 'POST',
    body: { barcodes: batch.map((r) => r.barcode) },
  }).then((r) => r.items || {});
  for (const row of batch) {
    const hit = items[row.barcode];
    if (!hit?.pos || hit.pos.stock < MIN_STOCK) continue;
    if (hit.inApp?.id || inApp.has(row.barcode)) continue;
    const posName = hit.pos.name || '';
    if (/ED[TP]\b|PARFUM|COLOGNE|OUD\b/i.test(posName) && !/MASCARA|CREAM|SHAMPOO|SERUM|GEL|LOTION|MASK|LIP|MAKEUP|SPRAY|FIXER|DEODORANT|SUN/i.test(posName)) continue;
    validated.push({
      barcode: row.barcode,
      sarahId: '',
      nameAr: '',
      nameEn: row.slugHint.replace(/-/g, ' '),
      brandAr: '',
      brandEn: '',
      category: 'care/makeup',
      url: '',
      stock: hit.pos.stock,
      posName,
      slugHint: row.slugHint,
      store: row.store,
    });
  }
  console.log(`POS ${Math.min(i + 40, list.length)}/${list.length} -> ${validated.length}`);
  if (validated.length >= TARGET) break;
}

validated.sort((a, b) => b.stock - a.stock);
console.log(`POS hits: ${validated.length}`);
if (validated.length < Number(process.env.LIMIT || 50)) {
  console.warn(`Only ${validated.length} candidates (need ${process.env.LIMIT || 50})`);
}

const client = createSallaClient('sarahmakeup37.com', { cachePrefix: `idx${BATCH}-${Date.now()}` });
const salla = createSallaProductsApi(client);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const row of validated.slice(0, TARGET)) {
  await sleep(PACE_MS);
  const hits = await salla.searchBarcode(row.barcode).catch(() => []);
  const hit = Array.isArray(hits) ? hits[0] : hits;
  if (hit) {
    row.sarahId = String(hit.url || hit.productUrl || '').match(/\/ar\/([^/?#]+)/)?.[1] || hit.id || '';
    row.nameAr = hit.nameAr || row.nameAr;
    row.nameEn = hit.nameEn || row.nameEn;
    row.brandAr = hit.brandAr || '';
    row.brandEn = hit.brandEn || '';
    row.url = hit.url || hit.productUrl || '';
    row.category = hit.category || row.category;
  }
}

writeFileSync(OUT, `${JSON.stringify(validated.slice(0, TARGET), null, 2)}\n`);
console.log(`Saved ${Math.min(validated.length, TARGET)} -> ${OUT}`);

#!/usr/bin/env node
/** Merge index + Niceone candidates for batch18 (top 50 non-perfume). */
import { readFileSync, writeFileSync, existsSync } from 'fs';

const OUT = new URL('../data/sarah-pos-candidates-care-batch18.json', import.meta.url).pathname;
const LIMIT = Number(process.env.LIMIT || 50);
const sources = [
  '../data/sarah-pos-candidates-care-batch18.json',
  '../data/sarah-pos-candidates-care-batch18-sarah.json',
  '../data/sarah-pos-candidates-care-batch18-niceone.json',
];

const PERF = /parfum|perfume|eau de|edt|edp|edc|cologne|\boud\b|عطر|برفيوم|fragrance/i;
function isPerfume(r) {
  const t = `${r.nameAr || ''} ${r.nameEn || ''} ${r.posName || ''}`;
  return PERF.test(t) && !/deodorant|body lotion|hair mist|shampoo|cream|serum|mask|cleanser|makeup|mascara|lip/i.test(t);
}

const byBc = new Map();
for (const f of sources) {
  const p = new URL(f, import.meta.url);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8'))) {
    if (isPerfume(r)) continue;
    if (!byBc.has(r.barcode) || (r.stock || 0) > (byBc.get(r.barcode).stock || 0)) byBc.set(r.barcode, r);
  }
}

const list = [...byBc.values()].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, LIMIT);
writeFileSync(OUT, `${JSON.stringify(list, null, 2)}\n`);
console.log(`Merged ${list.length} candidates -> ${OUT}`);

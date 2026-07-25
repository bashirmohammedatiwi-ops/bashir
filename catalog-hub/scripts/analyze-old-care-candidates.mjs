#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';

const EXCLUDE = new Set();
for (let i = 0; i <= 16; i++) {
  const name = i === 0 ? 'sarah-pos-import-state.json' : `sarah-pos-import-state-batch${i + 1}.json`;
  const p = new URL(`../data/${name}`, import.meta.url);
  if (!existsSync(p)) continue;
  for (const bc of Object.keys(JSON.parse(readFileSync(p, 'utf8')).imported || {})) EXCLUDE.add(bc);
}

const PERF = /عطر|perfume|parfum|eau de|edt|edp|edc|cologne|\boud\b|برفيوم|تواليت|بارفيوم/i;
const CARE = /مكياج|كريم|سيروم|شامبو|بلسم|مرطب|غسول|ماسك|ماسكر|باليت|ظلال|بودرة|برايمر|مزيل|عناية|lip|mascara|palette|foundation|cleanser|conditioner|cream|serum|shampoo|makeup|sunscreen|deodorant|highlighter|concealer|blush|eyeliner|lipstick|toner|moistur|lotion|gel|mask|scrub|toothpaste|hair|body|face|eye|nail|sponge|brush|fixer|setting spray/i;

function isPerf(r) {
  const t = `${r.nameAr || ''} ${r.posName || ''} ${r.category || ''}`;
  return PERF.test(t) && !/معطر شعر|deodorant|مزيل|شامبو|كريم|ماسكر|باليت/.test(t);
}

const pending = [];
for (const b of ['batch10', 'batch11', 'batch12', 'batch13', 'batch14', 'batch15', 'batch16']) {
  const p = new URL(`../data/sarah-pos-candidates-${b}.json`, import.meta.url);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8'))) {
    if (EXCLUDE.has(r.barcode)) continue;
    if (isPerf(r)) continue;
    if (!CARE.test(`${r.nameAr} ${r.posName} ${r.category}`)) continue;
    pending.push({ ...r, src: b });
  }
}

const byBc = new Map();
for (const r of pending) if (!byBc.has(r.barcode)) byBc.set(r.barcode, r);
const list = [...byBc.values()].sort((a, b) => (b.stock || 0) - (a.stock || 0));
console.log('Unimported care/makeup from old scans:', list.length);
console.log('Top 10:', list.slice(0, 10).map((r) => ({ bc: r.barcode, stock: r.stock, name: r.nameAr?.slice(0, 40), src: r.src })));

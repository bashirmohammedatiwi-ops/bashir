#!/usr/bin/env node
/** Merge all candidate pools + stock alerts, re-validate POS for batch-10. */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { api, getToken } from '../lib/core/api-auth.js';

const OUT = new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url).pathname;
const INCLUDE_TESTERS = process.env.INCLUDE_TESTERS !== '0';
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);

const STATE_FILES = [];
for (let i = 1; i <= 9; i++) {
  STATE_FILES.push(i === 1 ? '../data/sarah-pos-import-state.json' : `../data/sarah-pos-import-state-batch${i}.json`);
}
const imported = new Set(STATE_FILES.flatMap((f) =>
  Object.keys(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).imported || {}),
));
const TESTER = /\u062a\u0633\u062a\u0631|tester|sample|\u0643\u0631\u062a\u0648\u0646/i;

await getToken();
const inApp = new Set();
for (let page = 1; page <= 100; page++) {
  const items = await api(`/products?limit=100&page=${page}`);
  if (!items?.length) break;
  for (const p of items) if (p.barcode) inApp.add(p.barcode);
}

const byBc = new Map();
for (const f of readdirSync(new URL('../data/', import.meta.url).pathname)) {
  if (!f.startsWith('sarah-pos-candidates') || !f.endsWith('.json')) continue;
  for (const row of JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'))) {
    if (imported.has(row.barcode)) continue;
    if (!INCLUDE_TESTERS && TESTER.test(`${row.nameAr || ''} ${row.posName || ''}`)) continue;
    if (!byBc.has(row.barcode)) byBc.set(row.barcode, row);
  }
}

// Stock alerts may surface POS barcodes missing Sarah metadata
try {
  const alerts = await api('/sync/inventory/stock-alerts?limit=200');
  const rows = Array.isArray(alerts) ? alerts : (alerts?.items || []);
  for (const a of rows) {
    const bc = String(a.barcode || a.sku || '').replace(/\D/g, '');
    if (bc.length < 8 || imported.has(bc) || byBc.has(bc)) continue;
    byBc.set(bc, {
      barcode: bc,
      sarahId: '',
      nameAr: a.nameAr || a.name || a.productName || '',
      nameEn: a.nameEn || '',
      brandAr: a.brandAr || '',
      brandEn: a.brandEn || '',
      category: '',
      url: '',
      stock: a.stock ?? a.posStock ?? 0,
      posName: a.posName || a.name || '',
    });
  }
} catch (e) {
  console.warn('stock-alerts', e.message);
}

console.log('Pool before POS verify:', byBc.size);

const validated = [];
const list = [...byBc.values()];
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
    if (!INCLUDE_TESTERS && TESTER.test(`${row.nameAr || ''} ${hit.pos.name || ''}`)) continue;
    validated.push({
      ...row,
      stock: hit.pos.stock,
      posName: hit.pos.name || row.posName || '',
    });
  }
  console.log(`verified ${Math.min(i + 40, list.length)}/${list.length} -> ${validated.length}`);
}

validated.sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(validated, null, 2)}\n`);
const testers = validated.filter((r) => TESTER.test(`${r.nameAr || ''} ${r.posName || ''}`));
console.log(`Saved ${validated.length} (${testers.length} testers, ${validated.length - testers.length} regular)`);

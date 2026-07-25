#!/usr/bin/env node
/** Merge leftover batch8 candidates + rescan for batch10 pool. */
import { readFileSync, writeFileSync, existsSync } from 'fs';

const OUT = new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url).pathname;
const SKIP = /تستر|tester|sample|كرتون|T\*|T\*L|T\*M|T\*S|T-L-/i;

const STATE_FILES = [
  '../data/sarah-pos-import-state.json',
  '../data/sarah-pos-import-state-batch2.json',
  '../data/sarah-pos-import-state-batch3.json',
  '../data/sarah-pos-import-state-batch4.json',
  '../data/sarah-pos-import-state-batch5.json',
  '../data/sarah-pos-import-state-batch6.json',
  '../data/sarah-pos-import-state-batch7.json',
  '../data/sarah-pos-import-state-batch8.json',
  '../data/sarah-pos-import-state-batch9.json',
];

const imported = new Set(STATE_FILES.flatMap((f) =>
  Object.keys(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).imported || {}),
));

const byBc = new Map();
for (const src of ['../data/sarah-pos-candidates-batch8.json', '../data/sarah-pos-candidates-batch7.json', OUT]) {
  if (!existsSync(new URL(src, import.meta.url))) continue;
  for (const row of JSON.parse(readFileSync(new URL(src, import.meta.url), 'utf8'))) {
    if (imported.has(row.barcode) || SKIP.test(`${row.nameAr || ''} ${row.posName || ''}`)) continue;
    if (!byBc.has(row.barcode)) byBc.set(row.barcode, row);
  }
}

const merged = [...byBc.values()].sort((a, b) => b.stock - a.stock);
writeFileSync(OUT, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Merged ${merged.length} valid batch10 candidates`);

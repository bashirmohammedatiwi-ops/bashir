#!/usr/bin/env node
/**
 * دمج barcode-index.json من الصورة/الريبو إلى volume الحي على السيرفر.
 * الاستخدام: node merge-barcode-index.cjs <seed.json> <live.json>
 */
const fs = require('fs');

const [seedPath, livePath] = process.argv.slice(2);
if (!seedPath || !livePath) {
  console.error('usage: node merge-barcode-index.cjs <seed.json> <live.json>');
  process.exit(1);
}

function readIndex(file) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (raw.entries) return raw;
    return { entries: raw, meta: { updatedAt: 0 } };
  } catch {
    return { entries: {}, meta: { updatedAt: 0 } };
  }
}

const seed = readIndex(seedPath);
const live = readIndex(livePath);
const merged = { ...live.entries };

for (const [key, row] of Object.entries(seed.entries || {})) {
  if (!merged[key]) {
    merged[key] = row;
    continue;
  }
  merged[key] = { ...row, ...merged[key] };
}

const out = {
  meta: {
    updatedAt: Date.now(),
    mergedFrom: seedPath,
    liveCount: Object.keys(live.entries || {}).length,
    seedCount: Object.keys(seed.entries || {}).length,
  },
  entries: merged,
};

fs.writeFileSync(livePath, JSON.stringify(out));
console.log(
  `merged barcode-index.json: live=${Object.keys(live.entries || {}).length}`
  + ` + seed=${Object.keys(seed.entries || {}).length}`
  + ` -> ${Object.keys(merged).length}`,
);

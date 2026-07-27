#!/usr/bin/env node
/** Deactivate batch20 imports that are not makeup. */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMakeupText } from '../lib/core/makeup-product-filter.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(__dirname, '../data/niceone-makeup-pos-batch20-state.json');
const DRY = process.env.DRY_RUN === '1';

const state = JSON.parse(readFileSync(STATE, 'utf8'));
await getToken();

let off = 0;
for (const [bc, row] of Object.entries(state.imported || {})) {
  const text = `${row.nameEn || ''} ${row.nameAr || ''}`;
  if (isMakeupText(text)) continue;
  if (DRY) {
    console.log(`DRY deactivate ${bc} | ${row.nameEn}`);
    off += 1;
    continue;
  }
  try {
    await api(`/products/${row.id}`, { method: 'PATCH', body: { isActive: false } });
    console.log(`OFF ${bc} | ${row.nameEn?.slice(0, 70)}`);
    off += 1;
  } catch (err) {
    console.log(`FAIL ${bc} — ${err.message}`);
  }
}
console.log(`Deactivated: ${off}`);

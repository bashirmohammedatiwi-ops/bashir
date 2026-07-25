#!/usr/bin/env node
/** Discover non-perfume products with POS stock from all barcode sources. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/sarah-pos-candidates-care-batch18.json');
const LIMIT = Number(process.env.LIMIT || 50);
const MIN_STOCK = Number(process.env.MIN_STOCK || 1);
const dataDir = path.join(__dirname, '../data');

const EXCLUDE = new Set();
for (let i = 0; i <= 17; i++) {
  const n = i === 0 ? 'sarah-pos-import-state.json' : `sarah-pos-import-state-batch${i + 1}.json`;
  const p = path.join(dataDir, n);
  if (!existsSync(p)) continue;
  for (const bc of Object.keys(JSON.parse(readFileSync(p, 'utf8')).imported || {})) EXCLUDE.add(bc);
}
for (const f of ['care-pos-import-state.json', 'care-barcode-no-image-import-state.json']) {
  const p = path.join(dataDir, f);
  if (!existsSync(p)) continue;
  for (const bc of Object.keys(JSON.parse(readFileSync(p, 'utf8')).imported || {})) EXCLUDE.add(bc);
}

const PERF = /parfum|perfume|eau de|edt|edp|edc|cologne|\boud\b|عطر|برفيوم|تواليت|بارfiom|fragrance|\bedp\b|\bedt\b/i;

function isPerfumeText(t = '') {
  const s = String(t);
  if (/معطر شعر|hair mist|body mist|deodorant|مزيل|شامبو|كريم|ماسكر|باليت|setting spray|fixer spray|cleanser|toner|serum|mask|makeup|mascara|lip|foundation|shampoo|conditioner|gel|lotion|cream|sunscreen|spf|tooth|gummy|vitamin|cleans/i.test(s)) return false;
  return PERF.test(s) || /\b(EDP|EDT|EDC|EXDP|PARFUM)\b/i.test(s);
}

const barcodes = new Map();
function add(bc, meta = {}) {
  const d = String(bc || '').replace(/\D/g, '');
  if (d.length < 8 || EXCLUDE.has(d) || barcodes.has(d)) return;
  barcodes.set(d, meta);
}

for (const f of readdirSync(dataDir)) {
  if (f.endsWith('-barcodes.txt')) {
    try {
      for (const b of readFileSync(path.join(dataDir, f), 'utf8').split(/\s+/)) add(b, { src: f });
    } catch { /* skip */ }
    continue;
  }
  if (!f.includes('barcode') || !f.endsWith('.json')) continue;
  try {
    const raw = JSON.parse(readFileSync(path.join(dataDir, f), 'utf8'));
    const entries = raw.entries ? Object.values(raw.entries) : Array.isArray(raw) ? raw : [];
    for (const e of entries) {
      const slug = `${e.slug || ''} ${e.shadeName || ''} ${e.title || ''} ${e.titleEn || ''}`;
      if (isPerfumeText(slug)) continue;
      add(e.barcode || e, { src: f, slugHint: e.slug || '', shadeName: e.shadeName || '' });
    }
  } catch { /* skip */ }
}

console.log(`Checking ${barcodes.size} barcodes, exclude ${EXCLUDE.size}`);
await getToken();

const hits = [];
const list = [...barcodes.entries()];
for (let i = 0; i < list.length; i += 50) {
  const batch = list.slice(i, i + 50);
  const items = await api('/sync/inventory/lookup-barcodes', {
    method: 'POST',
    body: { barcodes: batch.map(([bc]) => bc) },
  }).then((r) => r.items || {});
  for (const [bc, meta] of batch) {
    const h = items[bc];
    if (!h?.pos || h.pos.stock < MIN_STOCK || h.inApp?.id) continue;
    const posName = h.pos.name || '';
    if (isPerfumeText(posName) && isPerfumeText(meta.slugHint || '')) continue;
    if (isPerfumeText(posName) && !/DEO|CREAM|SHAMPOO|SERUM|GEL|LOTION|MASK|LIP|MAKEUP|MASCARA|SPRAY|FIXER|SUN|TONER|CLEAN|GUMMY|VITAMIN|FOUNDATION|POWDER|PALETTE|BRUSH|TOOL/i.test(posName)) continue;
    hits.push({
      barcode: bc,
      sarahId: '',
      nameAr: '',
      nameEn: (meta.slugHint || posName).replace(/-/g, ' '),
      brandAr: '',
      brandEn: '',
      category: 'care/makeup',
      url: '',
      stock: h.pos.stock,
      posName,
      slugHint: meta.slugHint || '',
      store: meta.src || '',
    });
  }
  if (i % 500 === 0) console.log(`checked ${Math.min(i + 50, list.length)}/${list.length} -> ${hits.length}`);
  if (hits.length >= LIMIT * 2) break;
}

hits.sort((a, b) => b.stock - a.stock);
const selected = hits.slice(0, LIMIT);
writeFileSync(OUT, `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Saved ${selected.length} non-perfume candidates -> ${OUT}`);

#!/usr/bin/env node
/** Lookup barcodes via Miraaya + Elryan stores for product identification. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { miraayaAdapter } from '../lib/stores/miraaya/index.js';
import { elryanAdapter } from '../lib/stores/elryan/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BARCODES_FILE = path.join(__dirname, '../data/care-batch-large-barcodes.txt');
const OUT_FILE = path.join(__dirname, '../data/care-batch-large-store-lookup.json');
const DELAY_MS = Number(process.env.DELAY_MS || 400);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function lookupOne(barcode) {
  const out = { barcode, miraaya: null, elryan: null };
  try {
    const hits = await miraayaAdapter.searchBarcode(barcode);
    if (hits?.[0]) {
      const h = hits[0];
      out.miraaya = {
        nameEn: h.nameEn || h.name,
        nameAr: h.nameAr,
        brandEn: h.brandEn || h.manufacturerEn,
        brandAr: h.brandAr || h.manufacturer,
        sku: h.sku,
      };
    }
  } catch (e) {
    out.miraayaError = e.message;
  }

  await sleep(DELAY_MS);

  try {
    const hits = await elryanAdapter.searchBarcode(barcode);
    if (hits?.[0]) {
      const h = hits[0];
      out.elryan = {
        nameEn: h.nameEn || h.name,
        nameAr: h.nameAr,
        brandEn: h.brandEn || h.manufacturerEn,
        brandAr: h.brandAr || h.manufacturer,
        sku: h.sku,
      };
    }
  } catch (e) {
    out.elryanError = e.message;
  }

  return out;
}

async function main() {
  const barcodes = [...new Set(
    readFileSync(BARCODES_FILE, 'utf8').trim().split(/\s+/).filter(Boolean),
  )];

  let existing = {};
  if (existsSync(OUT_FILE)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
      for (const row of prev.rows || []) {
        if (row.miraaya || row.elryan) existing[row.barcode] = row;
      }
    } catch { /* ignore */ }
  }

  const rows = [];
  let found = 0;
  console.log(`Looking up ${barcodes.length} barcodes (delay=${DELAY_MS}ms)...\n`);

  for (let i = 0; i < barcodes.length; i += 1) {
    const bc = barcodes[i];
    if (existing[bc]) {
      rows.push(existing[bc]);
      if (existing[bc].miraaya || existing[bc].elryan) found += 1;
      continue;
    }

    if (i > 0) await sleep(DELAY_MS);
    const row = await lookupOne(bc);
    rows.push(row);
    if (row.miraaya || row.elryan) {
      found += 1;
      const src = row.miraaya || row.elryan;
      console.log(`[${i + 1}/${barcodes.length}] ${bc} → ${src.brandEn || ''} ${src.nameEn || src.nameAr || ''}`.slice(0, 120));
    } else if ((i + 1) % 25 === 0) {
      console.log(`[${i + 1}/${barcodes.length}] progress... found=${found}`);
    }

    if ((i + 1) % 20 === 0) {
      writeFileSync(OUT_FILE, JSON.stringify({ updatedAt: Date.now(), found, rows }, null, 2));
    }
  }

  writeFileSync(OUT_FILE, JSON.stringify({ updatedAt: Date.now(), found, rows }, null, 2));
  console.log(`\nDone: found=${found}/${barcodes.length} → ${OUT_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/** PATCH care batch49 products with corrected bilingual content from overrides. */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCareCategories } from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { buildCareContent } from '../lib/core/care-content.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '../data/care-batch49-import-state.json');
const DELAY_MS = Number(process.env.DELAY_MS || 800);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!existsSync(STATE_FILE)) {
    console.log('No batch49 import state found.');
    return;
  }

  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  const barcodes = Object.keys(state.imported || {});
  if (!barcodes.length) {
    console.log('No imported products to fix.');
    return;
  }

  await getToken();
  let ok = 0;
  let fail = 0;

  console.log(`Fixing ${barcodes.length} batch49 products...\n`);

  for (let i = 0; i < barcodes.length; i += 1) {
    const barcode = barcodes[i];
    const meta = state.imported[barcode];
    if (i > 0) await sleep(DELAY_MS);

    try {
      const override = getCareOverride(barcode);
      if (!override) {
        console.log(`SKIP ${barcode} — no override`);
        continue;
      }

      const content = buildCareContent({
        barcode,
        brandEn: override.brandEn,
        brandAr: override.brandAr,
        categoryEn: 'Care',
        categoryAr: 'عناية',
        posName: '',
        leaf: '',
      });

      const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories('', {
        barcode,
        brandEn: override.brandEn,
        brandAr: override.brandAr,
        posName: '',
        typeKey: content.typeKey,
      });

      await api(`/products/${meta.id}`, {
        method: 'PATCH',
        body: {
          name: content.nameAr,
          nameAr: content.nameAr,
          nameEn: content.nameEn,
          description: content.descriptionAr,
          descriptionAr: content.descriptionAr,
          descriptionEn: content.descriptionEn,
          subcategoryIds,
          tertiaryCategoryIds,
        },
      });

      ok += 1;
      console.log(`OK ${barcode}`);
      console.log(`  → ${content.nameAr}`);
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${barcode} — ${err.message}`);
    }
  }

  console.log(`\nFixed: OK=${ok} FAIL=${fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

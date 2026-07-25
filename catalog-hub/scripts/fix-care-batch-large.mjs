#!/usr/bin/env node
/** PATCH care batch-large products with corrected bilingual content from overrides. */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCareCategories } from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { buildCareContent } from '../lib/core/care-content.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 800);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findProduct(barcode) {
  const res = await api(`/products?limit=5&search=${encodeURIComponent(barcode)}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  return items.find((p) => String(p.sku || p.barcode || '').trim() === barcode) || items[0] || null;
}

async function main() {
  if (!existsSync(PRODUCTS_FILE)) {
    console.log('No batch-large products file found.');
    return;
  }

  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  const barcodes = products.map((p) => String(p.barcode).trim());
  await getToken();

  let ok = 0;
  let fail = 0;
  let missing = 0;

  console.log(`Patching ${barcodes.length} batch-large products...\n`);

  for (let i = 0; i < barcodes.length; i += 1) {
    const barcode = barcodes[i];
    if (i > 0) await sleep(DELAY_MS);

    try {
      const override = getCareOverride(barcode);
      if (!override) {
        console.log(`SKIP ${barcode} — no override`);
        continue;
      }

      const product = await findProduct(barcode);
      if (!product?.id) {
        missing += 1;
        console.log(`MISSING ${barcode} — not in catalog`);
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

      await api(`/products/${product.id}`, {
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

  console.log(`\nPatched: OK=${ok} MISSING=${missing} FAIL=${fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

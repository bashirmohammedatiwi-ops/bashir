/** Batch 140 hair-care overrides — loaded from care-batch140-products.json */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  readFileSync(path.join(__dirname, '../../data/care-batch140-products.json'), 'utf8'),
);

/** @type {Record<string, object>} */
export const BATCH140_OVERRIDES = Object.fromEntries(
  products.map((p) => [
    String(p.barcode).trim(),
    {
      brandEn: p.brandEn,
      brandAr: p.brandAr,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      typeKey: p.typeKey,
      subcategorySlugs: p.subcategorySlugs || ['care-hair-care'],
      tertiarySlugs: p.tertiarySlugs || [],
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
    },
  ]),
);

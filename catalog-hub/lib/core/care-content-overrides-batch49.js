/** Batch 49 care overrides — loaded from care-batch49-products.json */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  readFileSync(path.join(__dirname, '../../data/care-batch49-products.json'), 'utf8'),
);

/** @type {Record<string, object>} */
export const BATCH49_OVERRIDES = Object.fromEntries(
  products.map((p) => [
    String(p.barcode).trim(),
    {
      brandEn: p.brandEn,
      brandAr: p.brandAr,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      typeKey: p.typeKey,
      subcategorySlugs: p.subcategorySlugs || ['care-face-care'],
      tertiarySlugs: p.tertiarySlugs || [],
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
    },
  ]),
);

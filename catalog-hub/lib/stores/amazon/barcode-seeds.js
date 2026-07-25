import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, '..', '..', '..', 'data', 'amazon-barcode-seeds.json');

let seeds = null;

function loadSeeds() {
  if (seeds) return seeds;
  try {
    seeds = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  } catch {
    seeds = { version: 1, products: {} };
  }
  return seeds;
}

function normBarcode(v = '') {
  return String(v || '').replace(/\D/g, '');
}

function shadeKey(v = '') {
  const raw = String(v || '').trim();
  if (!raw) return '';
  const n = Number(raw);
  if (Number.isFinite(n)) return String(n);
  return raw.replace(/^0+/, '') || raw;
}

/** يملأ باركودات التدرجات من seed محلي (EAN أوروبي) عند غياب باركود أمازون */
export function applyBarcodeSeeds(shades = [], parentAsin = '') {
  const parent = String(parentAsin || '').trim().toUpperCase();
  if (!parent || !shades?.length) return shades;

  const productSeed = loadSeeds().products?.[parent];
  const byShade = productSeed?.byShadeNumber || {};
  if (!Object.keys(byShade).length) return shades;

  return shades.map((shade) => {
    const live = normBarcode(shade.barcode);
    if (live.length >= 8) return shade;

    const num = shadeKey(shade.shadeNumber || shade.shadeCode || shade.nameEn || shade.name);
    const seeded = normBarcode(byShade[num] || byShade[String(num).padStart(2, '0')] || '');
    if (seeded.length < 8) return shade;

    return { ...shade, barcode: seeded };
  });
}

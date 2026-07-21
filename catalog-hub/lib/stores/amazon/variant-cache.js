import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', '..', '..', 'data', 'amazon-variant-cache.json');

let cache = null;

function emptyCache() {
  return { version: 1, products: {} };
}

export function loadVariantCache({ force = false } = {}) {
  if (cache && !force) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    cache = {
      ...emptyCache(),
      ...raw,
      products: raw.products || {},
    };
  } catch {
    cache = emptyCache();
  }
  return cache;
}

function normAsin(v = '') {
  const id = String(v || '').trim().toUpperCase();
  return /^[A-Z0-9]{10}$/.test(id) ? id : '';
}

function normBarcode(v = '') {
  return String(v || '').replace(/\D/g, '');
}

function barcodeVariants(code = '') {
  const digits = normBarcode(code);
  if (digits.length < 8) return [];
  return [...new Set([
    digits,
    digits.replace(/^0+/, '') || digits,
    digits.length === 12 ? `0${digits}` : '',
    digits.length === 13 && digits.startsWith('0') ? digits.slice(1) : '',
  ].filter(Boolean))];
}

/** ابحث عن منتج أب في الفهرس المحلي — ASIN أو باركود */
export function lookupVariantProduct({ asin = '', barcode = '' } = {}) {
  const index = loadVariantCache();
  const id = normAsin(asin);
  const variants = barcodeVariants(barcode);

  if (id && index.products[id]) return index.products[id];

  for (const product of Object.values(index.products)) {
    if (id && (product.childAsins || []).map(normAsin).includes(id)) return product;
    if (id && normAsin(product.parentAsin) === id) return product;
    const pool = [
      ...(product.barcodes || []),
      ...(product.shades || []).map((s) => s.barcode),
    ].map(normBarcode).filter(Boolean);
    if (variants.some((v) => pool.includes(v))) return product;
  }
  return null;
}

export function resolveParentHint(asin = '') {
  const hit = lookupVariantProduct({ asin });
  return normAsin(hit?.parentAsin) || '';
}

function cloneShades(shades = []) {
  return shades.map((s, index) => ({
    id: normAsin(s.id || s.sku) || String(s.id || '').toUpperCase(),
    sku: normAsin(s.id || s.sku) || String(s.sku || s.id || '').toUpperCase(),
    nameEn: s.nameEn || s.shadeNumber || '',
    nameAr: s.nameAr || '',
    shadeNumber: s.shadeNumber || s.shadeCode || String(index + 1).padStart(2, '0'),
    shadeCode: s.shadeCode || s.shadeNumber || '',
    shadeTitleEn: s.shadeTitleEn || '',
    shadeTitleAr: s.shadeTitleAr || '',
    barcode: s.barcode || '',
    colorHex: s.colorHex || '',
    image: s.image || '',
    swatchImage: s.swatchImage || s.image || '',
    price: s.price || '',
    inStock: true,
    optionGroup: 'التدرج',
  }));
}

/** دمج تفاصيل أمازون مع الفهرس المحلي عند فشل/نقص الزحف الحي */
export function mergeDetailWithVariantCache(detail, {
  asin = '',
  matchedChildAsin = '',
  barcode = '',
  minShades = 8,
} = {}) {
  if (!detail) return detail;
  const liveCount = detail.shades?.length || 0;
  if (liveCount >= minShades) return detail;

  const cached = lookupVariantProduct({
    asin: normAsin(detail.id || detail.parentAsin || asin),
    barcode: barcode || detail.barcode || detail.matchedShadeBarcode,
  }) || lookupVariantProduct({ asin: matchedChildAsin || asin, barcode });

  if (!cached?.shades?.length) return detail;

  const child = normAsin(matchedChildAsin);
  const cachedShades = cloneShades(cached.shades);
  const byId = new Map(cachedShades.map((s) => [normAsin(s.id), s]));
  for (const live of detail.shades || []) {
    const key = normAsin(live.id || live.sku);
    if (!key) continue;
    const prev = byId.get(key);
    if (prev) {
      byId.set(key, {
        ...prev,
        ...live,
        barcode: live.barcode || prev.barcode,
        colorHex: live.colorHex || prev.colorHex,
        image: live.image || prev.image,
        swatchImage: live.swatchImage || prev.swatchImage,
        price: live.price || prev.price,
      });
    } else {
      byId.set(key, live);
    }
  }

  const shades = [...byId.values()];
  const matched = child ? shades.find((s) => normAsin(s.id) === child) : null;
  const knownBarcode = pickBarcode(barcode, detail, matched);

  const enrichedShades = knownBarcode && child
    ? shades.map((s) => (normAsin(s.id) === child
      ? { ...s, barcode: s.barcode || knownBarcode }
      : s))
    : shades;

  return {
    ...detail,
    id: normAsin(cached.parentAsin) || detail.id,
    parentAsin: normAsin(cached.parentAsin) || detail.parentAsin,
    sku: normAsin(cached.parentAsin) || detail.sku,
    nameEn: detail.nameEn || cached.nameEn || '',
    nameAr: detail.nameAr || cached.nameAr || '',
    brandEn: detail.brandEn || cached.brandEn || detail.brandAr || '',
    brandAr: detail.brandAr || cached.brandEn || detail.brandEn || '',
    thumb: detail.thumb || cached.thumb || '',
    shades: enrichedShades,
    shadeCount: enrichedShades.length,
    hasOptions: enrichedShades.length > 1,
    matchedChildAsin: child && child !== normAsin(cached.parentAsin) ? child : detail.matchedChildAsin,
    matchedShadeName: matched?.nameAr || matched?.nameEn || detail.matchedShadeName || '',
    matchedShadeBarcode: matched?.barcode || knownBarcode || detail.matchedShadeBarcode || '',
    barcode: knownBarcode || detail.barcode || matched?.barcode || '',
    source: detail.source ? `${detail.source}+cache` : 'cache',
  };
}

function pickBarcode(requested = '', detail = {}, matchedShade = null) {
  const variants = barcodeVariants(requested);
  if (variants.length) return variants[0];
  const fromMatched = normBarcode(matchedShade?.barcode);
  if (fromMatched.length >= 8) return fromMatched;
  const fromDetail = normBarcode(detail.barcode || detail.matchedShadeBarcode);
  if (fromDetail.length >= 8) return fromDetail;
  return '';
}

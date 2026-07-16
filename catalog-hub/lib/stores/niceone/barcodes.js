import {
  extractBarcode,
  isValidEan,
  isValidGtinChecksum,
} from './client.js';

const NICEONE_CDN_HOST_DIGITS = '14020';

function filenameFromUrl(url = '') {
  return String(url || '').split('/').pop()?.split('?')[0] || '';
}

function splitFilename(url = '') {
  const file = filenameFromUrl(url);
  return file.replace(/\.[a-z0-9-]+$/i, '').split('_');
}

function normalizeSegment(seg = '') {
  return String(seg || '').replace(/[^0-9]/g, '');
}

function isNiceoneCatalogUrl(url = '') {
  return /cloudfront\.net\/image\/catalog/i.test(String(url || ''));
}

/** باركود من دمج أرقام CDN نايس ون (d1aq4ubbxe020v) + بادئة ملف الصورة */
export function barcodeFromNiceoneCdnUrl(url = '') {
  const u = String(url || '');
  if (!isNiceoneCatalogUrl(u)) return '';
  const digits = u.replace(/\D/g, '');
  if (digits.length === 13 && isValidGtinChecksum(digits)) return digits;
  return '';
}

/** بادئة 14020 + 8 أرقام من اسم ملف ثنائي الأجزاء (نمط نارس وغيره) */
export function barcodeFromCatalogPrefix(url = '') {
  if (!isNiceoneCatalogUrl(url)) return '';
  const parts = splitFilename(url);
  if (parts.length !== 2) return '';
  // ملف name-only مثل 41466552_Maybelline... — البادئة ليست باركود
  if (/[a-z]/i.test(parts[1] || '')) return '';
  const prefix = normalizeSegment(parts[0]);
  if (!/^\d{7,8}$/.test(prefix)) return '';
  const candidate = `${NICEONE_CDN_HOST_DIGITS}${prefix.padStart(8, '0').slice(-8)}`;
  if (candidate.length === 13 && isValidGtinChecksum(candidate)) return candidate;
  return '';
}

/**
 * باركود من اسم ملف صورة نايس ون.
 * يدعم: EAN كامل في الجزء الأخير، أكواد 8 أرقام، وبادئة CDN.
 */
function barcodeFromCatalogProductParts(parts = []) {
  if (parts.length < 4) return '';

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const raw = String(parts[i] || '').replace(/-[0-9]+$/i, '');
    const seg = normalizeSegment(raw);
    if (!seg) continue;
    if ((seg.length === 12 || seg.length === 13) && isValidGtinChecksum(seg)) {
      return seg;
    }
  }

  const last = normalizeSegment(String(parts[parts.length - 1] || '').replace(/-[0-9]+$/i, ''));
  const mid = normalizeSegment(parts[parts.length - 2]);
  const prev = normalizeSegment(parts[parts.length - 3]);

  if (last.length === 8 && /^\d{8}$/.test(last)) return last;

  // نمط: timestamp_variant_barcode_variant
  if (last.length <= 5 && mid.length === 8 && /^\d{8}$/.test(mid)) return mid;

  // نمط: timestamp_variant_hash_barcode
  if (mid.length > 8 && prev.length === 8 && /^\d{8}$/.test(prev)) return prev;

  return '';
}

export function barcodeFromImageUrl(url = '') {
  const u = String(url || '');
  if (!u) return '';

  const parts = splitFilename(u);

  if (/catalog\/product/i.test(u)) {
    const fromProduct = barcodeFromCatalogProductParts(parts);
    if (fromProduct) return fromProduct;
  }

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const raw = String(parts[i] || '').replace(/-[0-9]+$/i, '');
    const seg = normalizeSegment(raw);
    if (!seg) continue;

    if ((seg.length === 12 || seg.length === 13) && isValidGtinChecksum(seg)) {
      return seg;
    }
  }

  const fromPrefix = barcodeFromCatalogPrefix(u);
  if (fromPrefix) return fromPrefix;

  const fromCdn = barcodeFromNiceoneCdnUrl(u);
  if (fromCdn) return fromCdn;

  return '';
}

export function collectBarcodeFromSources(sources = {}) {
  const textFields = [
    sources.isbn,
    sources.barcode,
    sources.ean,
    sources.upc,
    sources.gtin,
    sources.sku,
  ];

  for (const src of textFields) {
    const fromText = extractBarcode(src);
    if (fromText) return fromText;
  }

  const images = Array.isArray(sources.images) ? sources.images : [];
  for (const img of images) {
    const fromImg = barcodeFromImageUrl(img);
    if (fromImg) return fromImg;
  }

  return '';
}

/** جمع باركودات من HTML الصفحة بالقرب من SKU كل درجة */
export function harvestShadeBarcodesFromHtml(html = '', shades = []) {
  const body = String(html || '');
  if (!body || !shades.length) return shades;

  const byKey = new Map();
  for (const shade of shades) {
    const sku = String(shade.sku || '').trim();
    if (!sku || sku.length < 4) continue;

    let idx = 0;
    while ((idx = body.indexOf(sku, idx)) !== -1) {
      const chunk = body.slice(Math.max(0, idx - 180), idx + 520);
      for (const match of chunk.matchAll(/_(\d{12,13})(?:-\d+)?/g)) {
        const digits = match[1];
        if (!isValidGtinChecksum(digits)) continue;
        byKey.set(String(shade.id || sku), digits);
        byKey.set(sku, digits);
      }
      idx += sku.length;
    }
  }

  return shades.map((shade) => {
    if (shade.barcode) return shade;
    const hit = byKey.get(String(shade.id || '')) || byKey.get(String(shade.sku || ''));
    return hit ? { ...shade, barcode: hit } : shade;
  });
}

export function enrichShadesWithBarcodes(shades = [], { html = '' } = {}) {
  let out = shades.map((shade) => {
    if (shade.barcode) return shade;
    const images = [
      shade.image,
      ...(Array.isArray(shade.additional_images) ? shade.additional_images : []),
    ].filter(Boolean);
    const barcode = collectBarcodeFromSources({
      isbn: shade.isbn,
      barcode: shade.barcode,
      ean: shade.ean,
      upc: shade.upc,
      gtin: shade.gtin,
      sku: shade.sku,
      images,
    });
    return barcode ? { ...shade, barcode } : shade;
  });

  if (html) {
    out = harvestShadeBarcodesFromHtml(html, out);
  }

  return out;
}

export function pickProductBarcode({ barcode = '', images = [], shades = [] } = {}) {
  const main = extractBarcode(barcode);
  if (main) return main;

  for (const img of images) {
    const fromImg = barcodeFromImageUrl(img);
    if (fromImg) return fromImg;
  }

  return shades.find((s) => s.barcode)?.barcode || '';
}

export function isLikelyNiceoneBarcode(digits = '') {
  const d = String(digits || '').replace(/\D/g, '');
  return isValidEan(d);
}

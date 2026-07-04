/** GTIN / barcode normalization — single source of truth */

export function normalizeBarcodeQuery(raw = '') {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  return digits;
}

export function normalizeGtinCompare(digits = '') {
  const d = String(digits || '').replace(/\D/g, '');
  if (!d) return '';
  return d.replace(/^0+/, '') || d;
}

export function barcodeQueryVariants(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  const out = new Set([digits]);
  const stripped = digits.replace(/^0+/, '') || digits;
  out.add(stripped);
  if (digits.length === 13 && digits.startsWith('0')) out.add(digits.slice(1));
  if (stripped.length <= 12) out.add(stripped.padStart(12, '0'));
  if (stripped.length <= 13) out.add(stripped.padStart(13, '0'));
  return [...out].filter((v) => v.length >= 8 && v.length <= 14);
}

export function barcodeMatches(a, b) {
  const na = normalizeGtinCompare(a);
  const nb = normalizeGtinCompare(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 8 && nb.length >= 8) {
    if (na.endsWith(nb) || nb.endsWith(na)) return true;
  }
  return false;
}

export function isValidBarcodeValue(v) {
  const d = String(v || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(d);
}

/** تنظيف الباركود — ASCII فقط، بدون تشكيل أو رموز RTL */

const BIDI_AND_TASHKEEL =
  /[\u064B-\u065F\u0670\u06D6-\u06ED\u200E\u200F\u202A-\u202E\uFEFF]/g;

/** أحرف مسموحة في باركود POS: AV_018_2025, 6281000123456, إلخ */
const BARCODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\-./+]*$/;

export function normalizeBarcode(raw: string | null | undefined): string {
  if (raw == null) return "";
  return String(raw)
    .replace(/\u00A0/g, " ")
    .replace(BIDI_AND_TASHKEEL, "")
    .replace(/[^\x21-\x7E]/g, "")
    .trim();
}

export function isLikelyBarcode(code: string): boolean {
  if (!code || code.length < 2) return false;
  return BARCODE_PATTERN.test(code);
}

export function resolveProductBarcode(fields: {
  barcode?: string | null;
  productNum?: string | null;
  productCode?: number | string | null;
}): string | null {
  const barcode = normalizeBarcode(fields.barcode);
  const num = normalizeBarcode(fields.productNum);

  if (barcode && isLikelyBarcode(barcode)) return barcode;
  if (num && isLikelyBarcode(num)) return num;
  if (barcode) return barcode;
  if (num) return num;
  if (fields.productCode != null && String(fields.productCode).trim()) {
    return String(fields.productCode).trim();
  }
  return null;
}

/** يجرب أكثر من صيغة للبحث (مثل AV_018_2025 بدل ِ{_018_2025) */
export function barcodeLookupCandidates(raw: string | null | undefined): string[] {
  const normalized = normalizeBarcode(raw);
  if (!normalized) return [];

  const candidates = new Set<string>();
  candidates.add(normalized);

  if (isLikelyBarcode(normalized)) {
    candidates.add(normalized.toUpperCase());
  }

  return [...candidates];
}

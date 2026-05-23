const BIDI_AND_TASHKEEL =
  /[\u064B-\u065F\u0670\u06D6-\u06ED\u200E\u200F\u202A-\u202E\uFEFF]/g;

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

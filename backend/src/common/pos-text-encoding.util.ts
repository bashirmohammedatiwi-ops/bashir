import iconv from "iconv-lite";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function replacementCount(value: string): number {
  return (value.match(/\uFFFD|�/g) ?? []).length;
}

function decodeWin1256FromLatin1(value: string): string {
  return iconv.decode(Buffer.from(value, "latin1"), "win1256");
}

/** Repair Arabic POS text when SQL Server VARCHAR (CP1256) was mis-read as UTF-8/Latin-1. */
export function fixPosArabicText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.replace(/\u0000/g, "").trim();
  if (!trimmed) return null;

  if (ARABIC_RE.test(trimmed) && replacementCount(trimmed) === 0) {
    return trimmed;
  }

  if (!/[^\x00-\x7F]/.test(trimmed)) {
    return trimmed;
  }

  const repaired = decodeWin1256FromLatin1(trimmed).trim();
  if (!repaired) return trimmed;

  const repairedArabic = ARABIC_RE.test(repaired);
  const originalArabic = ARABIC_RE.test(trimmed);

  if (repairedArabic && (!originalArabic || replacementCount(repaired) < replacementCount(trimmed))) {
    return repaired;
  }

  if (replacementCount(repaired) < replacementCount(trimmed)) {
    return repaired;
  }

  return trimmed;
}

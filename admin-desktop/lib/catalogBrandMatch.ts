/** مطابقة أسماء البراندات بين الكتالوج والتطبيق */

import type { CatalogBrandRow } from "./catalogImport";

const AR_BRAND_ALIASES: Record<string, string> = {
  شانيل: "chanel",
  ديور: "dior",
  "إيف سان لوران": "yves saint laurent",
  "ايف سان لوران": "yves saint laurent",
  لانكوم: "lancome",
  ماك: "mac",
  نارس: "nars",
  كلينيك: "clinique",
  جيفنشي: "givenchy",
  غوتشي: "gucci",
  برادا: "prada",
  هيرميس: "hermes",
  فالنتينو: "valentino",
  بربري: "burberry",
  ارماني: "armani",
  أرماني: "armani",
  "توم فورد": "tom ford",
  "بوبي براون": "bobbi brown",
  "شارلوت تيلبري": "charlotte tilbury",
};

const EN_BRAND_ALIASES: Record<string, string> = {
  "m a c": "mac",
  "m.a.c": "mac",
  "mac cosmetics": "mac",
  ysl: "yves saint laurent",
  "yves saint laurent beaute": "yves saint laurent",
  "estée lauder": "estee lauder",
  "makeup forever": "make up for ever",
  "l oreal": "loreal",
  "l'oreal": "loreal",
  "loreal paris": "loreal",
};

export function normalizeBrandKey(name = "") {
  let key = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[''`´]/g, "")
    .replace(/[.&]/g, " ")
    .replace(/\b(the|and|co|company|ltd|inc|llc|gmbh|paris|london|uae|ae)\b/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!key) return "";
  if (AR_BRAND_ALIASES[key]) return AR_BRAND_ALIASES[key];
  if (EN_BRAND_ALIASES[key]) return EN_BRAND_ALIASES[key];

  key = key
    .replace(/\b(beauty|cosmetics|makeup|skincare|fragrance|perfume|parfum)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return EN_BRAND_ALIASES[key] || key;
}

function scoreBrandMatch(hints: string[], candidates: string[]) {
  let best = 0;
  for (const hint of hints) {
    const h = normalizeBrandKey(hint);
    if (!h) continue;
    for (const raw of candidates) {
      const c = normalizeBrandKey(raw);
      if (!c) continue;
      if (h === c) best = Math.max(best, 100);
      else if (h.includes(c) || c.includes(h)) best = Math.max(best, 82);
      else {
        const hWords = h.split(" ").filter((w) => w.length > 1);
        const cWords = c.split(" ").filter((w) => w.length > 1);
        const overlap = hWords.filter((w) =>
          cWords.some((cw) => cw === w || cw.includes(w) || w.includes(cw)),
        ).length;
        if (overlap >= 2) best = Math.max(best, 88);
        else if (overlap === 1) best = Math.max(best, 70);
      }
    }
  }
  return best;
}

export function matchBrandIdLocal(
  brands: Array<{ id?: string; name?: string; slug?: string; nameAr?: string; nameEn?: string }> = [],
  brandAr = "",
  brandEn = "",
) {
  const hints = [brandAr, brandEn].map((s) => String(s || "").trim()).filter(Boolean);
  if (!hints.length) return undefined;

  let best: { id: string; score: number } | null = null;
  for (const b of brands) {
    const names = [b.name, b.slug, b.nameAr, b.nameEn]
      .map((n) => String(n || ""))
      .filter(Boolean);
    const score = scoreBrandMatch(hints, names);
    if (score >= 75 && b.id && (!best || score > best.score)) {
      best = { id: b.id, score };
    }
  }
  return best?.id;
}

export function matchCatalogBrandRow(
  catalogBrands: CatalogBrandRow[] = [],
  brandAr = "",
  brandEn = "",
): CatalogBrandRow | undefined {
  const hints = [brandAr, brandEn].map((s) => String(s || "").trim()).filter(Boolean);
  if (!hints.length) return undefined;

  let best: { row: CatalogBrandRow; score: number } | null = null;
  for (const row of catalogBrands) {
    const names = [row.name, row.nameAr, row.nameEn, row.key]
      .map((n) => String(n || ""))
      .filter(Boolean);
    const score = scoreBrandMatch(hints, names);
    if (score >= 75 && (!best || score > best.score)) {
      best = { row, score };
    }
  }
  return best?.row;
}

export function catalogBrandLogoUrl(row?: CatalogBrandRow) {
  if (!row) return undefined;
  return row.logoUrl || undefined;
}

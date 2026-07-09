/** مطابقة أسماء البراندات بين الكتالوج والتطبيق */

export function normalizeBrandKey(name = "") {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchBrandIdLocal(
  brands: Array<{ id?: string; name?: string; slug?: string; nameAr?: string; nameEn?: string }> = [],
  brandAr = "",
  brandEn = "",
) {
  const keys = [brandAr, brandEn]
    .map((s) => normalizeBrandKey(s))
    .filter(Boolean);
  if (!keys.length) return undefined;

  let best: { id: string; score: number } | null = null;
  for (const b of brands) {
    const names = [b.name, b.slug, b.nameAr, b.nameEn]
      .map((n) => normalizeBrandKey(String(n || "")))
      .filter(Boolean);
    let score = 0;
    for (const k of keys) {
      for (const n of names) {
        if (k === n) score = Math.max(score, 100);
        else if (k.includes(n) || n.includes(k)) score = Math.max(score, 75);
      }
    }
    if (score >= 75 && b.id && (!best || score > best.score)) {
      best = { id: b.id, score };
    }
  }
  return best?.id;
}

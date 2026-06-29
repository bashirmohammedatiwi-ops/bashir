type NamedEntity = { id: string; nameAr?: string; nameEn?: string; name?: string };

function norm(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreName(hint: string, entity: NamedEntity) {
  const h = norm(hint);
  if (!h) return 0;
  const candidates = [entity.nameAr, entity.nameEn, entity.name].filter(Boolean).map((x) => norm(x!));
  let best = 0;
  for (const c of candidates) {
    if (!c) continue;
    if (h === c) best = Math.max(best, 100);
    else if (h.includes(c) || c.includes(h)) best = Math.max(best, 70);
    else {
      const hWords = h.split(" ");
      const cWords = c.split(" ");
      const overlap = hWords.filter((w) => w.length > 2 && cWords.some((cw) => cw.includes(w) || w.includes(cw))).length;
      if (overlap > 0) best = Math.max(best, 30 + overlap * 15);
    }
  }
  return best;
}

function splitHintParts(hintAr = "", hintEn = "") {
  const raw = [hintAr, hintEn].join(" › ");
  return raw
    .split(/[›>／/|»«]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function matchCategoryFromHints(
  categories: NamedEntity[],
  subcategories: NamedEntity[],
  tertiarySections: NamedEntity[],
  hintAr = "",
  hintEn = "",
) {
  const parts = splitHintParts(hintAr, hintEn);
  const deepest = parts[parts.length - 1] || hintAr || hintEn;

  let bestTertiary: { id: string; score: number } | null = null;
  for (const t of tertiarySections) {
    const score = Math.max(...parts.map((p) => scoreName(p, t)), scoreName(deepest, t));
    if (score >= 50 && (!bestTertiary || score > bestTertiary.score)) bestTertiary = { id: t.id, score };
  }

  let bestSub: { id: string; score: number } | null = null;
  for (const s of subcategories) {
    const score = Math.max(...parts.map((p) => scoreName(p, s)), scoreName(deepest, s));
    if (score >= 50 && (!bestSub || score > bestSub.score)) bestSub = { id: s.id, score };
  }

  let bestCat: { id: string; score: number } | null = null;
  for (const c of categories) {
    const score = Math.max(...parts.map((p) => scoreName(p, c)), scoreName(deepest, c));
    if (score >= 40 && (!bestCat || score > bestCat.score)) bestCat = { id: c.id, score };
  }

  return {
    categoryId: bestCat?.id,
    subcategoryId: bestSub?.id,
    tertiaryCategoryId: bestTertiary?.id,
    hintParts: parts,
  };
}

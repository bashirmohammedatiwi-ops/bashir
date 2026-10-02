import type { AiAutofillCategory } from "./aiProductTypes";
import { matchCategoryFromHints } from "./catalogCategoryMatch";
import { queries } from "./queries";

type NamedEntity = { id: string; nameAr?: string; nameEn?: string; name?: string };

function norm(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchByName(rows: NamedEntity[], name?: string | null) {
  const tn = norm(name ?? "");
  if (!tn) return undefined;
  for (const row of rows) {
    const n = norm(row.nameAr || row.name || row.nameEn || "");
    if (!n) continue;
    if (n === tn || n.includes(tn) || tn.includes(n)) return row.id;
  }
  return undefined;
}

function guessMainFromText(categories: NamedEntity[], hay: string) {
  const n = norm(hay);
  for (const c of categories) {
    const label = norm(c.nameAr || c.name || c.nameEn || "");
    if (!label) continue;
    if (label.includes("مكياج") || label.includes("makeup")) {
      if (/lip|شفاه|fluid|gloss|mat\s*passion|rouge|lipstick/.test(n)) return c.id;
    }
  }
  for (const c of categories) {
    const label = norm(c.nameAr || c.name || c.nameEn || "");
    if (label.includes("مكياج") || label.includes("makeup")) return c.id;
  }
  return categories[0]?.id;
}

export type AppliedCategories = {
  categoryId?: string;
  subcategoryIds: string[];
  tertiaryCategoryIds: string[];
};

/** Apply API category payload with cascading fetch — mirrors mobile shade wizard. */
export async function applyAiCategories(
  category: AiAutofillCategory,
  context: {
    categories: NamedEntity[];
    nameAr?: string;
    nameEn?: string;
    productTypeAr?: string;
    hint?: string;
  },
): Promise<AppliedCategories> {
  const categories = context.categories ?? [];
  const hay = [context.nameAr, context.nameEn, context.productTypeAr, context.hint, category.categoryNameAr]
    .filter(Boolean)
    .join(" ");

  let categoryId = category.categoryId ?? undefined;
  let subcategoryIds: string[] = [...(category.subcategoryIds ?? [])];
  if (!subcategoryIds.length && category.subcategoryId) subcategoryIds = [category.subcategoryId];
  let tertiaryCategoryIds: string[] = [...(category.tertiaryCategoryIds ?? [])];
  if (!tertiaryCategoryIds.length && category.tertiaryCategoryId) {
    tertiaryCategoryIds = [category.tertiaryCategoryId];
  }

  if (!categoryId) {
    categoryId = matchByName(categories, category.categoryNameAr) ?? guessMainFromText(categories, hay);
  }

  if (!categoryId) {
    const guessed = matchCategoryFromHints(categories, [], [], context.nameAr ?? "", context.nameEn ?? "");
    categoryId = guessed.categoryId;
  }

  if (!categoryId) {
    return { categoryId: undefined, subcategoryIds: [], tertiaryCategoryIds: [] };
  }

  const subs = (await queries.subcategories({ parentId: categoryId })) as NamedEntity[];
  subcategoryIds = subcategoryIds.filter((id) => subs.some((s: NamedEntity) => s.id === id));
  if (!subcategoryIds.length) {
    subcategoryIds = [
      matchByName(subs, category.subcategoryNameAr),
      matchCategoryFromHints(categories, subs, [], context.nameAr ?? "", context.nameEn ?? "").subcategoryId,
    ].filter((id): id is string => Boolean(id));
  }
  if (!subcategoryIds.length && /lip|شفاه|fluid|gloss|mat\s*passion/.test(norm(hay))) {
    const lip = subs.find((s: NamedEntity) => /شفاه|lip/i.test(s.nameAr || s.name || s.nameEn || ""));
    if (lip) subcategoryIds = [lip.id];
  }

  const tertRows: NamedEntity[] = [];
  const seenTert = new Set<string>();
  for (const subId of subcategoryIds) {
    const list = await queries.tertiarySections({ parentId: subId });
    for (const t of list) {
      if (!seenTert.has(t.id)) {
        seenTert.add(t.id);
        tertRows.push(t);
      }
    }
  }

  tertiaryCategoryIds = tertiaryCategoryIds.filter((id) => tertRows.some((t) => t.id === id));
  if (!tertiaryCategoryIds.length) {
    tertiaryCategoryIds = [
      matchByName(tertRows, category.tertiaryNameAr),
      matchCategoryFromHints(categories, subs, tertRows, context.nameAr ?? "", context.nameEn ?? "")
        .tertiaryCategoryId,
    ].filter((id): id is string => Boolean(id));
  }
  if (!tertiaryCategoryIds.length && context.productTypeAr) {
    const id = matchByName(tertRows, context.productTypeAr);
    if (id) tertiaryCategoryIds = [id];
  }

  return { categoryId, subcategoryIds, tertiaryCategoryIds };
}

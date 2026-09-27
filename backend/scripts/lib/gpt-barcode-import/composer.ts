/**
 * Composer-side enrichment — descriptions, categories, brands (no GPT).
 */
import type { CategoryCatalog, ComposerCategories, VariantInput } from "./types";

const KEYWORD_RULES: Array<{
  keywords: string[];
  sub_en: string;
  tertiary_en?: string;
}> = [
  { keywords: ["eyeshadow", "eye shadow", "shadow wand", "shadow stick"], sub_en: "Eyes", tertiary_en: "Eyeshadow" },
  { keywords: ["mascara"], sub_en: "Eyes", tertiary_en: "Mascara" },
  { keywords: ["eyeliner", "eye liner", "kajal"], sub_en: "Eyes", tertiary_en: "Eyeliner" },
  { keywords: ["brow", "eyebrow"], sub_en: "Eyebrow" },
  { keywords: ["lipstick", "lip color", "lip gloss", "lip tint", "lip pen"], sub_en: "Lips" },
  { keywords: ["foundation"], sub_en: "Face", tertiary_en: "Foundation" },
  { keywords: ["concealer"], sub_en: "Face", tertiary_en: "Concealer" },
  { keywords: ["blush", "rouge"], sub_en: "Cheek", tertiary_en: "Blush" },
  { keywords: ["highlighter"], sub_en: "Highlighter" },
  { keywords: ["primer"], sub_en: "Face", tertiary_en: "Primer" },
  { keywords: ["powder"], sub_en: "Face", tertiary_en: "Powder" },
  { keywords: ["cleanser", "face wash", "غسول"], sub_en: "Face", tertiary_en: "Cleanser" },
  { keywords: ["serum", "سيروم"], sub_en: "Face", tertiary_en: "Serum" },
  { keywords: ["moistur", "cream", "كريم"], sub_en: "Face", tertiary_en: "Moisturizer" },
  { keywords: ["shampoo", "شامبو"], sub_en: "Hair", tertiary_en: "Shampoo" },
  { keywords: ["conditioner", "بلسم"], sub_en: "Hair", tertiary_en: "Conditioner" },
  { keywords: ["perfume", "eau de", "عطر"], sub_en: "Women", tertiary_en: "Perfume" },
  { keywords: ["nail", "مانيكير", "vernis"], sub_en: "Nail Polish" },
];

const AR_KEYWORDS: Array<{ keywords: string[]; sub_ar: string; tertiary_ar?: string }> = [
  { keywords: ["ظلال", "ايشادو", "شادو"], sub_ar: "العيون", tertiary_ar: "ايشادو" },
  { keywords: ["ماسكرا"], sub_ar: "العيون", tertiary_ar: "ماسكرا" },
  { keywords: ["كحل", "آيلاينر"], sub_ar: "العيون", tertiary_ar: "كحل" },
  { keywords: ["حواجب", "حاجب"], sub_ar: "الحواجب" },
  { keywords: ["شفاه", "كريم شفاه", "أحمر شفاه"], sub_ar: "الشفاه" },
  { keywords: ["فاونديشن", "أساس"], sub_ar: "الوجه", tertiary_ar: "فاونديشن" },
  { keywords: ["كونسيلر", "كونسيل"], sub_ar: "الوجه", tertiary_ar: "كونسيلر" },
];

export function parseBrand(nameEn: string, nameAr: string): { brand_en: string; brand_ar: string } {
  const enParts = nameEn.split(/\s*[–—-]\s*/);
  const arParts = nameAr.split(/\s*[–—-]\s*/);
  const brandEn = enParts[0]?.trim() || nameEn.split(/\s+/)[0] || "Unknown";
  const brandAr = arParts[0]?.trim() || brandEn;
  return { brand_en: brandEn, brand_ar: brandAr };
}

function scoreRule(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) score += kw.length;
  }
  return score;
}

export function inferCategories(
  catalog: CategoryCatalog,
  nameEn: string,
  nameAr: string,
): ComposerCategories | { needs_review: true; reason: string } {
  const combined = `${nameEn} ${nameAr}`;
  let bestScore = 0;
  let bestRule: typeof KEYWORD_RULES[number] | null = null;

  for (const rule of KEYWORD_RULES) {
    const score = scoreRule(combined, rule.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  for (const rule of AR_KEYWORDS) {
    const score = scoreRule(combined, rule.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestRule = {
        keywords: rule.keywords,
        sub_en: rule.sub_ar,
        tertiary_en: rule.tertiary_ar,
      };
    }
  }

  if (!bestRule || bestScore === 0) {
    return { needs_review: true, reason: "Could not infer category from product name" };
  }

  const makeup = catalog.main.find((m) => m.slug === "makeup" || m.name_en === "Makeup");
  const care = catalog.main.find((m) => m.slug === "care" || m.name_en === "Care");
  const perfume = catalog.main.find((m) => m.slug === "perfume" || m.name_en === "Perfumes");

  let mainId = makeup?.id;
  if (bestRule.keywords.some((k) => ["cleanser", "serum", "moistur", "cream", "غسول", "سيروم", "كريم"].includes(k))) {
    mainId = care?.id ?? mainId;
  }
  if (bestRule.keywords.some((k) => ["perfume", "eau de", "عطر"].includes(k))) {
    mainId = perfume?.id ?? mainId;
  }
  if (!mainId) return { needs_review: true, reason: "No main category match" };

  const main = catalog.main.find((m) => m.id === mainId)!;
  const sub = catalog.sub.find(
    (s) => s.parent_id === mainId && s.name_en.toLowerCase() === bestRule!.sub_en.toLowerCase(),
  );
  if (!sub) {
    const subAr = catalog.sub.find(
      (s) => s.parent_id === mainId && s.name_ar === bestRule!.sub_en,
    );
    if (!subAr) return { needs_review: true, reason: `Subcategory not found: ${bestRule.sub_en}` };
    return buildResult(main, subAr, catalog, bestRule.tertiary_en);
  }
  return buildResult(main, sub, catalog, bestRule.tertiary_en);
}

function buildResult(
  main: CategoryCatalog["main"][number],
  sub: CategoryCatalog["sub"][number],
  catalog: CategoryCatalog,
  tertiaryHint?: string,
): ComposerCategories | { needs_review: true; reason: string } {
  const tertiaryList = catalog.tertiary.filter((t) => t.parent_id === sub.id && t.main_id === main.id);
  let tertiary = tertiaryList[0];
  if (tertiaryHint) {
    const match = tertiaryList.find(
      (t) =>
        t.name_en.toLowerCase() === tertiaryHint.toLowerCase() ||
        t.name_ar === tertiaryHint,
    );
    if (match) tertiary = match;
  }

  return {
    main_category: { id: main.id, name_ar: main.name_ar, name_en: main.name_en },
    subcategories: [{ id: sub.id, name_ar: sub.name_ar, name_en: sub.name_en }],
    secondary_categories: tertiary
      ? [{ id: tertiary.id, name_ar: tertiary.name_ar, name_en: tertiary.name_en }]
      : [],
  };
}

export function buildDescriptions(
  nameEn: string,
  nameAr: string,
  variants?: VariantInput[],
): { description_ar: string; description_en: string } {
  const shadeBlockAr =
    variants && variants.length > 0
      ? "\n\nالدرجات المتوفرة:\n" + variants.map((v) => `• ${v.variant_value}`).join("\n")
      : "";
  const shadeBlockEn =
    variants && variants.length > 0
      ? "\n\nAvailable shades:\n" + variants.map((v) => `• ${v.variant_value}`).join("\n")
      : "";

  const description_ar =
    `${nameAr} — منتج أصلي مناسب للاستخدام اليومي.\n\n` +
    "• تركيبة عالية الجودة مناسبة للسوق العراقي.\n" +
    "• نتيجة متوازنة وسهلة في الاستخدام.\n" +
    "• مناسب للاستخدام اليومي أو المناسبات.\n" +
    "• يُرجى قراءة التعليمات على العبوة قبل الاستخدام." +
    shadeBlockAr;

  const description_en =
    `${nameEn} — authentic product for everyday use.\n\n` +
    "• Quality formula suited for daily beauty routines.\n" +
    "• Balanced results with easy application.\n" +
    "• Suitable for everyday wear or special occasions.\n" +
    "• Please read package instructions before use." +
    shadeBlockEn;

  return { description_ar, description_en };
}

export function slugify(nameEn: string, suffix: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${base}-${suffix.slice(-6)}`;
}

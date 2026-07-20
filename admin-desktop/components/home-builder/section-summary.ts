import { labelForType } from "./section-types";
import { labelForCardSize } from "./card-sizes";
import { labelForAdSlot } from "./ad-slots";

export function sectionSummary(block: {
  type: string;
  title?: string;
  payload?: Record<string, unknown>;
}): string {
  const p = block.payload ?? {};
  const arr = (k: string) => (Array.isArray(p[k]) ? (p[k] as unknown[]).length : 0);
  const layout = p.sectionLayout ? ` · ${p.sectionLayout}` : "";
  const size = p.adSlot
    ? ` · ${labelForAdSlot(String(p.adSlot))}`
    : p.cardSize
      ? ` · ${labelForCardSize(String(p.cardSize))}`
      : "";

  switch (block.type) {
    case "HERO_BANNER":
      return `${arr("bannerIds") || "كل"} بنر · ${arr("categoryIds") || "كل"} فئة`;
    case "PROMO_STRIP":
      return String(p.text ?? "").slice(0, 40) || "بدون نص";
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      if (arr("productIds")) return `${arr("productIds")} منتج (يدوي)`;
      return `فلتر: ${filterLabel(String(p.filter ?? ""))}`;
    case "IMAGE_TILES":
      return `${arr("items")} بطاقة · ${p.columns ?? 2} أعمدة · ${p.shape ?? "rect"}${layout}${size}`;
    case "IMAGE_MARQUEE":
      return `${arr("items")} صورة متحركة${layout}${size}`;
    case "CIRCLE_TILES":
      return `${arr("items")} دائرة${layout}${size}`;
    case "ROUTINE_CAROUSEL":
      return `روتين: ${p.kind ?? "ROUTINE_MORNING"}`;
    case "CARE_HUB":
      return `مشاكل ${arr("concernIds") || "الكل"} · فئات ${arr("categoryIds") || "—"}`;
    case "PACKAGES":
      return arr("packageIds") ? `${arr("packageIds")} باقة` : `كل الباقات · ${p.kind ?? "all"}`;
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return arr("brandIds") ? `${arr("brandIds")} براند` : "كل البراندات";
    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
    case "MAKEUP_CATEGORIES":
      return arr("categoryIds") ? `${arr("categoryIds")} فئة` : `كل الفئات${layout}${size}`;
    case "SKIN_CONCERNS":
      return arr("concernIds") ? `${arr("concernIds")} مشكلة` : "كل المشاكل";
    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      if (p.source === "inline") return `صورة مباشرة${size}`;
      return p.bannerId ? `بنر محدد${size}` : `أول بنر نشط${size}`;
    case "BANNER_GRID_2":
    case "BANNER_GRID_3":
    case "BANNER_CAROUSEL":
      return arr("bannerIds") ? `${arr("bannerIds")} بنر` : "كل البنرات";
    default:
      return `${labelForType(block.type)}${layout}${size}`;
  }
}

function filterLabel(f: string) {
  const map: Record<string, string> = {
    promo: "عروض",
    new: "جديد",
    bestSeller: "الأكثر مبيعاً",
    featured: "مختارة",
  };
  return map[f] ?? (f || "افتراضي");
}

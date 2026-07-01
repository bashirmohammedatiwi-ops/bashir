import { labelForType } from "./section-types";

export type SectionWarning = {
  level: "error" | "warn" | "info";
  message: string;
};

export function validateSection(block: {
  type: string;
  title?: string;
  isActive?: boolean;
  payload?: Record<string, unknown>;
}): SectionWarning[] {
  const warnings: SectionWarning[] = [];
  const p = block.payload ?? {};
  const active = block.isActive !== false;

  if (!active) {
    warnings.push({ level: "info", message: "القسم مخفي — لن يظهر في التطبيق" });
  }

  switch (block.type) {
    case "HERO_BANNER":
      if (!asArray(p.bannerIds).length) warnings.push({ level: "warn", message: "لم تُحدَّد بنرات — سيُستخدم أول بنر نشط" });
      break;
    case "PROMO_STRIP":
      if (!String(p.text ?? "").trim()) warnings.push({ level: "error", message: "نص الشريط الترويجي فارغ" });
      break;
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      if (p.source === "manual" && !asArray(p.productIds).length) {
        warnings.push({ level: "error", message: "لم تُختر منتجات يدوياً" });
      }
      if (block.type === "FLASH_SALE" && !p.endsAt) {
        warnings.push({ level: "warn", message: "لم يُحدَّد وقت انتهاء العرض" });
      }
      break;
    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      if (!p.bannerId) warnings.push({ level: "warn", message: "لم يُحدَّد بنر" });
      break;
    case "BANNER_GRID_2":
    case "BANNER_GRID_3":
    case "BANNER_CAROUSEL":
      if (!asArray(p.bannerIds).length) warnings.push({ level: "warn", message: "لم تُحدَّد بنرات" });
      break;
    case "IMAGE_TILES":
      if (!asArray(p.items).length) warnings.push({ level: "error", message: "أضف بطاقة صورة واحدة على الأقل" });
      break;
    case "PACKAGES":
      if (!asArray(p.packageIds).length) warnings.push({ level: "warn", message: "لم تُحدَّد باقات — ستُعرض كل الباقات" });
      break;
    default:
      break;
  }

  if (!block.title && !["HERO_BANNER", "PROMO_STRIP", "BANNER_FULL", "CUSTOM_BANNER"].includes(block.type)) {
    warnings.push({ level: "info", message: "بدون عنوان — سيُستخدم اسم النوع: " + labelForType(block.type) });
  }

  return warnings;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export function countWarnings(blocks: { type: string; title?: string; isActive?: boolean; payload?: Record<string, unknown> }[]) {
  let errors = 0;
  let warns = 0;
  for (const b of blocks) {
    for (const w of validateSection(b)) {
      if (w.level === "error") errors++;
      if (w.level === "warn") warns++;
    }
  }
  return { errors, warns };
}

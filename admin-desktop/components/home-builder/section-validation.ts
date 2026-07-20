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
      if (!asArray(p.bannerIds).length) {
        warnings.push({ level: "warn", message: "لم تُحدَّد بنرات — سيُستخدم أول بنر نشط" });
      }
      if (!asArray(p.categoryIds).length) {
        warnings.push({ level: "warn", message: "بدون فئات — الهيرو يعرض البنر فقط بدون دوائر" });
      }
      break;
    case "PROMO_STRIP": {
      const text = String(p.text ?? "").trim();
      const items = asArray(p.items).map(String).filter((s) => s.trim());
      if (!text && !items.length) {
        warnings.push({ level: "error", message: "أضف نصاً أو أسطر للنشرة" });
      }
      const hasLink =
        (p.linkType && String(p.linkType).trim()) ||
        (p.link && String(p.link).trim());
      if (active && (text || items.length) && !hasLink) {
        warnings.push({ level: "warn", message: "لم يُحدَّد رابط — الضغط على الشريط لن يفعل شيئاً" });
      }
      break;
    }
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      if (p.source === "manual" && !asArray(p.productIds).length) {
        warnings.push({ level: "error", message: "لم تُختر منتجات يدوياً" });
      }
      if (
        p.source !== "manual" &&
        !asArray(p.productIds).length &&
        !p.categoryId &&
        !p.subcategoryId &&
        !p.brandId
      ) {
        warnings.push({ level: "info", message: "الفلتر العام — يمكن تحديد فئة أو براند من تبويب الروابط" });
      }
      if (block.type === "FLASH_SALE" && !p.endsAt) {
        warnings.push({ level: "warn", message: "لم يُحدَّد وقت انتهاء العرض" });
      }
      break;
    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      if (p.source === "inline") {
        if (!p.imageId) warnings.push({ level: "error", message: "أضف صورة الإعلان" });
      } else if (!p.bannerId) {
        warnings.push({ level: "warn", message: "لم يُحدَّد بنر" });
      }
      break;
    case "BANNER_GRID_2": {
      const count = bannerCount(p);
      if (active && count !== 2) {
        warnings.push({
          level: count === 0 ? "error" : "warn",
          message: count === 0 ? "أضف بنرين بالضبط" : `شبكة 2 تحتاج بنرين — لديك ${count}`,
        });
      }
      break;
    }
    case "BANNER_GRID_3": {
      const count = bannerCount(p);
      if (active && count !== 3) {
        warnings.push({
          level: count === 0 ? "error" : "warn",
          message: count === 0 ? "أضف 3 بنرات" : `شبكة 3 تحتاج 3 بنرات — لديك ${count}`,
        });
      }
      break;
    }
    case "BANNER_CAROUSEL":
      if (!asArray(p.bannerIds).length) warnings.push({ level: "warn", message: "لم تُحدَّد بنرات" });
      break;
    case "IMAGE_TILES": {
      const items = asArray(p.items);
      if (!items.length) warnings.push({ level: "error", message: "أضف بطاقة صورة واحدة على الأقل" });
      items.forEach((item, i) => {
        const row = item as Record<string, unknown>;
        if (!row?.imageId) warnings.push({ level: "error", message: `البطاقة ${i + 1}: أضف صورة` });
      });
      break;
    }
    case "IMAGE_MARQUEE": {
      const items = asArray(p.items);
      if (!items.length) warnings.push({ level: "error", message: "أضف صورة واحدة على الأقل للشريط المتحرك" });
      items.forEach((item, i) => {
        const row = item as Record<string, unknown>;
        if (!row?.imageId) warnings.push({ level: "error", message: `الصورة ${i + 1}: أضف صورة` });
      });
      break;
    }
    case "CIRCLE_TILES": {
      const items = asArray(p.items);
      if (!items.length) warnings.push({ level: "error", message: "أضف دائرة واحدة على الأقل" });
      items.forEach((item, i) => {
        const row = item as Record<string, unknown>;
        if (!row?.imageId) warnings.push({ level: "error", message: `الدائرة ${i + 1}: أضف صورة` });
      });
      break;
    }
    case "ROUTINE_CAROUSEL":
      if (!p.kind) warnings.push({ level: "warn", message: "لم يُحدَّد نوع الروتين" });
      break;
    case "CARE_HUB": {
      const hasConcerns = asArray(p.concernIds).length > 0;
      const hasCats = asArray(p.categoryIds).length > 0;
      const hasPkgs =
        asArray(p.morningPackageIds).length > 0 || asArray(p.eveningPackageIds).length > 0;
      if (active && !hasConcerns && !hasCats && !hasPkgs) {
        warnings.push({ level: "error", message: "أضف مشاكل بشرة أو فئات أو باقات روتين" });
      }
      break;
    }
    case "SKIN_CONCERNS":
      if (p.display === "circles") {
        warnings.push({ level: "info", message: "تأكد من رفع صور لمشاكل البشرة من صفحة دليل البشرة" });
      }
      if (p.display === "cards") {
        warnings.push({ level: "info", message: "عرض البطاقات — يفضّل صور لكل مشكلة" });
      }
      break;
    case "PACKAGES":
      if (!asArray(p.packageIds).length) {
        warnings.push({ level: "warn", message: "لم تُحدَّد باقات — ستُعرض كل الباقات" });
      }
      break;
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      if (!asArray(p.brandIds).length) {
        warnings.push({ level: "info", message: "فارغ = البراندات المميزة من النظام" });
      }
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

function bannerCount(p: Record<string, unknown>): number {
  const ids = asArray(p.bannerIds).length;
  const items = asArray(p.items).filter((i) => (i as Record<string, unknown>)?.bannerId).length;
  return Math.max(ids, items);
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

export function sectionHasErrors(block: Parameters<typeof validateSection>[0]): boolean {
  return validateSection(block).some((w) => w.level === "error");
}

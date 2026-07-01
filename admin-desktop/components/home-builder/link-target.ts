export type LinkTargetType =
  | "product"
  | "category"
  | "subcategory"
  | "tertiary"
  | "brand"
  | "search"
  | "offers"
  | "products"
  | "url";

export const LINK_TARGET_TYPES: { value: LinkTargetType; label: string; icon: string }[] = [
  { value: "product", label: "منتج", icon: "🛍️" },
  { value: "category", label: "قسم رئيسي", icon: "📁" },
  { value: "subcategory", label: "قسم فرعي", icon: "📂" },
  { value: "tertiary", label: "قسم ثانوي", icon: "🗂️" },
  { value: "brand", label: "براند", icon: "🏷️" },
  { value: "search", label: "بحث", icon: "🔍" },
  { value: "offers", label: "صفحة العروض", icon: "⚡" },
  { value: "products", label: "قائمة منتجات (query)", icon: "📋" },
  { value: "url", label: "مسار داخل التطبيق", icon: "🔗" },
];

export function buildAppLinkPath(
  linkType?: string | null,
  linkValue?: string | null,
  legacyLink?: string | null,
): string {
  const type = (linkType ?? "").trim();
  const value = (linkValue ?? "").trim();
  if (type === "product" && value) return `/product/${value}`;
  if (type === "category" && value) return `/products?categoryId=${encodeURIComponent(value)}`;
  if (type === "subcategory" && value) return `/products?subcategoryId=${encodeURIComponent(value)}`;
  if (type === "tertiary" && value) return `/products?tertiaryCategoryId=${encodeURIComponent(value)}`;
  if (type === "brand" && value) return `/products?brandId=${encodeURIComponent(value)}`;
  if (type === "search" && value) return `/search?q=${encodeURIComponent(value)}`;
  if (type === "offers") return "/products?isPromo=1&title=العروض";
  if (type === "products" && value) return value.startsWith("/") ? value : `/products?${value}`;
  if (type === "url" && value) return value;
  if (legacyLink?.trim()) return legacyLink.trim();
  if (value.startsWith("/")) return value;
  return "";
}

export function linkTargetLabel(
  linkType?: string | null,
  linkValue?: string | null,
  entities?: {
    products?: { id: string; name?: string }[];
    categories?: { id: string; name?: string }[];
    subcategories?: { id: string; name?: string }[];
    tertiary?: { id: string; name?: string }[];
    brands?: { id: string; name?: string }[];
  },
): string {
  if (!linkType) return "بدون رابط";
  const meta = LINK_TARGET_TYPES.find((t) => t.value === linkType);
  const prefix = meta ? `${meta.icon} ${meta.label}` : linkType;
  if (linkType === "offers") return prefix;
  if (!linkValue) return prefix;

  const find = (list?: { id: string; name?: string }[]) =>
    list?.find((e) => e.id === linkValue || e.name === linkValue)?.name ?? linkValue;

  if (linkType === "product") return `${prefix}: ${find(entities?.products)}`;
  if (linkType === "category") return `${prefix}: ${find(entities?.categories)}`;
  if (linkType === "subcategory") return `${prefix}: ${find(entities?.subcategories)}`;
  if (linkType === "tertiary") return `${prefix}: ${find(entities?.tertiary)}`;
  if (linkType === "brand") return `${prefix}: ${find(entities?.brands)}`;
  if (linkType === "search") return `${prefix}: «${linkValue}»`;
  return `${prefix}: ${linkValue.slice(0, 40)}`;
}

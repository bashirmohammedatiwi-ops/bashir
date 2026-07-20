export type LinkTargetType =
  | "product"
  | "category"
  | "subcategory"
  | "tertiary"
  | "brand"
  | "package"
  | "skinConcern"
  | "search"
  | "offers"
  | "products"
  | "url"
  | "categoriesTab";

export const LINK_TARGET_TYPES: { value: LinkTargetType; label: string; icon: string }[] = [
  { value: "product", label: "منتج", icon: "🛍️" },
  { value: "category", label: "قسم رئيسي", icon: "📁" },
  { value: "subcategory", label: "قسم فرعي", icon: "📂" },
  { value: "tertiary", label: "قسم ثانوي", icon: "🗂️" },
  { value: "brand", label: "براند", icon: "🏷️" },
  { value: "package", label: "باقة / روتين", icon: "🎁" },
  { value: "skinConcern", label: "مشكلة بشرة", icon: "✨" },
  { value: "search", label: "بحث", icon: "🔍" },
  { value: "offers", label: "صفحة العروض", icon: "⚡" },
  { value: "products", label: "قائمة منتجات (query)", icon: "📋" },
  { value: "categoriesTab", label: "تبويب الأقسام", icon: "⭕" },
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
  if (type === "package" && value) return `/package/${encodeURIComponent(value)}`;
  if (type === "skinConcern" && value) return `/products?concernSlug=${encodeURIComponent(value)}`;
  if (type === "search" && value) return `/search?q=${encodeURIComponent(value)}`;
  if (type === "offers") return "/products?isPromo=1&title=العروض";
  if (type === "categoriesTab") return "/categories-tab";
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
    products?: { id: string; name?: string; slug?: string }[];
    categories?: { id: string; name?: string }[];
    subcategories?: { id: string; name?: string }[];
    tertiary?: { id: string; name?: string }[];
    brands?: { id: string; name?: string }[];
    packages?: { id: string; name?: string; slug?: string }[];
    skinConcerns?: { id: string; name?: string; slug?: string }[];
  },
): string {
  if (!linkType) return "بدون رابط";
  const meta = LINK_TARGET_TYPES.find((t) => t.value === linkType);
  const prefix = meta ? `${meta.icon} ${meta.label}` : linkType;
  if (linkType === "offers" || linkType === "categoriesTab") return prefix;
  if (!linkValue) return prefix;

  const find = (list?: { id: string; name?: string; slug?: string }[]) =>
    list?.find((e) => e.id === linkValue || e.slug === linkValue || e.name === linkValue)?.name ?? linkValue;

  if (linkType === "product") return `${prefix}: ${find(entities?.products)}`;
  if (linkType === "category") return `${prefix}: ${find(entities?.categories)}`;
  if (linkType === "subcategory") return `${prefix}: ${find(entities?.subcategories)}`;
  if (linkType === "tertiary") return `${prefix}: ${find(entities?.tertiary)}`;
  if (linkType === "brand") return `${prefix}: ${find(entities?.brands)}`;
  if (linkType === "package") return `${prefix}: ${find(entities?.packages)}`;
  if (linkType === "skinConcern") return `${prefix}: ${find(entities?.skinConcerns)}`;
  if (linkType === "search") return `${prefix}: «${linkValue}»`;
  if (linkType === "products") return `${prefix}: ${linkValue.slice(0, 48)}`;
  return `${prefix}: ${linkValue.slice(0, 40)}`;
}

/** روابط سريعة — نقرة واحدة في المحرر */
export const QUICK_LINK_PRESETS: {
  id: string;
  label: string;
  icon: string;
  linkType: LinkTargetType;
  linkValue?: string;
}[] = [
  { id: "offers", label: "العروض", icon: "⚡", linkType: "offers" },
  { id: "categories", label: "تبويب الفئات", icon: "☰", linkType: "categoriesTab" },
  { id: "brands-page", label: "كل البراندات", icon: "🏷️", linkType: "url", linkValue: "/brands" },
  { id: "new", label: "وصل حديثاً", icon: "✨", linkType: "products", linkValue: "isNew=1&title=وصل حديثاً" },
  { id: "best", label: "الأكثر مبيعاً", icon: "🔥", linkType: "products", linkValue: "isBestSeller=1&title=الأكثر مبيعاً" },
  { id: "featured", label: "مختارات", icon: "⭐", linkType: "products", linkValue: "isFeatured=1&title=مختارات" },
];

/** قوالب «عرض الكل» — بدل كتابة query يدوياً */
export const VIEW_ALL_PRESETS: { label: string; value: string; hint?: string }[] = [
  { label: "افتراضي النظام (تلقائي)", value: "" },
  { label: "العروض والتخفيضات", value: "isPromo=1&title=العروض", hint: "/products?isPromo=1" },
  { label: "الأكثر مبيعاً", value: "isBestSeller=1&title=الأكثر مبيعاً" },
  { label: "وصل حديثاً", value: "isNew=1&title=وصل حديثاً" },
  { label: "منتجات مختارة", value: "isFeatured=1&title=مختارات" },
  { label: "الباقات والروتين", value: "isPromo=1&title=الباقات" },
  { label: "صفحة البراندات", value: "/brands", hint: "مسار مباشر" },
  { label: "مركز العناية", value: "isFeatured=1&title=العناية" },
];

/** قوالب query لنوع «قائمة منتجات» */
export const PRODUCT_QUERY_PRESETS: { label: string; value: string }[] = [
  { label: "عروض", value: "isPromo=1&title=العروض" },
  { label: "جديد", value: "isNew=1&title=جديد" },
  { label: "الأكثر مبيعاً", value: "isBestSeller=1&title=الأكثر مبيعاً" },
  { label: "مختارات", value: "isFeatured=1&title=مختارات" },
];

export function summarizeLink(
  payload?: Record<string, unknown>,
  entities?: Parameters<typeof linkTargetLabel>[2],
): string {
  if (!payload) return "";
  const lt = payload.linkType as string | undefined;
  const lv = payload.linkValue as string | undefined;
  const legacy = payload.link as string | undefined;
  if (!lt && !legacy) return "";
  return linkTargetLabel(lt, lv, entities);
}

export function summarizeItemLinks(items: unknown[]): { linked: number; total: number } {
  const list = Array.isArray(items) ? items : [];
  let linked = 0;
  for (const raw of list) {
    const item = raw as Record<string, unknown>;
    if (item?.linkType || item?.link) linked++;
  }
  return { linked, total: list.length };
}

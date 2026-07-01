/** يبني مسار التطبيق من نوع الرابط وقيمته. */
export function buildAppLink(
  linkType?: string | null,
  linkValue?: string | null,
  legacyLink?: string | null,
): string | undefined {
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
  return undefined;
}

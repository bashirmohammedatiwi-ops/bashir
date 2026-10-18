export const productHref = (slug: string) => `/product/${encodeURIComponent(slug)}`;
export const categoryHref = (slug: string) => `/category/${encodeURIComponent(slug)}`;
export const brandHref = (slug: string) => `/brand/${encodeURIComponent(slug)}`;
export const packageHref = (slug: string) => `/package/${encodeURIComponent(slug)}`;
export const concernHref = (slug: string) => `/skin-guide/${encodeURIComponent(slug)}`;
export const worldHref = (slug: string) => `/?world=${encodeURIComponent(slug)}`;

export function productsHref(params: Record<string, string | number | boolean | undefined | null> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    qs.set(k, v === true ? "1" : String(v));
  }
  const q = qs.toString();
  return q ? `/products?${q}` : "/products";
}

/**
 * روابط لوحة التحكم (نفس أنواع التطبيق) ← مسارات الويب.
 * linkType: product | category | brand | package | skinConcern | search | offers | products | url | categoriesTab
 */
export function resolveLink(linkType?: string | null, linkValue?: string | null, link?: string | null): string | null {
  const type = (linkType ?? "").trim();
  const value = (linkValue ?? "").trim();
  if (type === "product" && value) return productHref(value);
  if (type === "category" && value) return categoryHref(value);
  if ((type === "subcategory" || type === "tertiary") && value) return productsHref({ subcategoryId: value });
  if (type === "brand" && value) return /^[0-9a-f-]{36}$/i.test(value) ? productsHref({ brandId: value }) : brandHref(value);
  if (type === "package" && value) return packageHref(value);
  if (type === "skinConcern" && value) return concernHref(value);
  if (type === "skinGuide") return "/skin-guide";
  if (type === "packages") return "/packages";
  if (type === "search" && value) return `/search?q=${encodeURIComponent(value)}`;
  if (type === "offers") return "/offers";
  if (type === "categoriesTab") return "/categories";
  if (type === "products" && value) return value.startsWith("/") ? value : `/products?${value}`;
  if (type === "url" && value) return value;
  return link ? appPathToWeb(link) : null;
}

/** مسارات التطبيق (/product/x، /products?…، /categories-tab) ← الويب. */
export function appPathToWeb(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/categories-tab")) return "/categories";
  if (path.startsWith("/offers")) return "/offers";
  return path;
}

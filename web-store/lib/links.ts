import { packageHref, productHref } from "./storePaths";

/** يحوّل مسارات التطبيق/الـ CMS إلى روابط متجر الويب الثابت. */
export function webPathFromAppLink(link?: string | null): string | undefined {
  const raw = String(link ?? "").trim();
  if (!raw) return undefined;

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("mailto:") || raw.startsWith("tel:")) return raw;

  if (raw === "/categories" || raw === "/categories-tab" || raw === "/categories/") {
    return "/categories/";
  }
  if (raw === "/brands" || raw === "/brands/") return "/brands/";
  if (raw === "/offers" || raw.startsWith("/offers")) return "/offers/";
  if (raw === "/" || raw === "/home") return "/";

  const productMatch = raw.match(/^\/product\/([^/?#]+)/);
  if (productMatch) return productHref(decodeURIComponent(productMatch[1]));

  const packageMatch = raw.match(/^\/package\/([^/?#]+)/);
  if (packageMatch) return packageHref(decodeURIComponent(packageMatch[1]));

  if (raw.startsWith("/products?")) {
    return `/products/${raw.slice("/products".length)}`;
  }
  if (raw.startsWith("/products/")) return raw;

  if (raw.startsWith("/")) {
    return raw.endsWith("/") ? raw : `${raw}/`;
  }

  return `/products/?${raw}`;
}

export function viewAllHref(query?: string | null, fallback = "/products/"): string {
  const raw = String(query ?? "").trim();
  if (!raw) return fallback;
  return webPathFromAppLink(raw) ?? fallback;
}

export function sectionLinkHref(item: {
  link?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
}): string | undefined {
  if (item.link) return webPathFromAppLink(item.link);
  const type = String(item.linkType ?? "").trim();
  const value = String(item.linkValue ?? "").trim();
  if (!type || !value) return undefined;

  switch (type) {
    case "product":
      return productHref(value);
    case "category":
      return `/products/?categoryId=${encodeURIComponent(value)}`;
    case "brand":
      return `/products/?brandId=${encodeURIComponent(value)}`;
    case "package":
      return packageHref(value);
    case "skinConcern":
      return `/products/?concernSlug=${encodeURIComponent(value)}`;
    case "search":
      return `/products/?search=${encodeURIComponent(value)}`;
    case "offers":
      return "/offers/";
    case "categoriesTab":
      return "/categories/";
    case "products":
      return webPathFromAppLink(value.startsWith("/") ? value : `/products?${value}`);
    case "url":
      return value;
    default:
      return webPathFromAppLink(value);
  }
}

export function bannerLinkHref(banner: {
  linkUrl?: string | null;
  link?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
}): string | undefined {
  if (banner.linkUrl) return webPathFromAppLink(banner.linkUrl);
  return sectionLinkHref(banner);
}

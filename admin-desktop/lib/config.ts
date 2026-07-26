/** Production API — relative paths when admin is served from same nginx host */
export const APP_DOMAIN = "deemaalhayat.com";
export const APP_ORIGIN = `https://${APP_DOMAIN}`;

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

export const VPS_ORIGIN =
  typeof window !== "undefined" &&
  window.location.origin &&
  !window.location.origin.startsWith("file:")
    ? window.location.origin
    : API_BASE.startsWith("/")
      ? APP_ORIGIN
      : API_BASE.replace(/\/api\/v1\/?$/, "");

export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE?.replace(/\/$/, "") ?? "/media";

/** عنوان catalog-hub — يُحسب وقت التشغيل ليتوافق مع نفس أصل لوحة الإدارة */
export function getCatalogHubUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin && !origin.startsWith("file:")) {
      return `${origin}/catalog-hub`;
    }
  }
  return (
    process.env.NEXT_PUBLIC_CATALOG_HUB_URL?.replace(/\/$/, "") ??
    `${VPS_ORIGIN}/catalog-hub`
  );
}

/** @deprecated استخدم getCatalogHubUrl() */
export const CATALOG_HUB_URL = getCatalogHubUrl();

export const CATALOG_HUB_ORIGIN = getCatalogHubUrl().replace(/\/catalog-hub\/?$/, "");

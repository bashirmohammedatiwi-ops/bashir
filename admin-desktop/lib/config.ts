/** Production API — same domain & paths as web (`/api/v1`, `/media`, …) */
export const APP_DOMAIN = "deemaalhayat.com";
export const APP_ORIGIN = `https://${APP_DOMAIN}`;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? `${APP_ORIGIN}/api/v1`;

export const VPS_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE?.replace(/\/$/, "") ??
  `${APP_ORIGIN}/media`;

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

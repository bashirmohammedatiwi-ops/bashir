/** Production VPS API — baked in at build time via .env.production */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://187.127.88.146/api/v1";

export const VPS_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE?.replace(/\/$/, "") ?? VPS_ORIGIN;

/** Catalog Hub — multi-store product catalog via Nginx on same host */
export const CATALOG_HUB_URL =
  process.env.NEXT_PUBLIC_CATALOG_HUB_URL?.replace(/\/$/, "") ??
  `${VPS_ORIGIN}/catalog-hub`;

/** Site origin without /catalog-hub — for building absolute catalog asset URLs */
export const CATALOG_HUB_ORIGIN = CATALOG_HUB_URL.replace(/\/catalog-hub$/, "");

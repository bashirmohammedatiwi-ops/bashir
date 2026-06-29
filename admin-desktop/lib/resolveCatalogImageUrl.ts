import { CATALOG_HUB_URL } from "./config";

/** يحوّل روابط صور الكتالوج لعرضها في لوحة التحكم */
export function resolveCatalogImageUrl(url: string): string {
  let u = String(url || "").trim();
  if (!u) return "";

  // إصلاح روابط مكررة من إصدارات سابقة (catalog-hub/catalog-hub)
  u = u.replace(/\/catalog-hub\/catalog-hub\//g, "/catalog-hub/");

  const hub = CATALOG_HUB_URL.replace(/\/$/, "");

  if (u.startsWith(hub)) return u;

  if (u.startsWith("/catalog-hub/")) {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : new URL(hub).origin;
      return `${origin}${u}`;
    } catch {
      return `${hub}${u.replace(/^\/catalog-hub/, "")}`;
    }
  }

  if (u.startsWith("/api/")) return `${hub}${u}`;

  // رابط proxy وجوه جاهز — لا تعِد التغليف
  if (u.includes("/api/faces/img")) {
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${hub}${u.startsWith("/catalog-hub") ? u.replace(/^\/catalog-hub/, "") : u}`;
  }

  if (u.startsWith("http://") || u.startsWith("https://")) {
    const isDirectFaces =
      (u.includes("faces.ae") || u.includes("demandware.static")) &&
      (u.includes("/dw/image") || u.includes("demandware.static"));
    if (isDirectFaces) {
      return `${hub}/api/faces/img?u=${encodeURIComponent(u)}`;
    }
    return u;
  }

  return u;
}

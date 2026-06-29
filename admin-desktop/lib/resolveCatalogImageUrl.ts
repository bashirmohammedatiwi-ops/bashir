import { CATALOG_HUB_URL } from "./config";

/** يحوّل روابط صور الكتالوج لعرضها في لوحة التحكم */
export function resolveCatalogImageUrl(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";

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

  if (u.startsWith("http://") || u.startsWith("https://")) {
    if (u.includes("faces.ae") && (u.includes("/dw/image") || u.includes("demandware.static"))) {
      return `${hub}/api/faces/img?u=${encodeURIComponent(u)}`;
    }
    return u;
  }

  return u;
}

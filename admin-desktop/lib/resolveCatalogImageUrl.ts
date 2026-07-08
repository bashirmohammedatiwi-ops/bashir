import { CATALOG_HUB_URL } from "./config";

/** يحوّل روابط صور الكتالوج لعرضها في لوحة التحكم */
export function resolveCatalogImageUrl(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;

  const hub = CATALOG_HUB_URL.replace(/\/$/, "");
  if (u.startsWith("/catalog-hub/")) {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : new URL(hub).origin;
      return `${origin}${u}`;
    } catch {
      return `${hub}${u.replace(/^\/catalog-hub/, "")}`;
    }
  }
  if (u.startsWith("/api/")) return `${hub}${u}`;
  return u;
}

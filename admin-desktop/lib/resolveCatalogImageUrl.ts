import { getCatalogHubUrl } from "./config";

/** يوحّد صور أمازون لتجنّب القصّ المقرّب الغريب */
function normalizeAmazonImageUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!/media-amazon\.com|images-amazon\.com/i.test(raw)) return raw;
  const id = raw.match(/\/images\/I\/([A-Za-z0-9%+-]+)/i)?.[1]
    || raw.match(/\/I\/([A-Za-z0-9%+-]+)\./i)?.[1];
  if (!id) return raw;
  const cleanId = id.replace(/\._[^.]+$/, "");
  return `https://m.media-amazon.com/images/I/${cleanId}._AC_SL1500_.jpg`;
}

/** يحوّل روابط صور الكتالوج لعرضها في لوحة التحكم */
export function resolveCatalogImageUrl(url: string): string {
  const u = normalizeAmazonImageUrl(String(url || "").trim());
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;

  const hub = getCatalogHubUrl().replace(/\/$/, "");
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

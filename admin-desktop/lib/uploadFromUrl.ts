import { uploadMediaFile } from "./uploadMedia";
import { CATALOG_HUB_URL } from "./config";

function resolveFetchUrl(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `${CATALOG_HUB_URL}${u}`;
  return u;
}

export async function uploadImageFromUrl(url: string, purpose = "PRODUCT") {
  const fetchUrl = resolveFetchUrl(url);
  if (!fetchUrl) throw new Error("رابط صورة غير صالح");

  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`تعذّر تحميل الصورة (${res.status})`);

  const blob = await res.blob();
  const ext = blob.type?.includes("png")
    ? "png"
    : blob.type?.includes("webp")
      ? "webp"
      : "jpg";
  const file = new File([blob], `catalog-${Date.now()}.${ext}`, {
    type: blob.type || "image/jpeg",
  });
  return uploadMediaFile(file, purpose);
}

import { api } from "./api";
import { mediaThumb } from "./mediaUrl";
import { uploadMediaFile } from "./uploadMedia";

function uploadErrorMessage(error: unknown): string {
  const e = error as any;
  return (
    e?.response?.data?.error?.message ??
    e?.response?.data?.message ??
    e?.message ??
    "فشل رفع الصورة"
  );
}

function normalizeImageUrl(url: string): string {
  return String(url || "").trim();
}

/** Server fetch + same optimizeForStorage pipeline as ProductImageDropzone uploads. */
export async function uploadImageFromUrl(url: string, purpose = "PRODUCT") {
  const fetchUrl = normalizeImageUrl(url);
  if (!fetchUrl) throw new Error("رابط صورة غير صالح");

  try {
    const res = await api.post("/media/upload-from-url", { url: fetchUrl, purpose }, { timeout: 120_000 });
    const media = res.data?.data ?? res.data;
    return { ...media, previewUrl: mediaThumb(media) };
  } catch (error) {
    throw new Error(uploadErrorMessage(error));
  }
}

/** Fallback when API cannot reach the URL (local dev). Still uses /media/upload compression. */
export async function uploadImageFromUrlClient(url: string, purpose = "PRODUCT") {
  const fetchUrl = normalizeImageUrl(url);
  if (!fetchUrl) throw new Error("رابط صورة غير صالح");

  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`تعذّر تحميل الصورة (${res.status})`);

  const blob = await res.blob();
  const ext = blob.type?.includes("png")
    ? "png"
    : blob.type?.includes("webp")
      ? "webp"
      : "jpg";
  const file = new File([blob], `image-${Date.now()}.${ext}`, {
    type: blob.type || "image/jpeg",
  });
  return uploadMediaFile(file, purpose);
}

export async function uploadImageFromUrlWithFallback(url: string, purpose = "PRODUCT") {
  try {
    return await uploadImageFromUrl(url, purpose);
  } catch {
    return uploadImageFromUrlClient(url, purpose);
  }
}

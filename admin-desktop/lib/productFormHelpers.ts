import type { ImageItem } from "@/components/ProductImageDropzone";
import { mediaPreviewUrl, mediaThumb } from "@/lib/mediaUrl";

/** إزالة تكرار الصور عند التحميل من API (نفس mediaId أو hash). */
export function imagesFromProduct(full: any): ImageItem[] {
  const seenIds = new Set<string>();
  const seenHash = new Set<string>();
  const out: ImageItem[] = [];

  for (const img of full?.images ?? []) {
    const id = img.mediaId ?? img.media?.id;
    const hash = img.media?.hash as string | undefined;
    if (!id || seenIds.has(id)) continue;
    if (hash && seenHash.has(hash)) continue;
    seenIds.add(id);
    if (hash) seenHash.add(hash);
    out.push({
      id,
      url:
        mediaPreviewUrl(img.media) ??
        mediaThumb(img.media, "medium") ??
        mediaThumb(img.media, "original"),
    });
  }
  return out;
}

/** إزالة تكرار mediaId في قائمة الصور قبل الحفظ أو العرض. */
export function dedupeImageItems(items: ImageItem[]): ImageItem[] {
  const seen = new Set<string>();
  return items.filter((img) => {
    if (!img.id || seen.has(img.id)) return false;
    seen.add(img.id);
    return true;
  });
}

import type { ImageItem } from "@/components/ProductImageDropzone";
import { mediaPreviewUrl, mediaThumb } from "@/lib/mediaUrl";

/** إزالة تكرار الصور عند التحميل من API (نفس mediaId أو hash أو رابط). */
export function imagesFromProduct(full: any): ImageItem[] {
  const seenIds = new Set<string>();
  const seenHash = new Set<string>();
  const seenUrls = new Set<string>();
  const out: ImageItem[] = [];

  for (const img of full?.images ?? []) {
    const id = img.mediaId ?? img.media?.id;
    const hash = img.media?.hash as string | undefined;
    const url =
      mediaPreviewUrl(img.media) ??
      mediaThumb(img.media, "medium") ??
      mediaThumb(img.media, "original");
    const urlKey = (url ?? "").split("?")[0].trim().toLowerCase();

    if (!id || seenIds.has(id)) continue;
    if (hash && seenHash.has(hash)) continue;
    if (urlKey && seenUrls.has(urlKey)) continue;

    seenIds.add(id);
    if (hash) seenHash.add(hash);
    if (urlKey) seenUrls.add(urlKey);
    out.push({ id, url: url ?? null });
  }
  return out;
}

/** إزالة تكرار mediaId أو نفس رابط العرض في قائمة الصور. */
export function dedupeImageItems(items: ImageItem[]): ImageItem[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  return items.filter((img) => {
    if (!img.id || seenIds.has(img.id)) return false;
    const url = (img.url ?? "").split("?")[0].trim().toLowerCase();
    if (url && seenUrls.has(url)) return false;
    seenIds.add(img.id);
    if (url) seenUrls.add(url);
    return true;
  });
}

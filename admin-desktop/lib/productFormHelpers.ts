import type { ImageItem } from "@/components/ProductImageDropzone";
import { mediaPreviewUrl, mediaThumb } from "@/lib/mediaUrl";

export function imagesFromProduct(full: any): ImageItem[] {
  return (full?.images ?? [])
    .map((img: any) => ({
      id: img.mediaId ?? img.media?.id,
      url:
        mediaPreviewUrl(img.media) ??
        mediaThumb(img.media, "thumb") ??
        mediaThumb(img.media, "medium"),
    }))
    .filter((i: ImageItem) => i.id);
}

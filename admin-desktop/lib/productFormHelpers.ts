import type { ImageItem } from "@/components/ProductImageDropzone";
import { mediaThumb } from "@/lib/mediaUrl";

export function imagesFromProduct(full: any): ImageItem[] {
  return (full?.images ?? [])
    .map((img: any) => ({
      id: img.mediaId ?? img.media?.id,
      url: mediaThumb(img.media),
    }))
    .filter((i: ImageItem) => i.id);
}

import { mediaPreviewUrl, mediaThumb } from "./mediaUrl";

export function productCoverUrl(product?: {
  images?: Array<{ media?: unknown; mediaId?: string }>;
} | null): string | null {
  const first = product?.images?.[0];
  if (!first) return null;
  const media = (first as { media?: unknown }).media as Parameters<typeof mediaThumb>[0];
  return mediaThumb(media, "thumb") ?? mediaPreviewUrl(media);
}

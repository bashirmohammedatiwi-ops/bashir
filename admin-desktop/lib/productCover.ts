import { mediaPreviewUrl, mediaThumb } from "./mediaUrl";

export function productCoverUrl(product?: {
  images?: Array<{ media?: unknown; mediaId?: string }>;
} | null): string | null {
  const first = product?.images?.[0];
  if (!first) return null;
  const media = (first as { media?: unknown }).media as Parameters<typeof mediaThumb>[0];
  // Grid cards ~160–300px CSS — use 480px small, not 240px thumb (looks soft when stretched)
  return mediaThumb(media, "small") ?? mediaPreviewUrl(media);
}

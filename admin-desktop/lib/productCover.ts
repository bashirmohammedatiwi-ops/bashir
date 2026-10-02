import { mediaPreviewUrl, mediaThumb } from "./mediaUrl";

export function productCoverUrl(
  product?: {
    images?: Array<{ media?: unknown; mediaId?: string }>;
  } | null,
  preferred: "small" | "medium" = "small",
): string | null {
  const first = product?.images?.[0];
  if (!first) return null;
  const media = (first as { media?: unknown }).media as Parameters<typeof mediaThumb>[0];
  return mediaThumb(media, preferred) ?? mediaPreviewUrl(media);
}

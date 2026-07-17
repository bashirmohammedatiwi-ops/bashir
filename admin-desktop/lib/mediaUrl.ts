import { MEDIA_BASE, API_BASE } from "./config";

function mediaBase(): string {
  return MEDIA_BASE || API_BASE.replace(/\/api\/v1\/?$/, "");
}

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = mediaBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type MediaLike = {
  variants?: Record<string, { formats?: Record<string, string> }>;
  publicUrlBase?: string;
  originalUrl?: string;
  originalUrlJpg?: string;
  filename?: string;
  mime?: string;
} | null;

function pickFormat(formats?: Record<string, string> | null): string | null {
  if (!formats) return null;
  // Prefer formats that browsers/Electron always decode; AVIF optional in admin
  return formats.webp ?? formats.jpg ?? formats.avif ?? null;
}

/**
 * @param preferred — preferred variant size for the UI context
 * Prefer originals when listing immediately after upload (variants may still be generating).
 */
export function mediaThumb(
  item?: MediaLike,
  preferred: "thumb" | "small" | "medium" | "large" | "original" = "thumb",
): string | null {
  if (!item) return null;

  const order =
    preferred === "original"
      ? ([] as const)
      : preferred === "thumb"
        ? (["thumb", "small", "medium", "large"] as const)
        : preferred === "small"
          ? (["small", "thumb", "medium", "large"] as const)
          : preferred === "large"
            ? (["large", "medium", "small", "thumb"] as const)
            : (["medium", "small", "large", "thumb"] as const);

  for (const key of order) {
    const rel = pickFormat(item.variants?.[key]?.formats);
    if (rel) return mediaUrl(rel);
  }

  if (item.originalUrl) return mediaUrl(item.originalUrl);
  if (item.originalUrlJpg) return mediaUrl(item.originalUrlJpg);

  if (item.publicUrlBase && item.filename) {
    return (
      mediaUrl(`${item.publicUrlBase}/${item.filename}.webp`) ??
      mediaUrl(`${item.publicUrlBase}/${item.filename}.jpg`)
    );
  }
  return null;
}

/** Cover / gallery preview that never points at a missing async variant. */
export function mediaPreviewUrl(item?: MediaLike): string | null {
  if (!item) return null;
  if (item.originalUrl) return mediaUrl(item.originalUrl);
  return mediaThumb(item, "thumb") ?? mediaThumb(item, "original");
}

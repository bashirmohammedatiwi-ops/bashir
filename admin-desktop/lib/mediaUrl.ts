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

export function mediaThumb(item?: {
  variants?: Record<string, { formats?: Record<string, string> }>;
  publicUrlBase?: string;
  originalUrl?: string;
  filename?: string;
  mime?: string;
} | null): string | null {
  if (!item) return null;
  const rel =
    item.variants?.medium?.formats?.webp ??
    item.variants?.medium?.formats?.jpg ??
    item.variants?.thumb?.formats?.webp ??
    item.variants?.thumb?.formats?.jpg ??
    null;
  if (rel) return mediaUrl(rel);
  if (item.originalUrl) return mediaUrl(item.originalUrl);
  if (item.publicUrlBase && item.filename) {
    return (
      mediaUrl(`${item.publicUrlBase}/${item.filename}.webp`) ??
      mediaUrl(`${item.publicUrlBase}/${item.filename}.jpg`)
    );
  }
  return null;
}

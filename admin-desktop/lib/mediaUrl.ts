import { MEDIA_BASE, API_BASE } from "./config";

const LEGACY_MEDIA_HOSTS = new Set([
  "187.127.88.146",
  "localhost",
  "127.0.0.1",
  "deemaalhayat.com",
  "www.deemaalhayat.com",
]);

function mediaBase(): string {
  if (typeof window !== "undefined" && window.location.origin && !window.location.origin.startsWith("file:")) {
    return MEDIA_BASE.startsWith("/") ? MEDIA_BASE : MEDIA_BASE;
  }
  return MEDIA_BASE || API_BASE.replace(/\/api\/v1\/?$/, "");
}

/** يحوّل روابط IP/HTTP القديمة إلى مسار /media على نفس أصل لوحة التحكم. */
function normalizeMediaPath(path: string): string {
  if (!path.startsWith("http://") && !path.startsWith("https://")) {
    return path;
  }
  try {
    const url = new URL(path);
    const host = url.hostname.toLowerCase();
    if (!LEGACY_MEDIA_HOSTS.has(host) && !host.endsWith(".deemaalhayat.com")) {
      return path;
    }
    if (url.pathname.startsWith("/media/") || url.pathname === "/media") {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    return path;
  }
  return path;
}

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const normalized = normalizeMediaPath(path.trim());
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  const base = mediaBase();
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return `${base.replace(/\/$/, "")}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
  }
  return `${base}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

export type MediaRecord = {
  id?: string;
  variants?: Record<string, { formats?: Record<string, string> }>;
  publicUrlBase?: string;
  originalUrl?: string;
  originalUrlJpg?: string;
  filename?: string;
  mime?: string;
};

type MediaLike = MediaRecord | null | undefined;

function pickFormat(formats?: Record<string, string> | null): string | null {
  if (!formats) return null;
  return formats.webp ?? formats.jpg ?? formats.avif ?? null;
}

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
    const base = mediaUrl(item.publicUrlBase);
    if (!base) return null;
    return mediaUrl(`${base}/${item.filename}.webp`) ?? mediaUrl(`${base}/${item.filename}.jpg`);
  }
  return null;
}

export function mediaPreviewUrl(item?: MediaLike): string | null {
  if (!item) return null;
  if (item.originalUrl) return mediaUrl(item.originalUrl);
  if (item.originalUrlJpg) return mediaUrl(item.originalUrlJpg);
  if (item.publicUrlBase && item.filename) {
    const base = mediaUrl(item.publicUrlBase);
    if (!base) return null;
    return mediaUrl(`${base}/${item.filename}.webp`) ?? mediaUrl(`${base}/${item.filename}.jpg`);
  }
  return mediaThumb(item, "medium") ?? mediaThumb(item, "large") ?? mediaThumb(item, "small");
}

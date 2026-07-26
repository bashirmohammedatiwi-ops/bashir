import { MEDIA_BASE, API_BASE } from "./config";

function mediaBase(): string {
  if (typeof window !== "undefined" && window.location.origin && !window.location.origin.startsWith("file:")) {
    return MEDIA_BASE.startsWith("/") ? MEDIA_BASE : MEDIA_BASE;
  }
  return MEDIA_BASE || API_BASE.replace(/\/api\/v1\/?$/, "");
}

/** يحوّل أي رابط مطلق يشير إلى /media إلى مسار نسبي على نفس أصل لوحة التحكم. */
function normalizeMediaPath(path: string): string {
  if (!path.startsWith("http://") && !path.startsWith("https://")) {
    return path;
  }
  try {
    const url = new URL(path);
    if (url.pathname.startsWith("/media/") || url.pathname === "/media") {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    return path;
  }
  return path;
}

function joinMediaBase(base: string, path: string): string {
  const cleanBase = base.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  // المسار يحتوي /media بالفعل — لا نضيف MEDIA_BASE مرة ثانية
  if (normalized.startsWith("/media/") || normalized === "/media") {
    return normalized;
  }

  if (cleanBase.startsWith("http://") || cleanBase.startsWith("https://")) {
    return `${cleanBase}${normalized}`;
  }

  return `${cleanBase}${normalized}`;
}

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const normalized = normalizeMediaPath(path.trim());
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return joinMediaBase(mediaBase(), normalized);
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

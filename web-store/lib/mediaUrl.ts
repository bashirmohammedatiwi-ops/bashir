import { API_BASE, MEDIA_BASE } from "./config";

export type MediaRecord = {
  id?: string;
  thumb?: string;
  full?: string;
  url?: string;
  variants?: Record<string, { formats?: Record<string, string> }>;
  publicUrlBase?: string;
  originalUrl?: string;
  originalUrlJpg?: string;
  filename?: string;
  mime?: string;
};

type MediaLike = MediaRecord | null | undefined;

function mediaBase(): string {
  return MEDIA_BASE || API_BASE.replace(/\/api\/v1\/?$/, "");
}

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
  let normalized = path.startsWith("/") ? path : `/${path}`;

  if (normalized.startsWith("/media/media/")) {
    normalized = normalized.replace(/^\/media\/media\//, "/media/");
  }

  if (normalized.startsWith("/media/") || normalized === "/media") {
    return normalized;
  }

  if (cleanBase.startsWith("http://") || cleanBase.startsWith("https://")) {
    return `${cleanBase}${normalized}`;
  }

  return `${cleanBase}${normalized}`;
}

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return "";
  const normalized = normalizeMediaPath(path.trim());
  if (!normalized) return "";
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return joinMediaBase(mediaBase(), normalized);
}

function pickFormat(formats?: Record<string, string> | null): string | null {
  if (!formats) return null;
  return formats.webp ?? formats.jpg ?? formats.avif ?? null;
}

export function mediaThumb(
  item?: MediaLike,
  preferred: "thumb" | "small" | "medium" | "large" | "original" = "thumb",
): string {
  if (!item) return "";

  if (item.thumb) return resolveMediaUrl(item.thumb);
  if (item.full) return resolveMediaUrl(item.full);
  if (item.url) return resolveMediaUrl(item.url);

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
    if (rel) return resolveMediaUrl(rel);
  }

  if (item.originalUrl) return resolveMediaUrl(item.originalUrl);
  if (item.originalUrlJpg) return resolveMediaUrl(item.originalUrlJpg);

  if (item.publicUrlBase && item.filename) {
    const base = resolveMediaUrl(item.publicUrlBase);
    if (base) {
      return (
        resolveMediaUrl(`${base}/${item.filename}.webp`) ||
        resolveMediaUrl(`${base}/${item.filename}.jpg`)
      );
    }
  }

  return "";
}

export function mediaPreviewUrl(item?: MediaLike): string {
  if (!item) return "";
  if (item.full) return resolveMediaUrl(item.full);
  if (item.originalUrl) return resolveMediaUrl(item.originalUrl);
  if (item.originalUrlJpg) return resolveMediaUrl(item.originalUrlJpg);
  if (item.publicUrlBase && item.filename) {
    const base = resolveMediaUrl(item.publicUrlBase);
    if (base) {
      return (
        resolveMediaUrl(`${base}/${item.filename}.webp`) ||
        resolveMediaUrl(`${base}/${item.filename}.jpg`)
      );
    }
  }
  return mediaThumb(item, "medium") || mediaThumb(item, "large") || mediaThumb(item, "small");
}

export function imageFromUnknown(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return resolveMediaUrl(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.imageUrl) return resolveMediaUrl(String(record.imageUrl));
    if (record.coverUrl) return resolveMediaUrl(String(record.coverUrl));
    return mediaThumb(record as MediaRecord) || mediaPreviewUrl(record as MediaRecord);
  }
  return "";
}

export function productImageUrl(product: {
  images?: Array<{ isPrimary?: boolean; media?: MediaLike }>;
}): string {
  const imgs = product.images ?? [];
  const primary = imgs.find((i) => i.isPrimary) ?? imgs[0];
  return mediaThumb(primary?.media, "medium") || mediaPreviewUrl(primary?.media);
}

export function productGalleryUrls(product: {
  images?: Array<{ media?: MediaLike }>;
}): string[] {
  const urls = (product.images ?? [])
    .map((i) => mediaPreviewUrl(i.media) || mediaThumb(i.media, "large"))
    .filter(Boolean);
  return [...new Set(urls)];
}

export function categoryImageUrl(category: { image?: MediaLike }): string {
  return mediaThumb(category.image, "small") || mediaPreviewUrl(category.image);
}

export function brandLogoUrl(brand: { logo?: MediaLike }): string {
  return mediaThumb(brand.logo, "small") || mediaPreviewUrl(brand.logo);
}

export function bannerImageUrl(banner: {
  image?: MediaLike;
  imageUrl?: string | null;
}): string {
  if (banner.imageUrl) return resolveMediaUrl(banner.imageUrl);
  return mediaPreviewUrl(banner.image) || mediaThumb(banner.image, "large");
}

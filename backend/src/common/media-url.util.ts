/**
 * يعيد كتابة روابط الوسائط المخزّنة بعنوان IP أو HTTP قديم
 * إلى MEDIA_PUBLIC_BASE_URL الحالي (مثلاً https://deemaalhayat.com/media).
 */
export function getMediaPublicBase(): string {
  return (process.env.MEDIA_PUBLIC_BASE_URL ?? "/media").replace(/\/$/, "");
}

export function rewriteMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const base = getMediaPublicBase();

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    if (trimmed.startsWith("/media/") || trimmed === "/media") {
      return `${base}${trimmed.slice("/media".length)}`;
    }
    return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/media/") || parsed.pathname === "/media") {
      return `${base}${parsed.pathname.slice("/media".length)}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

type VariantFormats = Record<string, string>;
type VariantsRecord = Record<string, { width?: number; formats?: VariantFormats }>;

function rewriteVariants(variants: unknown): unknown {
  if (!variants || typeof variants !== "object") return variants;
  const out: VariantsRecord = {};
  for (const [key, value] of Object.entries(variants as VariantsRecord)) {
    if (!value || typeof value !== "object") {
      out[key] = value as { width?: number; formats?: VariantFormats };
      continue;
    }
    const formats = value.formats;
    if (!formats || typeof formats !== "object") {
      out[key] = value;
      continue;
    }
    const rewritten: VariantFormats = {};
    for (const [fmt, path] of Object.entries(formats)) {
      rewritten[fmt] = rewriteMediaUrl(path) ?? path;
    }
    out[key] = { ...value, formats: rewritten };
  }
  return out;
}

export function rewriteMediaRecord<T extends Record<string, unknown> | null | undefined>(
  media: T,
): T {
  if (!media || typeof media !== "object") return media;
  const next = { ...media } as Record<string, unknown>;

  if (typeof next.publicUrlBase === "string") {
    next.publicUrlBase = rewriteMediaUrl(next.publicUrlBase);
  }
  if (typeof next.originalUrl === "string") {
    next.originalUrl = rewriteMediaUrl(next.originalUrl);
  }
  if (typeof next.originalUrlJpg === "string") {
    next.originalUrlJpg = rewriteMediaUrl(next.originalUrlJpg);
  }
  if (next.variants) {
    next.variants = rewriteVariants(next.variants);
  }

  return next as T;
}

type MediaLike = {
  publicUrlBase?: string | null;
  filename?: string | null;
  originalUrl?: string | null;
  originalUrlJpg?: string | null;
  variants?: VariantsRecord;
};

export function mediaRecordToUrl(media?: MediaLike | null, preferLarge = false): string | null {
  if (!media) return null;
  const rewritten = rewriteMediaRecord(media as Record<string, unknown>) as MediaLike;

  if (rewritten.originalUrl) return rewritten.originalUrl;
  if (rewritten.originalUrlJpg) return rewritten.originalUrlJpg;

  const order = preferLarge
    ? (["large", "medium", "small", "thumb"] as const)
    : (["medium", "large", "small", "thumb"] as const);
  for (const key of order) {
    const formats = rewritten.variants?.[key]?.formats;
    if (!formats) continue;
    const path = formats.webp ?? formats.jpg ?? formats.avif;
    if (path) return rewriteMediaUrl(path);
  }

  if (rewritten.publicUrlBase && rewritten.filename) {
    return rewriteMediaUrl(`${rewritten.publicUrlBase}/${rewritten.filename}.webp`);
  }

  return null;
}

export function rewriteProductMediaUrls<
  T extends {
    images?: Array<{ media?: unknown }>;
    shades?: Array<{ image?: unknown }>;
  },
>(product: T): T {
  if (!product) return product;
  return {
    ...product,
    images: product.images?.map((img) => ({
      ...img,
      media: rewriteMediaRecord(img.media as Record<string, unknown> | null | undefined),
    })),
    shades: product.shades?.map((shade) => ({
      ...shade,
      image: rewriteMediaRecord(shade.image as Record<string, unknown> | null | undefined),
    })),
  };
}

import { Prisma } from "@prisma/client";

/** بصمة صورة المنتج الافتراضية في جدول Media (انظر scripts/backfill-product-images.js). */
export const PRODUCT_PLACEHOLDER_HASH = "alhayaa-product-placeholder-v1";

type MediaLike = {
  id?: string;
  hash?: string | null;
  storagePath?: string | null;
  originalName?: string | null;
} | null | undefined;

/** هل الوسيط صورة افتراضية وليست صورة منتج حقيقية؟ */
export function isPlaceholderMedia(media: MediaLike): boolean {
  if (!media) return true;
  if (media.id === "placeholder") return true;
  if (media.hash === PRODUCT_PLACEHOLDER_HASH) return true;
  if (media.storagePath === "placeholder") return true;
  const name = media.originalName?.toLowerCase() ?? "";
  return name.includes("placeholder");
}

/** شروط Prisma لوسائط الصورة الافتراضية. */
export function placeholderMediaWhere(): Prisma.MediaWhereInput {
  return {
    OR: [
      { hash: PRODUCT_PLACEHOLDER_HASH },
      { storagePath: "placeholder" },
      { originalName: { contains: "placeholder", mode: "insensitive" } },
    ],
  };
}

/** منتجات نشطة بلا صورة حقيقية (بدون صور أو صورة افتراضية فقط). */
export function activeWithoutRealImagesWhere(): Prisma.ProductWhereInput {
  return {
    isActive: true,
    NOT: {
      images: {
        some: {
          media: {
            NOT: placeholderMediaWhere(),
          },
        },
      },
    },
  };
}

/** منتجات لها صورة حقيقية واحدة على الأقل — للواجهة العامة. */
export function hasRealProductImagesWhere(): Prisma.ProductWhereInput {
  return {
    images: {
      some: {
        media: {
          NOT: placeholderMediaWhere(),
        },
      },
    },
  };
}

/** صورة بديلة للمنتجات بدون صور مرفقة. */
function placeholderMedia() {
  const base = (process.env.MEDIA_PUBLIC_BASE_URL ?? "/media").replace(/\/$/, "");
  const origin = base.replace(/\/media$/, "");
  const prefix = `${origin}/media/placeholder`;
  const webp = `${prefix}/product.webp`;
  const jpg = `${prefix}/product.jpg`;
  const variant = (width: number) => ({
    width,
    formats: { webp, jpg },
  });
  return {
    id: "placeholder",
    purpose: "PRODUCT",
    filename: "product",
    publicUrlBase: prefix,
    variants: {
      thumb: variant(320),
      small: variant(480),
      medium: variant(800),
      large: variant(1400),
    },
  };
}

export function withPlaceholderImages<T extends { images?: unknown[] }>(product: T): T {
  const images = product.images as Array<{ media?: MediaLike }> | undefined;
  const hasReal = Array.isArray(images) && images.some((img) => !isPlaceholderMedia(img.media));
  if (hasReal) return product;
  return {
    ...product,
    images: [
      {
        id: "placeholder",
        position: 0,
        isPrimary: true,
        media: placeholderMedia(),
      },
    ],
  };
}

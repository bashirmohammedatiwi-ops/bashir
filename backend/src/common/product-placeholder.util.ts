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
  if (Array.isArray(product.images) && product.images.length > 0) return product;
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

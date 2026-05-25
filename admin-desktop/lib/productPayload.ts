import { shadeToPayload } from "@/components/ProductShadesEditor";
import type { ImageItem } from "@/components/ProductImageDropzone";
import { normalizeBarcode } from "@/lib/barcode";
import { slugify } from "./slugify";

export function buildProductPayload(
  values: Record<string, any>,
  productImages: ImageItem[],
) {
  const tags = values.tags
    ? String(values.tags)
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  const name = values.name != null ? String(values.name).trim() : "";

  return {
    sku: values.sku || `SKU-${Date.now()}`,
    barcode: normalizeBarcode(values.barcode) || undefined,
    name,
    slug: values.slug?.trim() || slugify(name, "product"),
    brandId: values.brandId,
    categoryId: values.categoryId,
    subcategoryId: values.subcategoryId || undefined,
    description: values.description ?? "",
    ingredients: values.ingredients ?? "",
    howToUse: values.howToUse ?? "",
    price: Number(values.price ?? 0),
    originalPrice: Number(values.originalPrice ?? 0),
    discountPercent: Number(values.discountPercent ?? 0),
    stock: Number(values.stock ?? 0),
    pointsEarned: Number(values.pointsEarned ?? 0),
    rating: Number(values.rating ?? 0),
    isNew: !!values.isNew,
    isBestSeller: !!values.isBestSeller,
    isFeatured: !!values.isFeatured,
    isPromo: !!values.isPromo,
    isBogo: !!values.isBogo,
    isActive: values.isActive !== false,
    tags,
    skinType: Array.isArray(values.skinType) ? values.skinType : [],
    concernIds: Array.isArray(values.concernIds) ? values.concernIds : [],
    imageIds: productImages.map((i) => i.id),
    shades: (values.shades ?? [])
      .map((s: any, i: number) => shadeToPayload(s, i))
      .filter(Boolean),
    variants: (values.variants ?? [])
      .filter((v: any) => v?.label)
      .map((v: any) => ({
        label: String(v.label),
        sizeLabel: v.sizeLabel ?? undefined,
        priceDelta: Number(v.priceDelta ?? 0),
        stock: Number(v.stock ?? 0),
        position: Number(v.position ?? 0),
      })),
  };
}

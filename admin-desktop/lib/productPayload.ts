import { shadeToPayload } from "@/components/ProductShadesEditor";
import type { ImageItem } from "@/components/ProductImageDropzone";
import { normalizeBarcode } from "@/lib/barcode";
import { slugSourceName } from "@/lib/productName";
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

  const nameAr = values.nameAr != null ? String(values.nameAr).trim() : "";
  const nameEn = values.nameEn != null ? String(values.nameEn).trim() : "";
  const name = nameAr || nameEn;

  return {
    sku: values.sku || `SKU-${Date.now()}`,
    barcode: normalizeBarcode(values.barcode) || undefined,
    name,
    nameAr: nameAr || undefined,
    nameEn: nameEn || undefined,
    slug: values.slug?.trim() || slugify(slugSourceName(values), "product"),
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

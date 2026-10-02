import { Prisma } from "@prisma/client";

/** ترتيب المنتجات داخل براند واحد — يطابق صفحة «ترتيب التطبيق» في لوحة التحكم. */
export const PRODUCT_ORDER_WITHIN_BRAND: Prisma.ProductOrderByWithRelationInput[] = [
  { position: "asc" },
  { createdAt: "asc" },
  { id: "asc" },
];

/**
 * ترتيب المنتجات في المتجر: ترتيب البراندات (position ثم name) ثم ترتيب المنتج داخل البراند.
 * عند تساوي position للبراندات يُستخدم name كـ tie-breaker مثل قائمة البراندات في لوحة التحكم.
 */
export const PRODUCT_ORDER_BY_BRAND: Prisma.ProductOrderByWithRelationInput[] = [
  { brand: { position: "asc" } },
  { brand: { name: "asc" } },
  ...PRODUCT_ORDER_WITHIN_BRAND,
];

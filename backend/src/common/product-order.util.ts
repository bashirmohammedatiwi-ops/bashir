import { Prisma } from "@prisma/client";

/** ترتيب المنتجات في التطبيق: ترتيب البراند ثم ترتيب المنتج ضمن البراند. */
export const PRODUCT_ORDER_BY_BRAND: Prisma.ProductOrderByWithRelationInput[] = [
  { brand: { position: "asc" } },
  { position: "asc" },
  { createdAt: "asc" },
];

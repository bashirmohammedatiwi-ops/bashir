import { Prisma } from "@prisma/client";

/** ترتيب المنتجات في التطبيق: حسب ترتيب البراند فقط (بدون position للمنتج). */
export const PRODUCT_ORDER_BY_BRAND: Prisma.ProductOrderByWithRelationInput[] = [
  { brand: { position: "asc" } },
  { id: "asc" },
];

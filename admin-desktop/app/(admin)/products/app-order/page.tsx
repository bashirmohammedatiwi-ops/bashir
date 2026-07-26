"use client";

import { ProductsAdminPage } from "@/components/products/ProductsAdminPage";

export default function ProductsAppOrderPage() {
  return (
    <ProductsAdminPage
      sortMode="brand"
      pageTitle="ترتيب التطبيق"
      pageSubtitle="نفس ترتيب عرض المنتجات في تطبيق الهاتف — حسب ترتيب البراندات"
    />
  );
}

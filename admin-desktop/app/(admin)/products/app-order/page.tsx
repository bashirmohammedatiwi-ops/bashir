"use client";

import { ProductsAdminPage } from "@/components/products/ProductsAdminPage";

export default function ProductsAppOrderPage() {
  return (
    <ProductsAdminPage
      sortMode="brand"
      reorderMode
      pageTitle="ترتيب التطبيق"
      pageSubtitle="ترتيب البراندات ثم المنتجات داخل كل براند — اسحب المنتجات بعد اختيار البراند"
    />
  );
}

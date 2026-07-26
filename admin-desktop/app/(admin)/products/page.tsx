"use client";

import { ProductsAdminPage } from "@/components/products/ProductsAdminPage";

export default function ProductsPage() {
  return (
    <ProductsAdminPage
      sortMode="latest"
      pageTitle="المنتجات"
      pageSubtitle="مرتبة حسب تاريخ الإضافة — الأحدث أولاً"
    />
  );
}

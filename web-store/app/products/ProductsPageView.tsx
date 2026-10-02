import { Suspense } from "react";

import { ProductsPageClient } from "./ProductsPageClient";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export function ProductsPageView() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsPageClient />
    </Suspense>
  );
}

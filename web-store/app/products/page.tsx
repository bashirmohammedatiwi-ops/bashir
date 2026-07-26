import { Suspense } from "react";

import { ProductsPageClient } from "./ProductsPageClient";
import { LoadingState } from "@/components/ui/LoadingState";

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductsPageClient />
    </Suspense>
  );
}

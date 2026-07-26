"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { PackageDetailView } from "@/components/catalog/PackageDetailView";
import { BrandDetailView } from "@/components/catalog/BrandDetailView";
import { CategoryDetailView } from "@/components/catalog/CategoryDetailView";
import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import { LoadingState } from "@/components/ui/LoadingState";

type SlugPageKind = "product" | "category" | "brand" | "package";

export function SlugQueryPage({ kind }: { kind: SlugPageKind }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <SlugQueryInner kind={kind} />
    </Suspense>
  );
}

function SlugQueryInner({ kind }: { kind: SlugPageKind }) {
  const params = useSearchParams();
  const slug = params.get("slug")?.trim() ?? "";

  switch (kind) {
    case "product":
      return <ProductDetailView slug={slug} />;
    case "category":
      return <CategoryDetailView slug={slug} />;
    case "brand":
      return <BrandDetailView slug={slug} />;
    case "package":
      return <PackageDetailView slug={slug} />;
  }
}

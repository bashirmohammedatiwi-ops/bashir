"use client";

import { useQuery } from "@tanstack/react-query";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchBrand, fetchProducts } from "@/lib/api";
import { localizedName } from "@/lib/format";

export function BrandDetailClient({ slug }: { slug: string }) {
  const brandQ = useQuery({ queryKey: ["brand", slug], queryFn: () => fetchBrand(slug) });
  const brandId = brandQ.data?.id;
  const productsQ = useQuery({
    queryKey: ["products", "brand", brandId],
    queryFn: () => fetchProducts({ brandId: brandId!, limit: 48 }),
    enabled: !!brandId,
  });

  if (brandQ.isLoading) return <LoadingState />;

  const brand = brandQ.data;
  if (!brand) return <p className="empty-state container">البراند غير موجود.</p>;

  return (
    <div className="container">
      <div className="page-head">
        <h1>{localizedName(brand)}</h1>
        <p>منتجات {localizedName(brand)}</p>
      </div>
      {productsQ.isLoading ? <LoadingState /> : <ProductGrid products={productsQ.data?.data ?? []} />}
    </div>
  );
}

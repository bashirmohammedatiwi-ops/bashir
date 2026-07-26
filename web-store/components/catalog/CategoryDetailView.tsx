"use client";

import { useQuery } from "@tanstack/react-query";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchCategory, fetchProducts } from "@/lib/api";
import { localizedName } from "@/lib/format";

export function CategoryDetailView({ slug }: { slug: string }) {
  const categoryQ = useQuery({
    queryKey: ["category", slug],
    queryFn: () => fetchCategory(slug),
    enabled: !!slug,
  });
  const categoryId = categoryQ.data?.id;
  const productsQ = useQuery({
    queryKey: ["products", "category", categoryId],
    queryFn: () => fetchProducts({ categoryId: categoryId!, limit: 48 }),
    enabled: !!categoryId,
  });

  if (!slug) return <p className="empty-state container">لم يُحدَّد قسم.</p>;
  if (categoryQ.isLoading) return <LoadingState />;

  const category = categoryQ.data;
  if (!category) return <p className="empty-state container">القسم غير موجود.</p>;

  return (
    <div className="container">
      <div className="page-head">
        <h1>{localizedName(category)}</h1>
        <p>منتجات هذا القسم</p>
      </div>
      {productsQ.isLoading ? <LoadingState /> : <ProductGrid products={productsQ.data?.data ?? []} />}
    </div>
  );
}

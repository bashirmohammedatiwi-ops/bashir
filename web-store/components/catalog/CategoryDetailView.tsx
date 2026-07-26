"use client";

import { useQuery } from "@tanstack/react-query";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchCategory, fetchProducts } from "@/lib/api";
import { localizedName } from "@/lib/format";
import { categoryImageUrl } from "@/lib/mediaUrl";

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

  const heroImg = categoryImageUrl(category);

  return (
    <>
      <div className="detail-hero">
        <div className="container detail-hero-inner">
          {heroImg ? (
            <div className="detail-hero-media">
              <img src={heroImg} alt={localizedName(category)} />
            </div>
          ) : (
            <div className="detail-hero-fallback">{localizedName(category).slice(0, 1)}</div>
          )}
          <div>
            <p className="detail-hero-kicker">قسم</p>
            <h1>{localizedName(category)}</h1>
            <p>منتجات {localizedName(category)} المتوفرة في المتجر</p>
          </div>
        </div>
      </div>
      <div className="container">
        {productsQ.isLoading ? <LoadingState /> : <ProductGrid products={productsQ.data?.data ?? []} />}
      </div>
    </>
  );
}

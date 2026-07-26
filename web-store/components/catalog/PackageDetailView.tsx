"use client";

import { useQuery } from "@tanstack/react-query";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchPackage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { imageFromUnknown } from "@/lib/mediaUrl";
import type { Product } from "@/lib/types";

export function PackageDetailView({ slug }: { slug: string }) {
  const { data: pack, isLoading, isError } = useQuery({
    queryKey: ["package", slug],
    queryFn: () => fetchPackage(slug),
    enabled: !!slug,
  });

  if (!slug) return <p className="empty-state container">لم تُحدَّد باقة.</p>;
  if (isLoading) return <LoadingState />;
  if (isError || !pack) return <p className="empty-state container">الباقة غير موجودة.</p>;

  const cover = imageFromUnknown(pack.coverImage);
  const products = (pack.items ?? [])
    .map((i) => i.product)
    .filter((p): p is Product => !!p);

  return (
    <>
      <div className="detail-hero">
        <div className="container detail-hero-inner">
          {cover ? (
            <div className="detail-hero-media">
              <img src={cover} alt={pack.name} />
            </div>
          ) : (
            <div className="detail-hero-fallback">ب</div>
          )}
          <div>
            <p className="detail-hero-kicker">باقة</p>
            <h1>{pack.name}</h1>
            <div className="price-lg" style={{ marginTop: 8 }}>
              {formatPrice(pack.price)}
              {(pack.originalPrice ?? 0) > pack.price ? (
                <span className="price-old">{formatPrice(pack.originalPrice!)}</span>
              ) : null}
            </div>
            {pack.description ? <p>{pack.description}</p> : null}
          </div>
        </div>
      </div>
      <div className="container">
        <div className="section-head">
          <h2>محتويات الباقة</h2>
        </div>
        <ProductGrid products={products} />
      </div>
    </>
  );
}

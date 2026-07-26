"use client";

import { useQuery } from "@tanstack/react-query";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchBrand, fetchProducts } from "@/lib/api";
import { localizedName } from "@/lib/format";
import { brandLogoUrl } from "@/lib/mediaUrl";

export function BrandDetailView({ slug }: { slug: string }) {
  const brandQ = useQuery({
    queryKey: ["brand", slug],
    queryFn: () => fetchBrand(slug),
    enabled: !!slug,
  });
  const brandId = brandQ.data?.id;
  const productsQ = useQuery({
    queryKey: ["products", "brand", brandId],
    queryFn: () => fetchProducts({ brandId: brandId!, limit: 48 }),
    enabled: !!brandId,
  });

  if (!slug) return <p className="empty-state container">لم يُحدَّد براند.</p>;
  if (brandQ.isLoading) return <LoadingState />;

  const brand = brandQ.data;
  if (!brand) return <p className="empty-state container">البراند غير موجود.</p>;

  const logo = brandLogoUrl(brand);

  return (
    <>
      <div className="detail-hero">
        <div className="container detail-hero-inner">
          {logo ? (
            <div className="detail-hero-media is-brand">
              <img src={logo} alt={localizedName(brand)} />
            </div>
          ) : (
            <div className="detail-hero-fallback">{localizedName(brand).slice(0, 2)}</div>
          )}
          <div>
            <p className="detail-hero-kicker">براند</p>
            <h1>{localizedName(brand)}</h1>
            <p>منتجات {localizedName(brand)}</p>
          </div>
        </div>
      </div>
      <div className="container">
        {productsQ.isLoading ? <LoadingState /> : <ProductGrid products={productsQ.data?.data ?? []} />}
      </div>
    </>
  );
}

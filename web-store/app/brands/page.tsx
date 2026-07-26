"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LoadingState } from "@/components/ui/LoadingState";
import { fetchBrands } from "@/lib/api";
import { localizedName } from "@/lib/format";
import { brandLogoUrl } from "@/lib/mediaUrl";
import { brandHref } from "@/lib/storePaths";

export default function BrandsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <p className="empty-state container">تعذّر تحميل البراندات.</p>;

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h1>البراندات</h1>
          <p>تسوّقي حسب العلامة التجارية المفضّلة لديكِ.</p>
        </div>
      </div>
      <div className="container">
        <div className="brand-showcase-row page-grid">
          {(data ?? []).map((b) => {
            const img = brandLogoUrl(b);
            return (
              <Link key={b.id} href={brandHref(b.slug)} className="brand-showcase-card">
                <div className="brand-showcase-logo">
                  {img ? (
                    <img src={img} alt={localizedName(b)} loading="lazy" />
                  ) : (
                    <span>{localizedName(b).slice(0, 2)}</span>
                  )}
                </div>
                <span>{localizedName(b)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

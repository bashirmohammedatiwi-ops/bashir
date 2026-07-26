"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LoadingState } from "@/components/ui/LoadingState";
import { fetchBrands } from "@/lib/api";
import { localizedName } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { brandHref } from "@/lib/storePaths";

export default function BrandsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <p className="empty-state container">تعذّر تحميل البراندات.</p>;

  return (
    <div className="container">
      <div className="page-head">
        <h1>البراندات</h1>
        <p>تسوّقي حسب العلامة التجارية.</p>
      </div>
      <div className="brand-grid">
        {(data ?? []).map((b) => {
          const img = resolveMediaUrl(b.logo?.thumb || b.logo?.full || b.logo?.url);
          return (
            <Link key={b.id} href={brandHref(b.slug)} className="tile-card">
              {img ? <img src={img} alt={localizedName(b)} /> : null}
              <div>{localizedName(b)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

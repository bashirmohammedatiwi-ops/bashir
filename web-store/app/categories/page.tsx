"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LoadingState } from "@/components/ui/LoadingState";
import { fetchCategories } from "@/lib/api";
import { localizedName } from "@/lib/format";
import { categoryImageUrl } from "@/lib/mediaUrl";
import { categoryHref } from "@/lib/storePaths";

export default function CategoriesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <p className="empty-state container">تعذّر تحميل الأقسام.</p>;

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h1>الأقسام</h1>
          <p>تصفّحي المنتجات حسب القسم المناسب لكِ.</p>
        </div>
      </div>
      <div className="container">
        <div className="category-showcase-grid page-grid">
          {(data ?? []).map((c) => {
            const img = categoryImageUrl(c);
            return (
              <Link key={c.id} href={categoryHref(c.slug)} className="category-card">
                <div className="category-card-media">
                  {img ? (
                    <img src={img} alt={localizedName(c)} loading="lazy" />
                  ) : (
                    <div className="category-card-fallback">{localizedName(c).slice(0, 1)}</div>
                  )}
                </div>
                <span>{localizedName(c)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

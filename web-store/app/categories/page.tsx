"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LoadingState } from "@/components/ui/LoadingState";
import { fetchCategories } from "@/lib/api";
import { localizedName } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { categoryHref } from "@/lib/storePaths";

export default function CategoriesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <p className="empty-state container">تعذّر تحميل الأقسام.</p>;

  return (
    <div className="container">
      <div className="page-head">
        <h1>الأقسام</h1>
        <p>تصفّحي المنتجات حسب القسم.</p>
      </div>
      <div className="category-grid">
        {(data ?? []).map((c) => {
          const img = resolveMediaUrl(c.image?.thumb || c.image?.full || c.image?.url);
          return (
            <Link key={c.id} href={categoryHref(c.slug)} className="tile-card">
              {img ? <img src={img} alt={localizedName(c)} /> : null}
              <div>{localizedName(c)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

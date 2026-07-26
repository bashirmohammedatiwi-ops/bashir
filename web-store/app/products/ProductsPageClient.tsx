"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchProducts } from "@/lib/api";

function flag(v: string | null): boolean | undefined {
  if (v === "1" || v === "true") return true;
  return undefined;
}

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      brandId: searchParams.get("brandId") || undefined,
      subcategoryId: searchParams.get("subcategoryId") || undefined,
      tertiaryCategoryId: searchParams.get("tertiaryCategoryId") || undefined,
      concernSlug: searchParams.get("concernSlug") || undefined,
      isNew: flag(searchParams.get("isNew")),
      isFeatured: flag(searchParams.get("isFeatured")),
      isBestSeller: flag(searchParams.get("isBestSeller")),
      isPromo: flag(searchParams.get("isPromo")),
      title: searchParams.get("title") || undefined,
    }),
    [searchParams],
  );

  useEffect(() => {
    setSearch(filters.search ?? "");
    setQuery(filters.search ?? "");
  }, [filters.search]);

  const activeSearch = query || filters.search;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { ...filters, search: activeSearch }],
    queryFn: () =>
      fetchProducts({
        limit: 48,
        search: activeSearch || undefined,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        subcategoryId: filters.subcategoryId,
        tertiaryCategoryId: filters.tertiaryCategoryId,
        concernSlug: filters.concernSlug,
        isNew: filters.isNew,
        isFeatured: filters.isFeatured,
        isBestSeller: filters.isBestSeller,
        isPromo: filters.isPromo,
      }),
  });

  const products = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta?.total;
  const pageTitle = filters.title || "المنتجات";

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h1>{pageTitle}</h1>
          <p>تصفّحي المنتجات المتوفرة في المتجر.</p>
        </div>
      </div>
      <div className="container">
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <input
            className="search-bar"
            placeholder="ابحثي عن منتج، براند، أو قسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            بحث
          </button>
        </form>

        {total != null ? <p className="results-meta">{total} منتج</p> : null}

        {isLoading ? <LoadingState /> : null}
        {isError ? <p className="empty-state">تعذّر تحميل المنتجات.</p> : null}
        {!isLoading && !isError ? (
          products.length ? (
            <ProductGrid products={products} />
          ) : (
            <p className="empty-state">لا توجد منتجات مطابقة.</p>
          )
        ) : null}
      </div>
    </>
  );
}

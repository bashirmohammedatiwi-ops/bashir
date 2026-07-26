"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchProducts } from "@/lib/api";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", query],
    queryFn: () => fetchProducts({ limit: 48, search: query || undefined }),
  });

  const products = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta?.total;

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h1>المنتجات</h1>
          <p>تصفّحي كل المنتجات المتوفرة في المتجر.</p>
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
          <button type="submit" className="btn btn-primary">بحث</button>
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

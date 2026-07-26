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

  return (
    <div className="container">
      <div className="page-head">
        <h1>المنتجات</h1>
        <p>تصفّحي كل المنتجات المتوفرة في المتجر.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
      >
        <input
          className="search-bar"
          placeholder="ابحثي عن منتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>
      {isLoading ? <LoadingState /> : null}
      {isError ? <p className="empty-state">تعذّر تحميل المنتجات.</p> : null}
      {!isLoading && !isError ? <ProductGrid products={products} /> : null}
    </div>
  );
}

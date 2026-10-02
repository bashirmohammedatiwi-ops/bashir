"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { EntityMultiPicker } from "./EntityMultiPicker";
import { flattenProductPages, useProductsInfinite } from "@/hooks/useProductsInfinite";
import { queries } from "@/lib/queries";

type Props = {
  value?: string[];
  onChange?: (ids: string[]) => void;
  max?: number;
  sort?: "latest" | "brand";
  placeholder?: string;
};

export function InfiniteProductPicker({
  value,
  onChange,
  max,
  sort = "brand",
  placeholder = "ابحث بالاسم أو SKU أو الباركود...",
}: Props) {
  const [search, setSearch] = useState("");
  const selected = value ?? [];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } =
    useProductsInfinite({
      search: search.trim() || undefined,
      sort,
      limit: 40,
    });

  const loadedItems = useMemo(
    () => flattenProductPages(data?.pages) as Array<{ id: string; name?: string }>,
    [data?.pages],
  );
  const loadedIds = useMemo(() => new Set(loadedItems.map((p: any) => p.id)), [loadedItems]);

  const missingSelected = useMemo(
    () => selected.filter((id) => !loadedIds.has(id)),
    [selected, loadedIds],
  );

  const { data: pinnedSelected } = useQuery({
    queryKey: ["products-pinned", missingSelected],
    queryFn: async () => {
      const rows = await Promise.all(
        missingSelected.map((id) => queries.product(id).catch(() => null)),
      );
      return rows.filter(Boolean);
    },
    enabled: missingSelected.length > 0,
    staleTime: 5 * 60_000,
  });

  const items = useMemo(() => {
    const byId = new Map<string, (typeof loadedItems)[number]>();
    for (const row of loadedItems) byId.set((row as { id: string }).id, row);
    for (const row of pinnedSelected ?? []) {
      if (row && (row as { id?: string }).id) {
        byId.set((row as { id: string }).id, row as (typeof loadedItems)[number]);
      }
    }
    return [...byId.values()];
  }, [loadedItems, pinnedSelected]);

  const total = data?.pages?.[0]?.meta?.total ?? items.length;

  return (
    <EntityMultiPicker
      items={items}
      value={value}
      onChange={onChange}
      max={max}
      placeholder={placeholder}
      searchValue={search}
      onSearchChange={setSearch}
      serverSearch
      onLoadMore={() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
      }}
      hasMore={!!hasNextPage}
      loadingMore={isFetchingNextPage}
      loading={isLoading || (isFetching && !items.length)}
      totalCount={total}
    />
  );
}

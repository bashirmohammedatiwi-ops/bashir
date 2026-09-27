import { useInfiniteQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import type { PaginatedBody } from "@/lib/paginated";

export type ProductsInfiniteParams = {
  search?: string;
  sort?: "latest" | "brand" | "price_asc" | "price_desc" | "rating" | "popular" | "oldest";
  categoryId?: string;
  subcategoryId?: string;
  tertiaryCategoryId?: string;
  concernId?: string;
  brandId?: string;
  limit?: number;
};

export const PRODUCTS_PAGE_SIZE = 48;

export function productsInfiniteQueryKey(params: ProductsInfiniteParams) {
  return [
    "products-infinite",
    params.sort ?? "latest",
    params.search ?? "",
    params.categoryId ?? "",
    params.subcategoryId ?? "",
    params.tertiaryCategoryId ?? "",
    params.concernId ?? "",
    params.brandId ?? "",
    params.limit ?? PRODUCTS_PAGE_SIZE,
  ] as const;
}

export function useProductsInfinite(params: ProductsInfiniteParams & { enabled?: boolean }) {
  const limit = params.limit ?? PRODUCTS_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: productsInfiniteQueryKey(params),
    enabled: params.enabled ?? true,
    queryFn: ({ pageParam }) =>
      queries.products({
        page: pageParam,
        limit,
        search: params.search || undefined,
        sort: params.sort ?? "latest",
        categoryId: params.categoryId,
        subcategoryId: params.subcategoryId,
        tertiaryCategoryId: params.tertiaryCategoryId,
        concernId: params.concernId,
        brandId: params.brandId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedBody<unknown>) => {
      const meta = lastPage.meta as { page?: number; hasNext?: boolean } | undefined;
      if (meta?.hasNext) return (meta.page ?? 1) + 1;
      return undefined;
    },
    staleTime: 3 * 60_000,
  });
}

export function flattenProductPages(pages: PaginatedBody<unknown>[] | undefined) {
  if (!pages?.length) return [];
  return pages.flatMap((page) => page.data ?? []);
}

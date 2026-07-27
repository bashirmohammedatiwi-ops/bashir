export type PaginatedBody<T> = {
  data: T[];
  meta?: { total?: number; page?: number; limit?: number };
};

/** يفك غلاف API ويُرجع قائمة المنتجات/العناصر بشكل موحّد */
export function unwrapPaginated<T = unknown>(raw: unknown): PaginatedBody<T> {
  if (!raw) return { data: [] };
  if (Array.isArray(raw)) return { data: raw as T[] };

  const top = raw as Record<string, unknown>;

  if (top.data && typeof top.data === "object" && !Array.isArray(top.data)) {
    const inner = top.data as Record<string, unknown>;
    if (Array.isArray(inner.data)) {
      return { data: inner.data as T[], meta: inner.meta as PaginatedBody<T>["meta"] };
    }
    if (Array.isArray(inner.items)) {
      return { data: inner.items as T[], meta: inner.meta as PaginatedBody<T>["meta"] };
    }
  }

  if (Array.isArray(top.data)) {
    return { data: top.data as T[], meta: top.meta as PaginatedBody<T>["meta"] };
  }
  if (Array.isArray(top.items)) {
    return { data: top.items as T[], meta: top.meta as PaginatedBody<T>["meta"] };
  }

  return { data: [] };
}

export function paginatedItems<T>(raw: unknown): T[] {
  return unwrapPaginated<T>(raw).data;
}

"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { arProducts, brandLabel, formatNumber } from "@/lib/format";
import type { Paged, Product } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

type Facets = {
  brands?: { id: string; name: string; count: number }[];
  kinds?: { id: string; name: string; count: number }[];
  categories?: { id: string; name: string; count: number }[];
  price?: { min: number; max: number };
};
type SearchResp = Paged<Product> & { facets?: Facets; corrected?: string | null; understood?: string[] };

const PRICE_RANGES: [string, number | undefined, number | undefined][] = [
  ["أقل من 10 آلاف", undefined, 10000],
  ["10–25 ألف", 10000, 25000],
  ["25–50 ألف", 25000, 50000],
  ["50 ألف+", 50000, undefined],
];

const PRODUCT_SORTS = [
  ["popular", "الأكثر طلباً"],
  ["latest", "الأحدث"],
  ["price_asc", "السعر: من الأقل"],
  ["price_desc", "السعر: من الأعلى"],
  ["rating", "الأعلى تقييماً"],
];
const SEARCH_SORTS = [
  ["relevance", "الأنسب"],
  ["best", "الأكثر طلباً"],
  ["new", "الأحدث"],
  ["price_asc", "السعر: من الأقل"],
  ["price_desc", "السعر: من الأعلى"],
  ["discount", "أعلى خصم"],
];

/**
 * قائمة منتجات بفلاتر وترتيب وتحميل متواصل.
 * mode=products: /products بفلاتر ثابتة (قسم، براند، عروض…). mode=search: /search مع فلاتر البراند والنوع.
 */
export function ListingView({
  mode,
  base,
  initial,
  q,
}: {
  mode: "products" | "search";
  base?: Record<string, string>;
  initial?: SearchResp | Paged<Product> | null;
  q?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sorts = mode === "search" ? SEARCH_SORTS : PRODUCT_SORTS;
  const sort = sp.get("sort") ?? sorts[0][0];
  const minPrice = sp.get("minPrice") ?? undefined;
  const maxPrice = sp.get("maxPrice") ?? undefined;
  const inStock = sp.get("inStock") === "1";
  const deals = sp.get("deals") === "1";
  const brand = sp.get("brand") ?? undefined;
  const kind = sp.get("kind") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const activeCount = [minPrice || maxPrice, inStock, deals, brand, kind, category].filter(Boolean).length;

  const setParam = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const queryKey = useMemo(
    () => [mode, base, q, sort, minPrice, maxPrice, inStock, deals, brand, kind, category],
    [mode, base, q, sort, minPrice, maxPrice, inStock, deals, brand, kind, category],
  );
  const isDefault = !minPrice && !maxPrice && !inStock && !deals && !brand && !kind && !category && sort === sorts[0][0];

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    initialData: initial && isDefault ? { pages: [initial as SearchResp], pageParams: [1] } : undefined,
    queryFn: ({ pageParam }) =>
      mode === "search"
        ? api<SearchResp>("/search", {
            auth: false,
            query: { q, page: pageParam, limit: 24, sort, minPrice, maxPrice, inStock: inStock ? 1 : undefined, deals: deals ? 1 : undefined, brand, kind, category },
          })
        : api<SearchResp>("/products", {
            auth: false,
            query: { ...base, page: pageParam, limit: 24, sort, minPrice, maxPrice, inStock: inStock ? 1 : undefined, isPromo: deals ? 1 : base?.isPromo, brandId: brand ?? base?.brandId, subcategoryId: category ?? base?.subcategoryId },
          }),
    getNextPageParam: (last) => (last.meta?.hasNext ? last.meta.page + 1 : undefined),
  });

  const pages = query.data?.pages ?? [];
  const items = pages.flatMap((p) => p.data ?? []);
  const total = pages[0]?.meta?.total ?? 0;
  // صفحات الأقسام: عدّادات البراندات ومدى السعر من /products/facets (البحث يعيدها مع النتائج).
  const productFacets = useQuery({
    queryKey: ["facets", base, inStock, deals],
    enabled: mode === "products",
    staleTime: 60_000,
    queryFn: () => api<Facets>("/products/facets", { auth: false, query: { ...base, inStock: inStock ? 1 : undefined, isPromo: deals ? 1 : base?.isPromo } }),
  });
  const facets = mode === "search" ? (pages[0] as SearchResp | undefined)?.facets : productFacets.data;

  // تحميل الصفحة التالية عند الاقتراب من الأسفل.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    }, { rootMargin: "900px" });
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  const Filters = (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 font-extrabold">السعر</h4>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.filter(([, min, max]) => !facets?.price || ((min ?? 0) <= facets.price.max && (max ?? Infinity) >= facets.price.min)).map(([label, min, max]) => {
            const on = String(min ?? "") === (minPrice ?? "") && String(max ?? "") === (maxPrice ?? "");
            return (
              <button key={label} onClick={() => setParam(on ? { minPrice: undefined, maxPrice: undefined } : { minPrice: min ? String(min) : undefined, maxPrice: max ? String(max) : undefined })} className={clsx("chip", on && "chip-on")}>
                {label}
              </button>
            );
          })}
        </div>
        <PriceRange key={`${minPrice}-${maxPrice}`} min={minPrice} max={maxPrice} bounds={facets?.price ?? undefined} onApply={(a, b) => setParam({ minPrice: a, maxPrice: b })} />
      </div>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-canvas px-4 py-3 font-semibold">
          المتوفر فقط
          <input type="checkbox" checked={inStock} onChange={(e) => setParam({ inStock: e.target.checked ? "1" : undefined })} className="h-5 w-5 accent-[rgb(var(--accent-dark))]" />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-canvas px-4 py-3 font-semibold">
          العروض والخصومات
          <input type="checkbox" checked={deals} onChange={(e) => setParam({ deals: e.target.checked ? "1" : undefined })} className="h-5 w-5 accent-[rgb(var(--accent-dark))]" />
        </label>
      </div>
      {facets?.kinds && facets.kinds.length > 1 && (
        <FacetList title="النوع" items={facets.kinds} value={kind} onPick={(v) => setParam({ kind: v })} />
      )}
      {facets?.categories && facets.categories.length > 1 && (
        <FacetList title="القسم" items={facets.categories} value={category} onPick={(v) => setParam({ category: v })} />
      )}
      {facets?.brands && facets.brands.length > 1 && (
        <FacetList title="البراند" items={facets.brands.map((b) => ({ ...b, name: brandLabel(b.name) }))} value={brand} onPick={(v) => setParam({ brand: v })} />
      )}
      {activeCount > 0 && (
        <button
          onClick={() => setParam({ minPrice: undefined, maxPrice: undefined, inStock: undefined, deals: undefined, brand: undefined, kind: undefined, category: undefined })}
          className="w-full rounded-2xl border border-hairline py-3 text-sm font-bold text-sale hover:bg-rose-soft"
        >
          مسح كل الفلاتر
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="card sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto p-5">{Filters}</div>
      </aside>
      <div>
        {mode === "products" && base?.brandId && (facets?.categories?.length ?? 0) > 1 && (
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            <button onClick={() => setParam({ category: undefined })} className={clsx("chip flex-none", !category && "chip-on")}>
              الكل
            </button>
            {facets!.categories!.map((c) => (
              <button key={c.id} onClick={() => setParam({ category: category === c.id ? undefined : c.id })} className={clsx("chip flex-none", category === c.id && "chip-on")}>
                {c.name} <span className="text-xs opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="me-auto text-sm font-bold text-ink-muted">{query.isLoading ? "…" : total ? arProducts(total) : "لا نتائج"}</span>
          <button onClick={() => setFiltersOpen(true)} className="chip lg:hidden">
            <Icon name="filter" size={16} /> تصفية {activeCount > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-dark text-[11px] text-white">{activeCount}</span>}
          </button>
          <label className="chip">
            <Icon name="sort" size={16} />
            <select value={sort} onChange={(e) => setParam({ sort: e.target.value })} className="bg-transparent font-semibold outline-none">
              {sorts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>

        {query.isLoading && !items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center">
            <Icon name="search" size={40} className="mx-auto mb-3 text-ink-muted" />
            <p className="text-lg font-extrabold">{activeCount ? "لا منتجات بهذه الفلاتر" : "لا منتجات هنا بعد"}</p>
            <p className="mt-1 text-sm text-ink-muted">{activeCount ? "جربي إزالة بعض الفلاتر" : "تابعينا — منتجات جديدة قريباً"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4">
            {items.map((p, i) => (
              <ProductCard key={`${p.id}-${i}`} product={p} priority={i < 4} />
            ))}
            {query.isFetchingNextPage && Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={`s${i}`} />)}
          </div>
        )}
        <div ref={sentinel} className="h-4" />
        {!query.hasNextPage && items.length > 24 && <p className="py-6 text-center text-sm text-ink-muted">عرضنا كل المنتجات ({formatNumber(total)})</p>}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[66] lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-surface p-5 pb-8 animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">تصفية المنتجات</h3>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2" aria-label="إغلاق">
                <Icon name="close" />
              </button>
            </div>
            {Filters}
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full">
              عرض {total ? arProducts(total) : "النتائج"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FacetList({ title, items, value, onPick }: { title: string; items: { id: string; name: string; count: number }[]; value?: string; onPick: (v?: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 8);
  return (
    <div>
      <h4 className="mb-3 font-extrabold">{title}</h4>
      <ul className="space-y-1">
        {shown.map((it) => {
          const on = value === it.id;
          return (
            <li key={it.id}>
              <button onClick={() => onPick(on ? undefined : it.id)} className={clsx("flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition", on ? "bg-accent-light font-bold text-accent-dark" : "hover:bg-canvas")}>
                <span className="flex items-center gap-2">
                  <span className={clsx("grid h-4 w-4 place-items-center rounded border", on ? "border-accent-dark bg-accent-dark text-white" : "border-hairline")}>{on && <Icon name="check" size={12} stroke={3} />}</span>
                  {it.name}
                </span>
                <span className="text-xs text-ink-muted">{it.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {items.length > 8 && (
        <button onClick={() => setAll(!all)} className="mt-2 text-sm font-bold text-accent-dark">
          {all ? "عرض أقل" : `عرض الكل (${items.length})`}
        </button>
      )}
    </div>
  );
}

function PriceRange({ min, max, bounds, onApply }: { min?: string; max?: string; bounds?: { min: number; max: number }; onApply: (a?: string, b?: string) => void }) {
  const [a, setA] = useState(min ?? "");
  const [b, setB] = useState(max ?? "");
  const clean = (v: string) => v.replace(/[^\d]/g, "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(clean(a) || undefined, clean(b) || undefined);
      }}
      className="mt-3 flex items-center gap-2"
    >
      <input value={a} onChange={(e) => setA(clean(e.target.value))} inputMode="numeric" placeholder={bounds ? `من ${formatNumber(bounds.min)}` : "من"} className="field h-10 min-w-0 px-3 text-sm" aria-label="أقل سعر" />
      <span className="text-ink-muted">–</span>
      <input value={b} onChange={(e) => setB(clean(e.target.value))} inputMode="numeric" placeholder={bounds ? `إلى ${formatNumber(bounds.max)}` : "إلى"} className="field h-10 min-w-0 px-3 text-sm" aria-label="أعلى سعر" />
      <button className="btn h-10 flex-none bg-ink px-3 text-xs text-white">تطبيق</button>
    </form>
  );
}

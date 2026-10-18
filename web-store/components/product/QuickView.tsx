"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { productHref } from "@/lib/links";
import { useUi } from "@/lib/stores/ui";
import type { Product } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { ProductView } from "./ProductView";

/** نظرة سريعة: المعرض ولوحة الشراء في نافذة — بلا مغادرة القائمة. */
export function QuickView() {
  const slug = useUi((s) => s.quickView);
  const close = useUi((s) => s.openQuickView);
  const cartOpen = useUi((s) => s.cartOpen);
  const q = useQuery({ queryKey: ["product", slug], enabled: !!slug, queryFn: () => api<Product>(`/products/${encodeURIComponent(slug!)}`, { auth: false }) });

  useEffect(() => {
    if (!slug) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close(null);
    window.addEventListener("keydown", esc);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = "";
    };
  }, [slug, close]);

  // بعد الإضافة تُفتح السلة — نغلق النافذة.
  useEffect(() => {
    if (cartOpen && slug) close(null);
  }, [cartOpen, slug, close]);

  if (!slug) return null;
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-night/40 p-6 backdrop-blur-[2px]" onClick={() => close(null)}>
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-canvas p-6 shadow-float animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => close(null)} className="absolute left-4 top-4 z-10 rounded-full bg-surface p-2 shadow-card" aria-label="إغلاق">
          <Icon name="close" />
        </button>
        {q.data ? (
          <>
            <ProductView product={q.data} />
            <Link href={productHref(q.data.slug)} onClick={() => close(null)} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-dark hover:underline">
              التفاصيل الكاملة والتقييمات <Icon name="chevronLeft" size={16} />
            </Link>
          </>
        ) : q.isError ? (
          <p className="p-10 text-center text-ink-muted">تعذّر تحميل المنتج</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="aspect-square" />
            <Skeleton className="h-96" />
          </div>
        )}
      </div>
    </div>
  );
}

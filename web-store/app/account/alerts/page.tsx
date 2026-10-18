"use client";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { useRestockAlerts, useRestockToggle } from "@/lib/hooks/alerts";
import type { Product } from "@/lib/types";

export default function AlertsPage() {
  const { ids, isLoading } = useRestockAlerts();
  const toggle = useRestockToggle();
  const products = useQueries({ queries: ids.map((id) => ({ queryKey: ["product", id], queryFn: () => api<Product>(`/products/${id}`, { auth: false }), staleTime: 300_000 })) });
  return (
    <div>
      <h1 className="text-2xl font-extrabold">تنبيهات التوفّر 🔔</h1>
      <p className="mt-1 text-sm text-ink-muted">نرسل لكِ إشعاراً فور عودة أي منتج هنا للمخزون</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4">
        {isLoading ? (
          [0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)
        ) : ids.length ? (
          products.map((q, i) =>
            q.data ? (
              <div key={ids[i]} className="space-y-2">
                <ProductCard product={q.data} />
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className={q.data.stock > 0 ? "font-bold text-success" : "text-ink-muted"}>{q.data.stock > 0 ? "✓ عاد للمخزون" : "بانتظار التوفّر"}</span>
                  <button onClick={() => toggle.mutate({ id: ids[i], on: false })} className="font-bold text-sale hover:underline">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <ProductCardSkeleton key={ids[i]} />
            ),
          )
        ) : (
          <div className="card col-span-full p-10 text-center">
            <Icon name="bell" size={36} className="mx-auto text-ink-muted" />
            <p className="mt-2 font-extrabold">لا تنبيهات</p>
            <p className="mt-1 text-sm text-ink-muted">حين ينفد منتج تحبينه اضغطي «أعلميني عند التوفّر» في صفحته</p>
            <Link href="/" className="btn-soft mt-4">
              تسوّقي
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

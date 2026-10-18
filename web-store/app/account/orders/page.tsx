"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { OrderCard } from "@/components/account/OrderCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/stores/auth";
import type { Order, Paged } from "@/lib/types";

const TABS: [string, string][] = [
  ["", "الكل"],
  ["PENDING", "بانتظار التأكيد"],
  ["PROCESSING", "قيد التجهيز"],
  ["SHIPPED", "في الطريق"],
  ["DELIVERED", "تم التوصيل"],
  ["CANCELLED", "ملغاة"],
];

export default function OrdersPage() {
  const user = useAuth((s) => s.user)!;
  const [status, setStatus] = useState("");
  const q = useInfiniteQuery({
    queryKey: ["orders", user.id, status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api<Paged<Order>>("/orders", { query: { page: pageParam, limit: 10, preview: true, status: status || undefined } }),
    getNextPageParam: (l) => (l.meta.hasNext ? l.meta.page + 1 : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.data) ?? [];
  return (
    <div>
      <h1 className="text-2xl font-extrabold">طلباتي</h1>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={clsx("chip flex-none", status === v && "chip-on")}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {q.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)
        ) : items.length ? (
          items.map((o) => <OrderCard key={o.id} order={o} />)
        ) : (
          <div className="card p-10 text-center">
            <p className="font-bold">{status ? "لا طلبات بهذه الحالة" : "لا طلبات بعد"}</p>
            <Link href="/" className="btn-primary mt-4">
              تسوّقي الآن
            </Link>
          </div>
        )}
        {q.hasNextPage && (
          <button onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} className="btn-ghost w-full">
            {q.isFetchingNextPage ? "…" : "عرض المزيد"}
          </button>
        )}
      </div>
    </div>
  );
}

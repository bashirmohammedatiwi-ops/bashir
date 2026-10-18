"use client";
import { useQuery } from "@tanstack/react-query";
import { useHydrated } from "../Providers";
import { ProductRow } from "../product/ProductRow";
import { SectionHeader } from "../ui/SectionHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/stores/auth";
import type { Product } from "@/lib/types";

/** «اطلبيها مرة أخرى» — مما اشترته الزبونة سابقاً (للمسجّلات فقط). */
export function BuyAgain({ boxed }: { boxed?: boolean }) {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ["buy-again", user?.id], enabled: !!user, queryFn: () => api<Product[]>("/products/me/buy-again", { query: { limit: 14 } }) });
  const items = (q.data ?? []).filter((p) => p.stock > 0);
  if (!hydrated || !user || !items.length) return null;
  const body = (
    <>
      <SectionHeader title="اطلبيها مرة أخرى 🔁" subtitle="منتجات اشتريتِها سابقاً — بضغطة واحدة" href="/account/orders" action="طلباتي" />
      <ProductRow products={items} />
    </>
  );
  return boxed ? <section>{body}</section> : <section className="container py-6 md:py-10">{body}</section>;
}

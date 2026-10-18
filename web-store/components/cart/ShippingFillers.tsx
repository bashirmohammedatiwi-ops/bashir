"use client";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "../Providers";
import { ProductRow } from "../product/ProductRow";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Paged, Product } from "@/lib/types";

/** «أضيفي هذا وتوصيلكِ مجاني»: منتجات بسعر يقارب المبلغ الناقص. */
export function ShippingFillers({ subtotal, exclude }: { subtotal: number; exclude: string[] }) {
  const threshold = useSettings().freeShippingThreshold ?? 0;
  const left = threshold - subtotal;
  const band = left > 0 ? Math.ceil(left / 1000) * 1000 : 0;
  const q = useQuery({
    queryKey: ["fillers", band],
    enabled: band > 0 && band <= 40000,
    staleTime: 300_000,
    queryFn: () => api<Paged<Product>>("/products", { auth: false, query: { minPrice: band, maxPrice: band + 12000, inStock: 1, limit: 16, sort: "popular", lite: 1 } }),
  });
  const items = (q.data?.data ?? []).filter((p) => !exclude.includes(p.id));
  if (band <= 0 || !items.length) return null;
  return (
    <section className="py-8">
      <h2 className="section-title">أضيفي {formatPrice(left)} وتوصيلكِ مجاني 🚚</h2>
      <p className="mb-4 mt-1 text-sm text-ink-muted">منتجات محبوبة بسعر قريب من المبلغ الناقص</p>
      <ProductRow products={items} />
    </section>
  );
}

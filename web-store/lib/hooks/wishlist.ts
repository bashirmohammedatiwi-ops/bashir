"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../api";
import { useAuth } from "../stores/auth";
import { toast } from "../stores/ui";
import type { Product } from "../types";

/** المفضلة على السيرفر (للمسجّلات) — مثل التطبيق، وتنبيه انخفاض السعر يعمل تلقائياً. */
export function useWishlist() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const r = await api<unknown>("/wishlist");
      const list = Array.isArray(r) ? r : ((r as { data?: unknown[] })?.data ?? []);
      return (list as { product?: Product; productId?: string; id?: string }[]).map((w) => (w.product ?? w) as Product);
    },
  });
}

export function useWishToggle() {
  const qc = useQueryClient();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const m = useMutation({
    mutationFn: (p: Product) => api(`/wishlist/${p.id}/toggle`, { method: "POST" }),
    onMutate: async (p) => {
      const key = ["wishlist", user?.id];
      const prev = qc.getQueryData<Product[]>(key) ?? [];
      const has = prev.some((x) => x.id === p.id);
      qc.setQueryData(key, has ? prev.filter((x) => x.id !== p.id) : [p, ...prev]);
      toast({ text: has ? "أُزيل من المفضلة" : "أُضيف للمفضلة 💜 — سننبّهكِ إن انخفض سعره", action: has ? undefined : { label: "المفضلة", href: "/wishlist" } });
      return { prev, key };
    },
    onError: (_e, _p, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
      toast({ text: "تعذّر تحديث المفضلة", tone: "error" });
    },
  });
  return (p: Product) => {
    if (!user) {
      toast({ text: "سجّلي الدخول لحفظ المفضلة", action: { label: "دخول", href: "/signin" } });
      router.push(`/signin?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    m.mutate(p);
  };
}

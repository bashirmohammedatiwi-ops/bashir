"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productCover } from "../media";
import type { Product } from "../types";
import { toast } from "./ui";

export type CompareItem = { id: string; slug: string; name: string; image: string };
export const COMPARE_MAX = 4;

type S = { items: CompareItem[]; toggle: (p: Product) => void; remove: (id: string) => void; clear: () => void };

/** قائمة المقارنة (حتى 4 منتجات) — محفوظة على الجهاز. */
export const useCompare = create<S>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (p) => {
        const items = get().items;
        if (items.some((x) => x.id === p.id)) return set({ items: items.filter((x) => x.id !== p.id) });
        if (items.length >= COMPARE_MAX) return toast({ text: `تقدرين تقارنين ${COMPARE_MAX} منتجات كحد أقصى`, tone: "error" });
        set({ items: [...items, { id: p.id, slug: p.slug, name: p.nameAr || p.name, image: productCover(p, "thumb") }] });
        if (items.length === 0) toast({ text: "أُضيف للمقارنة ⚖️ — أضيفي منتجاً آخر", action: { label: "المقارنة", href: "/compare" } });
      },
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: "dh-compare" },
  ),
);

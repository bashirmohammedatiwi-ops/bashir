"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BeautyPackage, Product, Shade } from "../types";
import { productCover } from "../media";

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
  stock: number;
  shadeId?: string | null;
  shadeName?: string | null;
  shadeColor?: string | null;
};

export type CartPackage = { id: string; slug: string; name: string; price: number; items: Record<string, number>; sets: number; cover?: string | null };

type CartState = {
  lines: CartLine[];
  packages: CartPackage[];
  couponCode: string | null;
  lastAdded: number;
  add: (p: Product, qty?: number, shade?: Shade | null) => boolean;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  addPackage: (pack: BeautyPackage, shades?: Record<string, Shade | null>) => void;
  removePackage: (id: string) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
};

const keyOf = (productId: string, shadeId?: string | null) => (shadeId ? `${productId}:${shadeId}` : productId);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      packages: [],
      couponCode: null,
      lastAdded: 0,
      add: (p, qty = 1, shade) => {
        const key = keyOf(p.id, shade?.id);
        const lines = [...get().lines];
        const i = lines.findIndex((l) => l.key === key);
        const stock = shade ? shade.stock : p.stock;
        const max = stock > 0 ? stock : 99;
        if (i >= 0) {
          const next = Math.min(max, lines[i].quantity + qty);
          if (next === lines[i].quantity) return false;
          lines[i] = { ...lines[i], quantity: next };
        } else {
          lines.push({
            key,
            productId: p.id,
            slug: p.slug,
            name: p.nameAr || p.name,
            brand: p.brand?.name,
            image: productCover(p, "thumb"),
            price: shade?.price ?? p.price,
            originalPrice: p.originalPrice,
            quantity: Math.min(max, qty),
            stock,
            shadeId: shade?.id ?? null,
            shadeName: shade?.name ?? null,
            shadeColor: shade?.colorHex ?? null,
          });
        }
        set({ lines, lastAdded: Date.now() });
        return true;
      },
      setQty: (key, qty) =>
        set({
          lines:
            qty <= 0
              ? get().lines.filter((l) => l.key !== key)
              : get().lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.stock > 0 ? l.stock : 99, qty) } : l)),
        }),
      remove: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      addPackage: (pack, shades = {}) => {
        for (const it of pack.items) get().add(it.product, it.quantity, shades[it.product.id] ?? null);
        const packages = [...get().packages];
        const i = packages.findIndex((p) => p.id === pack.id);
        if (i >= 0) packages[i] = { ...packages[i], sets: packages[i].sets + 1 };
        else
          packages.push({
            id: pack.id,
            slug: pack.slug,
            name: pack.name,
            price: pack.price,
            cover: pack.coverUrl ?? pack.thumbs[0] ?? null,
            items: Object.fromEntries(pack.items.map((it) => [it.product.id, it.quantity])),
            sets: 1,
          });
        set({ packages, lastAdded: Date.now() });
      },
      removePackage: (id) => set({ packages: get().packages.filter((p) => p.id !== id) }),
      setCoupon: (code) => set({ couponCode: code }),
      clear: () => set({ lines: [], packages: [], couponCode: null }),
    }),
    { name: "dh-cart", partialize: (s) => ({ lines: s.lines, packages: s.packages, couponCode: s.couponCode }) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.price * l.quantity, 0);

/** حالة الباقات في السلة — نفس قاعدة السيرفر (القطعة لا تُحسب لباقتين). */
export function packageStatus(lines: CartLine[], packages: CartPackage[]) {
  const left = new Map<string, number>();
  const price = new Map<string, number>();
  for (const l of lines) {
    left.set(l.productId, (left.get(l.productId) ?? 0) + l.quantity);
    price.set(l.productId, l.price);
  }
  return packages.map((p) => {
    let sets = p.sets;
    const missing: string[] = [];
    for (const [pid, need] of Object.entries(p.items)) {
      const have = Math.floor((left.get(pid) ?? 0) / need);
      if (have === 0) missing.push(pid);
      sets = Math.min(sets, have);
    }
    const itemsTotal = Object.entries(p.items).reduce((s, [pid, n]) => s + (price.get(pid) ?? 0) * n, 0);
    if (sets > 0) for (const [pid, need] of Object.entries(p.items)) left.set(pid, (left.get(pid) ?? 0) - sets * need);
    const perSet = itemsTotal - p.price;
    return { pack: p, sets, saving: sets > 0 && perSet > 0 ? perSet * sets : 0, missing };
  });
}

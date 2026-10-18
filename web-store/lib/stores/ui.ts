"use client";
import { create } from "zustand";

export type Toast = { id: number; text: string; tone?: "success" | "error" | "info"; action?: { label: string; href: string } };

type UiState = {
  cartOpen: boolean;
  menuOpen: boolean;
  toasts: Toast[];
  quickView: string | null;
  openQuickView: (slug: string | null) => void;
  openCart: (v: boolean) => void;
  openMenu: (v: boolean) => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

export const useUi = create<UiState>()((set, get) => ({
  cartOpen: false,
  menuOpen: false,
  toasts: [],
  quickView: null,
  openQuickView: (slug) => set({ quickView: slug }),
  openCart: (v) => set({ cartOpen: v }),
  openMenu: (v) => set({ menuOpen: v }),
  toast: (t) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] });
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));

export const toast = (t: Omit<Toast, "id">) => useUi.getState().toast(t);

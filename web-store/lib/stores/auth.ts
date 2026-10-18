"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, bindAuth } from "../api";
import type { User } from "../types";

type Tokens = { accessToken: string; refreshToken?: string };

type AuthState = {
  access: string | null;
  refresh: string | null;
  user: User | null;
  ready: boolean;
  setTokens: (t: Tokens | null) => void;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      access: null,
      refresh: null,
      user: null,
      ready: false,
      setTokens: (t) =>
        set(t ? { access: t.accessToken, refresh: t.refreshToken ?? get().refresh } : { access: null, refresh: null, user: null }),
      login: async (phone, password) => {
        const t = await api<Tokens>("/auth/login", { method: "POST", body: { phone, password }, auth: false });
        get().setTokens(t);
        await get().loadMe();
      },
      register: async (name, phone, password) => {
        const t = await api<Tokens>("/auth/register", { method: "POST", body: { name, phone, password }, auth: false });
        get().setTokens(t);
        await get().loadMe();
      },
      loadMe: async () => {
        if (!get().access) return set({ ready: true, user: null });
        try {
          const user = await api<User>("/auth/me");
          set({ user, ready: true });
        } catch {
          set({ ready: true });
        }
      },
      logout: async () => {
        try {
          await api("/auth/logout", { method: "POST", body: { refreshToken: get().refresh } });
        } catch {}
        set({ access: null, refresh: null, user: null });
      },
    }),
    { name: "dh-auth", partialize: (s) => ({ access: s.access, refresh: s.refresh, user: s.user }) },
  ),
);

bindAuth(
  () => ({ access: useAuth.getState().access, refresh: useAuth.getState().refresh }),
  (t) => useAuth.getState().setTokens(t),
);

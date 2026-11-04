"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/stores/auth";
import type { HomeFeed, LoyaltyRules } from "@/lib/types";
import { reportClientError } from "@/lib/reportError";

type Settings = HomeFeed["settings"];
const SettingsCtx = createContext<Settings>({});
export const useSettings = () => useContext(SettingsCtx);

export const DEFAULT_LOYALTY: LoyaltyRules = { pointValue: 1, earnPercent: 1, redeemStep: 250, firstOrderBonus: 500 };
export const useLoyaltyRules = () => useSettings().loyalty ?? DEFAULT_LOYALTY;

export function Providers({ children, settings }: { children: React.ReactNode; settings: Settings }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } } }),
  );
  useEffect(() => {
    useAuth.getState().loadMe();
    const onErr = (e: ErrorEvent) => reportClientError("window", e.error ?? e.message);
    const onRej = (e: PromiseRejectionEvent) => reportClientError("promise", e.reason);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);
  return (
    <SettingsCtx.Provider value={settings}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SettingsCtx.Provider>
  );
}

/** يمنع اختلاف الرسم بين السيرفر والمتصفح لما يُحفظ محلياً (السلة، الدخول). */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

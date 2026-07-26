"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchHome } from "@/lib/api";
import { displayStoreName } from "@/lib/config";
import type { StoreSettings } from "@/lib/types";

type StoreContextValue = {
  settings: StoreSettings;
  storeName: string;
  whatsappUrl?: string;
};

const StoreContext = createContext<StoreContextValue>({
  settings: {},
  storeName: displayStoreName("ar"),
});

function whatsappLink(phone?: string) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["home", "settings"],
    queryFn: fetchHome,
    staleTime: 5 * 60_000,
  });

  const settings = data?.settings ?? {};
  const storeName = settings.storeName || displayStoreName("ar");
  const phone = settings.whatsapp || settings.supportPhone;

  return (
    <StoreContext.Provider
      value={{
        settings,
        storeName,
        whatsappUrl: whatsappLink(phone),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}

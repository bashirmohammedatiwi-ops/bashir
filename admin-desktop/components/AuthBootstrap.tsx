"use client";

import { useEffect } from "react";
import { mutations } from "@/lib/queries";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DEFAULT_ADMIN_USER,
  useAuth,
} from "@/store/auth";

export function AuthBootstrap() {
  const setSession = useAuth((s) => s.setSession);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const tokens = await mutations.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (cancelled) return;
        setSession({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: DEFAULT_ADMIN_USER,
        });
      } catch {
        // Keep the built-in local session when backend is unavailable.
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  return null;
}

"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function appNavigate(router: AppRouterInstance, path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const target = normalized.endsWith("/") ? normalized : `${normalized}/`;

  if (typeof window !== "undefined" && window.location.protocol === "app:") {
    window.location.href = target;
    return;
  }

  router.replace(target);
}

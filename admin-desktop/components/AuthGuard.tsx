"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/store/auth";
import { appNavigate } from "@/lib/navigate";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuth.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuth.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated && !accessToken) {
      appNavigate(router, "/login");
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated) {
    return (
      <div className="alhayaa-loading-screen">
        <Spin size="large" />
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="alhayaa-loading-screen">
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}

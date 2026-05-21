"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appNavigate } from "@/lib/navigate";
import { useAuth } from "@/store/auth";

export default function Index() {
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
    if (!hydrated) return;
    appNavigate(router, accessToken ? "/dashboard" : "/login");
  }, [hydrated, accessToken, router]);

  return <div className="alhayaa-loading-screen">جاري التحميل...</div>;
}

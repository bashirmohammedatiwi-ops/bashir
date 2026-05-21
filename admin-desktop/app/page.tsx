"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { appNavigate } from "@/lib/navigate";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    appNavigate(router, "/dashboard");
  }, [router]);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "#f5f5f7",
        color: "#4a2466",
        fontFamily: 'Cairo, "Segoe UI", sans-serif',
      }}
    >
      جاري التحميل...
    </div>
  );
}

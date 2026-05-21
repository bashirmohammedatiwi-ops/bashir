"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";

const nav = [
  { href: "/dashboard", label: "لوحة المعلومات", icon: "📊" },
  { href: "/products", label: "المنتجات", icon: "🛍️" },
  { href: "/categories", label: "الفئات", icon: "🗂️" },
  { href: "/subcategories", label: "الأقسام الفرعية", icon: "📂" },
  { href: "/brands", label: "البراندات", icon: "💎" },
  { href: "/orders", label: "الطلبات", icon: "📦" },
  { href: "/users", label: "العملاء", icon: "👥" },
  { href: "/reviews", label: "التقييمات", icon: "⭐" },
  { href: "/notifications", label: "الإشعارات", icon: "🔔" },
  { href: "/packages", label: "الباقات", icon: "🎁" },
  { href: "/banners", label: "البنرات", icon: "🖼️" },
  { href: "/coupons", label: "الكوبونات", icon: "🏷️" },
  { href: "/home-blocks", label: "الصفحة الرئيسية", icon: "🏠" },
  { href: "/media", label: "الوسائط", icon: "📁" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [online, setOnline] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        await api.get("/health", { timeout: 1500 });
        if (!cancelled) setOnline("online");
      } catch {
        if (!cancelled) setOnline("offline");
      }
    }
    ping();
    const t = setInterval(ping, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const statusColor =
    online === "online" ? "#3ecf8e" : online === "offline" ? "#f59e0b" : "#888";
  const statusLabel =
    online === "online"
      ? "Backend متصل"
      : online === "offline"
        ? "وضع البيانات المحلية"
        : "...جارٍ الفحص";

  return (
    <div className="alhayaa-shell">
      <aside className="alhayaa-sidebar">
        <div className="alhayaa-brand">الحياة • Admin</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 14,
            fontSize: 11.5,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }}
          />
          <span style={{ color: "#cfcdd6" }}>{statusLabel}</span>
        </div>

        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            prefetch={false}
            className={`alhayaa-nav-item ${pathname?.startsWith(n.href) ? "active" : ""}`}
          >
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}

        <div
          style={{
            marginTop: 24,
            paddingTop: 12,
            borderTop: "1px solid #2a2a36",
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          {user?.name ?? user?.email ?? "مسؤول"}
        </div>
      </aside>
      <main className="alhayaa-content">{children}</main>
    </div>
  );
}

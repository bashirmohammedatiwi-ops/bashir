"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { useAuth } from "@/store/auth";
import { appNavigate } from "@/lib/navigate";
import { pingServer } from "@/lib/pingServer";
import { VPS_ORIGIN } from "@/lib/config";

type NavItem = { href: string; label: string; short: string };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "الرئيسية",
    items: [
      { href: "/dashboard", label: "لوحة المعلومات", short: "لو" },
      { href: "/reports", label: "التقارير", short: "ت" },
      { href: "/orders", label: "الطلبات", short: "ط" },
      { href: "/notifications", label: "الإشعارات", short: "إ" },
    ],
  },
  {
    title: "المنتجات",
    items: [
      { href: "/products", label: "المنتجات", short: "م" },
      { href: "/skin-concerns", label: "دليل البشرة", short: "ب" },
      { href: "/skin-routines", label: "روتين البشرة", short: "ر" },
      { href: "/inventory", label: "المخزون و POS", short: "مخ" },
      { href: "/categories", label: "الفئات", short: "ف" },
      { href: "/subcategories", label: "الأقسام الفرعية", short: "ق" },
      { href: "/brands", label: "البراندات", short: "ب" },
      { href: "/media", label: "الوسائط", short: "ص" },
    ],
  },
  {
    title: "التسويق",
    items: [
      { href: "/banners", label: "البنرات", short: "ن" },
      { href: "/coupons", label: "الكوبونات", short: "ك" },
      { href: "/packages", label: "الباقات", short: "ع" },
      { href: "/home-blocks", label: "الصفحة الرئيسية", short: "ر" },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { href: "/users", label: "العملاء", short: "ع" },
      { href: "/reviews", label: "التقييمات", short: "ت" },
      { href: "/shipping", label: "الشحن", short: "ش" },
      { href: "/settings", label: "الإعدادات", short: "ض" },
    ],
  },
];

const NavLink = memo(function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      className={`alhayaa-nav-item${active ? " active" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="alhayaa-nav-icon">{item.short}</span>
      {!collapsed && <span className="alhayaa-nav-label">{item.label}</span>}
    </Link>
  );
});

export const Shell = memo(function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [online, setOnline] = useState<"checking" | "online" | "offline">("checking");

  const ping = useCallback(async () => {
    setOnline("checking");
    const ok = await pingServer();
    setOnline(ok ? "online" : "offline");
  }, []);

  useEffect(() => {
    ping();
    const t = setInterval(ping, 120_000);
    return () => clearInterval(t);
  }, [ping]);

  const logout = useCallback(() => {
    clearSession();
    appNavigate(router, "/login");
  }, [clearSession, router]);

  const shellClass = useMemo(
    () => `alhayaa-shell${collapsed ? " collapsed" : ""}`,
    [collapsed],
  );

  return (
    <div className={shellClass}>
      <aside className="alhayaa-sidebar">
        <div className="alhayaa-sidebar-top">
          <div className="alhayaa-brand">{collapsed ? "ح" : "الحياة • Admin"}</div>
          <button
            type="button"
            className="alhayaa-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <div className={`alhayaa-status alhayaa-status--${online}`} title={online}>
          <span className="alhayaa-status-dot" />
          {!collapsed && (
            <span className="alhayaa-status-text">
              {online === "online"
                ? "السيرفر متصل"
                : online === "offline"
                  ? "السيرفر غير متصل"
                  : "جارٍ الفحص..."}
            </span>
          )}
          {!collapsed && online === "offline" && (
            <Button size="small" type="link" className="alhayaa-status-retry" onClick={ping}>
              إعادة المحاولة
            </Button>
          )}
        </div>
        {!collapsed && online === "offline" && (
          <div className="alhayaa-status-hint" title={VPS_ORIGIN}>
            تحقق من السيرفر: {VPS_ORIGIN}
          </div>
        )}

        <nav className="alhayaa-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="alhayaa-nav-group">
              {!collapsed && <div className="alhayaa-nav-group-title">{group.title}</div>}
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={!!pathname?.startsWith(item.href)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="alhayaa-sidebar-footer">
          {!collapsed && (
            <div className="alhayaa-user">
              {user?.name ?? user?.email ?? "—"}
            </div>
          )}
          <Button size="small" type="text" className="alhayaa-logout" onClick={logout}>
            {collapsed ? "↪" : "تسجيل الخروج"}
          </Button>
        </div>
      </aside>

      <main className="alhayaa-content">{children}</main>
    </div>
  );
});

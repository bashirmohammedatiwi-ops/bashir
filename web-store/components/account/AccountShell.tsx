"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "../Providers";
import { arPoints } from "@/lib/format";
import { useAuth } from "@/lib/stores/auth";
import { Icon, type IconName } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";

const NAV: [string, string, IconName][] = [
  ["/account", "نظرة عامة", "user"],
  ["/account/orders", "طلباتي", "box"],
  ["/wishlist", "المفضلة", "heart"],
  ["/account/points", "نقاط الولاء", "sparkle"],
  ["/account/addresses", "عناويني", "location"],
  ["/account/notifications", "الإشعارات", "bell"],
  ["/account/profile", "الحساب والأمان", "shield"],
];

/** إطار صفحات الحساب: يتطلب الدخول، قائمة جانبية على الحاسوب وشريط تبويبات على الهاتف. */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const { user, ready, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && ready && !user) router.replace(`/signin?next=${encodeURIComponent(path)}`);
  }, [hydrated, ready, user, path, router]);

  if (!hydrated || !user)
    return (
      <div className="container grid gap-6 py-8 md:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-96 md:block" />
        <Skeleton className="h-96" />
      </div>
    );

  const active = (href: string) => (href === "/account" ? path === href : path.startsWith(href));
  return (
    <div className="container animate-fade-up py-4 md:py-8">
      <div className="grid items-start gap-6 md:grid-cols-[260px_1fr]">
        <aside className="card overflow-hidden md:sticky md:top-36">
          <div className="hidden bg-gradient-to-br from-accent to-accent-dark p-5 text-white md:block">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-2xl font-extrabold">{user.name?.slice(0, 1) ?? "؟"}</span>
            <p className="mt-3 text-lg font-extrabold">{user.name}</p>
            <p className="text-sm opacity-85">{arPoints(user.points ?? 0)} ✨</p>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
            {NAV.map(([href, label, icon]) => (
              <Link
                key={href}
                href={href}
                className={clsx("flex flex-none items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition", active(href) ? "bg-accent-light text-accent-dark" : "text-ink-soft hover:bg-canvas")}
              >
                <Icon name={icon} size={19} /> {label}
              </Link>
            ))}
            <button onClick={() => logout().then(() => router.replace("/"))} className="flex flex-none items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-sale hover:bg-rose-soft">
              <Icon name="logout" size={19} /> تسجيل الخروج
            </button>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "../Providers";
import { cartCount, useCart } from "@/lib/stores/cart";
import { useUi } from "@/lib/stores/ui";
import { Icon, type IconName } from "../ui/Icon";

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "الرئيسية", icon: "home", match: (p) => p === "/" },
  { href: "/categories", label: "الأقسام", icon: "grid", match: (p) => p.startsWith("/categor") },
  { href: "/offers", label: "العروض", icon: "tag", match: (p) => p.startsWith("/offers") },
  { href: "/account", label: "حسابي", icon: "user", match: (p) => p.startsWith("/account") || p === "/signin" },
];

/** شريط التنقل السفلي للهاتف — مثل التطبيق. */
export function MobileTabBar() {
  const path = usePathname();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const count = hydrated ? cartCount(lines) : 0;
  const openCart = useUi((s) => s.openCart);
  if (path.startsWith("/checkout")) return null;
  return (
    <nav className="no-print fixed inset-x-3 bottom-3 z-40 rounded-[28px] border border-hairline bg-surface/90 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 shadow-float backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.href} {...t} on={t.match(path)} />
        ))}
        <li>
          <button onClick={() => openCart(true)} className="relative flex w-full flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold text-ink-soft">
            <span className="relative grid h-11 w-11 -translate-y-3 place-items-center rounded-full bg-gradient-to-b from-accent to-accent-dark text-white shadow-lift ring-4 ring-surface">
              <Icon name="bag" size={21} />
              {count > 0 && (
                <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] text-white ring-2 ring-surface">{count}</span>
              )}
            </span>
            <span className="-mt-3">السلة</span>
          </button>
        </li>
        {TABS.slice(2).map((t) => (
          <Tab key={t.href} {...t} on={t.match(path)} />
        ))}
      </ul>
    </nav>
  );
}

function Tab({ href, label, icon, on }: { href: string; label: string; icon: IconName; on: boolean }) {
  return (
    <li>
      <Link href={href} className={clsx("flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition", on ? "text-accent-dark" : "text-ink-muted")}>
        <span className={clsx("grid h-8 w-12 place-items-center rounded-full transition", on && "bg-accent-light")}>
          <Icon name={icon} size={21} stroke={on ? 2.1 : 1.8} />
        </span>
        {label}
      </Link>
    </li>
  );
}

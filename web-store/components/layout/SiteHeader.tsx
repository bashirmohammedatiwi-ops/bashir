"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHydrated } from "../Providers";
import { formatNumber } from "@/lib/format";
import { categoryHref } from "@/lib/links";
import { mediaUrl } from "@/lib/media";
import { useAuth } from "@/lib/stores/auth";
import { cartCount, useCart } from "@/lib/stores/cart";
import { useUi } from "@/lib/stores/ui";
import { worldVars } from "@/lib/theme";
import type { Category, World } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { SearchBox } from "./SearchBox";
import { HeaderBadges } from "./HeaderBadges";

/** اختيار العالم: يُحفظ في كوكي ليرسمه السيرفر، والألوان تتبدل فوراً. */
export function useSwitchWorld() {
  const router = useRouter();
  return (w: World) => {
    document.cookie = `world=${w.slug}; path=/; max-age=31536000; samesite=lax`;
    const vars = worldVars(w);
    for (const [k, v] of Object.entries(vars)) document.body.style.setProperty(k, v);
    router.refresh();
  };
}

export function SiteHeader({
  worlds,
  current,
  categories,
  freeShipping,
}: {
  worlds: World[];
  current: World | null;
  categories: Category[];
  freeShipping: number;
}) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const lastAdded = useCart((s) => s.lastAdded);
  const user = useAuth((s) => s.user);
  const openCart = useUi((s) => s.openCart);
  const openMenu = useUi((s) => s.openMenu);
  const menuOpen = useUi((s) => s.menuOpen);
  const switchWorld = useSwitchWorld();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const count = hydrated ? cartCount(lines) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMega(false);
    setSearchOpen(false);
    openMenu(false);
  }, [pathname, openMenu]);

  return (
    <>
      {freeShipping > 0 && (
        <div className="bg-gradient-to-l from-accent-dark to-accent text-white">
          <div className="container flex h-9 items-center justify-center gap-2 text-[13px] font-semibold">
            <Icon name="truck" size={16} />
            <span>توصيل مجاني لكل محافظات العراق للطلبات فوق {formatNumber(freeShipping)} د.ع</span>
            <span className="hidden opacity-80 sm:inline">• الدفع عند الاستلام أو بالبطاقة</span>
          </div>
        </div>
      )}

      <header
        className={clsx(
          "sticky top-0 z-40 border-b transition-all duration-300",
          scrolled ? "border-hairline bg-surface/85 shadow-[0_6px_24px_-18px_rgb(26_20_38/0.35)] backdrop-blur-xl" : "border-transparent bg-surface",
        )}
      >
        <div className="container flex h-[68px] items-center gap-3 md:h-[76px] md:gap-6">
          <button onClick={() => openMenu(!menuOpen)} className="-ms-2 rounded-full p-2 text-ink lg:hidden" aria-label="القائمة">
            <Icon name="menu" />
          </button>
          <Link href="/" className="flex flex-none items-center gap-2" aria-label="ديما الحياة — الرئيسية">
            <img src="/logo.png" alt="" className="h-10 w-10 rounded-2xl object-contain md:h-11 md:w-11" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-lg font-extrabold tracking-tight text-ink">ديما الحياة</span>
              <span className="block text-[11px] font-semibold text-ink-muted">deema alhayat</span>
            </span>
          </Link>

          <SearchBox className="hidden flex-1 md:block md:max-w-2xl" />

          <nav className="ms-auto flex items-center gap-1 md:gap-2">
            <button onClick={() => setSearchOpen(true)} className="rounded-full p-2.5 text-ink hover:bg-accent-light md:hidden" aria-label="بحث">
              <Icon name="search" />
            </button>
            <Link
              href={user ? "/account" : "/signin"}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-ink hover:bg-accent-light md:flex"
            >
              <Icon name="user" />
              <span className="max-w-[9rem] truncate">{hydrated && user ? user.name?.split(" ")[0] || "حسابي" : "دخول"}</span>
            </Link>
            <HeaderBadges />
            <button onClick={() => openCart(true)} className="relative rounded-full p-2.5 text-ink hover:bg-accent-light" aria-label="السلة">
              <Icon name="bag" />
              {count > 0 && (
                <span
                  key={lastAdded}
                  className="absolute -left-0.5 -top-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-sale px-1 text-[11px] font-extrabold text-white ring-2 ring-surface"
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* صف التنقل (شاشات كبيرة): العوالم + الأقسام + روابط سريعة */}
        <div className="hidden border-t border-hairline/70 lg:block" onMouseLeave={() => setMega(false)}>
          <div className="container flex h-12 items-center gap-2">
            <button
              onMouseEnter={() => setMega(true)}
              onClick={() => setMega((v) => !v)}
              className={clsx("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition", mega ? "bg-accent-dark text-white" : "bg-accent-light text-accent-dark hover:bg-accent-soft")}
            >
              <Icon name="grid" size={18} /> كل الأقسام <Icon name="chevronDown" size={16} />
            </button>
            <div className="mx-2 h-6 w-px bg-hairline" />
            <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
              {worlds.map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchWorld(w)}
                  className={clsx(
                    "flex flex-none items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition",
                    current?.id === w.id ? "bg-ink text-white" : "text-ink-soft hover:bg-accent-light hover:text-ink",
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white/70" style={{ background: w.accentColor }} />
                  {w.nameAr}
                </button>
              ))}
            </div>
            <div className="flex flex-none items-center gap-1 text-sm font-bold">
              <Link href="/offers" className="rounded-full px-3 py-2 text-sale hover:bg-rose-soft">العروض</Link>
              <Link href="/brands" className="rounded-full px-3 py-2 text-ink-soft hover:bg-accent-light hover:text-ink">البراندات</Link>
              <Link href="/skin-guide" className="rounded-full px-3 py-2 text-ink-soft hover:bg-accent-light hover:text-ink">دليل البشرة</Link>
              <Link href="/packages" className="rounded-full px-3 py-2 text-ink-soft hover:bg-accent-light hover:text-ink">الباقات</Link>
              <Link href="/advisor" className="rounded-full bg-gradient-to-l from-accent-light to-accent-soft px-3 py-2 font-bold text-accent-dark hover:brightness-95">✨ اسألي ديما</Link>
            </div>
          </div>
          {mega && <MegaMenu categories={categories} onClose={() => setMega(false)} />}
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-surface p-4 animate-fade-up md:hidden">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setSearchOpen(false)} className="rounded-full p-2" aria-label="إغلاق">
              <Icon name="close" />
            </button>
            <span className="font-bold">البحث</span>
          </div>
          <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      <MobileMenu worlds={worlds} current={current} categories={categories} onWorld={switchWorld} />
    </>
  );
}

function MegaMenu({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  if (!active) return null;
  return (
    <div className="absolute inset-x-0 top-full border-t border-hairline bg-surface shadow-float animate-fade-up">
      <div className="container grid grid-cols-[240px_1fr] gap-6 py-6">
        <ul className="space-y-1 border-e border-hairline pe-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={categoryHref(c.slug)}
                onMouseEnter={() => setActiveId(c.id)}
                onClick={onClose}
                className={clsx(
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-bold transition",
                  c.id === active.id ? "bg-accent-light text-accent-dark" : "text-ink-soft hover:bg-canvas",
                )}
              >
                {c.nameAr || c.name}
                <Icon name="chevronLeft" size={16} />
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">{active.nameAr || active.name}</h3>
            <Link href={categoryHref(active.slug)} onClick={onClose} className="text-sm font-bold text-accent-dark hover:underline">
              تسوّقي الكل ←
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4 xl:grid-cols-6">
            {(active.children ?? []).map((sub) => (
              <Link key={sub.id} href={categoryHref(sub.slug)} onClick={onClose} className="group text-center">
                <span className="mb-2 block aspect-square overflow-hidden rounded-3xl bg-gradient-to-b from-accent-light to-accent-soft">
                  {sub.image || sub.imageUrl ? (
                    <img src={sub.imageUrl || mediaUrl(sub.image, "small")} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  ) : null}
                </span>
                <span className="text-sm font-bold text-ink-soft group-hover:text-accent-dark">{sub.nameAr || sub.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ worlds, current, categories, onWorld }: { worlds: World[]; current: World | null; categories: Category[]; onWorld: (w: World) => void }) {
  const open = useUi((s) => s.menuOpen);
  const close = () => useUi.getState().openMenu(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const user = useAuth((s) => s.user);
  return (
    <div className={clsx("fixed inset-0 z-[55] lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div onClick={close} className={clsx("absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} />
      <aside
        className={clsx(
          "absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-surface shadow-float transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline p-4">
          <Link href={user ? "/account" : "/signin"} onClick={close} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-light text-accent-dark">
              <Icon name="user" />
            </span>
            <span>
              <span className="block font-extrabold">{user ? `أهلاً ${user.name?.split(" ")[0] ?? ""}` : "أهلاً بكِ 🌸"}</span>
              <span className="text-xs text-ink-muted">{user ? "حسابي وطلباتي" : "سجّلي الدخول أو أنشئي حساباً"}</span>
            </span>
          </Link>
          <button onClick={close} className="rounded-full p-2" aria-label="إغلاق">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 text-xs font-bold text-ink-muted">العوالم</p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {worlds.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  onWorld(w);
                  close();
                }}
                className={clsx("flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold", current?.id === w.id ? "border-transparent bg-ink text-white" : "border-hairline")}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: w.accentColor }} /> {w.nameAr}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs font-bold text-ink-muted">الأقسام</p>
          <ul className="mb-5 divide-y divide-hairline rounded-3xl border border-hairline">
            {categories.map((c) => (
              <li key={c.id}>
                <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="flex w-full items-center justify-between px-4 py-3.5 text-[15px] font-bold">
                  {c.nameAr || c.name}
                  <Icon name="chevronDown" size={18} className={clsx("transition", expanded === c.id && "rotate-180")} />
                </button>
                {expanded === c.id && (
                  <div className="grid grid-cols-2 gap-1 px-3 pb-3">
                    <Link href={categoryHref(c.slug)} onClick={close} className="rounded-xl bg-accent-light px-3 py-2 text-sm font-bold text-accent-dark">
                      الكل
                    </Link>
                    {(c.children ?? []).map((s) => (
                      <Link key={s.id} href={categoryHref(s.slug)} onClick={close} className="rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-canvas">
                        {s.nameAr || s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="grid gap-1 text-[15px] font-bold">
            {[
              ["/offers", "العروض", "tag"],
              ["/brands", "البراندات", "sparkle"],
              ["/skin-guide", "دليل البشرة", "spa"],
              ["/packages", "الباقات والروتين", "gift"],
              ["/advisor", "اسألي ديما ✨", "chat"],
              ["/wishlist", "المفضلة", "heart"],
            ].map(([href, label, icon]) => (
              <Link key={href} href={href} onClick={close} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-canvas">
                <Icon name={icon as never} size={20} className="text-accent-dark" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

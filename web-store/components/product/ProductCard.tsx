"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cardTitle } from "@/lib/brandSearch";
import { brandLabel, formatNumber, productName } from "@/lib/format";
import { useWishlist, useWishToggle } from "@/lib/hooks/wishlist";
import { productHref } from "@/lib/links";
import { listedShades, mediaUrl, productCover } from "@/lib/media";
import { useCart } from "@/lib/stores/cart";
import { useCompare } from "@/lib/stores/compare";
import { useHydrated } from "../Providers";
import { toast, useUi } from "@/lib/stores/ui";
import type { Product } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { DiscountBadge } from "../ui/Price";

export { cardTitle };

export function ProductCard({ product: p, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const openQuickView = useUi((s) => s.openQuickView);
  const toggleCompare = useCompare((s) => s.toggle);
  const hydrated = useHydrated();
  const comparing = useCompare((s) => s.items.some((x) => x.id === p.id)) && hydrated;
  const wish = useWishlist();
  const toggleWish = useWishToggle();
  const liked = !!wish.data?.some((x) => x.id === p.id);
  const shades = listedShades(p);
  const shadeCount = Math.max(shades.length, p._count?.shades ?? 0, p.shadeCount ?? 0);
  const out = p.stock <= 0;
  const second = p.images?.[1]?.media ? mediaUrl(p.images[1].media, "small") : null;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (shadeCount > 1) {
      // الحاسوب: نافذة سريعة لاختيار اللون؛ الهاتف: صفحة المنتج.
      if (window.matchMedia("(min-width: 768px)").matches) openQuickView(p.slug);
      else router.push(productHref(p.slug));
      return;
    }
    if (add(p, 1, shades[0] ?? null)) {
      toast({ text: "أُضيف للسلة", action: { label: "السلة", href: "/cart" } });
      openCart(true);
    } else toast({ text: "وصلتِ للكمية المتوفرة", tone: "error" });
  };

  return (
    <Link
      href={productHref(p.slug)}
      className={clsx("group relative flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift", className)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <img
          src={productCover(p, "small")}
          alt={productName(p)}
          loading={priority ? "eager" : "lazy"}
          className={clsx("absolute inset-0 h-full w-full object-contain p-4 transition duration-500", second ? "group-hover:opacity-0" : "group-hover:scale-105", out && "opacity-50 grayscale")}
        />
        {second && <img src={second} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition duration-500 group-hover:opacity-100" />}
        <div className="absolute right-3 top-3 flex flex-col items-start gap-1">
          <DiscountBadge percent={p.discountPercent} />
          {p.isNew && <span className="rounded-full bg-night px-2 py-0.5 text-[11px] font-bold text-white">جديد</span>}
        </div>
        {out && <span className="absolute inset-x-3 bottom-3 rounded-full bg-night/80 py-1.5 text-center text-xs font-bold text-white backdrop-blur">نفدت الكمية</span>}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWish(p);
          }}
          className={clsx(
            "absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110",
            liked ? "text-sale" : "text-ink-soft",
          )}
          aria-label="المفضلة"
        >
          <Icon name="heart" size={18} fill={liked ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleCompare(p);
          }}
          className={clsx(
            "absolute left-3 top-14 hidden h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition hover:scale-110 md:grid",
            comparing ? "bg-accent-dark text-white" : "bg-white/90 text-ink-soft opacity-0 group-hover:opacity-100",
          )}
          aria-label={comparing ? "إزالة من المقارنة" : "أضيفي للمقارنة"}
          title={comparing ? "في المقارنة" : "قارني"}
        >
          <span className="text-sm">⚖️</span>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            openQuickView(p.slug);
          }}
          className="absolute bottom-3 right-3 hidden h-10 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-ink shadow-lift opacity-0 transition hover:bg-white md:flex md:group-hover:opacity-100"
          aria-label="نظرة سريعة"
        >
          <Icon name="eye" size={16} /> نظرة سريعة
        </button>
        {!out && (
          <button
            onClick={quickAdd}
            className="absolute bottom-3 left-3 grid h-10 w-10 translate-y-1 place-items-center rounded-full bg-accent-dark text-white opacity-100 shadow-lift transition hover:scale-110 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            aria-label={shadeCount > 1 ? "اختاري اللون" : "أضيفي للسلة"}
          >
            <Icon name={shadeCount > 1 ? "sparkle" : "plus"} size={18} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5 pt-3">
        {p.brand?.name && <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-accent-dark">{brandLabel(p.brand.name)}</p>}
        <h3 className="line-clamp-2 min-h-[2.75rem] text-[13.5px] font-semibold leading-[1.4rem] text-ink">{cardTitle(p)}</h3>
        {p.reviewCount > 0 && (
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Icon name="star" size={13} className="text-star" fill="currentColor" stroke={0} /> {p.rating.toFixed(1)} ({p.reviewCount})
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="flex flex-col">
            <span className={clsx("text-base font-extrabold tabular-nums", p.originalPrice > p.price ? "text-sale" : "text-ink")}>
              {formatNumber(p.price)} <span className="text-[11px]">د.ع</span>
            </span>
            {p.originalPrice > p.price && <s className="text-[11px] tabular-nums text-ink-muted">{formatNumber(p.originalPrice)}</s>}
          </span>
          {shadeCount > 1 && (
            <span className="flex items-center gap-1" dir="ltr">
              {shades.slice(0, 4).map((s) => (
                <span key={s.id} className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: s.colorHexEnd ? `linear-gradient(135deg, ${s.colorHex}, ${s.colorHexEnd})` : s.colorHex }} />
              ))}
              {shadeCount > 4 && <span className="text-[10px] font-bold text-ink-muted">+{shadeCount - 4}</span>}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface shadow-card">
      <div className="skeleton aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}

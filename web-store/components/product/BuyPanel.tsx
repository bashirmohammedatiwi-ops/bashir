"use client";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoyaltyRules } from "../Providers";
import { FreeShippingBar, QtyStepper } from "../cart/CartDrawer";
import { api } from "@/lib/api";
import { arPoints, brandLabel, cartSubtotalSafe, formatPrice, productName } from "./buyHelpers";
import { useRestockAlerts, useRestockToggle } from "@/lib/hooks/alerts";
import { useDeliveryHint } from "@/lib/hooks/delivery";
import { useWishlist, useWishToggle } from "@/lib/hooks/wishlist";
import { brandHref } from "@/lib/links";
import { listedShades } from "@/lib/media";
import { useAuth } from "@/lib/stores/auth";
import { useCart } from "@/lib/stores/cart";
import { useCompare } from "@/lib/stores/compare";
import { toast, useUi } from "@/lib/stores/ui";
import type { Product, Shade } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { Price } from "../ui/Price";
import { rememberProduct } from "./RecentlyViewed";
import { AskDeema } from "../advisor/AskDeema";

export function BuyPanel({ product: p, onShade }: { product: Product; onShade?: (s: Shade | null) => void }) {
  const router = useRouter();
  const shades = useMemo(() => listedShades(p), [p]);
  const [shade, setShade] = useState<Shade | null>(shades.length === 1 ? shades[0] : null);
  const [qty, setQty] = useState(1);
  const [q, setQ] = useState("");
  const add = useCart((s) => s.add);
  const lines = useCart((s) => s.lines);
  const openCart = useUi((s) => s.openCart);
  const rules = useLoyaltyRules();
  const delivery = useDeliveryHint();
  const wish = useWishlist();
  const toggleWish = useWishToggle();
  const liked = !!wish.data?.some((x) => x.id === p.id);
  const user = useAuth((s) => s.user);
  const toggleCompare = useCompare((s) => s.toggle);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const comparing = useCompare((s) => s.items.some((x) => x.id === p.id)) && mounted;
  const alerts = useRestockAlerts();
  const toggleAlert = useRestockToggle();
  const watching = alerts.ids.includes(p.id);

  useEffect(() => rememberProduct(p), [p]);

  // شريط شراء ثابت على الهاتف حين يختفي زر الإضافة عن الشاشة.
  const buyRow = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const el = buyRow.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const price = shade?.price ?? p.price;
  const stock = shade ? shade.stock : p.stock;
  const out = stock <= 0;
  const needShade = shades.length > 1 && !shade;
  const points = Math.floor((price * qty * rules.earnPercent) / 100);
  const filtered = q ? shades.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())) : shades;

  const doAdd = (buyNow = false) => {
    if (needShade) {
      toast({ text: "اختاري اللون أولاً", tone: "error" });
      document.getElementById("shades")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!add(p, qty, shade)) {
      toast({ text: "وصلتِ للكمية المتوفرة", tone: "error" });
      return;
    }
    if (buyNow) router.push("/checkout");
    else {
      toast({ text: "أُضيف للسلة ✨", action: { label: "السلة", href: "/cart" } });
      openCart(true);
    }
  };

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: productName(p), url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ text: "نُسخ رابط المنتج" });
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div>
        {p.brand && (
          <Link href={brandHref(p.brand.slug)} className="inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-accent-dark hover:bg-accent-soft">
            {brandLabel(p.brand.name)} <Icon name="chevronLeft" size={14} />
          </Link>
        )}
        <h1 className="mt-3 text-2xl font-extrabold leading-snug md:text-[28px]">{productName(p)}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          {p.reviewCount > 0 && (
            <a href="#reviews" className="flex items-center gap-1 hover:text-ink">
              <Icon name="star" size={16} className="text-star" fill="currentColor" stroke={0} /> <b className="text-ink">{p.rating.toFixed(1)}</b> ({p.reviewCount} تقييم)
            </a>
          )}
          {(p.soldCount ?? 0) > 10 && <span>🔥 طُلب {p.soldCount} مرة</span>}
          {p.barcode && <span dir="ltr">#{p.barcode}</span>}
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Price value={price} old={p.originalPrice > price ? p.originalPrice : null} size="lg" />
          {p.originalPrice > price && <span className="rounded-full bg-rose-soft px-3 py-1 text-sm font-extrabold text-sale">وفّري {formatPrice(p.originalPrice - price)}</span>}
        </div>

        {shades.length > 1 && (
          <div id="shades">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-extrabold">
                اختاري اللون {shade && <span className="font-semibold text-accent-dark">— {shade.name}</span>}
              </span>
              <span className="text-xs font-bold text-ink-muted">{shades.length} لون</span>
            </div>
            {shades.length > 12 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي عن لون…" className="field mb-3 h-10 text-sm" />}
            <div className="flex max-h-56 flex-wrap gap-2.5 overflow-y-auto p-1">
              {filtered.map((s) => {
                const on = shade?.id === s.id;
                const soldOut = s.stock <= 0;
                return (
                  <button
                    key={s.id}
                    title={s.name}
                    disabled={soldOut}
                    onClick={() => {
                      setShade(on ? null : s);
                      onShade?.(on ? null : s);
                    }}
                    className={clsx(
                      "relative h-10 w-10 rounded-full ring-offset-2 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40",
                      on ? "ring-2 ring-accent-dark" : "ring-1 ring-black/10",
                    )}
                    style={{ background: s.colorHexEnd ? `linear-gradient(135deg, ${s.colorHex}, ${s.colorHexEnd})` : s.colorHex }}
                    aria-label={s.name}
                  >
                    {on && <Icon name="check" size={16} className="absolute inset-0 m-auto text-white drop-shadow" stroke={3} />}
                    {soldOut && <span className="absolute inset-0 m-auto h-px w-full rotate-45 bg-night/60" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {out ? (
          <div className="space-y-3">
            <p className="rounded-2xl bg-canvas p-3 text-center font-bold text-ink-soft">نفدت الكمية حالياً</p>
            <button
              onClick={() => {
                if (!user) return router.push(`/signin?next=${encodeURIComponent(location.pathname)}`);
                toggleAlert.mutate({ id: p.id, on: !watching });
              }}
              className={clsx("w-full", watching ? "btn-ghost" : "btn-soft")}
            >
              <Icon name="bell" size={18} /> {watching ? "سننبّهكِ عند التوفّر — إلغاء التنبيه" : "أعلميني عند التوفّر"}
            </button>
          </div>
        ) : (
          <>
            <div ref={buyRow} className="flex items-center gap-3">
              <QtyStepper value={qty} min={1} max={stock > 0 ? stock : 99} onChange={setQty} />
              <button onClick={() => doAdd()} className="btn-primary flex-1">
                <Icon name="bag" size={19} /> {needShade ? "اختاري اللون" : "أضيفي للسلة"}
              </button>
              <button onClick={() => toggleWish(p)} className={clsx("grid h-12 w-12 flex-none place-items-center rounded-full border border-hairline transition hover:border-sale", liked ? "text-sale" : "text-ink-soft")} aria-label="المفضلة">
                <Icon name="heart" fill={liked ? "currentColor" : "none"} />
              </button>
            </div>
            <button onClick={() => doAdd(true)} className="btn-ghost w-full">
              اشتري الآن
            </button>
            {stock > 0 && stock <= 5 && <p className="text-center text-sm font-bold text-sale">باقي {stock} فقط — اطلبيها قبل نفادها</p>}
          </>
        )}

        <div className="space-y-2.5 border-t border-hairline pt-4 text-sm">
          {points > 0 && (
            <p className="flex items-center gap-2 font-semibold text-ink-soft">
              <Icon name="star" size={18} className="text-star" /> اكسبي {arPoints(points)} عند شراء هذا المنتج
            </p>
          )}
          {delivery && (
            <p className="flex items-center gap-2 font-semibold text-ink-soft">
              <Icon name="clock" size={18} className="text-accent-dark" /> {delivery}
            </p>
          )}
          <FreeShippingBar subtotal={cartSubtotalSafe(lines, p.id, price * qty)} />
        </div>
      </div>

      <AskDeema productId={p.id} />

      {sticky && !out && (
        <div className="fixed inset-x-3 bottom-[88px] z-[44] flex items-center gap-3 rounded-[24px] border border-hairline bg-surface/95 p-2.5 shadow-float backdrop-blur animate-fade-up lg:hidden">
          <div className="min-w-0 flex-1 ps-2">
            <p className="line-clamp-1 text-xs text-ink-muted">{shade ? shade.name : productName(p)}</p>
            <p className="font-extrabold tabular-nums">{formatPrice(price * qty)}</p>
          </div>
          <button onClick={() => doAdd()} className="btn-primary h-11 px-5 text-sm">
            <Icon name="bag" size={17} /> {needShade ? "اختاري اللون" : "أضيفي للسلة"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-ink-soft">
        {[
          ["shield", "منتجات أصلية 100%"],
          ["truck", "توصيل لكل العراق"],
          ["cash", "نقداً أو بالبطاقة"],
        ].map(([i, t]) => (
          <div key={t} className="rounded-2xl bg-surface p-3 shadow-card">
            <Icon name={i as never} className="mx-auto mb-1 text-accent-dark" />
            {t}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <button onClick={share} className="flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-accent-dark">
          <Icon name="copy" size={16} /> مشاركة المنتج
        </button>
        <button onClick={() => toggleCompare(p)} className={clsx("flex items-center gap-2 text-sm font-bold hover:text-accent-dark", comparing ? "text-accent-dark" : "text-ink-soft")}>
          ⚖️ {comparing ? "في المقارنة ✓" : "قارني مع منتج آخر"}
        </button>
      </div>
    </div>
  );
}

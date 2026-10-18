"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useEffect } from "react";
import { useHydrated, useSettings } from "../Providers";
import { brandLabel, formatNumber, formatPrice } from "@/lib/format";
import { productHref } from "@/lib/links";
import { cartCount, cartSubtotal, packageStatus, useCart, type CartLine } from "@/lib/stores/cart";
import { useUi } from "@/lib/stores/ui";
import { Icon } from "../ui/Icon";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const threshold = useSettings().freeShippingThreshold ?? 0;
  if (threshold <= 0) return null;
  const left = threshold - subtotal;
  const pct = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="rounded-2xl bg-accent-light/70 p-3">
      <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-ink-soft">
        <Icon name="truck" size={18} className={left <= 0 ? "text-success" : "text-accent-dark"} />
        {left <= 0 ? <span className="text-success">رائع! طلبكِ يستحق توصيلاً مجانياً</span> : <>أضيفي {formatPrice(left)} للتوصيل المجاني</>}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className={clsx("h-full rounded-full transition-all duration-700", left <= 0 ? "bg-success" : "bg-gradient-to-l from-accent to-accent-dark")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function QtyStepper({ value, max, min = 0, onChange, size = "md" }: { value: number; max: number; min?: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <div className={clsx("inline-flex items-center rounded-full border border-hairline bg-surface", h)}>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="grid h-full w-9 place-items-center text-accent-dark disabled:opacity-30" aria-label="زيادة">
        <Icon name="plus" size={16} />
      </button>
      <span className="w-6 text-center text-sm font-extrabold tabular-nums">{value}</span>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="grid h-full w-9 place-items-center text-ink-soft disabled:opacity-30" aria-label="إنقاص">
        <Icon name={value <= 1 && min === 0 ? "trash" : "minus"} size={16} />
      </button>
    </div>
  );
}

export function CartLineRow({ line, compact }: { line: CartLine; compact?: boolean }) {
  const setQty = useCart((s) => s.setQty);
  return (
    <div className="flex gap-3">
      <Link href={productHref(line.slug)} className="grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-2xl border border-hairline bg-white">
        {line.image ? <img src={line.image} alt="" className="h-full w-full object-contain p-1.5" /> : null}
      </Link>
      <div className="min-w-0 flex-1">
        {line.brand && <p className="truncate text-[11px] font-bold uppercase text-accent-dark">{brandLabel(line.brand)}</p>}
        <Link href={productHref(line.slug)} className="line-clamp-2 text-sm font-semibold leading-6 hover:text-accent-dark">
          {line.name}
        </Link>
        {line.shadeName && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="h-3 w-3 rounded-full ring-1 ring-hairline" style={{ background: line.shadeColor ?? undefined }} /> {line.shadeName}
          </p>
        )}
        <div className={clsx("mt-2 flex items-center justify-between gap-2", compact && "mt-1.5")}>
          <QtyStepper size="sm" value={line.quantity} max={line.stock > 0 ? line.stock : 99} onChange={(v) => setQty(line.key, v)} />
          <span className="text-sm font-extrabold tabular-nums">{formatPrice(line.price * line.quantity)}</span>
        </div>
      </div>
    </div>
  );
}

/** سلة جانبية: تُفتح من أي صفحة — المنتجات، الباقات، التوصيل المجاني، والمجموع. */
export function CartDrawer() {
  const hydrated = useHydrated();
  const open = useUi((s) => s.cartOpen);
  const openCart = useUi((s) => s.openCart);
  const lines = useCart((s) => s.lines);
  const packages = useCart((s) => s.packages);
  const status = packageStatus(lines, packages);
  const saving = status.reduce((s, x) => s + x.saving, 0);
  const subtotal = cartSubtotal(lines);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && openCart(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, openCart]);

  if (!hydrated) return null;
  return (
    <div className={clsx("fixed inset-0 z-[65]", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div onClick={() => openCart(false)} className={clsx("absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} />
      <aside
        role="dialog"
        aria-label="سلة التسوق"
        className={clsx(
          "absolute inset-y-0 left-0 flex w-full max-w-[440px] flex-col bg-surface shadow-float transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-lg font-extrabold">
            سلة التسوّق <span className="text-sm font-bold text-ink-muted">({cartCount(lines)})</span>
          </h2>
          <button onClick={() => openCart(false)} className="rounded-full p-2 hover:bg-canvas" aria-label="إغلاق">
            <Icon name="close" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid h-24 w-24 place-items-center rounded-full bg-accent-light text-accent-dark">
              <Icon name="bag" size={40} />
            </span>
            <p className="text-lg font-extrabold">سلّتكِ فارغة</p>
            <p className="text-sm text-ink-muted">اكتشفي أجمل منتجات التجميل وأضيفيها لسلتكِ</p>
            <Link href="/" onClick={() => openCart(false)} className="btn-primary mt-2">
              تسوّقي الآن
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <FreeShippingBar subtotal={subtotal - saving} />
              {status.length > 0 && (
                <div className="space-y-2">
                  {status.map((s) => (
                    <div key={s.pack.id} className={clsx("rounded-2xl p-3 text-sm", s.sets > 0 ? "bg-emerald-50 text-success" : "bg-canvas text-ink-soft")}>
                      🎁 <b>{s.pack.name}</b> — {s.sets > 0 ? `مكتملة، وفّرتِ ${formatPrice(s.saving)}` : `ينقصها ${s.missing.length} منتج لسعر الباقة`}
                    </div>
                  ))}
                </div>
              )}
              <div className="divide-y divide-hairline">
                {lines.map((l) => (
                  <div key={l.key} className="py-4 first:pt-0">
                    <CartLineRow line={l} compact />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 border-t border-hairline px-5 py-4">
              {saving > 0 && (
                <div className="flex justify-between text-sm font-bold text-success">
                  <span>توفير الباقات</span>
                  <span>- {formatPrice(saving)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-ink-soft">المجموع</span>
                <span className="text-2xl font-extrabold tabular-nums">
                  {formatNumber(subtotal - saving)} <span className="text-sm">د.ع</span>
                </span>
              </div>
              <Link href="/checkout" onClick={() => openCart(false)} className="btn-primary w-full">
                إتمام الطلب <Icon name="arrowLeft" size={18} />
              </Link>
              <Link href="/cart" onClick={() => openCart(false)} className="block text-center text-sm font-bold text-accent-dark hover:underline">
                عرض السلة وإضافة كود الخصم
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

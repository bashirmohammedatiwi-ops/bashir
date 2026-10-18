"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Coupon } from "@/lib/types";
import { couponValue } from "../home/CouponsShelf";
import { formatPrice } from "@/lib/format";
import { checkCoupon, useCartMath } from "@/lib/hooks/cartMath";
import { useCart } from "@/lib/stores/cart";
import { toast } from "@/lib/stores/ui";
import { Icon } from "../ui/Icon";

/** كود الخصم: تحقق فوري مع سبب الرفض، ويبقى مفعّلاً إن لم تبلغ السلة حدّه الأدنى. */
export function CouponBox() {
  const code = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const m = useCartMath();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const world = typeof document === "undefined" ? undefined : document.cookie.match(/(?:^|; )world=([^;]+)/)?.[1];
  const featured = useQuery({ queryKey: ["coupons", world], queryFn: () => api<Coupon[]>("/coupons/featured", { query: { world } }), staleTime: 300_000 });

  const apply = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      const r = await checkCoupon(t);
      if (r.ok && r.coupon) {
        setCoupon(r.coupon.code);
        setText("");
        toast({ text: `تم تفعيل الكود ${r.coupon.code} 🎉`, tone: "success" });
      } else setError(r.reason ?? "الكود غير صحيح");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (code && m.coupon) {
    const [big, small] = couponValue(m.coupon);
    return (
      <div className="rounded-2xl border border-dashed border-success/50 bg-emerald-50 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-success text-center text-[11px] font-extrabold leading-tight text-white">
            {big}
            <br />
            {small}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold tracking-wide text-success" dir="ltr">
              {m.coupon.code}
            </p>
            <p className="text-xs text-ink-soft">
              {m.couponEligible
                ? m.freeShippingCoupon
                  ? "التوصيل مجاني لهذا الطلب"
                  : `وفّرتِ ${formatPrice(m.couponDiscount)}`
                : `أضيفي ${formatPrice(m.couponMissing)} ليتفعّل الخصم`}
            </p>
          </div>
          <button onClick={() => setCoupon(null)} className="rounded-full p-2 text-ink-muted hover:bg-white hover:text-sale" aria-label="إزالة الكود">
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="tag" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={text}
            onChange={(e) => (setText(e.target.value.toUpperCase()), setError(null))}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="كود الخصم"
            className="field h-11 ps-10 font-bold uppercase tracking-wide"
            dir="ltr"
            aria-label="كود الخصم"
          />
        </div>
        <button onClick={apply} disabled={!text.trim() || busy} className="btn h-11 bg-night px-5 text-sm text-white">
          {busy ? "…" : "تطبيق"}
        </button>
      </div>
      {!!featured.data?.length && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-bold text-ink-muted">كوبونات متاحة لكِ:</p>
          {featured.data.slice(0, 3).map((c) => {
            const [big, small] = couponValue(c);
            const short = c.minOrder > m.couponBase ? c.minOrder - m.couponBase : 0;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCoupon(c.code);
                  toast({ text: `فعّلنا ${c.code} ✓`, tone: "success" });
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-accent-light/40 px-3 py-2 text-start transition hover:bg-accent-light"
              >
                <span className="text-sm font-extrabold text-accent-dark" dir="ltr">
                  {big} <span className="text-[10px]">{small}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{c.title || c.code}</span>
                  <span className="block text-[11px] text-ink-muted">{short ? `ينقصكِ ${formatPrice(short)}` : c.minOrder ? `فوق ${formatPrice(c.minOrder)}` : "بدون حد أدنى"}</span>
                </span>
                <span className="rounded-full bg-accent-dark px-2.5 py-1 text-[11px] font-bold text-white">تطبيق</span>
              </button>
            );
          })}
        </div>
      )}
      {(error || (code && m.couponReason)) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-sale">
          <Icon name="close" size={14} /> {error ?? m.couponReason}
        </p>
      )}
    </div>
  );
}

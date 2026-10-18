"use client";
/* eslint-disable @next/next/no-img-element */
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { CartLineRow, FreeShippingBar } from "@/components/cart/CartDrawer";
import { CartSummary, type SummaryRow } from "@/components/cart/CartSummary";
import { CouponBox } from "@/components/cart/CouponBox";
import { ShippingFillers } from "@/components/cart/ShippingFillers";
import { Breadcrumbs } from "@/components/catalog/PageHero";
import { useHydrated, useLoyaltyRules } from "@/components/Providers";
import { ProductRow } from "@/components/product/ProductRow";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { arPoints, arProducts, formatPrice } from "@/lib/format";
import { useCartMath } from "@/lib/hooks/cartMath";
import { packageHref } from "@/lib/links";
import { pointsFor } from "@/lib/pricing";
import { useCart } from "@/lib/stores/cart";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const hydrated = useHydrated();
  const m = useCartMath();
  const remove = useCart((s) => s.remove);
  const removePackage = useCart((s) => s.removePackage);
  const rules = useLoyaltyRules();
  const first = m.lines[0]?.slug;
  const inCart = new Set(m.lines.map((l) => l.productId));
  const recs = useQuery({
    queryKey: ["bought-together", first],
    enabled: !!first,
    queryFn: () => api<{ items: Product[] }>(`/products/${encodeURIComponent(first!)}/bought-together`, { query: { limit: 12 }, auth: false }).then((r) => r.items ?? []),
  });

  if (!hydrated)
    return (
      <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
      </div>
    );

  if (!m.lines.length)
    return (
      <div className="container py-16 text-center md:py-24">
        <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-accent-light text-accent-dark">
          <Icon name="bag" size={48} />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">سلّتكِ فارغة</h1>
        <p className="mt-2 text-ink-muted">اكتشفي أجمل منتجات التجميل والعناية وأضيفيها هنا</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            تسوّقي الآن
          </Link>
          <Link href="/offers" className="btn-soft">
            شاهدي العروض
          </Link>
        </div>
      </div>
    );

  const discountsTotal = m.packSaving + m.couponDiscount;
  const est = Math.max(0, m.subtotal - discountsTotal);
  const rows: SummaryRow[] = [
    { label: `المنتجات (${arProducts(m.count)})`, value: m.subtotal },
    ...(m.packSaving ? [{ label: "توفير الباقات", value: m.packSaving, tone: "saving" as const }] : []),
    ...(m.couponDiscount ? [{ label: `كود ${m.coupon?.code}`, value: m.couponDiscount, tone: "saving" as const }] : []),
    { label: "التوصيل", value: 0, tone: "muted", hint: m.freeShippingCoupon ? undefined : "يُحسب حسب المحافظة", free: m.freeShippingCoupon },
  ];

  return (
    <div className="container animate-fade-up py-4 md:py-8">
      <Breadcrumbs items={[{ label: "السلة" }]} />
      <h1 className="mt-3 text-2xl font-extrabold md:text-3xl">
        سلة التسوّق <span className="text-base font-bold text-ink-muted">({arProducts(m.count)})</span>
      </h1>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <FreeShippingBar subtotal={m.subtotal} />
          {m.status.map((s) => (
            <div key={s.pack.id} className={clsx("card flex items-center gap-3 p-4", s.sets > 0 ? "ring-1 ring-success/30" : "")}>
              <span className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-2xl bg-accent-light text-2xl">
                {s.pack.cover ? <img src={s.pack.cover} alt="" className="h-full w-full object-cover" /> : "🎁"}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={packageHref(s.pack.slug)} className="font-extrabold hover:text-accent-dark">
                  {s.pack.name}
                </Link>
                <p className={clsx("text-sm", s.sets > 0 ? "font-bold text-success" : "text-ink-muted")}>
                  {s.sets > 0 ? `الباقة مكتملة — وفّرتِ ${formatPrice(s.saving)}` : `ينقصها ${s.missing.length} منتج لتحصلي على سعر الباقة`}
                </p>
              </div>
              <button onClick={() => removePackage(s.pack.id)} className="rounded-full p-2 text-ink-muted hover:bg-canvas" aria-label="إلغاء سعر الباقة" title="إلغاء سعر الباقة (المنتجات تبقى)">
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}
          <div className="card divide-y divide-hairline px-4 md:px-6">
            {m.lines.map((l) => (
              <div key={l.key} className="flex items-start gap-2 py-4">
                <div className="flex-1">
                  <CartLineRow line={l} />
                </div>
                <button onClick={() => remove(l.key)} className="rounded-full p-2 text-ink-muted hover:bg-rose-soft hover:text-sale" aria-label="حذف">
                  <Icon name="trash" size={18} />
                </button>
              </div>
            ))}
          </div>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-accent-dark hover:underline">
            <Icon name="chevronRight" size={16} /> متابعة التسوّق
          </Link>
        </div>

        <aside className="card space-y-5 p-5 lg:sticky lg:top-36">
          <h2 className="text-lg font-extrabold">ملخص الطلب</h2>
          <CouponBox />
          <CartSummary rows={rows} total={est} totalLabel="المجموع التقديري" />
          {m.productSaving + discountsTotal > 0 && (
            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-success">🎉 وفّرتِ {formatPrice(m.productSaving + discountsTotal)} في هذا الطلب</p>
          )}
          {rules.earnPercent > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
              <Icon name="sparkle" size={14} className="text-accent-dark" /> ستكسبين نحو <b>{arPoints(pointsFor(est, rules))}</b> بهذا الطلب
            </p>
          )}
          <Link href="/checkout" className="btn-primary w-full text-base">
            إتمام الطلب <Icon name="arrowLeft" size={18} />
          </Link>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-ink-soft">
            <span className="flex flex-col items-center gap-1">
              <Icon name="shield" size={20} className="text-accent-dark" /> منتجات أصلية
            </span>
            <span className="flex flex-col items-center gap-1">
              <Icon name="cash" size={20} className="text-accent-dark" /> كاش أو بطاقة
            </span>
            <span className="flex flex-col items-center gap-1">
              <Icon name="truck" size={20} className="text-accent-dark" /> لكل المحافظات
            </span>
          </div>
        </aside>
      </div>

      <ShippingFillers subtotal={m.subtotal} exclude={[...inCart]} />

      {!!recs.data?.filter((p) => !inCart.has(p.id)).length && (
        <section className="py-10">
          <h2 className="section-title mb-4">يُشترى معها غالباً</h2>
          <ProductRow products={recs.data.filter((p) => !inCart.has(p.id))} />
        </section>
      )}
    </div>
  );
}

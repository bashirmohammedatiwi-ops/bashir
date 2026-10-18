"use client";
/* eslint-disable @next/next/no-img-element */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatusPill } from "@/components/account/OrderCard";
import { CartSummary, type SummaryRow } from "@/components/cart/CartSummary";
import { useSettings } from "@/components/Providers";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { arPoints, arProducts, formatDateTime, formatPrice } from "@/lib/format";
import { deliveryLabel, useZones } from "@/lib/hooks/delivery";
import { productHref } from "@/lib/links";
import { productCover } from "@/lib/media";
import { PAY_STATUS, PAYMENT, TIMELINE, canCancel, timelineStep } from "@/lib/orders";
import { formatPhoneLocal } from "@/lib/phone";
import { useCart } from "@/lib/stores/cart";
import { toast, useUi } from "@/lib/stores/ui";
import type { Order } from "@/lib/types";

const STEP_LABEL: Record<string, string> = { PENDING: "استلمنا طلبكِ", CONFIRMED: "تم التأكيد", PROCESSING: "قيد التجهيز", SHIPPED: "مع المندوب", DELIVERED: "وصل 💜" };

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const placed = sp.get("placed") === "1";
  const router = useRouter();
  const qc = useQueryClient();
  const settings = useSettings();
  const zones = useZones().data ?? [];
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const [busy, setBusy] = useState<"" | "cancel" | "pay">("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const q = useQuery({ queryKey: ["order", id], queryFn: () => api<Order>(`/orders/${id}`) });
  const o = q.data;

  if (q.isLoading) return <Skeleton className="h-[560px]" />;
  if (!o)
    return (
      <div className="card p-10 text-center">
        <p className="font-bold">لم نجد هذا الطلب</p>
        <Link href="/account/orders" className="btn-soft mt-4">
          طلباتي
        </Link>
      </div>
    );

  const step = timelineStep(o.status);
  const cancelled = o.status === "CANCELLED" || o.status === "REFUNDED";
  const unpaidCard = o.paymentMethod === "CARD" && o.paymentStatus !== "PAID" && !cancelled;
  const coupon = Math.max(0, o.discountTotal - (o.packageDiscount ?? 0));
  const zone = zones.find((z) => z.governorate === o.address?.governorate);

  const rows: SummaryRow[] = [
    { label: "المنتجات", value: o.subtotal },
    ...(o.packageDiscount ? [{ label: "توفير الباقات", value: o.packageDiscount, tone: "saving" as const }] : []),
    ...(coupon ? [{ label: o.coupon?.code ? `كود ${o.coupon.code}` : "الخصم", value: coupon, tone: "saving" as const }] : []),
    { label: o.deliveryOption === "PICKUP" ? "استلام من الفرع" : "التوصيل", value: o.shippingTotal, free: o.shippingTotal === 0 },
    ...(o.loyaltyDiscount ? [{ label: `نقاط الولاء (${o.loyaltySpent})`, value: o.loyaltyDiscount, tone: "saving" as const }] : []),
  ];

  const cancel = async () => {
    setBusy("cancel");
    try {
      await api(`/orders/${o.id}/cancel`, { method: "PATCH" });
      toast({ text: "تم إلغاء الطلب وتحديث نقاط الولاء", tone: "success" });
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirmCancel(false);
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
    } finally {
      setBusy("");
    }
  };

  const pay = async () => {
    setBusy("pay");
    try {
      const r = await api<{ formUrl?: string | null; alreadyPaid?: boolean }>(`/payments/orders/${o.id}/start`, { method: "POST", body: { channel: "web" } });
      if (r.alreadyPaid) {
        toast({ text: "الطلب مدفوع ✓", tone: "success" });
        qc.invalidateQueries({ queryKey: ["order", id] });
      } else if (r.formUrl) {
        window.location.href = r.formUrl;
        return;
      } else toast({ text: "تعذّر فتح صفحة الدفع — حاولي بعد قليل", tone: "error" });
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
    }
    setBusy("");
  };

  const reorder = () => {
    let n = 0;
    for (const it of o.items) {
      const p = it.product;
      if (!p) continue;
      const shade = it.shadeId ? p.shades?.find((s) => s.id === it.shadeId) ?? null : null;
      if (add(p, it.quantity, shade)) n++;
    }
    if (n) openCart(true);
    else toast({ text: "المنتجات غير متوفرة حالياً", tone: "error" });
  };

  return (
    <div className="space-y-5">
      {placed && (
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent to-accent-dark p-6 text-white shadow-lift md:p-8">
          <span className="absolute -left-6 -top-8 text-[120px] opacity-25">🎉</span>
          <p className="text-sm font-bold opacity-85">{unpaidCard ? "تم إنشاء طلبكِ" : "شكراً لثقتكِ"}</p>
          <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{unpaidCard ? "أكملي الدفع لتأكيد الطلب" : "تم استلام طلبكِ بنجاح 💜"}</h1>
          <p className="mt-2 max-w-xl text-sm opacity-90">
            {o.deliveryOption === "PICKUP" ? "نبلغكِ حين يجهز طلبكِ للاستلام." : zone ? `${deliveryLabel(zone)} — سنتصل بكِ قبل الوصول.` : "سنتصل بكِ لتأكيد الطلب قبل الشحن."}
          </p>
          {!!o.loyaltyEarned && !cancelled && <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-bold">✨ ستكسبين {arPoints(o.loyaltyEarned)} بعد التوصيل</p>}
        </div>
      )}

      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => router.push("/account/orders")} className="rounded-full p-1.5 hover:bg-canvas" aria-label="رجوع">
            <Icon name="chevronRight" />
          </button>
          <h2 className="text-xl font-extrabold" dir="ltr">
            #{o.orderNumber}
          </h2>
          <StatusPill status={o.status} />
          <span className="ms-auto text-sm text-ink-muted">{formatDateTime(o.createdAt)}</span>
        </div>

        {!cancelled ? (
          <ol className="mt-6 grid grid-cols-5 gap-1">
            {TIMELINE.map((s, i) => (
              <li key={s} className="flex flex-col items-center text-center">
                <span className="relative flex w-full items-center justify-center">
                  {i > 0 && <span className={clsx("absolute left-1/2 h-1 w-full rounded-full", i <= step ? "bg-accent-dark" : "bg-hairline")} />}
                  <span className={clsx("relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold", i <= step ? "bg-accent-dark text-white" : "bg-canvas text-ink-muted ring-1 ring-hairline", i === step && "ring-4 ring-accent/25")}>
                    {i < step ? <Icon name="check" size={15} stroke={3} /> : i + 1}
                  </span>
                </span>
                <span className={clsx("mt-2 text-[11px] font-bold leading-tight md:text-xs", i <= step ? "text-ink" : "text-ink-muted")}>{STEP_LABEL[s]}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-bold text-sale">تم إلغاء هذا الطلب. يمكنكِ إعادة طلب المنتجات بضغطة واحدة.</p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {unpaidCard && (
            <button onClick={pay} disabled={!!busy} className="btn-primary h-11">
              <Icon name="shield" size={18} /> {busy === "pay" ? "…" : `ادفعي الآن ${formatPrice(o.total)}`}
            </button>
          )}
          <button onClick={reorder} className="btn-soft h-11">
            <Icon name="bag" size={18} /> اطلبيه مرة أخرى
          </button>
          {settings.whatsapp && (
            <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً، استفسار عن طلبي #${o.orderNumber}`)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <Icon name="chat" size={18} /> تواصلي معنا
            </a>
          )}
          {canCancel(o.status) && (
            <button onClick={() => setConfirmCancel(true)} className="btn-ghost text-sale">
              إلغاء الطلب
            </button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="card p-5 md:p-6">
          <h3 className="mb-3 font-extrabold">المنتجات ({arProducts(o.items.reduce((s, i) => s + i.quantity, 0))})</h3>
          <div className="divide-y divide-hairline">
            {o.items.map((it) => {
              const shade = it.shadeId ? it.product?.shades?.find((s) => s.id === it.shadeId) : null;
              return (
                <div key={it.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-2xl border border-hairline bg-white p-1">
                    {it.product && <img src={productCover(it.product, "thumb")} alt="" className="h-full w-full object-contain" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {it.product ? (
                      <Link href={productHref(it.product.slug)} className="line-clamp-2 text-sm font-semibold hover:text-accent-dark">
                        {it.product.nameAr || it.productName}
                      </Link>
                    ) : (
                      <span className="line-clamp-2 text-sm font-semibold">{it.productName}</span>
                    )}
                    {shade && (
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className="h-3 w-3 rounded-full ring-1 ring-hairline" style={{ background: shade.colorHex }} /> {shade.name}
                      </span>
                    )}
                    <span className="text-xs text-ink-muted">
                      {it.quantity} × {formatPrice(it.unitPrice)}
                    </span>
                  </span>
                  <span className="text-sm font-extrabold tabular-nums">{formatPrice(it.totalPrice)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <CartSummary rows={rows} total={o.total} totalLabel="الإجمالي" />
          </div>
          <div className="card space-y-3 p-5 text-sm">
            <p className="flex items-start gap-2">
              <Icon name="cash" size={18} className="mt-0.5 text-accent-dark" />
              <span>
                <b>{PAYMENT[o.paymentMethod] ?? o.paymentMethod}</b>
                <span className="block text-xs text-ink-muted">{PAY_STATUS[o.paymentStatus] ?? o.paymentStatus}</span>
              </span>
            </p>
            {o.address && (
              <p className="flex items-start gap-2">
                <Icon name="location" size={18} className="mt-0.5 text-accent-dark" />
                <span>
                  <b>{o.address.fullName}</b> • <span dir="ltr">{formatPhoneLocal(o.address.phone)}</span>
                  <span className="block text-xs text-ink-muted">{[o.address.governorate, o.address.area, o.address.street, o.address.house].filter(Boolean).join("، ")}</span>
                </span>
              </p>
            )}
            {o.isGift && (
              <p className="flex items-start gap-2">
                <Icon name="gift" size={18} className="mt-0.5 text-accent-dark" />
                <span>
                  <b>مغلّف كهدية</b>
                  {o.giftMessage && <span className="block text-xs text-ink-muted">«{o.giftMessage}»</span>}
                </span>
              </p>
            )}
            {o.notes && (
              <p className="flex items-start gap-2">
                <Icon name="chat" size={18} className="mt-0.5 text-accent-dark" /> <span className="text-ink-soft">{o.notes}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4" onClick={() => setConfirmCancel(false)}>
          <div className="card w-full max-w-sm p-6 text-center animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-soft text-sale">
              <Icon name="close" size={26} />
            </span>
            <h3 className="mt-3 text-lg font-extrabold">إلغاء الطلب؟</h3>
            <p className="mt-1 text-sm text-ink-muted">سيُلغى الطلب وتُعاد نقاط الولاء المستخدمة لرصيدكِ.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmCancel(false)} className="btn-ghost">
                تراجع
              </button>
              <button onClick={cancel} disabled={busy === "cancel"} className="btn h-11 bg-sale text-white">
                {busy === "cancel" ? "…" : "نعم، ألغيه"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

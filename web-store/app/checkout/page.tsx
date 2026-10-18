"use client";
/* eslint-disable @next/next/no-img-element */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CartSummary, type SummaryRow } from "@/components/cart/CartSummary";
import { CouponBox } from "@/components/cart/CouponBox";
import { Breadcrumbs } from "@/components/catalog/PageHero";
import { useHydrated, useLoyaltyRules } from "@/components/Providers";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { arPoints, arProducts, formatNumber, formatPrice } from "@/lib/format";
import { useCartMath } from "@/lib/hooks/cartMath";
import { deliveryLabel, useAddresses, useZones } from "@/lib/hooks/delivery";
import { formatPhoneLocal, isValidIraqiPhone, normalizePhone } from "@/lib/phone";
import { pointsFor, redeemable } from "@/lib/pricing";
import { useAuth } from "@/lib/stores/auth";
import { useCart } from "@/lib/stores/cart";
import { toast } from "@/lib/stores/ui";
import type { Address, Order } from "@/lib/types";

type Methods = { cod: boolean; card: { enabled: boolean; sandbox?: boolean } };
type Quote = { fee: number; freeShippingApplied?: boolean };
type Form = { fullName: string; phone: string; governorate: string; area: string; street: string; house: string };
const EMPTY: Form = { fullName: "", phone: "", governorate: "", area: "", street: "", house: "" };

function Section({ n, title, children, aside }: { n: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-dark text-sm font-extrabold text-white">{n}</span>
        <h2 className="flex-1 text-lg font-extrabold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-center gap-3 text-start">
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {sub && <span className="block text-xs text-ink-muted">{sub}</span>}
      </span>
      <span className={clsx("relative h-7 w-12 flex-none rounded-full transition", on ? "bg-accent-dark" : "bg-hairline")}>
        <span className={clsx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-1" : "left-6")} />
      </span>
    </button>
  );
}

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, ready, loadMe } = useAuth();
  const m = useCartMath();
  const packages = useCart((s) => s.packages);
  const clear = useCart((s) => s.clear);
  const rules = useLoyaltyRules();
  const zones = useZones().data ?? [];
  const addresses = useAddresses();
  const methods = useQuery({ queryKey: ["pay-methods", user?.id], enabled: !!user, queryFn: () => api<Methods>("/payments/methods") });

  const [addressId, setAddressId] = useState<string | null>(null); // null = عنوان جديد
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [isGift, setGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [hidePrices, setHidePrices] = useState(true);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"COD" | "CARD">("COD");
  const [placing, setPlacing] = useState(false);
  const [booted, setBooted] = useState(false);

  // غير مسجّلة ← الدخول ثم العودة هنا.
  useEffect(() => {
    if (hydrated && ready && !user) router.replace("/signin?next=/checkout");
  }, [hydrated, ready, user, router]);

  // أول تحميل: العنوان الافتراضي، وإلا اسم ورقم الحساب.
  useEffect(() => {
    if (booted || !user || !addresses.isFetched) return;
    const list = addresses.data ?? [];
    const main = list.find((a) => a.isDefault) ?? list[0];
    if (main) pick(main);
    else setForm({ ...EMPTY, fullName: user.name ?? "", phone: formatPhoneLocal(user.phone) });
    setBooted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, addresses.isFetched, booted]);

  const pick = (a: Address) => {
    setAddressId(a.id);
    setForm({
      fullName: a.fullName ?? "",
      phone: formatPhoneLocal(a.phone),
      governorate: a.governorate ?? a.city ?? "",
      area: a.area ?? "",
      street: a.street ?? "",
      house: a.house ?? "",
    });
  };

  const zone = zones.find((z) => z.governorate === form.governorate);
  const quote = useQuery({
    queryKey: ["quote", form.governorate, form.area, m.subtotal],
    enabled: !!form.governorate,
    queryFn: () => api<Quote>("/shipping/quote", { auth: false, query: { governorate: form.governorate, area: form.area || undefined, subtotal: m.subtotal } }),
  });
  const shipping = m.freeShippingCoupon ? 0 : quote.data?.fee ?? 0;
  const discounts = m.packSaving + m.couponDiscount;
  const beforeLoyalty = Math.max(0, m.subtotal - discounts + shipping);
  const balance = user?.points ?? 0;
  const loyaltyPoints = useLoyalty ? redeemable(balance, beforeLoyalty, rules) : 0;
  const loyaltyValue = Math.floor(loyaltyPoints * rules.pointValue);
  const total = Math.max(0, beforeLoyalty - loyaltyValue);
  const canRedeem = redeemable(balance, beforeLoyalty, rules) > 0;
  const cardEnabled = !!methods.data?.card?.enabled;

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (form.fullName.trim().length < 2) e.fullName = "اكتبي اسم المستلمة";
    if (!isValidIraqiPhone(form.phone)) e.phone = "رقم غير صحيح — مثال 07701234567";
    if (!form.governorate) e.governorate = "اختاري المحافظة";
    if (form.street.trim().length < 3) e.street = "اكتبي المنطقة / الشارع / أقرب نقطة دالة";
    return e;
  }, [form]);
  const valid = Object.keys(errors).length === 0;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === "governorate" ? { area: "" } : {}) }));
  const err = (k: keyof Form) => touched && errors[k] && <span className="mt-1 block text-xs font-bold text-sale">{errors[k]}</span>;

  const place = async () => {
    setTouched(true);
    if (!valid) {
      document.getElementById("address")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast({ text: "أكملي بيانات التوصيل أولاً", tone: "error" });
      return;
    }
    setPlacing(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: normalizePhone(form.phone),
        city: form.area || form.governorate,
        governorate: form.governorate,
        area: form.area || undefined,
        street: form.street.trim() || undefined,
        house: form.house.trim() || undefined,
        isDefault: true,
      };
      const address = addressId ? await api<Address>(`/addresses/${addressId}`, { method: "PATCH", body: payload }) : await api<Address>("/addresses", { method: "POST", body: payload });
      const packs = m.status.filter((s) => s.sets > 0).map((s) => ({ packageId: s.pack.id, quantity: s.sets }));
      const order = await api<Order>("/orders", {
        method: "POST",
        body: {
          items: m.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, ...(l.shadeId ? { shadeId: l.shadeId } : {}) })),
          ...(packs.length ? { packages: packs } : {}),
          addressId: address.id,
          couponCode: m.coupon && m.couponEligible ? m.coupon.code : undefined,
          notes: notes.trim() || undefined,
          isGift,
          giftMessage: isGift ? giftMessage.trim() || undefined : undefined,
          giftHidePrices: isGift && hidePrices,
          loyaltySpent: loyaltyPoints,
          paymentMethod: method,
          deliveryOption: "STANDARD",
        },
      });
      clear();
      qc.invalidateQueries({ queryKey: ["addresses"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      loadMe();
      if (method === "CARD") {
        try {
          const pay = await api<{ formUrl?: string | null; alreadyPaid?: boolean }>(`/payments/orders/${order.id}/start`, { method: "POST", body: { channel: "web" } });
          if (pay.formUrl) {
            window.location.href = pay.formUrl;
            return;
          }
        } catch (e) {
          toast({ text: `${(e as Error).message} — يمكنكِ الدفع من صفحة الطلب`, tone: "error" });
        }
      }
      router.replace(`/account/orders/${order.id}?placed=1`);
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
      setPlacing(false);
    }
  };

  if (!hydrated || !ready || !user)
    return (
      <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_400px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-96" />
      </div>
    );

  if (!m.lines.length)
    return (
      <div className="container py-20 text-center">
        <p className="text-xl font-extrabold">سلّتكِ فارغة</p>
        <Link href="/" className="btn-primary mt-5">
          تسوّقي الآن
        </Link>
      </div>
    );

  const rows: SummaryRow[] = [
    { label: `المنتجات (${arProducts(m.count)})`, value: m.subtotal },
    ...(m.packSaving ? [{ label: "توفير الباقات", value: m.packSaving, tone: "saving" as const }] : []),
    ...(m.couponDiscount ? [{ label: `كود ${m.coupon?.code}`, value: m.couponDiscount, tone: "saving" as const }] : []),
    form.governorate
      ? { label: "التوصيل", value: shipping, free: !quote.isLoading && shipping === 0, hint: quote.isLoading ? "…" : undefined }
      : { label: "التوصيل", value: 0, tone: "muted" as const, hint: "اختاري المحافظة" },
    ...(loyaltyValue ? [{ label: `نقاط الولاء (${formatNumber(loyaltyPoints)})`, value: loyaltyValue, tone: "saving" as const }] : []),
  ];

  return (
    <div className="container animate-fade-up py-4 pb-32 md:py-8 lg:pb-8">
      <Breadcrumbs items={[{ label: "السلة", href: "/cart" }, { label: "إتمام الطلب" }]} />
      <h1 className="mt-3 text-2xl font-extrabold md:text-3xl">إتمام الطلب</h1>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <div id="address" className="scroll-mt-40">
            <Section n={1} title="عنوان التوصيل">
              {!!addresses.data?.length && (
                <div className="mb-5 grid gap-2 sm:grid-cols-2">
                  {addresses.data.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => pick(a)}
                      className={clsx("rounded-2xl border-2 p-3 text-start transition", addressId === a.id ? "border-accent-dark bg-accent-light/60" : "border-hairline hover:border-accent/50")}
                    >
                      <span className="flex items-center gap-2 font-extrabold">
                        <Icon name="location" size={16} className="text-accent-dark" /> {a.governorate}
                        {a.area ? ` — ${a.area}` : ""}
                        {addressId === a.id && <Icon name="check" size={16} className="ms-auto text-accent-dark" stroke={3} />}
                      </span>
                      <span className="mt-1 line-clamp-1 block text-xs text-ink-muted">
                        {a.fullName} • {formatPhoneLocal(a.phone)} • {a.street}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => (setAddressId(null), setForm({ ...EMPTY, fullName: user.name ?? "", phone: formatPhoneLocal(user.phone) }))}
                    className={clsx("flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 font-bold transition", addressId === null ? "border-accent-dark bg-accent-light/60 text-accent-dark" : "border-hairline text-ink-soft hover:border-accent/50")}
                  >
                    <Icon name="plus" size={18} /> عنوان جديد
                  </button>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">اسم المستلمة</span>
                  <input value={form.fullName} onChange={set("fullName")} className="field" autoComplete="name" />
                  {err("fullName")}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">رقم الهاتف</span>
                  <input value={form.phone} onChange={set("phone")} className="field text-left tracking-wider" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXXX" />
                  {err("phone")}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">المحافظة</span>
                  <select value={form.governorate} onChange={set("governorate")} className="field">
                    <option value="">اختاري المحافظة</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.governorate}>
                        {z.governorate} — {formatPrice(z.standardFee)}
                      </option>
                    ))}
                  </select>
                  {err("governorate")}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    المنطقة <span className="font-normal text-ink-muted">(اختياري)</span>
                  </span>
                  {zone?.areas?.length ? (
                    <select value={form.area} onChange={set("area")} className="field">
                      <option value="">— اختاري —</option>
                      {zone.areas.map((a) => (
                        <option key={a.id} value={a.name}>
                          {a.name}
                          {a.fee != null ? ` — ${formatPrice(a.fee)}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input value={form.area} onChange={set("area")} className="field" placeholder="مثال: الكرادة" />
                  )}
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold">الشارع وأقرب نقطة دالة</span>
                  <input value={form.street} onChange={set("street")} className="field" placeholder="مثال: شارع 62، قرب جامع…" autoComplete="street-address" />
                  {err("street")}
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold">
                    رقم الدار / الشقة <span className="font-normal text-ink-muted">(اختياري)</span>
                  </span>
                  <input value={form.house} onChange={set("house")} className="field" />
                </label>
              </div>
              {zone && (
                <p className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-light/70 px-4 py-3 text-sm font-bold text-accent-dark">
                  <Icon name="truck" size={18} /> {deliveryLabel(zone)}
                </p>
              )}
            </Section>
          </div>

          <Section n={2} title="طريقة الدفع">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: "COD" as const, icon: "cash" as const, title: "الدفع عند الاستلام", sub: "ادفعي نقداً حين يصلكِ الطلب", on: true },
                { id: "CARD" as const, icon: "shield" as const, title: "بطاقة كي كارد / ماستركارد", sub: cardEnabled ? "دفع آمن عبر بوابة كي كارد" : "غير متاحة حالياً", on: cardEnabled },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  disabled={!o.on}
                  onClick={() => setMethod(o.id)}
                  className={clsx("flex items-center gap-3 rounded-2xl border-2 p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50", method === o.id ? "border-accent-dark bg-accent-light/60" : "border-hairline hover:border-accent/50")}
                >
                  <span className={clsx("grid h-11 w-11 flex-none place-items-center rounded-xl", method === o.id ? "bg-accent-dark text-white" : "bg-canvas text-ink-soft")}>
                    <Icon name={o.icon} size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-extrabold">{o.title}</span>
                    <span className="block text-xs text-ink-muted">{o.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            {method === "CARD" && methods.data?.card?.sandbox && <p className="mt-3 text-xs font-bold text-amber-600">وضع التجربة: لن يُسحب أي مبلغ حقيقي.</p>}
          </Section>

          <Section n={3} title="لمسات إضافية">
            <div className="space-y-5">
              {balance > 0 && (
                <div className={clsx("rounded-2xl p-4", canRedeem ? "bg-gradient-to-l from-accent-light to-accent-soft" : "bg-canvas")}>
                  <Toggle
                    on={useLoyalty && canRedeem}
                    onChange={(v) => canRedeem && setUseLoyalty(v)}
                    label={
                      <span className="flex items-center gap-2">
                        <Icon name="sparkle" size={18} className="text-accent-dark" /> استخدمي نقاطكِ ({arPoints(balance)})
                      </span>
                    }
                    sub={canRedeem ? `خصم حتى ${formatPrice(redeemable(balance, beforeLoyalty, rules) * rules.pointValue)} — بمضاعفات ${formatNumber(rules.redeemStep)}` : `تحتاجين ${formatNumber(rules.redeemStep)} نقطة على الأقل للاستخدام`}
                  />
                </div>
              )}
              <div className="rounded-2xl bg-canvas p-4">
                <Toggle on={isGift} onChange={setGift} label="🎁 هذا الطلب هدية" sub="نغلّفه بأناقة ونرفق بطاقة برسالتكِ" />
                {isGift && (
                  <div className="mt-4 space-y-3 animate-fade-up">
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value.slice(0, 300))}
                      rows={3}
                      className="field h-auto resize-none py-3"
                      placeholder="رسالتكِ على البطاقة (اختياري)"
                    />
                    <p className="text-left text-[11px] text-ink-muted">{giftMessage.length}/300</p>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" checked={hidePrices} onChange={(e) => setHidePrices(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--accent-dark))]" />
                      إخفاء الأسعار من الفاتورة داخل الطرد
                    </label>
                  </div>
                )}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">
                  ملاحظات للتوصيل <span className="font-normal text-ink-muted">(اختياري)</span>
                </span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="field h-auto resize-none py-3" placeholder="مثال: اتصلوا قبل الوصول" />
              </label>
            </div>
          </Section>
        </div>

        <aside className="card space-y-5 p-5 lg:sticky lg:top-36">
          <h2 className="text-lg font-extrabold">طلبكِ</h2>
          <div className="no-scrollbar max-h-64 space-y-3 overflow-y-auto">
            {m.lines.map((l) => (
              <div key={l.key} className="flex items-center gap-3">
                <span className="relative h-14 w-14 flex-none rounded-xl border border-hairline bg-white p-1">
                  {l.image && <img src={l.image} alt="" className="h-full w-full object-contain" />}
                  <span className="absolute -left-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{l.quantity}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-semibold">{l.name}</span>
                  {l.shadeName && <span className="block text-xs text-ink-muted">{l.shadeName}</span>}
                </span>
                <span className="text-sm font-bold tabular-nums">{formatPrice(l.price * l.quantity)}</span>
              </div>
            ))}
          </div>
          {packages.length > 0 && m.packSaving === 0 && <p className="text-xs text-ink-muted">بعض الباقات غير مكتملة — يُحسب سعرها العادي.</p>}
          <CouponBox />
          <CartSummary rows={rows} total={total} totalLabel="الإجمالي" />
          {rules.earnPercent > 0 && total > 0 && (
            <p className="text-center text-xs text-ink-soft">
              ستكسبين <b>{arPoints(pointsFor(total, rules))}</b> بعد التوصيل ✨
            </p>
          )}
          <button onClick={place} disabled={placing || quote.isLoading} className="btn-primary hidden w-full text-base lg:flex">
            {placing ? "جاري تأكيد الطلب…" : method === "CARD" ? `الدفع ${formatPrice(total)}` : `تأكيد الطلب • ${formatPrice(total)}`}
          </button>
          <p className="text-center text-[11px] text-ink-muted">
            بتأكيد الطلب توافقين على{" "}
            <Link href="/terms" className="underline">
              شروط الاستخدام
            </Link>
          </p>
        </aside>
      </div>

      {/* زر ثابت على الهاتف */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-hairline bg-surface/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <button onClick={place} disabled={placing || quote.isLoading} className="btn-primary w-full text-base">
          {placing ? "جاري تأكيد الطلب…" : `${method === "CARD" ? "الدفع" : "تأكيد الطلب"} • ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  );
}

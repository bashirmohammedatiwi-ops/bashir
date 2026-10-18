"use client";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@/lib/api";
import { formatNumber, formatPrice } from "@/lib/format";
import { useCart } from "@/lib/stores/cart";
import { toast } from "@/lib/stores/ui";
import type { Coupon } from "@/lib/types";
import { SectionHeader } from "../ui/SectionHeader";

const THEMES: Record<string, [string, string]> = {
  rose: ["#E8577E", "#B83A6B"],
  gold: ["#E8B04A", "#B8791F"],
  violet: ["#9B6BD8", "#5E3BA8"],
  midnight: ["#3A3F7A", "#1D2147"],
  mint: ["#3BA6A0", "#1F716C"],
  coral: ["#F27A5E", "#C24E37"],
};

export function couponValue(c: Coupon) {
  if (c.type === "FREE_SHIPPING") return ["توصيل", "مجاني"];
  if (c.type === "PERCENT" || c.type === "FIRST_ORDER") return [`${c.value}%`, "خصم"];
  return [c.value % 1000 === 0 ? `${c.value / 1000}K` : formatNumber(c.value), "د.ع خصم"];
}

/** كوبونات الرئيسية: تذكرة بلون الكوبون وزر «استخدمي الكود» يفعّله في السلة فوراً. */
export function CouponsShelf({ world }: { world?: string }) {
  const setCoupon = useCart((s) => s.setCoupon);
  const applied = useCart((s) => s.couponCode);
  const { data } = useQuery({ queryKey: ["coupons", world], queryFn: () => api<Coupon[]>("/coupons/featured", { query: { world } }) });
  if (!data?.length) return null;
  return (
    <section className="container py-5 md:py-8">
      <SectionHeader title="كوبونات لكِ ✂️" subtitle="لمسة وحدة ويتفعّل الخصم على سلتكِ" />
      <div className="scroll-row -mx-4 px-4 md:mx-0 md:px-0">
        {data.map((c) => {
          const [a, b] = THEMES[c.theme ?? "rose"] ?? THEMES.rose;
          const [big, small] = couponValue(c);
          const on = applied?.toUpperCase() === c.code.toUpperCase();
          return (
            <div key={c.id} className="flex w-[86%] flex-none snap-start overflow-hidden rounded-3xl text-white shadow-lift sm:w-[420px]" style={{ background: `linear-gradient(225deg, ${a}, ${b})` }}>
              <div className="flex w-28 flex-none flex-col items-center justify-center border-e-2 border-dashed border-white/40 p-3 text-center">
                <span dir="ltr" className="text-3xl font-extrabold">{big}</span>
                <span className="text-xs font-bold opacity-90">{small}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="font-extrabold">{c.title || c.description || "كود خصم"}</span>
                {c.subtitle && <span className="text-xs opacity-90">{c.subtitle}</span>}
                <span className="mt-1 text-xs opacity-85">{c.minOrder > 0 ? `فوق ${formatPrice(c.minOrder)}` : "بدون حد أدنى"}</span>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code).catch(() => {});
                      toast({ text: `نُسخ الكود ${c.code}` });
                    }}
                    dir="ltr"
                    className="rounded-xl border border-dashed border-white/60 px-3 py-1.5 font-mono text-sm font-bold tracking-widest"
                  >
                    {c.code}
                  </button>
                  <button
                    onClick={() => {
                      setCoupon(c.code);
                      toast({ text: `فعّلنا ${c.code} على سلتكِ ✓`, action: { label: "السلة", href: "/cart" } });
                    }}
                    className={clsx("ms-auto rounded-full px-4 py-1.5 text-sm font-bold", on ? "bg-white/25" : "bg-white text-ink")}
                  >
                    {on ? "مُفعّل ✓" : "استخدمي الكود"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

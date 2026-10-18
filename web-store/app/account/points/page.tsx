"use client";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

type Summary = { points: number; pointValue: number; earnPercent: number; redeemStep: number; firstOrderBonus: number; history: { id: string; title: string; points: number; date: string; isEarned: boolean }[] };

export default function PointsPage() {
  const q = useQuery({ queryKey: ["loyalty"], queryFn: () => api<Summary>("/loyalty") });
  if (q.isLoading || !q.data) return <Skeleton className="h-96" />;
  const s = q.data;
  const value = Math.floor(s.points * s.pointValue);
  const toNext = s.points % s.redeemStep === 0 && s.points > 0 ? 0 : s.redeemStep - (s.points % s.redeemStep);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">نقاط الولاء</h1>
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent via-accent-dark to-night p-6 text-white shadow-lift md:p-8">
        <span className="absolute -left-8 -top-8 text-[140px] opacity-20">✨</span>
        <p className="text-sm font-bold opacity-80">رصيدكِ</p>
        <p className="mt-1 text-5xl font-extrabold tabular-nums">{formatNumber(s.points)}</p>
        <p className="mt-1 text-sm opacity-90">نقطة = {formatPrice(value)} خصم</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, ((s.points % s.redeemStep) / s.redeemStep) * 100 || (s.points ? 100 : 0))}%` }} />
        </div>
        <p className="mt-2 text-xs opacity-85">{s.points >= s.redeemStep ? `يمكنكِ استخدام ${formatNumber(Math.floor(s.points / s.redeemStep) * s.redeemStep)} نقطة في طلبكِ القادم` : `ينقصكِ ${formatNumber(toNext)} نقطة لأول استخدام`}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["🛍️", "اكسبي", `${s.earnPercent}% من قيمة كل طلب نقاطاً — ${formatNumber((1000 * s.earnPercent) / 100)} نقاط لكل 1,000 د.ع`],
          ["💜", "استخدمي", `كل نقطة = ${s.pointValue} د.ع، بمضاعفات ${formatNumber(s.redeemStep)} عند الدفع`],
          ["🎁", "هدية البداية", s.firstOrderBonus ? `${formatNumber(s.firstOrderBonus)} نقطة مع أول طلب يصلكِ` : "عروض خاصة للأعضاء"],
        ].map(([e, t, d]) => (
          <div key={t} className="card p-4">
            <span className="text-2xl">{e}</span>
            <p className="mt-2 font-extrabold">{t}</p>
            <p className="text-sm text-ink-muted">{d}</p>
          </div>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="mb-3 font-extrabold">السجل</h2>
        {s.history.length ? (
          <ul className="divide-y divide-hairline">
            {s.history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-3">
                <span className={clsx("grid h-10 w-10 place-items-center rounded-full text-lg", h.isEarned ? "bg-emerald-50" : "bg-rose-soft")}>{h.isEarned ? "＋" : "−"}</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="text-xs text-ink-muted">{formatDate(h.date)}</span>
                </span>
                <span className={clsx("font-extrabold tabular-nums", h.isEarned ? "text-success" : "text-sale")}>
                  {h.isEarned ? "+" : "-"}
                  {formatNumber(Math.abs(h.points))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-ink-muted">لا حركات بعد — نقاطكِ تُضاف بعد توصيل كل طلب</p>
        )}
      </div>
    </div>
  );
}

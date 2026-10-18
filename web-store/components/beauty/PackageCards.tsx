/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { packageHref } from "@/lib/links";
import type { BeautyPackage } from "@/lib/types";

export const routineColors = (p: Pick<BeautyPackage, "kind">) =>
  p.kind === "ROUTINE_MORNING"
    ? ["#FFC46B", "#F08A5D"]
    : p.kind === "ROUTINE_EVENING"
      ? ["#6C5BD4", "#2E2A6B"]
      : p.kind === "BRIDAL_KIT"
        ? ["#E9B7C8", "#B65F86"]
        : ["rgb(var(--accent))", "rgb(var(--accent-dark))"];

export const routineIcon = (p: Pick<BeautyPackage, "kind">) =>
  p.kind === "ROUTINE_MORNING" ? "☀️" : p.kind === "ROUTINE_EVENING" ? "🌙" : p.kind === "BRIDAL_KIT" ? "💍" : "🎁";

export function SavingBadge({ pack, large }: { pack: BeautyPackage; large?: boolean }) {
  if (pack.saving <= 0) return null;
  return (
    <span className={clsx("rounded-full bg-gradient-to-l from-emerald-500 to-emerald-700 font-extrabold text-white shadow", large ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-[11px]")}>
      وفّري {pack.savingPercent > 0 ? `${pack.savingPercent}%` : `${formatNumber(pack.saving)} د.ع`}
    </span>
  );
}

function PackPrice({ pack, light }: { pack: BeautyPackage; light?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={clsx("text-lg font-extrabold tabular-nums", light ? "text-white" : "text-ink")}>
        {formatNumber(pack.price)} <span className="text-xs">د.ع</span>
      </span>
      {pack.saving > 0 && <s className={clsx("text-xs tabular-nums", light ? "text-white/70" : "text-ink-muted")}>{formatNumber(pack.itemsTotal)}</s>}
    </span>
  );
}

/** بطاقة باقة: الغلاف (أو منتجاتها)، التوفير، الاسم، السعر. */
export function PackageCard({ pack }: { pack: BeautyPackage }) {
  const thumbs = pack.thumbs.slice(0, 4);
  return (
    <Link href={packageHref(pack.slug)} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-card transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-accent-light to-accent-soft">
        {pack.coverUrl ? (
          <img src={pack.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 px-5 pt-6">
            {thumbs.map((t, i) => (
              <span key={i} className={clsx("grid aspect-[4/5] flex-1 place-items-center rounded-2xl bg-white p-1.5 shadow", i % 2 ? "translate-y-2" : "-translate-y-1")}>
                <img src={t} alt="" loading="lazy" className="h-full w-full object-contain" />
              </span>
            ))}
          </div>
        )}
        <span className="absolute right-3 top-3">
          <SavingBadge pack={pack} />
        </span>
        {pack.badge && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-accent-dark">{pack.badge}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-extrabold">{pack.name}</h3>
        <p className="line-clamp-1 text-sm text-ink-muted">{pack.subtitle || `${pack.stepCount} منتجات مختارة`}</p>
        <div className="mt-auto pt-3">
          <PackPrice pack={pack} />
        </div>
      </div>
    </Link>
  );
}

/** بطاقة روتين: تدرّج الصباح/المساء، الخطوات المرقّمة، والسعر. */
export function RoutineCard({ pack }: { pack: BeautyPackage }) {
  const [a, b] = routineColors(pack);
  const steps = pack.items.map((i) => i.stepTitle).filter(Boolean) as string[];
  return (
    <Link
      href={packageHref(pack.slug)}
      className="group relative flex h-full min-h-[230px] flex-col overflow-hidden rounded-[28px] p-5 text-white shadow-lift transition hover:-translate-y-1"
      style={{ background: `linear-gradient(225deg, ${a}, ${b})` }}
    >
      {pack.coverUrl && <img src={pack.coverUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
      <span className="pointer-events-none absolute -left-4 -top-6 text-[92px] opacity-90 transition group-hover:rotate-6">{routineIcon(pack)}</span>
      <div className="relative flex items-center gap-2">
        <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur">
          {pack.kind === "ROUTINE_MORNING" ? "روتين الصباح" : pack.kind === "ROUTINE_EVENING" ? "روتين المساء" : "روتين"} • {pack.stepCount} خطوات
        </span>
        <SavingBadge pack={pack} />
      </div>
      <h3 className="relative mt-3 max-w-[75%] text-xl font-extrabold leading-snug">{pack.name}</h3>
      {pack.subtitle && <p className="relative line-clamp-1 text-sm opacity-90">{pack.subtitle}</p>}
      <div className="relative mt-auto pt-4">
        {steps.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            {steps.slice(0, 4).map((s, i) => (
              <span key={i} className="rounded-lg bg-white/15 px-2 py-1">
                {i + 1} {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end justify-between">
          <PackPrice pack={pack} light />
          <span className="flex -space-x-2 space-x-reverse" dir="ltr">
            {pack.thumbs.slice(0, 4).map((t, i) => (
              <span key={i} className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white p-0.5 ring-2 ring-white/80">
                <img src={t} alt="" loading="lazy" className="h-full w-full object-contain" />
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}

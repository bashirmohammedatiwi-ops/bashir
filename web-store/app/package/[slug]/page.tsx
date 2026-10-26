/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddPackage } from "@/components/beauty/AddPackage";
import { PackageCard, RoutineCard, SavingBadge, routineColors, routineIcon } from "@/components/beauty/PackageCards";
import { Breadcrumbs } from "@/components/catalog/PageHero";
import { Countdown } from "@/components/home/Countdown";
import { cardTitle } from "@/lib/brandSearch";
import { Icon } from "@/components/ui/Icon";
import { serverTry } from "@/lib/api";
import { brandLabel, formatNumber, formatPrice } from "@/lib/format";
import { concernHref, packageHref, productHref } from "@/lib/links";
import { productCover } from "@/lib/media";
import { skinLabel } from "@/lib/skin";
import type { BeautyPackage } from "@/lib/types";

const getPack = (slug: string) => serverTry<BeautyPackage>(`/packages/slug/${encodeURIComponent(slug)}`, { revalidate: 60 });

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPack(decodeURIComponent(params.slug));
  if (!p) return { title: "الباقة غير موجودة" };
  return {
    title: p.name,
    description: p.subtitle || p.description?.slice(0, 160) || `${p.stepCount} منتجات مختارة بسعر ${formatPrice(p.price)}`,
    alternates: { canonical: packageHref(p.slug) },
    openGraph: { images: [p.coverUrl ?? p.thumbs[0]].filter(Boolean) as string[] },
  };
}

export default async function PackagePage({ params }: { params: { slug: string } }) {
  const p = await getPack(decodeURIComponent(params.slug));
  if (!p) notFound();
  const [a, b] = routineColors(p);
  const live = p.endsAt && new Date(p.endsAt).getTime() > Date.now();
  return (
    <div className="animate-fade-up">
      <div className="container pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "الباقات", href: "/packages" }, { label: p.name }]} />
      </div>
      <section className="container mt-3 grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-[32px] p-6 text-white shadow-lift md:p-10" style={{ background: `linear-gradient(225deg, ${a}, ${b})` }}>
          {p.coverUrl && <img src={p.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
          <span className="pointer-events-none absolute -left-6 -top-8 text-[140px] opacity-80">{routineIcon(p)}</span>
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                {p.isRoutine ? (p.kind === "ROUTINE_MORNING" ? "روتين الصباح" : p.kind === "ROUTINE_EVENING" ? "روتين المساء" : "روتين") : p.kind === "BRIDAL_KIT" ? "باقة العروس" : "باقة"} • {p.stepCount} {p.isRoutine ? "خطوات" : "منتجات"}
              </span>
              <SavingBadge pack={p} large />
              {p.badge && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">{p.badge}</span>}
            </div>
            <h1 className="mt-4 max-w-[80%] text-3xl font-extrabold leading-tight md:text-4xl">{p.name}</h1>
            {p.subtitle && <p className="mt-2 text-lg opacity-90">{p.subtitle}</p>}
            <div className="mt-8 grid grid-cols-3 gap-2 md:gap-3">
              {p.items.slice(0, 6).map((it) => (
                <span key={it.id} className="aspect-square rounded-2xl bg-white p-2 shadow-lg">
                  <img src={productCover(it.product, "small")} alt="" className="h-full w-full object-contain" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-36">
          <div className="card space-y-4 p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold tabular-nums">
                {formatNumber(p.price)} <span className="text-base">د.ع</span>
              </span>
              {p.saving > 0 && <s className="text-lg text-ink-muted tabular-nums">{formatNumber(p.itemsTotal)}</s>}
            </div>
            {p.saving > 0 && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-success">
                توفّرين {formatPrice(p.saving)} مقارنة بشراء كل منتج لوحده
              </p>
            )}
            {live && (
              <div className="flex items-center gap-2 text-sm font-bold text-sale">
                <Icon name="clock" size={18} /> ينتهي العرض خلال <Countdown endsAt={p.endsAt!} />
              </div>
            )}
            <AddPackage pack={p} />
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-ink-soft">
              <li className="flex items-center gap-1.5">
                <Icon name="shield" size={16} className="text-accent-dark" /> منتجات أصلية 100%
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="cash" size={16} className="text-accent-dark" /> الدفع عند الاستلام
              </li>
            </ul>
          </div>
          {(p.skinTypes.length > 0 || p.concernSlugs.length > 0) && (
            <div className="card p-5 text-sm">
              <p className="mb-2 font-extrabold">مناسبة لـ</p>
              <div className="flex flex-wrap gap-2">
                {p.skinTypes.map((t) => (
                  <span key={t} className="chip">
                    بشرة {skinLabel(t)}
                  </span>
                ))}
                {p.concernSlugs.map((c) => (
                  <Link key={c} href={concernHref(c)} className="chip">
                    #{c}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container py-10">
        <h2 className="section-title mb-5">{p.isRoutine ? "خطوات الروتين" : "محتوى الباقة"}</h2>
        <ol className="space-y-3">
          {p.items.map((it, i) => (
            <li key={it.id} className="card flex items-center gap-4 p-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full text-lg font-extrabold text-white" style={{ background: `linear-gradient(225deg, ${a}, ${b})` }}>
                {i + 1}
              </span>
              <Link href={productHref(it.product.slug)} className="grid h-20 w-20 flex-none place-items-center rounded-2xl border border-hairline bg-white p-1.5">
                <img src={productCover(it.product, "small")} alt="" className="h-full w-full object-contain" loading="lazy" />
              </Link>
              <div className="min-w-0 flex-1">
                {it.stepTitle && <p className="text-xs font-extrabold text-accent-dark">{it.stepTitle}</p>}
                {it.product.brand && <p className="text-[11px] font-bold uppercase text-ink-muted">{brandLabel(it.product.brand.name)}</p>}
                <Link href={productHref(it.product.slug)} className="line-clamp-2 font-semibold hover:text-accent-dark">
                  {cardTitle(it.product)}
                </Link>
                {it.note && <p className="mt-1 text-sm text-ink-soft">💡 {it.note}</p>}
              </div>
              <div className="text-left">
                <p className="font-bold tabular-nums">{formatPrice(it.product.price)}</p>
                {it.quantity > 1 && <p className="text-xs text-ink-muted">× {it.quantity}</p>}
              </div>
            </li>
          ))}
        </ol>
        {p.description && (
          <div className="card mt-6 p-6">
            <h3 className="mb-2 font-extrabold">عن {p.isRoutine ? "الروتين" : "الباقة"}</h3>
            <p className="prose-ar">{p.description}</p>
          </div>
        )}
      </section>

      {!!p.related?.length && (
        <section className="container pb-12">
          <h2 className="section-title mb-4">قد يعجبكِ أيضاً</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.related.slice(0, 6).map((r) => (r.isRoutine ? <RoutineCard key={r.id} pack={r} /> : <PackageCard key={r.id} pack={r} />))}
          </div>
        </section>
      )}
    </div>
  );
}

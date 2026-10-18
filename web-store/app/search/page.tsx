import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHero } from "@/components/catalog/PageHero";
import { CategoryCircles } from "@/components/home/Sections";
import { DeemaButton } from "@/components/advisor/DeemaButton";
import { ListingView } from "@/components/product/ListingView";
import { Icon } from "@/components/ui/Icon";
import { serverTry } from "@/lib/api";
import { getCategories } from "@/lib/data";
import { POPULAR_SEARCHES } from "@/lib/popular";
import { brandLabel } from "@/lib/format";
import { brandHref, categoryHref } from "@/lib/links";
import type { Paged, Product } from "@/lib/types";

type Resp = Paged<Product> & { corrected?: string | null; understood?: string[] };

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const q = searchParams.q?.trim();
  return { title: q ? `نتائج البحث عن «${q}»` : "البحث", robots: { index: false } };
}

function Popular() {
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_SEARCHES.map((t) => (
        <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip">
          <Icon name="search" size={14} /> {t}
        </Link>
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  if (!q) {
    const categories = await getCategories();
    return (
      <div className="animate-fade-up">
        <PageHero title="عمّ تبحثين؟" subtitle="اكتبي اسم منتج أو براند أو نوع — نفهم العربي والإنجليزي والأخطاء الإملائية" crumbs={[{ label: "البحث" }]}>
          <Popular />
        </PageHero>
        <section className="container py-8">
          <h2 className="section-title mb-4">تصفّحي الأقسام</h2>
          <CategoryCircles categories={categories} />
        </section>
      </div>
    );
  }
  const [initial, instant] = await Promise.all([
    serverTry<Resp>(`/search?q=${encodeURIComponent(q)}&page=1&limit=24&sort=relevance`, { revalidate: 30 }),
    serverTry<{ brands?: { id: string; name: string; slug: string; count: number }[]; categories?: { id: string; name: string; slug: string; count: number }[] }>(`/search/instant?q=${encodeURIComponent(q)}`, { revalidate: 60 }),
  ]);
  const brands = (instant?.brands ?? []).slice(0, 4);
  const cats = (instant?.categories ?? []).slice(0, 6);
  const total = initial?.meta?.total ?? 0;
  return (
    <div className="animate-fade-up">
      <PageHero tone="plain" title={`«${q}»`} crumbs={[{ label: "البحث", href: "/search" }, { label: q }]}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          {initial?.corrected && (
            <span>
              هل تقصدين{" "}
              <Link href={`/search?q=${encodeURIComponent(initial.corrected)}`} className="font-extrabold text-accent-dark underline">
                {initial.corrected}
              </Link>
              ؟
            </span>
          )}
          {!!initial?.understood?.length && initial.understood.join(" ") !== q && (
            <span className="flex flex-wrap items-center gap-1.5">
              <Icon name="sparkle" size={16} className="text-accent-dark" /> فهمنا:
              {initial.understood.map((u) => (
                <span key={u} className="rounded-full bg-accent-light px-2.5 py-0.5 font-bold text-accent-dark">
                  {u}
                </span>
              ))}
            </span>
          )}
        </div>
      </PageHero>
      {(brands.length > 0 || cats.length > 0) && (
        <section className="container pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {brands.map((b) => (
              <Link key={b.id} href={brandHref(b.slug)} className="flex items-center gap-2 rounded-2xl bg-gradient-to-l from-accent-light to-surface px-4 py-2.5 shadow-card ring-1 ring-accent/20 hover:ring-accent/50">
                <Icon name="sparkle" size={16} className="text-accent-dark" />
                <span className="text-sm">
                  كل منتجات <b>{brandLabel(b.name)}</b>
                </span>
                <span className="text-xs text-ink-muted">{b.count}</span>
              </Link>
            ))}
            {cats.map((c) => (
              <Link key={c.id} href={categoryHref(c.slug)} className="chip">
                {c.name} <span className="text-xs opacity-60">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="container py-5 md:py-6">
        {total === 0 ? (
          <div className="card mx-auto max-w-2xl p-8 text-center md:p-12">
            <span className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-accent-light text-accent-dark">
              <Icon name="search" size={34} />
            </span>
            <p className="text-xl font-extrabold">لم نجد نتائج لـ «{q}»</p>
            <p className="mt-2 text-ink-muted">جربي كلمة أبسط أو اسم البراند — أو اختاري من عمليات البحث الشائعة:</p>
            <div className="mt-5 flex justify-center">
              <Popular />
            </div>
            <div className="mt-6 flex justify-center">
              <DeemaButton q={q} className="flex h-11 items-center gap-2 rounded-full bg-accent-light px-5 text-sm font-bold text-accent-dark">
                اسألي ديما عن «{q}» — تفهم الوصف وتقترح بدائل
              </DeemaButton>
            </div>
          </div>
        ) : (
          <Suspense>
            <ListingView mode="search" q={q} initial={initial} />
          </Suspense>
        )}
      </section>
    </div>
  );
}

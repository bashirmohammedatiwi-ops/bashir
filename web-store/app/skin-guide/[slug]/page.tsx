/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoutineCard, PackageCard } from "@/components/beauty/PackageCards";
import { PageHero } from "@/components/catalog/PageHero";
import { ProductGrid } from "@/components/product/ProductRow";
import { Icon } from "@/components/ui/Icon";
import { serverTry } from "@/lib/api";
import { currentWorld } from "@/lib/data";
import { concernHref, productsHref } from "@/lib/links";
import { skinLabel } from "@/lib/skin";
import type { BeautyPackage, Product, SkinConcern } from "@/lib/types";

type Guide = { concern: SkinConcern; products: Product[]; productTotal: number; routines: BeautyPackage[]; others: SkinConcern[] };

async function getGuide(slug: string) {
  const world = await currentWorld();
  return serverTry<Guide>(`/skin-guide/${encodeURIComponent(slug)}${world ? `?world=${world.slug}` : ""}`, { revalidate: 300 });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = await getGuide(decodeURIComponent(params.slug));
  if (!g) return { title: "دليل البشرة" };
  return { title: `${g.concern.name} — الأسباب والعلاج والمنتجات`, description: g.concern.subtitle || g.concern.description, alternates: { canonical: concernHref(g.concern.slug) } };
}

function Block({ title, emoji, items, tone }: { title: string; emoji: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <div className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-extrabold">
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${tone}`}>{emoji}</span> {title}
      </h3>
      <ul className="space-y-2 text-sm text-ink-soft">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ConcernPage({ params }: { params: { slug: string } }) {
  const g = await getGuide(decodeURIComponent(params.slug));
  if (!g) notFound();
  const c = g.concern;
  return (
    <div className="animate-fade-up">
      <PageHero title={`${c.icon ?? ""} ${c.name}`.trim()} subtitle={c.subtitle || c.description} crumbs={[{ label: "دليل البشرة", href: "/skin-guide" }, { label: c.name }]} image={c.imageUrl}>
        {c.skinTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {c.skinTypes.map((t) => (
              <span key={t} className="chip bg-white/80">
                بشرة {skinLabel(t)}
              </span>
            ))}
          </div>
        )}
      </PageHero>
      <div className="container space-y-10 py-8">
        {c.description && c.subtitle && <p className="prose-ar max-w-3xl">{c.description}</p>}
        {(c.causes.length || c.tips.length || c.ingredients.length || c.avoid.length) > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="الأسباب" emoji="🔎" items={c.causes} tone="bg-amber-50" />
            <Block title="نصائح يومية" emoji="💡" items={c.tips} tone="bg-sky-50" />
            <Block title="مكونات تفيدكِ" emoji="🧪" items={c.ingredients} tone="bg-emerald-50" />
            <Block title="تجنّبي" emoji="🚫" items={c.avoid} tone="bg-rose-soft" />
          </div>
        )}
        {g.routines.length > 0 && (
          <section>
            <h2 className="section-title mb-4">روتين مقترح</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{g.routines.map((p) => (p.isRoutine ? <RoutineCard key={p.id} pack={p} /> : <PackageCard key={p.id} pack={p} />))}</div>
          </section>
        )}
        {g.products.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="section-title">منتجات مناسبة</h2>
              {g.productTotal > g.products.length && (
                <Link href={productsHref({ concernSlug: c.slug, title: `منتجات ${c.name}` })} className="flex items-center gap-1 text-sm font-bold text-accent-dark">
                  عرض الكل ({g.productTotal}) <Icon name="chevronLeft" size={16} />
                </Link>
              )}
            </div>
            <ProductGrid products={g.products} />
          </section>
        )}
        {g.others.length > 0 && (
          <section>
            <h2 className="section-title mb-4">مشاكل أخرى</h2>
            <div className="flex flex-wrap gap-2">
              {g.others.map((o) => (
                <Link key={o.id} href={concernHref(o.slug)} className="chip">
                  {o.icon} {o.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { Icon } from "@/components/ui/Icon";
import { serverTry } from "@/lib/api";
import { currentWorld } from "@/lib/data";
import { arProducts } from "@/lib/format";
import { concernHref } from "@/lib/links";
import type { SkinConcern } from "@/lib/types";

export const metadata: Metadata = {
  title: "دليل البشرة",
  description: "تعرّفي على مشاكل البشرة الشائعة: الأسباب، النصائح، المكونات المفيدة، والمنتجات المناسبة لكل مشكلة.",
  alternates: { canonical: "/skin-guide" },
};

export default async function SkinGuidePage() {
  const world = await currentWorld();
  const list = (await serverTry<SkinConcern[]>(`/skin-concerns${world ? `?world=${world.slug}` : ""}`, { revalidate: 300 })) ?? [];
  return (
    <div className="animate-fade-up">
      <PageHero title="دليل البشرة 🌿" subtitle="اختاري مشكلة بشرتكِ — نشرح لكِ أسبابها وما يفيدها ونرشّح المنتجات المناسبة" crumbs={[{ label: "دليل البشرة" }]} />
      <div className="container py-8">
        <Link href="/skin-quiz" className="group mb-8 flex items-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-l from-accent to-accent-dark p-5 text-white shadow-lift md:p-7">
          <span className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-white/20 text-4xl transition group-hover:rotate-6">🔍</span>
          <span className="flex-1">
            <span className="block text-lg font-extrabold md:text-xl">اختبار البشرة — دقيقة واحدة</span>
            <span className="block text-sm opacity-90">اعرفي نوع بشرتكِ واحصلي على روتين صباح ومساء مقترح</span>
          </span>
          <span className="hidden rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-dark md:block">ابدئي الآن</span>
        </Link>
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <Link key={c.id} href={concernHref(c.slug)} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                <div className="relative aspect-[16/9] overflow-hidden" style={{ background: c.color ?? "rgb(var(--accent-light))" }}>
                  {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                  <span className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-2xl shadow">{c.icon ?? "🌸"}</span>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-extrabold group-hover:text-accent-dark">{c.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{c.subtitle || c.description}</p>
                  <p className="mt-3 flex items-center gap-1 text-sm font-bold text-accent-dark">
                    {c.productCount ? `${arProducts(c.productCount)} مناسبة` : "اقرئي الدليل"} <Icon name="chevronLeft" size={16} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-ink-muted">الدليل قيد التحضير</div>
        )}
      </div>
    </div>
  );
}

import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { PackageCard, RoutineCard } from "@/components/beauty/PackageCards";
import { PageHero } from "@/components/catalog/PageHero";
import { Icon } from "@/components/ui/Icon";
import { serverTry } from "@/lib/api";
import { currentWorld } from "@/lib/data";
import type { BeautyPackage } from "@/lib/types";

export const metadata: Metadata = {
  title: "الباقات والروتينات",
  description: "روتينات صباح ومساء وباقات مختارة بسعر أقل من شراء كل منتج لوحده.",
  alternates: { canonical: "/packages" },
};

const TABS: [string, string][] = [
  ["", "الكل"],
  ["routines", "الروتينات"],
  ["ROUTINE_MORNING", "☀️ الصباح"],
  ["ROUTINE_EVENING", "🌙 المساء"],
  ["bundles", "الباقات"],
  ["BRIDAL_KIT", "💍 العروس"],
];

export default async function PackagesPage({ searchParams }: { searchParams: { kind?: string } }) {
  const kind = TABS.some(([k]) => k === searchParams.kind) ? searchParams.kind ?? "" : "";
  const world = await currentWorld();
  const qs = new URLSearchParams({ ...(world ? { world: world.slug } : {}), ...(kind ? { kind } : {}) }).toString();
  const list = (await serverTry<BeautyPackage[]>(`/packages${qs ? `?${qs}` : ""}`, { revalidate: 60 })) ?? [];
  const routines = list.filter((p) => p.isRoutine);
  const bundles = list.filter((p) => !p.isRoutine);
  return (
    <div className="animate-fade-up">
      <PageHero title="الباقات والروتينات 🎁" subtitle="منتجات مختارة تكمّل بعضها — بسعر أقل من شرائها منفردة" crumbs={[{ label: "الباقات" }]}>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {TABS.map(([k, l]) => (
            <Link key={k} href={k ? `/packages?kind=${k}` : "/packages"} className={clsx("chip flex-none", kind === k ? "chip-on" : "bg-white/80")} scroll={false}>
              {l}
            </Link>
          ))}
        </div>
      </PageHero>
      <div className="container space-y-10 py-8">
        {!list.length && (
          <div className="card p-12 text-center">
            <p className="text-lg font-extrabold">لا باقات هنا حالياً</p>
            <p className="mt-1 text-ink-muted">نجهّز باقات جديدة قريباً — جرّبي اختبار البشرة لترشيحات تناسبكِ</p>
            <Link href="/skin-quiz" className="btn-primary mt-5">
              اختبار البشرة
            </Link>
          </div>
        )}
        {routines.length > 0 && (
          <section>
            <h2 className="section-title mb-4">روتينات العناية</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {routines.map((p) => (
                <RoutineCard key={p.id} pack={p} />
              ))}
            </div>
          </section>
        )}
        {bundles.length > 0 && (
          <section>
            <h2 className="section-title mb-4">باقات مختارة</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {bundles.map((p) => (
                <PackageCard key={p.id} pack={p} />
              ))}
            </div>
          </section>
        )}
        <Link href="/skin-quiz" className="group flex items-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-l from-accent to-accent-dark p-6 text-white shadow-lift">
          <span className="text-5xl transition group-hover:rotate-12">🔍</span>
          <span className="flex-1">
            <span className="block text-xl font-extrabold">ما تعرفين أي روتين يناسبكِ؟</span>
            <span className="block text-sm opacity-90">4 أسئلة فقط ونرشّحلكِ روتين الصباح والمساء</span>
          </span>
          <Icon name="arrowLeft" />
        </Link>
      </div>
    </div>
  );
}

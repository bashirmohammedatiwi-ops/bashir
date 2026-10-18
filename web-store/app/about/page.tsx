import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "من نحن",
  description: "ديما الحياة — متجر عراقي لمستحضرات التجميل والعناية والعطور الأصلية، مع توصيل لكل المحافظات.",
  alternates: { canonical: "/about" },
};

const POINTS: [IconName, string, string][] = [
  ["shield", "أصلي 100%", "نستورد من الوكلاء والموزعين المعتمدين فقط — لا تقليد ولا منتجات مجهولة."],
  ["truck", "لكل العراق", "توصيل سريع لجميع المحافظات، والدفع عند الاستلام أو بالبطاقة."],
  ["sparkle", "نقاط ولاء", "كل طلب يكسبكِ نقاطاً تستخدمينها خصماً على طلباتكِ القادمة."],
  ["chat", "نسمعكِ", "فريق خدمة يرد عليكِ ويساعدكِ تختارين الأنسب لبشرتكِ."],
];

export default function AboutPage() {
  return (
    <div className="animate-fade-up">
      <PageHero title="من نحن" subtitle="ديما الحياة — جمالكِ يبدأ من منتج أصلي تثقين به" crumbs={[{ label: "من نحن" }]} />
      <div className="container space-y-8 py-8 md:py-12">
        <p className="prose-ar max-w-3xl text-base">
          بدأت «ديما الحياة» بفكرة بسيطة: أن تحصل كل عراقية على مستحضرات تجميل وعناية أصلية من أشهر الماركات العالمية، بسعر عادل وتجربة تسوّق مريحة. اليوم نوفّر آلاف المنتجات
          في المكياج والعناية بالبشرة والشعر والعطور، مع دليل للبشرة وروتينات مختارة تساعدكِ تختارين بثقة.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(([i, t, d]) => (
            <div key={t} className="card p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-light text-accent-dark">
                <Icon name={i} />
              </span>
              <h2 className="mt-3 text-lg font-extrabold">{t}</h2>
              <p className="mt-1 text-sm text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            تسوّقي الآن
          </Link>
          <Link href="/skin-quiz" className="btn-soft">
            اختبار البشرة
          </Link>
        </div>
      </div>
    </div>
  );
}

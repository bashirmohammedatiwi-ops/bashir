import type { Metadata } from "next";
import Link from "next/link";
import { DeemaButton } from "@/components/advisor/DeemaButton";
import { Breadcrumbs } from "@/components/catalog/PageHero";
import { ProductRow } from "@/components/product/ProductRow";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getProducts } from "@/lib/data";
import { categoryHref, productsHref } from "@/lib/links";

export const metadata: Metadata = {
  title: "دليل الهدايا",
  description: "أفكار هدايا تجميل وعطور أصلية لكل ميزانية — مع تغليف هدية ورسالة مكتوبة.",
  alternates: { canonical: "/gifts" },
};

const BUDGETS: [string, string, number | undefined, number | undefined, string][] = [
  ["لمسة لطيفة", "تحت 15 ألف", undefined, 15000, "from-[#F7C6D9] to-[#E893B5]"],
  ["هدية محبوبة", "15 – 35 ألف", 15000, 35000, "from-[#D9C3F5] to-[#A77BE0]"],
  ["هدية مميزة", "35 – 75 ألف", 35000, 75000, "from-[#F5D3B5] to-[#E09A6B]"],
  ["فخامة", "فوق 75 ألف", 75000, undefined, "from-[#3B2650] to-[#22162F]"],
];

export default async function GiftsPage() {
  const [sets, her, him] = await Promise.all([
    getProducts({ categoryId: "gifts", inStock: 1, sort: "popular", limit: 14 }).catch(() => null),
    getProducts({ subcategoryId: "perfume-women-perfumes", inStock: 1, sort: "popular", limit: 14 }).catch(() => null),
    getProducts({ subcategoryId: "perfume-men-perfumes", inStock: 1, sort: "popular", limit: 14 }).catch(() => null),
  ]);
  return (
    <div className="animate-fade-up">
      <section className="container pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "دليل الهدايا" }]} />
        <div className="relative mt-3 overflow-hidden rounded-[32px] bg-gradient-to-br from-accent via-accent-dark to-[#C2508A] px-6 py-10 text-white shadow-lift md:px-12 md:py-14">
          <span className="pointer-events-none absolute -left-6 -top-10 text-[160px] opacity-25 md:text-[220px]">🎁</span>
          <h1 className="relative max-w-xl text-3xl font-extrabold leading-tight md:text-5xl">هدايا تفرّحها 💝</h1>
          <p className="relative mt-3 max-w-lg leading-8 opacity-95">عطور ومجموعات تجميل أصلية لكل ميزانية — نغلّفها كهدية ونرفق بطاقة برسالتكِ، ونقدر نخفي السعر من الفاتورة.</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <DeemaButton action="quiz:start=gift" label="🎁 ساعديني أختار هدية">
              ساعديني أختار هدية
            </DeemaButton>
            <a href="#budgets" className="btn h-12 border border-white/40 px-5 font-bold text-white hover:bg-white/10">
              تسوّقي حسب الميزانية
            </a>
          </div>
        </div>
      </section>

      <section id="budgets" className="container scroll-mt-40 py-8 md:py-12">
        <SectionHeader title="حسب الميزانية" subtitle="اختاري المبلغ ونعرض لكِ الأكثر طلباً كهدايا" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {BUDGETS.map(([t, sub, min, max, grad]) => (
            <Link key={t} href={productsHref({ minPrice: min, maxPrice: max, inStock: 1, title: `هدايا ${sub}` })} className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${grad} p-5 text-white shadow-lift transition hover:-translate-y-1 md:p-7`}>
              <span className="absolute -left-3 -top-3 text-6xl opacity-30 transition group-hover:rotate-12">🎀</span>
              <span className="block text-lg font-extrabold md:text-xl">{t}</span>
              <span className="mt-1 block text-sm opacity-90">{sub}</span>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold">
                تسوّقي <Icon name="arrowLeft" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {!!sets?.data?.length && (
        <section className="container py-6 md:py-8">
          <SectionHeader title="مجموعات جاهزة للإهداء" subtitle="علب أنيقة جاهزة — ما تحتاج تفكير" href={categoryHref("gifts")} />
          <ProductRow products={sets.data} />
        </section>
      )}
      {!!her?.data?.length && (
        <section className="container py-6 md:py-8">
          <SectionHeader title="عطور لها 🌸" subtitle="الأكثر إهداءً من العطور النسائية" href={categoryHref("perfume-women-perfumes")} />
          <ProductRow products={her.data} />
        </section>
      )}
      {!!him?.data?.length && (
        <section className="container py-6 md:py-8">
          <SectionHeader title="عطور له 🖤" subtitle="هدية مضمونة لزوجكِ أو أخوكِ أو أبوكِ" href={categoryHref("perfume-men-perfumes")} />
          <ProductRow products={him.data} />
        </section>
      )}

      <section className="container py-8">
        <div className="grid gap-4 rounded-[28px] bg-surface p-6 shadow-card md:grid-cols-3 md:p-8">
          {[
            ["🎁", "تغليف هدية", "فعّلي «هذا الطلب هدية» عند الدفع ونغلّفه بأناقة"],
            ["💌", "بطاقة برسالتكِ", "اكتبي رسالتكِ ونطبعها على بطاقة داخل الطرد"],
            ["🙈", "بدون أسعار", "نخفي الأسعار من الفاتورة حتى تبقى المفاجأة كاملة"],
          ].map(([e, t, d]) => (
            <div key={t} className="flex gap-3">
              <span className="text-3xl">{e}</span>
              <span>
                <b className="block">{t}</b>
                <span className="text-sm text-ink-muted">{d}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

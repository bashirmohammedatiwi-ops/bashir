/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { Icon } from "@/components/ui/Icon";
import { getCategories } from "@/lib/data";
import { arProducts } from "@/lib/format";
import { categoryHref } from "@/lib/links";
import { mediaUrl } from "@/lib/media";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "كل الأقسام", alternates: { canonical: "/categories" } };
const label = (c: Category) => c.nameAr || c.name;
const img = (c: Category, s: "small" | "medium" = "small") => c.imageUrl || mediaUrl(c.image, s);

export default async function CategoriesPage() {
  const tree = (await getCategories()).filter((c) => (c.productCount ?? 1) > 0);
  return (
    <div className="animate-fade-up">
      <PageHero title="كل الأقسام" subtitle="من المكياج للعناية والعطور — اختاري القسم وابدئي التسوّق" crumbs={[{ label: "الأقسام" }]}>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {tree.map((c) => (
            <a key={c.id} href={`#${c.slug}`} className="chip flex-none bg-white/80">
              {label(c)}
            </a>
          ))}
        </div>
      </PageHero>
      <div className="container space-y-10 py-8 md:space-y-14 md:py-12">
        {tree.map((c) => {
          const subs = (c.children ?? []).filter((s) => (s.productCount ?? 1) > 0);
          return (
            <section key={c.id} id={c.slug} className="scroll-mt-40">
              <div className="mb-5 flex items-center gap-4">
                <span className="h-16 w-16 flex-none overflow-hidden rounded-[20px] bg-accent-light shadow-card md:h-20 md:w-20">
                  {img(c) && <img src={img(c)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="section-title">{label(c)}</h2>
                  {!!c.productCount && <p className="text-sm text-ink-muted">{arProducts(c.productCount)}</p>}
                </div>
                <Link href={categoryHref(c.slug)} className="btn-soft h-10 flex-none px-4 text-sm">
                  تسوّقي الكل <Icon name="chevronLeft" size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {subs.map((s) => (
                  <div key={s.id} className="card group flex flex-col overflow-hidden transition hover:shadow-lift">
                    <Link href={categoryHref(s.slug)} className="flex items-center gap-3 p-3">
                      <span className="h-14 w-14 flex-none overflow-hidden rounded-2xl bg-accent-light">
                        {img(s) && <img src={img(s)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-extrabold group-hover:text-accent-dark">{label(s)}</span>
                        {!!s.productCount && <span className="text-xs text-ink-muted">{arProducts(s.productCount)}</span>}
                      </span>
                    </Link>
                    {!!s.children?.length && (
                      <div className="flex flex-wrap gap-1.5 border-t border-hairline px-3 py-2.5">
                        {s.children
                          .filter((t) => (t.productCount ?? 1) > 0)
                          .slice(0, 6)
                          .map((t) => (
                            <Link key={t.id} href={categoryHref(t.slug)} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-accent-light hover:text-accent-dark">
                              {label(t)}
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

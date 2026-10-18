/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/catalog/PageHero";
import { ListingView } from "@/components/product/ListingView";
import { findCategory, getProducts } from "@/lib/data";
import { arProducts } from "@/lib/format";
import { categoryHref } from "@/lib/links";
import { mediaUrl } from "@/lib/media";
import type { Category } from "@/lib/types";

const label = (c: Category) => c.nameAr || c.name;
const FILTER = ["categoryId", "subcategoryId", "tertiaryCategoryId"] as const;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const hit = await findCategory(decodeURIComponent(params.slug));
  if (!hit) return { title: "القسم غير موجود" };
  const name = label(hit.node);
  return {
    title: name,
    description: `تسوّقي ${name} من أشهر الماركات الأصلية مع توصيل لكل العراق.`,
    alternates: { canonical: categoryHref(hit.node.slug) },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const hit = await findCategory(decodeURIComponent(params.slug));
  if (!hit) notFound();
  const { node, path } = hit;
  const level = Math.min(path.length, 2);
  const base = { [FILTER[level]]: node.id };
  const initial = await getProducts({ ...base, page: 1, limit: 24, sort: "popular" }).catch(() => null);
  const parent = path[path.length - 1];
  // الأقسام الفرعية للتنقل: أبناء القسم، أو إخوته إن كان آخر مستوى.
  const subs = (node.children?.length ? node.children : level > 0 ? parent?.children ?? [] : []).filter((c) => (c.productCount ?? 1) > 0);
  const showTiles = level === 0 && subs.some((s) => s.image || s.imageUrl);

  return (
    <div className="animate-fade-up">
      <PageHero
        title={label(node)}
        subtitle={initial?.meta?.total ? `${arProducts(initial.meta.total)} من أشهر الماركات العالمية` : node.description}
        crumbs={[{ label: "الأقسام", href: "/categories" }, ...path.map((p) => ({ label: label(p), href: categoryHref(p.slug) })), { label: label(node) }]}
        image={node.imageUrl || mediaUrl(node.image, "large") || null}
      />

      {subs.length > 0 && (
        <section className="container pt-5">
          {showTiles ? (
            <div className="scroll-row -mx-4 px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:px-0 lg:grid-cols-8">
              {subs.map((c) => (
                <Link key={c.id} href={categoryHref(c.slug)} className="group w-[24%] flex-none snap-start text-center md:w-auto">
                  <span className="mb-2 block aspect-square overflow-hidden rounded-[22px] bg-accent-light shadow-card transition group-hover:-translate-y-1 group-hover:shadow-lift">
                    {(c.imageUrl || c.image) && <img src={c.imageUrl || mediaUrl(c.image, "small")} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </span>
                  <span className="line-clamp-1 text-[13px] font-bold text-ink-soft group-hover:text-accent-dark">{label(c)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {level > 0 && !node.children?.length && parent && (
                <Link href={categoryHref(parent.slug)} className="chip flex-none">
                  الكل
                </Link>
              )}
              {subs.map((c) => (
                <Link key={c.id} href={categoryHref(c.slug)} className={clsx("chip flex-none", c.id === node.id && "chip-on")}>
                  {label(c)}
                  {!!c.productCount && <span className="text-xs opacity-60">{c.productCount}</span>}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="container py-6 md:py-8">
        <Suspense>
          <ListingView mode="products" base={base} initial={initial} />
        </Suspense>
      </section>
    </div>
  );
}

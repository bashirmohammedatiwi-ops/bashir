/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/catalog/PageHero";
import { ListingView } from "@/components/product/ListingView";
import { getBrand, getProducts } from "@/lib/data";
import { arProducts, brandLabel } from "@/lib/format";
import { brandHref } from "@/lib/links";
import { mediaUrl } from "@/lib/media";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const b = await getBrand(decodeURIComponent(params.slug));
  if (!b) return { title: "البراند غير موجود" };
  return {
    title: `${brandLabel(b.name)} — منتجات أصلية`,
    description: `تسوّقي منتجات ${b.name} الأصلية في العراق مع توصيل سريع والدفع عند الاستلام.`,
    alternates: { canonical: brandHref(b.slug) },
    openGraph: b.logo ? { images: [mediaUrl(b.logo, "medium")] } : undefined,
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const b = await getBrand(decodeURIComponent(params.slug));
  if (!b) notFound();
  const base = { brandId: b.id };
  const initial = await getProducts({ ...base, page: 1, limit: 24, sort: "popular" }).catch(() => null);
  const count = initial?.meta?.total ?? b.productCount ?? 0;
  return (
    <div className="animate-fade-up">
      <PageHero
        title={brandLabel(b.name)}
        subtitle={[b.name !== brandLabel(b.name) ? b.name : null, count ? `${arProducts(count)} — أصلية ومضمونة` : null].filter(Boolean).join(" • ")}
        crumbs={[{ label: "البراندات", href: "/brands" }, { label: brandLabel(b.name) }]}
        logo={
          <span className="grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-full bg-white p-3 shadow-card ring-4 ring-white/70 md:h-28 md:w-28" style={b.bgColorHex ? { background: b.bgColorHex } : undefined}>
            {b.logo ? <img src={mediaUrl(b.logo, "small")} alt={b.name} className="h-full w-full object-contain" /> : <span className="text-3xl font-extrabold text-accent-dark">{brandLabel(b.name).slice(0, 1)}</span>}
          </span>
        }
      />
      <section className="container py-6 md:py-8">
        <Suspense>
          <ListingView mode="products" base={base} initial={initial} />
        </Suspense>
      </section>
    </div>
  );
}

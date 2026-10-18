import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/catalog/PageHero";
import { ListingView } from "@/components/product/ListingView";
import { getProducts } from "@/lib/data";

const BASE_KEYS = ["categoryId", "subcategoryId", "tertiaryCategoryId", "brandId", "isPromo", "isNew", "isBestSeller", "tag", "concernSlug", "skinType"];

type SP = Record<string, string | undefined>;

function titleFor(sp: SP) {
  if (sp.title) return sp.title;
  if (sp.isNew) return "وصل حديثاً";
  if (sp.isBestSeller) return "الأكثر مبيعاً";
  if (sp.isPromo) return "العروض";
  return "كل المنتجات";
}

export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  return { title: titleFor(searchParams), alternates: { canonical: "/products" } };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const base = Object.fromEntries(BASE_KEYS.filter((k) => searchParams[k]).map((k) => [k, searchParams[k] as string]));
  const initial = await getProducts({ ...base, page: 1, limit: 24, sort: "popular" }).catch(() => null);
  return (
    <div className="animate-fade-up">
      <PageHero title={titleFor(searchParams)} subtitle={searchParams.subtitle} crumbs={[{ label: titleFor(searchParams) }]} />
      <section className="container py-6 md:py-8">
        <Suspense>
          <ListingView mode="products" base={base} initial={initial} />
        </Suspense>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/catalog/PageHero";
import { ListingView } from "@/components/product/ListingView";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "العروض والخصومات", description: "خصومات حقيقية على مستحضرات تجميل أصلية — تسوّقي قبل نفاد الكمية.", alternates: { canonical: "/offers" } };

export default async function OffersPage() {
  const base = { isPromo: "1" };
  const initial = await getProducts({ ...base, page: 1, limit: 24, sort: "popular" }).catch(() => null);
  return (
    <div className="animate-fade-up">
      <PageHero tone="rose" title="العروض والخصومات 🏷️" subtitle="خصومات حقيقية على ماركات أصلية — الكميات محدودة" crumbs={[{ label: "العروض" }]} />
      <section className="container py-6 md:py-8">
        <Suspense>
          <ListingView mode="products" base={base} initial={initial} />
        </Suspense>
      </section>
    </div>
  );
}

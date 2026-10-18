import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/catalog/PageHero";
import { ListingView } from "@/components/product/ListingView";
import { CouponsShelf } from "@/components/home/CouponsShelf";
import { FlashSaleBand } from "@/components/home/FlashSaleBand";
import { currentWorld, getHome, getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "العروض والخصومات", description: "خصومات حقيقية على مستحضرات تجميل أصلية — تسوّقي قبل نفاد الكمية.", alternates: { canonical: "/offers" } };

export default async function OffersPage() {
  const base = { isPromo: "1" };
  const world = await currentWorld();
  const [initial, feed] = await Promise.all([getProducts({ ...base, page: 1, limit: 24, sort: "popular" }).catch(() => null), getHome(world?.slug).catch(() => null)]);
  return (
    <div className="animate-fade-up">
      <PageHero tone="rose" title="العروض والخصومات 🏷️" subtitle="خصومات حقيقية على ماركات أصلية — الكميات محدودة" crumbs={[{ label: "العروض" }]} />
      {feed?.flashSale?.endsAt && <FlashSaleBand endsAt={feed.flashSale.endsAt} products={feed.flashSale.products ?? []} />}
      <CouponsShelf world={world?.slug} />
      <section className="container py-6 md:py-8">
        <h2 className="section-title mb-4">كل المنتجات المخفّضة</h2>
        <Suspense>
          <ListingView mode="products" base={base} initial={initial} />
        </Suspense>
      </section>
    </div>
  );
}

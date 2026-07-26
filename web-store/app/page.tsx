"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { HomeCmsSections } from "@/components/home/HomeCmsSections";
import {
  BannerCarousel,
  BrandStrip,
  CategoryStrip,
  FlashSaleSection,
  ProductSection,
  TrustBar,
} from "@/components/home/HomeSections";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchHome } from "@/lib/api";
import { displayStoreName } from "@/lib/config";

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return <p className="empty-state container">تعذّر تحميل الصفحة. تأكدي من تشغيل الخادم.</p>;
  }

  const storeName = data.settings?.storeName || displayStoreName("ar");
  const promoProducts =
    data.flashSale?.products?.length
      ? data.flashSale.products
      : data.promoProducts ?? [];
  const hasCmsSections = (data.sections ?? []).length > 0;

  return (
    <>
      {!hasCmsSections ? (
        <section className="hero container">
          <div className="hero-card">
            <p className="hero-kicker">مرحباً بكِ في {storeName}</p>
            <h1>جمالك يبدأ من هنا</h1>
            <p>اكتشفي أحدث مستحضرات التجميل والعناية — تسوّقي بسهولة مع الدفع عند الاستلام.</p>
            <div className="hero-actions">
              <Link href="/products/" className="btn btn-primary">تسوّقي الآن</Link>
              <Link href="/categories/" className="btn btn-outline">تصفّحي الأقسام</Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="home-content">
        {hasCmsSections ? (
          <HomeCmsSections sections={data.sections ?? []} />
        ) : (
          <div className="container">
            <BannerCarousel banners={data.banners ?? []} variant="carousel" />
            <CategoryStrip categories={data.categories ?? []} />
            <BrandStrip brands={data.brands ?? []} />
            <ProductSection title="وصل حديثاً" products={data.newArrivals ?? []} moreHref="/products/" />
            <FlashSaleSection
              title="عروض اليوم"
              products={promoProducts}
              endsAt={data.flashSale?.endsAt}
              moreHref="/products/"
            />
            <ProductSection title="الأكثر مبيعاً" products={data.bestSellers ?? []} moreHref="/products/" />
            <ProductSection title="منتجات مميزة" products={data.featuredProducts ?? []} moreHref="/products/" />
          </div>
        )}
        <div className="container">
          <TrustBar />
        </div>
      </div>
    </>
  );
}

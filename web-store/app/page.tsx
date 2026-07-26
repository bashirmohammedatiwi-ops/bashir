"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import {
  BannerCarousel,
  BrandStrip,
  CategoryStrip,
  ProductSection,
} from "@/components/home/HomeSections";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchHome } from "@/lib/api";

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return <p className="empty-state container">تعذّر تحميل الصفحة. تأكدي من تشغيل الخادم.</p>;
  }

  return (
    <>
      <section className="hero container">
        <div className="hero-card">
          <h1>مرحباً بكِ في ديما الحياة</h1>
          <p>اكتشفي أحدث مستحضرات التجميل والعناية — تسوّقي بسهولة مع الدفع عند الاستلام.</p>
          <div className="hero-actions">
            <Link href="/products/" className="btn btn-primary">تسوّقي الآن</Link>
            <Link href="/categories/" className="btn btn-outline">تصفّحي الأقسام</Link>
          </div>
        </div>
      </section>

      <div className="container">
        <BannerCarousel banners={data.banners ?? []} />
        <CategoryStrip categories={data.categories ?? []} />
        <BrandStrip brands={data.brands ?? []} />
        <ProductSection title="وصل حديثاً" products={data.newArrivals ?? []} moreHref="/products/" />
        <ProductSection title="الأكثر مبيعاً" products={data.bestSellers ?? []} moreHref="/products/" />
        <ProductSection title="منتجات مميزة" products={data.featuredProducts ?? []} moreHref="/products/" />
        <ProductSection title="عروض" products={data.promoProducts ?? []} moreHref="/products/" />
      </div>
    </>
  );
}

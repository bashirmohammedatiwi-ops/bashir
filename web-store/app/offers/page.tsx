"use client";

import { useQuery } from "@tanstack/react-query";

import { HomeCmsSections } from "@/components/home/HomeCmsSections";
import { FlashSaleSection, TrustBar } from "@/components/home/HomeSections";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchOffers } from "@/lib/api";

export default function OffersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["offers"],
    queryFn: fetchOffers,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return <p className="empty-state container">تعذّر تحميل صفحة العروض.</p>;
  }

  const promoProducts = data.flashSale?.products?.length
    ? data.flashSale.products
    : data.promoProducts ?? [];

  return (
    <>
      <div className="page-banner offers-banner">
        <div className="container">
          <h1>العروض والتخفيضات</h1>
          <p>أفضل العروض الحصرية من ديما الحياة.</p>
        </div>
      </div>
      <div className="home-content">
        {data.sections?.length ? (
          <HomeCmsSections sections={data.sections} />
        ) : (
          <div className="container">
            <FlashSaleSection
              title="عروض اليوم"
              products={promoProducts}
              endsAt={data.flashSale?.endsAt}
              moreHref="/products/?isPromo=1"
            />
          </div>
        )}
        <div className="container">
          <TrustBar />
        </div>
      </div>
    </>
  );
}

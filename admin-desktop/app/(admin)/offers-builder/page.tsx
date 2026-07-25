"use client";

import { PageBuilderStudio } from "@/components/home-builder/PageBuilderStudio";

export default function OffersBuilderPage() {
  return (
    <PageBuilderStudio
      pageKey="OFFERS"
      blocksQueryKey="offers-blocks"
      exportFilePrefix="offers-blocks"
      title="استوديو صفحة العروض"
      subtitle="ابني تبويب «عروضنا» في التطبيق — بنرات، تخفيضات سريعة، وقوائم منتجات ترويجية"
      infoBanner={{
        message: "صفحة مستقلة عن الرئيسية",
        description:
          "الأقسام هنا تظهر فقط في تبويب العروض. استخدم بنراً كاملاً أو عرضاً سريعاً في الأعلى، ثم قوائم منتجات بفلتر «ترويجي».",
      }}
    />
  );
}

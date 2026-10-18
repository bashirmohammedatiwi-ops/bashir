import type { Metadata } from "next";
import { BrandsDirectory } from "@/components/catalog/BrandsDirectory";
import { PageHero } from "@/components/catalog/PageHero";
import { getBrands } from "@/lib/data";

export const metadata: Metadata = { title: "كل البراندات", description: "مئات الماركات العالمية الأصلية للمكياج والعناية والعطور.", alternates: { canonical: "/brands" } };

export default async function BrandsPage() {
  const brands = await getBrands();
  const n = brands.filter((b) => (b.productCount ?? 0) > 0).length;
  return (
    <div className="animate-fade-up">
      <PageHero title="كل البراندات" subtitle={`${n} ماركة عالمية أصلية — ابحثي بالاسم أو تصفّحي حسب الحرف`} crumbs={[{ label: "البراندات" }]} />
      <div className="container py-6 md:py-8">
        <BrandsDirectory brands={brands} />
      </div>
    </div>
  );
}

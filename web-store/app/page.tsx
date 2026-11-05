import Link from "next/link";
import { CouponsShelf } from "@/components/home/CouponsShelf";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { BrandStrip, CategoryCircles, HomeSections } from "@/components/home/Sections";
import { WorldStrip } from "@/components/home/WorldStrip";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { BuyAgain } from "@/components/account/BuyAgain";
import { ForYourSkin } from "@/components/home/ForYourSkin";
import { FlashSaleBand } from "@/components/home/FlashSaleBand";
import { TrendingSearches } from "@/components/home/TrendingSearches";
import { Icon } from "@/components/ui/Icon";
import { Deferred } from "@/components/ui/Deferred";
import { SafeSection } from "@/components/ui/SafeSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { slimHomeSections, toCardProduct } from "@/lib/cardProduct";
import { currentWorld, getHome, getWorlds } from "@/lib/data";

export const revalidate = 60;

export default async function HomePage({ searchParams }: { searchParams: { world?: string } }) {
  const [worlds, world] = await Promise.all([getWorlds(), currentWorld(searchParams.world)]);
  const raw = await getHome(world?.slug).catch(() => null);
  // منتجات خفيفة للبطاقات: الـ API يرسلها كاملة (~9KB للمنتج) وتُنسخ كلها في الصفحة.
  const feed = raw && {
    ...raw,
    sections: slimHomeSections(raw.sections ?? []),
    flashSale: raw.flashSale && { ...raw.flashSale, products: (raw.flashSale.products ?? []).map(toCardProduct) },
  };
  if (!feed) {
    return (
      <div className="container py-24 text-center">
        <p className="text-lg font-bold">تعذّر تحميل المتجر حالياً</p>
        <p className="mt-2 text-ink-muted">حاولي بعد لحظات</p>
      </div>
    );
  }
  return (
    <div>
      <section className="container pt-4 md:pt-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <SafeSection name="hero"><HeroCarousel banners={feed.banners} /></SafeSection>
          <aside className="hidden flex-col gap-4 lg:flex">
            <Link href="/skin-quiz" className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-4xl bg-gradient-to-br from-accent to-accent-dark p-6 text-white shadow-lift">
              <span className="absolute -left-6 -top-6 text-8xl opacity-30 transition group-hover:rotate-12">🔍</span>
              <span className="text-xs font-bold opacity-85">جديد</span>
              <span className="mt-1 text-xl font-extrabold">اكتشفي نوع بشرتكِ في دقيقة</span>
              <span className="mt-1 text-sm opacity-90">ونرشّحلكِ روتين الصباح والمساء</span>
              <span className="mt-4 inline-flex w-max items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-accent-dark">
                ابدئي الاختبار <Icon name="arrowLeft" size={16} />
              </span>
            </Link>
            <Link href="/offers" className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-4xl bg-gradient-to-br from-rose to-rose-deep p-6 text-white shadow-lift">
              <span className="absolute -left-4 -top-4 text-8xl opacity-30 transition group-hover:-rotate-12">🏷️</span>
              <span className="text-xl font-extrabold">عروض اليوم</span>
              <span className="mt-1 text-sm opacity-90">خصومات حقيقية على ماركات أصلية</span>
              <span className="mt-4 inline-flex w-max items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-deep">
                تسوّقي العروض <Icon name="arrowLeft" size={16} />
              </span>
            </Link>
          </aside>
        </div>
      </section>

      <SafeSection name="trending"><TrendingSearches /></SafeSection>

      <section className="container pt-5 md:pt-8">
        <SafeSection name="worlds"><WorldStrip worlds={worlds} current={world} /></SafeSection>
      </section>

      {feed.categories.length > 0 && (
        <section className="container py-6 md:py-10">
          <SectionHeader title="تسوّقي حسب القسم" subtitle={world?.taglineAr} href="/categories" />
          <CategoryCircles categories={feed.categories} />
        </section>
      )}

      {feed.flashSale?.endsAt && !feed.sections.some((x) => x.type === "FLASH_SALE") && <FlashSaleBand endsAt={feed.flashSale.endsAt} products={feed.flashSale.products ?? []} />}

      <SafeSection name="buy-again"><BuyAgain /></SafeSection>

      <SafeSection name="for-your-skin"><ForYourSkin /></SafeSection>

      <SafeSection name="coupons"><CouponsShelf world={world?.slug} /></SafeSection>

      <SafeSection name="sections"><HomeSections sections={feed.sections} /></SafeSection>

      {feed.brands.length > 0 && (
        <Deferred estimate={220}>
          <section className="container py-6 md:py-10">
            <SectionHeader title="براندات تحبينها" href="/brands" />
            <BrandStrip brands={feed.brands.slice(0, 24)} />
          </section>
        </Deferred>
      )}

      <SafeSection name="recently-viewed"><RecentlyViewed /></SafeSection>
    </div>
  );
}

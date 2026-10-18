/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { brandLabel } from "@/lib/format";
import { brandHref, categoryHref, concernHref, productsHref, resolveLink } from "@/lib/links";
import { mediaUrl } from "@/lib/media";
import type { Brand, Category, HomeSection, SectionItem } from "@/lib/types";
import { PackageCard, RoutineCard } from "../beauty/PackageCards";
import { ProductRow } from "../product/ProductRow";
import { SectionHeader } from "../ui/SectionHeader";
import { Countdown } from "./Countdown";

const viewAll = (s: HomeSection) => (s.showViewAll === false ? null : s.viewAllQuery ? productsHref(Object.fromEntries(new URLSearchParams(s.viewAllQuery))) : null);
const titleOf = (s: HomeSection) => (s.showTitle === false ? null : s.title);

/** يعرض أقسام الرئيسية كما رُتّبت في منشئ الرئيسية (نفس أنواع التطبيق). */
export function HomeSections({ sections }: { sections: HomeSection[] }) {
  const list = [...sections].sort((a, b) => a.position - b.position).filter((s) => s.type !== "HERO_BANNER");
  return (
    <>
      {list.map((s, i) => (
        <SectionView key={s.id} s={s} priority={i < 2} />
      ))}
    </>
  );
}

function Wrap({ children, className, bg }: { children: React.ReactNode; className?: string; bg?: string | null }) {
  return (
    <section className={clsx("container py-5 md:py-8", className)} style={bg ? undefined : undefined}>
      {children}
    </section>
  );
}

export function SectionView({ s, priority }: { s: HomeSection; priority?: boolean }) {
  const title = titleOf(s);
  switch (s.type) {
    case "PRODUCT_LIST":
    case "FLASH_SALE": {
      if (!s.products?.length) return null;
      return (
        <Wrap>
          <div className="flex items-end justify-between">
            <SectionHeader title={title ?? (s.type === "FLASH_SALE" ? "عرض سريع" : "مختارات")} subtitle={s.subtitle} href={viewAll(s)} />
            {s.endsAt && <Countdown endsAt={s.endsAt} className="mb-6 rounded-full bg-sale px-3 py-1 text-sm font-extrabold text-white" />}
          </div>
          <ProductRow products={s.products} priority={priority} />
        </Wrap>
      );
    }
    case "PROMO_STRIP":
      return <PromoStrip s={s} />;
    case "CUSTOM_BANNER":
    case "BANNER_FULL":
    case "BANNER_CAROUSEL":
    case "BANNER_GRID_2":
    case "BANNER_GRID_3": {
      const banners = s.banners ?? [];
      if (!banners.length) return null;
      const cols = s.type === "BANNER_GRID_3" ? 3 : s.type === "BANNER_GRID_2" || banners.length > 1 ? 2 : 1;
      return (
        <Wrap>
          {title && <SectionHeader title={title} subtitle={s.subtitle} />}
          <div className={clsx("grid gap-3 md:gap-5", cols === 3 ? "grid-cols-1 sm:grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            {banners.map((b) => {
              const href = resolveLink(b.linkType, b.linkValue, b.link);
              const img = (
                <img
                  src={b.imageUrl || mediaUrl(b.image, "large")}
                  alt={b.title ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              );
              return (
                <div key={b.id} className="group overflow-hidden rounded-[28px] bg-accent-light shadow-card" style={{ aspectRatio: String(s.bannerAspect && cols === 1 ? Math.max(s.bannerAspect, 2.6) : 2.1) }}>
                  {href ? <Link href={href}>{img}</Link> : img}
                </div>
              );
            })}
          </div>
        </Wrap>
      );
    }
    case "IMAGE_TILES":
    case "CIRCLE_TILES":
    case "IMAGE_MARQUEE":
    case "PHOTO_WALL":
    case "MEDIA_GALLERY":
    case "IMAGE_COLLAGE":
      return <Tiles s={s} title={title} />;
    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
    case "MAKEUP_CATEGORIES":
      return s.categories?.length ? (
        <Wrap>
          <SectionHeader title={title ?? "تسوّقي حسب القسم"} subtitle={s.subtitle} href="/categories" />
          <CategoryCircles categories={s.categories} />
        </Wrap>
      ) : null;
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return s.brands?.length ? (
        <Wrap>
          <SectionHeader title={title ?? "براندات مميزة"} subtitle={s.subtitle} href="/brands" />
          <BrandStrip brands={s.brands} />
        </Wrap>
      ) : null;
    case "SKIN_CONCERNS":
    case "CARE_HUB":
      return s.skinConcerns?.length ? (
        <Wrap>
          <SectionHeader title={title ?? "دليل البشرة"} subtitle={s.subtitle ?? "اختاري مشكلتكِ ونرشّحلكِ الأنسب"} href="/skin-guide" action="الدليل كامل" />
          <div className="scroll-row -mx-4 px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0 xl:grid-cols-6">
            {s.skinConcerns.map((c) => (
              <Link
                key={c.id}
                href={concernHref(c.slug)}
                className="group relative aspect-[4/5] w-[44%] flex-none snap-start overflow-hidden rounded-3xl shadow-card md:w-auto"
                style={{ background: c.color ?? "rgb(var(--accent-light))" }}
              >
                {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="block text-lg font-extrabold">{c.icon} {c.name}</span>
                  {c.subtitle && <span className="line-clamp-2 text-xs opacity-90">{c.subtitle}</span>}
                </span>
              </Link>
            ))}
          </div>
        </Wrap>
      ) : null;
    case "ROUTINE_CAROUSEL":
    case "PACKAGES": {
      const packs = s.packages ?? [];
      if (!packs.length) return null;
      const routines = s.type === "ROUTINE_CAROUSEL" || packs.every((p) => p.isRoutine);
      return (
        <Wrap>
          <SectionHeader title={title ?? (routines ? "روتين البشرة" : "الباقات")} subtitle={s.subtitle} href={`/packages${routines ? "?tab=routines" : ""}`} />
          <div className="scroll-row -mx-4 px-4 md:mx-0 md:px-0">
            {packs.map((p) => (
              <div key={p.id} className={clsx("flex-none snap-start", p.isRoutine ? "w-[84%] sm:w-[48%] lg:w-[32%]" : "w-[62%] sm:w-[36%] lg:w-[24%]")}>
                {p.isRoutine ? <RoutineCard pack={p} /> : <PackageCard pack={p} />}
              </div>
            ))}
          </div>
        </Wrap>
      );
    }
    case "SECTION_GROUP":
      return s.children?.length ? (
        <section className="container py-5 md:py-8">
          <div className="rounded-4xl p-4 md:p-8" style={{ background: s.backgroundColor ?? "rgb(var(--accent-light))" }}>
            {s.title && s.showTitle !== false && <h2 className="section-title mb-4">{s.title}</h2>}
            <div className="-mx-4 md:-mx-8">
              {s.children.map((c) => (
                <SectionView key={c.id} s={c} />
              ))}
            </div>
          </div>
        </section>
      ) : null;
    default:
      return null;
  }
}

function PromoStrip({ s }: { s: HomeSection }) {
  const p = s.promoStrip;
  if (!p?.text) return null;
  const href = resolveLink(p.linkType, p.linkValue, p.link);
  const items = [p.text, ...(p.items ?? [])];
  const row = (
    <div className="flex flex-none items-center gap-8 pe-8">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap text-sm font-bold md:text-[15px]">
          {t}
          <span className="opacity-50">✦</span>
        </span>
      ))}
    </div>
  );
  const strip = (
    <div className="overflow-hidden rounded-2xl py-3 md:rounded-3xl" style={{ background: p.backgroundColor, color: p.textColor || "inherit" }}>
      {p.marquee !== false ? (
        <div className="flex w-max animate-marquee" style={{ ["--marquee-speed" as string]: "38s" }}>
          {row}
          {row}
          {row}
          {row}
        </div>
      ) : (
        <div className="text-center text-sm font-bold">{p.text}</div>
      )}
    </div>
  );
  return <div className="container py-3">{href ? <Link href={href}>{strip}</Link> : strip}</div>;
}

function Tiles({ s, title }: { s: HomeSection; title?: string | null }) {
  const items = (s.items ?? []).filter((it: SectionItem) => it.imageUrl || it.image);
  if (!items.length) return null;
  const circle = s.type === "CIRCLE_TILES" || s.shape === "circle";
  const cols = s.layout === "grid3" ? 3 : s.layout === "grid4" ? 4 : items.length >= 4 ? 4 : items.length === 3 ? 3 : 2;
  return (
    <Wrap>
      {title && <SectionHeader title={title} subtitle={s.subtitle} />}
      <div
        className={clsx(
          "grid gap-3 md:gap-5",
          circle ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8" : cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2",
        )}
      >
        {items.map((it) => {
          const href = resolveLink(it.linkType, it.linkValue, it.link) ?? "#";
          return (
            <Link key={it.id} href={href} className="group text-center">
              <span
                className={clsx(
                  "relative block overflow-hidden bg-accent-light shadow-card",
                  circle ? "aspect-square rounded-full ring-2 ring-accent-soft" : cols === 4 ? "aspect-[4/5] rounded-3xl" : cols === 3 ? "aspect-[4/5] rounded-3xl md:aspect-[5/4]" : "aspect-[16/10] rounded-[28px] lg:aspect-[2/1]",
                )}
              >
                <img src={it.imageUrl || mediaUrl(it.image, "medium")} alt={it.title ?? ""} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                {!circle && it.title && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 text-start text-sm font-extrabold text-white md:p-5 md:text-lg">
                    {it.title}
                  </span>
                )}
              </span>
              {circle && it.title && <span className="mt-2 block text-xs font-bold text-ink-soft md:text-sm">{it.title}</span>}
            </Link>
          );
        })}
      </div>
    </Wrap>
  );
}

export function CategoryCircles({ categories }: { categories: Category[] }) {
  return (
    <div className="scroll-row -mx-4 px-4 md:mx-0 md:grid md:grid-cols-6 md:gap-5 md:px-0 lg:grid-cols-8">
      {categories.map((c) => (
        <Link key={c.id} href={categoryHref(c.slug)} className="group w-[22%] flex-none snap-start text-center md:w-auto">
          <span className="mb-2 block aspect-square overflow-hidden rounded-[26px] bg-gradient-to-b from-accent-light to-accent-soft shadow-card ring-1 ring-white transition group-hover:-translate-y-1 group-hover:shadow-lift">
            {(c.imageUrl || c.image) && <img src={c.imageUrl || mediaUrl(c.image, "small")} alt="" loading="lazy" className="h-full w-full object-cover" />}
          </span>
          <span className="line-clamp-1 text-[13px] font-bold text-ink-soft group-hover:text-accent-dark">{c.nameAr || c.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function BrandStrip({ brands }: { brands: Brand[] }) {
  return (
    <div className="scroll-row -mx-4 px-4 md:mx-0 md:px-0">
      {brands.map((b) => (
        <Link key={b.id} href={brandHref(b.slug)} className="group w-[26%] flex-none snap-start text-center sm:w-[18%] md:w-[13%] lg:w-[10.5%]">
          <span className="mb-2 grid aspect-square place-items-center overflow-hidden rounded-full bg-white p-3 shadow-card ring-1 ring-hairline transition group-hover:-translate-y-1 group-hover:shadow-lift">
            {b.logo ? (
              <img src={mediaUrl(b.logo, "thumb")} alt={b.name} loading="lazy" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-extrabold text-accent-dark">{b.initial ?? brandLabel(b.name).slice(0, 1)}</span>
            )}
          </span>
          <span className="line-clamp-1 text-xs font-bold text-ink-soft">{brandLabel(b.name)}</span>
        </Link>
      ))}
    </div>
  );
}

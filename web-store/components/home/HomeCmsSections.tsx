import Link from "next/link";
import type { ReactNode } from "react";

import {
  BannerCarousel,
  BrandStrip,
  CareHubSection,
  CategoryGrid,
  CircleTilesSection,
  FlashSaleSection,
  ImageMarqueeSection,
  PackagesSection,
  ProductSection,
  PromoStrip,
  SectionShell,
  SkinConcernsStrip,
} from "@/components/home/HomeSections";
import { bannerLinkHref, sectionLinkHref, viewAllHref } from "@/lib/links";
import { bannerImageUrl, imageFromUnknown } from "@/lib/mediaUrl";
import type { Banner, CircleTileItem, HomeSection, Product } from "@/lib/types";

function sectionVisible(section: HomeSection): boolean {
  if (section.type === "PROMO_STRIP") {
    const strip = section.promoStrip;
    return !!(strip?.text?.trim() || strip?.items?.some((i) => i.trim()));
  }
  if (section.type === "SECTION_GROUP") {
    return (section.children ?? []).some(sectionVisible);
  }
  return !!(
    section.banners?.length ||
    section.categories?.length ||
    section.products?.length ||
    section.brands?.length ||
    section.packages?.length ||
    section.skinConcerns?.length ||
    section.items?.length
  );
}

function BannerGrid({ banners, columns }: { banners: Banner[]; columns: number }) {
  if (!banners.length) return null;
  return (
    <div className={`banner-grid cols-${columns}`}>
      {banners.map((b) => {
        const img = bannerImageUrl(b);
        const href = bannerLinkHref(b);
        const card = (
          <div className="banner-card" style={b.backgroundColor ? { background: b.backgroundColor } : undefined}>
            {img ? <img src={img} alt={b.title || "عرض"} /> : <div className="banner-fallback" />}
            {(b.title || b.subtitle) && (
              <div className="banner-caption">
                {b.title && <h2>{b.title}</h2>}
                {b.subtitle && <p>{b.subtitle}</p>}
              </div>
            )}
          </div>
        );
        return href ? (
          <a key={b.id} href={href} className="banner-link">
            {card}
          </a>
        ) : (
          <div key={b.id}>{card}</div>
        );
      })}
    </div>
  );
}

function ImageTilesSection({ section }: { section: HomeSection }) {
  const items = (section.items ?? []).filter(
    (item): item is CircleTileItem => item != null && typeof item === "object",
  );
  if (!items.length) return null;
  return (
    <SectionShell title={section.title} subtitle={section.subtitle} showTitle={section.showTitle}>
      <div className="image-tiles-grid">
        {items.map((item, idx) => {
          const img = imageFromUnknown(item.image ?? item.imageUrl);
          const href = sectionLinkHref(item);
          const tile = (
            <div className="image-tile">
              {img ? <img src={img} alt={item.title || ""} /> : <div className="banner-fallback" />}
              {item.title ? <span>{item.title}</span> : null}
            </div>
          );
          return href ? (
            <Link key={item.id || String(idx)} href={href}>
              {tile}
            </Link>
          ) : (
            <div key={item.id || String(idx)}>{tile}</div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function renderSection(section: HomeSection): ReactNode {
  const more = section.showViewAll ? viewAllHref(section.viewAllQuery) : undefined;
  const productLayout = section.layout === "carousel" ? "carousel" : "grid";

  switch (section.type) {
    case "HERO_BANNER":
      return section.banners?.length ? (
        <section className="hero-banner-wrap">
          <BannerCarousel banners={section.banners} variant="hero" />
        </section>
      ) : null;

    case "PROMO_STRIP":
      return section.promoStrip ? <PromoStrip strip={section.promoStrip} /> : null;

    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
    case "MAKEUP_CATEGORIES":
      return section.categories?.length ? (
        <CategoryGrid
          categories={section.categories}
          title={section.showTitle ? section.title ?? "الأقسام" : undefined}
          subtitle={section.subtitle}
          moreHref={more}
          variant={section.type === "MAKEUP_CATEGORIES" ? "makeup" : "grid"}
        />
      ) : null;

    case "PRODUCT_LIST":
      return section.products?.length ? (
        <ProductSection
          title={section.title ?? "منتجات"}
          subtitle={section.subtitle}
          products={section.products}
          moreHref={more}
          layout={productLayout}
        />
      ) : null;

    case "FLASH_SALE":
      return section.products?.length ? (
        <FlashSaleSection
          title={section.title ?? "عروض سريعة"}
          subtitle={section.subtitle}
          products={section.products}
          endsAt={section.endsAt}
          moreHref={more}
        />
      ) : null;

    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return section.brands?.length ? (
        <BrandStrip
          brands={section.brands}
          title={section.title ?? "البراندات"}
          subtitle={section.subtitle}
          moreHref={more ?? "/brands/"}
        />
      ) : null;

    case "PACKAGES":
    case "ROUTINE_CAROUSEL":
      return section.packages?.length ? (
        <PackagesSection
          title={section.title ?? "الباقات"}
          subtitle={section.subtitle}
          packages={section.packages}
          moreHref={more}
        />
      ) : null;

    case "CARE_HUB":
      return <CareHubSection section={section} />;

    case "BANNER_CAROUSEL":
      return section.banners?.length ? <BannerCarousel banners={section.banners} variant="carousel" /> : null;

    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      return section.banners?.length ? <BannerGrid banners={section.banners.slice(0, 1)} columns={1} /> : null;

    case "BANNER_GRID_2":
      return section.banners?.length ? <BannerGrid banners={section.banners} columns={2} /> : null;

    case "BANNER_GRID_3":
      return section.banners?.length ? <BannerGrid banners={section.banners} columns={3} /> : null;

    case "SKIN_CONCERNS":
      return section.skinConcerns?.length ? (
        <SkinConcernsStrip
          title={section.title}
          subtitle={section.subtitle}
          concerns={section.skinConcerns}
        />
      ) : null;

    case "IMAGE_TILES":
    case "MEDIA_GALLERY":
    case "PHOTO_WALL":
    case "IMAGE_COLLAGE":
      return <ImageTilesSection section={section} />;

    case "IMAGE_MARQUEE":
      return section.items?.length ? (
        <ImageMarqueeSection
          title={section.title}
          subtitle={section.subtitle}
          items={section.items}
          showTitle={section.showTitle}
        />
      ) : null;

    case "CIRCLE_TILES":
      return section.items?.length ? (
        <CircleTilesSection
          title={section.title}
          subtitle={section.subtitle}
          items={section.items}
          moreHref={more}
          showTitle={section.showTitle}
        />
      ) : section.categories?.length ? (
        <CategoryGrid
          categories={section.categories}
          title={section.showTitle ? section.title ?? undefined : undefined}
          subtitle={section.subtitle}
          moreHref={more}
          variant="grid"
        />
      ) : null;

    case "SECTION_GROUP":
      return (
        <div
          className={`section-group ${section.frameShadow !== false ? "has-shadow" : ""}`}
          style={{
            background: section.backgroundColor,
            borderColor: section.borderColor,
            borderRadius: section.borderRadius ? `${section.borderRadius}px` : undefined,
            paddingInline: section.framePaddingH ? `${section.framePaddingH}px` : undefined,
            color: section.titleColor,
          }}
        >
          {section.showTitle !== false && section.title ? (
            <div className="section-group-title">
              <h2>{section.title}</h2>
              {section.subtitle ? <p>{section.subtitle}</p> : null}
            </div>
          ) : null}
          {(section.children ?? []).filter(sectionVisible).map((child) => (
            <HomeCmsSection key={child.id} section={child} nested />
          ))}
        </div>
      );

    default:
      if (section.products?.length) {
        return (
          <ProductSection
            title={section.title ?? "منتجات"}
            subtitle={section.subtitle}
            products={section.products as Product[]}
            moreHref={more}
            layout={productLayout}
          />
        );
      }
      if (section.packages?.length) {
        return (
          <PackagesSection
            title={section.title ?? "الباقات"}
            subtitle={section.subtitle}
            packages={section.packages}
            moreHref={more}
          />
        );
      }
      return null;
  }
}

export function HomeCmsSection({ section, nested }: { section: HomeSection; nested?: boolean }) {
  if (!sectionVisible(section)) return null;
  const content = renderSection(section);
  if (!content) return null;

  const style = section.backgroundColor && section.type !== "SECTION_GROUP"
    ? { background: section.backgroundColor }
    : undefined;
  const isFullBleed =
    !nested &&
    (section.type === "HERO_BANNER" || section.type === "PROMO_STRIP" || section.type === "BANNER_CAROUSEL");

  return (
    <div className="cms-section" style={style}>
      {isFullBleed || nested ? content : <div className="container">{content}</div>}
    </div>
  );
}

export function HomeCmsSections({ sections }: { sections: HomeSection[] }) {
  const ordered = [...sections].sort((a, b) => a.position - b.position);
  return (
    <>
      {ordered.filter(sectionVisible).map((section) => (
        <HomeCmsSection key={section.id} section={section} />
      ))}
    </>
  );
}

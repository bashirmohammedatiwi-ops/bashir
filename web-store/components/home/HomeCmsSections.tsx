import Link from "next/link";
import type { ReactNode } from "react";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import {
  BannerCarousel,
  BrandStrip,
  CategoryGrid,
  FlashSaleSection,
  ProductSection,
  PromoStrip,
  SectionShell,
  SkinConcernsStrip,
} from "@/components/home/HomeSections";
import { bannerImageUrl, categoryImageUrl, imageFromUnknown } from "@/lib/mediaUrl";
import type { Banner, HomeSection, Product } from "@/lib/types";
import { categoryHref, productHref } from "@/lib/storePaths";
import { localizedName } from "@/lib/format";

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
    section.skinConcerns?.length ||
    section.items?.length
  );
}

function bannerLink(b: Banner): string | undefined {
  if (b.linkUrl) return b.linkUrl;
  if (b.link) return b.link;
  if (b.linkType === "product" && b.linkValue) return productHref(b.linkValue);
  if (b.linkType === "category" && b.linkValue) return categoryHref(b.linkValue);
  return undefined;
}

function BannerGrid({ banners, columns }: { banners: Banner[]; columns: number }) {
  if (!banners.length) return null;
  return (
    <div className={`banner-grid cols-${columns}`}>
      {banners.map((b) => {
        const img = bannerImageUrl(b);
        const href = bannerLink(b);
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
  const items = section.items ?? [];
  if (!items.length) return null;
  return (
    <SectionShell title={section.title} subtitle={section.subtitle} showTitle={section.showTitle}>
      <div className="image-tiles-grid">
        {items.map((item, idx) => {
          const img = imageFromUnknown(item.image ?? item.imageUrl);
          const href = typeof item.link === "string" ? item.link : undefined;
          const tile = (
            <div className="image-tile">
              {img ? <img src={img} alt={String(item.title ?? "")} /> : <div className="banner-fallback" />}
              {item.title ? <span>{String(item.title)}</span> : null}
            </div>
          );
          return href ? (
            <a key={String(item.id ?? idx)} href={href}>
              {tile}
            </a>
          ) : (
            <div key={String(item.id ?? idx)}>{tile}</div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function CircleTilesSection({ section }: { section: HomeSection }) {
  const items = section.categories?.length ? section.categories : (section.items as unknown as HomeSection["categories"]) ?? [];
  if (!items?.length) return null;
  return (
    <SectionShell
      title={section.title}
      subtitle={section.subtitle}
      showTitle={section.showTitle}
      moreHref={section.showViewAll ? section.viewAllQuery || "/categories/" : undefined}
    >
      <div className="circle-tiles-row">
        {items.map((c) => {
          const img = categoryImageUrl(c);
          return (
            <Link key={c.id} href={categoryHref(c.slug)} className="circle-tile">
              <div className="circle-tile-img">
                {img ? <img src={img} alt={localizedName(c)} /> : <span>{localizedName(c).slice(0, 1)}</span>}
              </div>
              <span>{localizedName(c)}</span>
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}

function renderSection(section: HomeSection): ReactNode {
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
          moreHref={section.showViewAll ? section.viewAllQuery || "/categories/" : undefined}
          variant={section.type === "MAKEUP_CATEGORIES" ? "makeup" : "grid"}
        />
      ) : null;

    case "PRODUCT_LIST":
      return section.products?.length ? (
        <ProductSection
          title={section.title ?? "منتجات"}
          subtitle={section.subtitle}
          products={section.products}
          moreHref={section.showViewAll ? section.viewAllQuery || "/products/" : undefined}
        />
      ) : null;

    case "FLASH_SALE":
      return section.products?.length ? (
        <FlashSaleSection
          title={section.title ?? "عروض سريعة"}
          subtitle={section.subtitle}
          products={section.products}
          endsAt={section.endsAt}
          moreHref={section.showViewAll ? section.viewAllQuery || "/products/" : undefined}
        />
      ) : null;

    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return section.brands?.length ? (
        <BrandStrip
          brands={section.brands}
          title={section.title ?? "البراندات"}
          subtitle={section.subtitle}
          moreHref={section.showViewAll ? section.viewAllQuery || "/brands/" : undefined}
        />
      ) : null;

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

    case "CIRCLE_TILES":
      return <CircleTilesSection section={section} />;

    case "SECTION_GROUP":
      return (
        <div className="section-group">
          {(section.children ?? []).filter(sectionVisible).map((child) => (
            <HomeCmsSection key={child.id} section={child} />
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
            moreHref={section.showViewAll ? section.viewAllQuery || "/products/" : undefined}
          />
        );
      }
      return null;
  }
}

export function HomeCmsSection({ section }: { section: HomeSection }) {
  if (!sectionVisible(section)) return null;
  const content = renderSection(section);
  if (!content) return null;

  const style = section.backgroundColor ? { background: section.backgroundColor } : undefined;
  const isFullBleed = section.type === "HERO_BANNER" || section.type === "PROMO_STRIP";

  return (
    <div className="cms-section" style={style}>
      {isFullBleed ? content : <div className="container">{content}</div>}
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

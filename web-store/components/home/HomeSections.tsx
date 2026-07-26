"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProductCarousel } from "@/components/catalog/ProductCarousel";
import { PackageCarousel } from "@/components/catalog/PackageCard";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { bannerLinkHref, sectionLinkHref, viewAllHref } from "@/lib/links";
import { bannerImageUrl, brandLogoUrl, categoryImageUrl, imageFromUnknown } from "@/lib/mediaUrl";
import type {
  Banner,
  Brand,
  Category,
  CircleTileItem,
  Product,
  PromoStrip as PromoStripType,
  StorePackage,
} from "@/lib/types";
import { localizedName } from "@/lib/format";
import { brandHref, categoryHref } from "@/lib/storePaths";
import { viewAllHref } from "@/lib/links";

function bannerHref(b: Banner): string | undefined {
  return bannerLinkHref(b);
}

export function SectionShell({
  title,
  subtitle,
  showTitle = true,
  moreHref,
  children,
  className,
}: {
  title?: string | null;
  subtitle?: string | null;
  showTitle?: boolean;
  moreHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!title && !subtitle && !children) return null;
  return (
    <section className={`section ${className ?? ""}`.trim()}>
      {(showTitle && title) || moreHref ? (
        <div className="section-head">
          <div>
            {showTitle && title ? <h2>{title}</h2> : null}
            {subtitle ? <p className="section-sub">{subtitle}</p> : null}
          </div>
          {moreHref ? <Link href={viewAllHref(moreHref)} className="section-more">عرض الكل</Link> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function BannerCarousel({
  banners,
  variant = "grid",
}: {
  banners: Banner[];
  variant?: "grid" | "carousel" | "hero";
}) {
  const [active, setActive] = useState(0);
  const items = banners.slice(0, variant === "hero" ? 6 : 8);
  if (!items.length) return null;

  useEffect(() => {
    if (variant !== "carousel" && variant !== "hero") return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length, variant]);

  if (variant === "carousel" || variant === "hero") {
    const b = items[active];
    const img = bannerImageUrl(b);
    const href = bannerHref(b);
    const slide = (
      <div className={`banner-slide ${variant}`}>
        {img ? <img src={img} alt={b.title || "عرض"} /> : <div className="banner-fallback" />}
        <div className="banner-slide-overlay">
          {b.tag ? <span className="banner-tag">{b.tag}</span> : null}
          {b.title ? <h2>{b.title}</h2> : null}
          {b.subtitle ? <p>{b.subtitle}</p> : null}
        </div>
      </div>
    );
    return (
      <section className="banner-carousel">
        {href ? <a href={href}>{slide}</a> : slide}
        {items.length > 1 ? (
          <div className="banner-dots">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={idx === active ? "is-active" : ""}
                aria-label={`شريحة ${idx + 1}`}
                onClick={() => setActive(idx)}
              />
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="banner-row">
      {items.map((b) => {
        const img = bannerImageUrl(b);
        const href = bannerHref(b);
        const inner = (
          <div className="banner-card">
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
            {inner}
          </a>
        ) : (
          <div key={b.id}>{inner}</div>
        );
      })}
    </section>
  );
}

export function CategoryGrid({
  categories,
  title,
  subtitle,
  moreHref,
  variant = "grid",
}: {
  categories: Category[];
  title?: string;
  subtitle?: string | null;
  moreHref?: string;
  variant?: "grid" | "makeup";
}) {
  if (!categories.length) return null;
  return (
    <SectionShell title={title} subtitle={subtitle} moreHref={moreHref}>
      <div className={variant === "makeup" ? "category-makeup-grid" : "category-showcase-grid"}>
        {categories.map((c) => {
          const img = categoryImageUrl(c);
          return (
            <Link key={c.id} href={categoryHref(c.slug)} className="category-card">
              <div className="category-card-media">
                {img ? <img src={img} alt={localizedName(c)} loading="lazy" /> : (
                  <div className="category-card-fallback">{localizedName(c).slice(0, 1)}</div>
                )}
              </div>
              <span>{localizedName(c)}</span>
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <CategoryGrid
      categories={categories.slice(0, 12)}
      title="الأقسام"
      moreHref="/categories/"
    />
  );
}

export function BrandStrip({
  brands,
  title = "البراندات",
  subtitle,
  moreHref = "/brands/",
}: {
  brands: Brand[];
  title?: string;
  subtitle?: string | null;
  moreHref?: string;
}) {
  if (!brands.length) return null;
  return (
    <SectionShell title={title} subtitle={subtitle} moreHref={moreHref}>
      <div className="brand-showcase-row">
        {brands.map((b) => {
          const logo = brandLogoUrl(b);
          return (
            <Link key={b.id} href={brandHref(b.slug)} className="brand-showcase-card">
              <div className="brand-showcase-logo">
                {logo ? <img src={logo} alt={localizedName(b)} loading="lazy" /> : (
                  <span>{localizedName(b).slice(0, 2)}</span>
                )}
              </div>
              <span>{localizedName(b)}</span>
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function ProductSection({
  title,
  subtitle,
  products,
  moreHref,
  layout = "grid",
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  moreHref?: string;
  layout?: "grid" | "carousel";
}) {
  if (!products.length) return null;
  return (
    <SectionShell title={title} subtitle={subtitle} moreHref={moreHref}>
      {layout === "carousel" ? <ProductCarousel products={products} /> : <ProductGrid products={products} />}
    </SectionShell>
  );
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FlashSaleSection({
  title,
  subtitle,
  products,
  endsAt,
  moreHref,
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  endsAt?: string | null;
  moreHref?: string;
}) {
  const end = useMemo(() => (endsAt ? new Date(endsAt).getTime() : 0), [endsAt]);
  const [left, setLeft] = useState(() => (end ? end - Date.now() : 0));

  useEffect(() => {
    if (!end) return;
    const tick = () => setLeft(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  if (!products.length) return null;

  return (
    <section className="flash-sale-section">
      <div className="flash-sale-head">
        <div>
          <span className="flash-badge">تخفيضات</span>
          <h2>{title}</h2>
          {subtitle ? <p className="section-sub">{subtitle}</p> : null}
        </div>
        {end > Date.now() ? <div className="flash-timer">{formatCountdown(left)}</div> : null}
        {moreHref ? <Link href={moreHref} className="section-more">عرض الكل</Link> : null}
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

export function PromoStrip({ strip }: { strip: PromoStripType }) {
  const text = strip.text?.trim() || strip.items?.filter(Boolean).join(strip.items?.length ? " · " : "") || "";
  if (!text) return null;
  const style = {
    background: strip.backgroundColor || undefined,
    color: strip.textColor || undefined,
  };
  const href = sectionLinkHref(strip);
  const inner = (
    <span className={`promo-strip-text ${strip.marquee !== false ? "is-marquee" : ""}`}>{text}</span>
  );
  return (
    <div className="promo-strip" style={style}>
      {href ? <a href={href}>{inner}</a> : inner}
    </div>
  );
}

export function SkinConcernsStrip({
  title,
  subtitle,
  concerns,
}: {
  title?: string | null;
  subtitle?: string | null;
  concerns: Array<{ id: string; name?: string; nameAr?: string; imageUrl?: string; image?: unknown }>;
}) {
  if (!concerns.length) return null;
  return (
    <SectionShell title={title ?? "اهتمامات البشرة"} subtitle={subtitle}>
      <div className="skin-concerns-row">
        {concerns.map((c) => {
          const img = imageFromUnknown(c.image ?? c.imageUrl);
          const name = c.nameAr || c.name || "";
          return (
            <div key={c.id} className="skin-concern-chip">
              {img ? <img src={img} alt={name} /> : null}
              <span>{name}</span>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function TrustBar() {
  return (
    <section className="trust-bar">
      <div className="trust-item">
        <strong>دفع عند الاستلام</strong>
        <span>اطمئني عند الاستلام</span>
      </div>
      <div className="trust-item">
        <strong>منتجات أصلية</strong>
        <span>من براندات موثوقة</span>
      </div>
      <div className="trust-item">
        <strong>توصيل سريع</strong>
        <span>لجميع المحافظات</span>
      </div>
      <div className="trust-item">
        <strong>دعم واتساب</strong>
        <span>مساعدة سريعة</span>
      </div>
    </section>
  );
}

export function PackagesSection({
  title,
  subtitle,
  packages,
  moreHref,
}: {
  title?: string;
  subtitle?: string | null;
  packages: StorePackage[];
  moreHref?: string;
}) {
  if (!packages.length) return null;
  return (
    <SectionShell title={title ?? "الباقات"} subtitle={subtitle} moreHref={moreHref}>
      <PackageCarousel packages={packages} />
    </SectionShell>
  );
}

export function CircleTilesSection({
  title,
  subtitle,
  items,
  moreHref,
  showTitle,
}: {
  title?: string | null;
  subtitle?: string | null;
  items: CircleTileItem[];
  moreHref?: string;
  showTitle?: boolean;
}) {
  if (!items.length) return null;
  return (
    <SectionShell title={title} subtitle={subtitle} showTitle={showTitle} moreHref={moreHref}>
      <div className="circle-tiles-row">
        {items.map((item) => {
          const img = imageFromUnknown(item.image ?? item.imageUrl);
          const href = sectionLinkHref(item);
          const tile = (
            <div className="circle-tile">
              <div className="circle-tile-img">
                {img ? <img src={img} alt={item.title || ""} /> : <span>{(item.title || "?").slice(0, 1)}</span>}
              </div>
              <span>{item.title}</span>
            </div>
          );
          return href ? (
            <Link key={item.id} href={href}>{tile}</Link>
          ) : (
            <div key={item.id}>{tile}</div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function ImageMarqueeSection({
  title,
  subtitle,
  items,
  showTitle,
}: {
  title?: string | null;
  subtitle?: string | null;
  items: CircleTileItem[];
  showTitle?: boolean;
}) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <SectionShell title={title} subtitle={subtitle} showTitle={showTitle}>
      <div className="image-marquee">
        <div className="image-marquee-track">
          {doubled.map((item, idx) => {
            const img = imageFromUnknown(item.image ?? item.imageUrl);
            return (
              <div key={`${item.id}-${idx}`} className="image-marquee-item">
                {img ? <img src={img} alt={item.title || ""} /> : <div className="banner-fallback" />}
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

export function CareHubSection({
  section,
}: {
  section: {
    title?: string | null;
    subtitle?: string | null;
    showTitle?: boolean;
    showViewAll?: boolean;
    viewAllQuery?: string;
    skinConcerns?: Array<{ id: string; name?: string; nameAr?: string; imageUrl?: string; image?: unknown; link?: string }>;
    categories?: Category[];
    products?: Product[];
    packages?: StorePackage[];
  };
}) {
  const moreHref = section.showViewAll ? viewAllHref(section.viewAllQuery) : undefined;
  return (
    <div className="care-hub">
      <SectionShell
        title={section.showTitle ? section.title ?? "العناية" : undefined}
        subtitle={section.subtitle}
        moreHref={moreHref}
      >
        {section.skinConcerns?.length ? (
          <SkinConcernsStrip concerns={section.skinConcerns} />
        ) : null}
        {section.categories?.length ? (
          <CategoryGrid categories={section.categories} variant="makeup" />
        ) : null}
        {section.packages?.length ? (
          <PackageCarousel packages={section.packages} />
        ) : null}
        {section.products?.length ? (
          <ProductCarousel products={section.products} />
        ) : null}
      </SectionShell>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { bannerImageUrl, brandLogoUrl, categoryImageUrl, imageFromUnknown } from "@/lib/mediaUrl";
import type { Banner, Brand, Category, Product, PromoStrip as PromoStripType } from "@/lib/types";
import { localizedName } from "@/lib/format";
import { brandHref, categoryHref } from "@/lib/storePaths";

function bannerHref(b: Banner): string | undefined {
  if (b.linkUrl) return b.linkUrl;
  if (b.link) return b.link;
  return undefined;
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
          {moreHref ? <Link href={moreHref} className="section-more">عرض الكل</Link> : null}
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
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  moreHref?: string;
}) {
  if (!products.length) return null;
  return (
    <SectionShell title={title} subtitle={subtitle} moreHref={moreHref}>
      <ProductGrid products={products} />
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
  const text = strip.text?.trim() || strip.items?.filter(Boolean).join(" · ") || "";
  if (!text) return null;
  const style = {
    background: strip.backgroundColor || undefined,
    color: strip.textColor || undefined,
  };
  const inner = <span className="promo-strip-text">{text}</span>;
  return (
    <div className="promo-strip" style={style}>
      {strip.link ? <a href={strip.link}>{inner}</a> : inner}
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

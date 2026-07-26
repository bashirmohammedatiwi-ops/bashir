import Link from "next/link";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { Banner, Brand, Category, Product } from "@/lib/types";
import { localizedName } from "@/lib/format";
import { brandHref, categoryHref } from "@/lib/storePaths";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <section className="banner-row">
      {banners.slice(0, 4).map((b) => {
        const img = resolveMediaUrl(b.image?.full || b.image?.url);
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
        return b.linkUrl ? (
          <a key={b.id} href={b.linkUrl} className="banner-link">
            {inner}
          </a>
        ) : (
          <div key={b.id}>{inner}</div>
        );
      })}
    </section>
  );
}

export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>الأقسام</h2>
        <Link href="/categories/">عرض الكل</Link>
      </div>
      <div className="chip-row">
        {categories.slice(0, 12).map((c) => (
          <Link key={c.id} href={categoryHref(c.slug)} className="chip">
            {localizedName(c)}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BrandStrip({ brands }: { brands: Brand[] }) {
  if (!brands.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>البراندات</h2>
        <Link href="/brands/">عرض الكل</Link>
      </div>
      <div className="brand-row">
        {brands.slice(0, 10).map((b) => {
          const logo = resolveMediaUrl(b.logo?.thumb || b.logo?.full || b.logo?.url);
          return (
            <Link key={b.id} href={brandHref(b.slug)} className="brand-pill">
              {logo ? <img src={logo} alt={localizedName(b)} /> : <span>{localizedName(b)}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ProductSection({ title, products, moreHref }: { title: string; products: Product[]; moreHref?: string }) {
  if (!products.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {moreHref ? <Link href={moreHref}>عرض الكل</Link> : null}
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

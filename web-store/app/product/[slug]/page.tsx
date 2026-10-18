import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/ProductView";
import { ProductRow } from "@/components/product/ProductRow";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { BoughtTogether } from "@/components/product/BoughtTogether";
import { Reviews } from "@/components/product/Reviews";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ApiError, serverTry } from "@/lib/api";
import { SITE_URL, STORE_NAME } from "@/lib/config";
import { getProduct } from "@/lib/data";
import { brandLabel, productName } from "@/lib/format";
import { brandHref, categoryHref, productHref, productsHref } from "@/lib/links";
import { mediaUrl, productCover } from "@/lib/media";
import type { Paged, Product } from "@/lib/types";

export const revalidate = 60;

async function load(slug: string) {
  try {
    return await getProduct(decodeURIComponent(slug));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return { title: "المنتج غير موجود" };
  const name = productName(p);
  const desc = (p.description ?? "").replace(/\s+/g, " ").slice(0, 160) || `${name} من ${brandLabel(p.brand?.name)} — أصلي 100% مع توصيل لكل العراق.`;
  const image = productCover(p, "large");
  return {
    title: `${name}${p.brand ? ` — ${brandLabel(p.brand.name)}` : ""}`,
    description: desc,
    alternates: { canonical: productHref(p.slug) },
    openGraph: { title: name, description: desc, images: image ? [image] : undefined, type: "website", url: productHref(p.slug) },
    twitter: { card: "summary_large_image", title: name, description: desc, images: image ? [image] : undefined },
  };
}

function Details({ p }: { p: Product }) {
  const blocks = [
    ["الوصف", p.description],
    ["طريقة الاستخدام", p.howToUse],
    ["المكونات", p.ingredients],
  ].filter(([, v]) => v && String(v).trim()) as [string, string][];
  if (!blocks.length) return null;
  return (
    <div className="card divide-y divide-hairline">
      {blocks.map(([title, body], i) => (
        <details key={title} open={i === 0} className="group p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-extrabold">
            {title}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-light text-accent-dark transition group-open:rotate-45">+</span>
          </summary>
          <p className="prose-ar mt-4">{body}</p>
        </details>
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  const [together, sameCat] = await Promise.all([
    serverTry<{ items: Product[] }>(`/products/${p.id}/bought-together`, { revalidate: 300 }),
    p.subcategory || p.category
      ? serverTry<Paged<Product>>(`/products?${p.subcategory ? `subcategoryId=${p.subcategory.id}` : `categoryId=${p.category!.id}`}&limit=14&sort=popular`, { revalidate: 300 })
      : null,
  ]);
  const related = (sameCat?.data ?? []).filter((x) => x.id !== p.id);
  const pairs = (together?.items ?? []).filter((x) => x.id !== p.id);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName(p),
    image: p.images.map((i) => mediaUrl(i.media, "large")).filter(Boolean),
    description: p.description ?? undefined,
    sku: p.sku,
    gtin13: p.barcode ?? undefined,
    brand: p.brand ? { "@type": "Brand", name: brandLabel(p.brand.name) } : undefined,
    aggregateRating: p.reviewCount > 0 ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${productHref(p.slug)}`,
      priceCurrency: "IQD",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: STORE_NAME },
    },
  };
  return (
    <div className="animate-fade-up">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { name: "الرئيسية", url: SITE_URL },
              p.category && { name: p.category.name, url: `${SITE_URL}${categoryHref(p.category.slug)}` },
              p.subcategory && { name: p.subcategory.name, url: `${SITE_URL}${categoryHref(p.subcategory.slug)}` },
              { name: productName(p), url: `${SITE_URL}${productHref(p.slug)}` },
            ]
              .filter(Boolean)
              .map((x, i) => ({ "@type": "ListItem", position: i + 1, name: (x as { name: string }).name, item: (x as { url: string }).url })),
          }),
        }}
      />
      <nav className="container flex flex-wrap items-center gap-1.5 py-4 text-sm text-ink-muted" aria-label="مسار التنقل">
        <Link href="/" className="hover:text-ink">الرئيسية</Link>
        {p.category && (
          <>
            <span>/</span>
            <Link href={categoryHref(p.category.slug)} className="hover:text-ink">{p.category.name}</Link>
          </>
        )}
        {p.subcategory && (
          <>
            <span>/</span>
            <Link href={categoryHref(p.subcategory.slug)} className="hover:text-ink">{p.subcategory.name}</Link>
          </>
        )}
        {p.brand && (
          <>
            <span>/</span>
            <Link href={brandHref(p.brand.slug)} className="hover:text-ink">{brandLabel(p.brand.name)}</Link>
          </>
        )}
      </nav>
      <section className="container">
        <ProductView product={p} />
      </section>
      <section className="container mt-10 md:mt-14">
        <Details p={p} />
      </section>
      {pairs.length > 0 && (
        <section className="container mt-10 md:mt-14">
          <BoughtTogether product={p} pairs={pairs} />
          {pairs.length > 2 && (
            <div className="mt-8">
              <SectionHeader title="يكمّله لكِ" subtitle="يُشترى عادةً مع هذا المنتج" />
              <ProductRow products={pairs} />
            </div>
          )}
        </section>
      )}
      {related.length > 0 && (
        <section className="container mt-10 md:mt-14">
          <SectionHeader
            title="قد يعجبكِ أيضاً"
            href={p.subcategory ? productsHref({ subcategoryId: p.subcategory.id, title: p.subcategory.name }) : null}
          />
          <ProductRow products={related} />
        </section>
      )}
      <section className="container mt-10 md:mt-14">
        <SectionHeader title="التقييمات" />
        <Reviews product={p} />
      </section>
      <RecentlyViewed excludeId={p.id} />
    </div>
  );
}

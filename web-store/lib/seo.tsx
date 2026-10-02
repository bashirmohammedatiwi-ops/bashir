/// أدوات SEO — بناء عناوين وبيانات منظمة (JSON-LD) وجلب وقت البناء.
/// كل الجلب محمي: فشل الـ API وقت البناء لا يكسر التصدير — يبقى الموقع يعمل.

import { API_BASE, displayStoreName, STORE_NAME_AR } from "./config";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://deemaalhayat.com").replace(/\/$/, "");

/// أصل API مطلق وقت البناء (الافتراضي النسبي يخدم المتصفح فقط).
const SEO_API_ORIGIN = (process.env.SEO_API_ORIGIN ?? SITE_URL).replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}/${path.replace(/^\//, "")}`;
}

async function seoFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SEO_API_ORIGIN}${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}

export interface SeoProductLite {
  id: string;
  slug: string;
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  stock?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  descriptionAr?: string | null;
  brand?: { name?: string | null | undefined } | null;
  // واسع عمداً — يقبل نموذج العميل ونموذج الـ API.
  images?: ReadonlyArray<Record<string, unknown> & { media?: Record<string, unknown> | null }> | null;
}

export async function fetchAllProductSlugs(limitPerPage = 100, maxPages = 20): Promise<SeoProductLite[]> {
  const all: SeoProductLite[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await seoFetch<{ items?: SeoProductLite[] }>(`/products?page=${page}&limit=${limitPerPage}&lite=1`);
    const items = batch?.items ?? [];
    all.push(...items);
    if (items.length < limitPerPage) break;
  }
  return all;
}

export async function fetchSeoProduct(slug: string): Promise<SeoProductLite | null> {
  return seoFetch<SeoProductLite>(`/products/${encodeURIComponent(slug)}`);
}

export async function fetchSeoSlugs(kind: "categories" | "brands"): Promise<Array<{ slug: string }>> {
  const data = await seoFetch<Array<{ slug: string }>>(`/${kind}?all=1&minimal=1`);
  return Array.isArray(data) ? data.filter((c) => c?.slug) : [];
}

export function productName(p: SeoProductLite): string {
  return p.nameAr || p.nameEn || p.name || p.slug;
}

/// رابط صورة المنتج الأولى (مطلق للـ JSON-LD).
export function productImage(p: SeoProductLite): string | null {
  const first = p.images?.[0] as { media?: { url?: unknown } | null; url?: unknown } | undefined;
  const raw = (first?.media?.url ?? first?.url ?? null) as string | null;
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `${SEO_API_ORIGIN}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

/// Product JSON-LD — يقرأه جوجل لعرض السعر/التوفر بالنتائج.
export function productJsonLd(p: SeoProductLite): Record<string, unknown> {
  const inStock = (p.stock ?? 0) > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName(p),
    sku: p.id,
    description: p.descriptionAr?.slice(0, 300) ?? undefined,
    image: productImage(p) ?? undefined,
    brand: p.brand?.name ? { "@type": "Brand", name: p.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`product/?slug=${encodeURIComponent(p.slug)}`),
      priceCurrency: "IQD",
      price: p.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(p.rating && (p.reviewCount ?? 0) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.rating,
            reviewCount: p.reviewCount,
          },
        }
      : {}),
  };
}

/// Organization JSON-LD — هوية المتجر بالبحث.
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: STORE_NAME_AR,
    alternateName: displayStoreName("en"),
    url: SITE_URL,
    logo: absoluteUrl("logo.png"),
    description:
      "متجر ديما الحياة لمستحضرات التجميل والعناية في العراق — مكياج، عناية بالبشرة والشعر، عطور، مع الدفع عند الاستلام.",
    currenciesAccepted: "IQD",
    paymentAccepted: "Cash on delivery",
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD من بيانات المتجر نفسه (لا مدخلات مستخدم).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

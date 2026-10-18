import type { MetadataRoute } from "next";
import { serverTry } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { getBrands, getCategories } from "@/lib/data";
import type { BeautyPackage, Category, Paged, Product, SkinConcern } from "@/lib/types";

export const dynamic = "force-dynamic";

/** خريطة الموقع: الصفحات الثابتة، الأقسام، البراندات، الباقات، الدليل، والمنتجات المتوفرة. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${SITE_URL}${p}`;
  const now = new Date();
  const [cats, brands, packs, concerns] = await Promise.all([
    getCategories(),
    getBrands(),
    serverTry<BeautyPackage[]>("/packages", { revalidate: 3600 }),
    serverTry<SkinConcern[]>("/skin-concerns", { revalidate: 3600 }),
  ]);
  const flat: Category[] = [];
  const walk = (l: Category[]) => l.forEach((c) => (flat.push(c), walk(c.children ?? [])));
  walk(cats);

  // المنتجات: صفحات من 100 (حد الـ API) حتى 6,000 منتج.
  const products: Product[] = [];
  for (let page = 1; page <= 60; page++) {
    const r = await serverTry<Paged<Product>>(`/products?page=${page}&limit=100&lite=1&inStock=1`, { revalidate: 3600 });
    if (!r?.data?.length) break;
    products.push(...r.data);
    if (!r.meta.hasNext) break;
  }

  return [
    { url: u("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["/offers", "/categories", "/brands", "/packages", "/skin-guide", "/skin-quiz", "/products", "/gifts", "/advisor", "/help", "/about"].map((p) => ({ url: u(p), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...flat.filter((c) => (c.productCount ?? 1) > 0).map((c) => ({ url: u(`/category/${c.slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
    ...brands.filter((b) => (b.productCount ?? 0) > 0).map((b) => ({ url: u(`/brand/${b.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(packs ?? []).map((p) => ({ url: u(`/package/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(concerns ?? []).map((c) => ({ url: u(`/skin-guide/${c.slug}`), changeFrequency: "monthly" as const, priority: 0.5 })),
    ...products.map((p) => ({ url: u(`/product/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...["/privacy", "/terms", "/en/privacy", "/en/terms"].map((p) => ({ url: u(p), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}

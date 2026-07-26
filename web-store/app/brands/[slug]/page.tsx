import { BrandDetailClient } from "./BrandDetailClient";

export async function generateStaticParams() {
  try {
    const { fetchAllBrandSlugs } = await import("@/lib/api");
    const slugs = await fetchAllBrandSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default function BrandDetailPage({ params }: { params: { slug: string } }) {
  return <BrandDetailClient slug={params.slug} />;
}

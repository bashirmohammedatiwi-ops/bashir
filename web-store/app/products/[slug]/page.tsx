import { ProductDetailClient } from "./ProductDetailClient";

export async function generateStaticParams() {
  try {
    const { fetchAllProductSlugs } = await import("@/lib/api");
    const slugs = await fetchAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}

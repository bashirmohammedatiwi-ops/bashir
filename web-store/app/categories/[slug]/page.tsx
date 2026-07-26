import { CategoryDetailClient } from "./CategoryDetailClient";

export async function generateStaticParams() {
  try {
    const { fetchAllCategorySlugs } = await import("@/lib/api");
    const slugs = await fetchAllCategorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  return <CategoryDetailClient slug={params.slug} />;
}

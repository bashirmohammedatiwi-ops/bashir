import { CategoryDetailView } from "@/components/catalog/CategoryDetailView";
import { SlugQueryPage } from "@/components/catalog/SlugQueryPage";

export default function CategoryPage() {
  return <SlugQueryPage render={(slug) => <CategoryDetailView slug={slug} />} />;
}

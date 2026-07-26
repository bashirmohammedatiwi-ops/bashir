import { BrandDetailView } from "@/components/catalog/BrandDetailView";
import { SlugQueryPage } from "@/components/catalog/SlugQueryPage";

export default function BrandPage() {
  return <SlugQueryPage render={(slug) => <BrandDetailView slug={slug} />} />;
}

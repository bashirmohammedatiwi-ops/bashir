import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import { SlugQueryPage } from "@/components/catalog/SlugQueryPage";

export default function ProductPage() {
  return <SlugQueryPage render={(slug) => <ProductDetailView slug={slug} />} />;
}

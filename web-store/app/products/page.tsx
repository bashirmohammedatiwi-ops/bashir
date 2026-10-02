import { ProductsPageView } from "./ProductsPageView";

export const metadata = {
  title: "كل المنتجات",
  description: "تصفّحي كل منتجات التجميل والعناية مع أسعار بالدينار العراقي.",
  alternates: { canonical: "/products/" },
};

export default function Page() {
  return <ProductsPageView />;
}

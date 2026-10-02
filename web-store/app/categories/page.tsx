import { CategoriesPageView } from "./CategoriesPageView";

export const metadata = {
  title: "الفئات",
  description: "تسوّقي حسب الفئة — مكياج، عناية بالبشرة، العناية بالشعر والعطور.",
  alternates: { canonical: "/categories/" },
};

export default function Page() {
  return <CategoriesPageView />;
}

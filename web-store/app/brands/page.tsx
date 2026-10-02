import { BrandsPageView } from "./BrandsPageView";

export const metadata = {
  title: "البراندات",
  description: "اكتشفي كل براندات التجميل والعناية المتوفرة لدينا.",
  alternates: { canonical: "/brands/" },
};

export default function Page() {
  return <BrandsPageView />;
}

import { OffersPageView } from "./OffersPageView";

export const metadata = {
  title: "العروض",
  description: "أقوى عروض وخصومات مستحضرات التجميل اليوم — وفّري أكثر.",
  alternates: { canonical: "/offers/" },
};

export default function Page() {
  return <OffersPageView />;
}

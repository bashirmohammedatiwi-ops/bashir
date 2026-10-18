import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { legalPageCopy, legalPath, termsSections } from "@/lib/legal";

const copy = legalPageCopy.terms.en;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
  alternates: { canonical: legalPath("terms", "en"), languages: { ar: legalPath("terms", "ar"), en: legalPath("terms", "en") } },
};

export default function Page() {
  return <LegalDocument lang="en" variant="terms" sections={termsSections.en} />;
}

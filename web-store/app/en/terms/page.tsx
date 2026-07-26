import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { legalPageCopy, termsSections } from "@/lib/legal";

const copy = legalPageCopy.terms.en;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
  alternates: {
    languages: {
      ar: "/terms/",
      en: "/en/terms/",
    },
  },
};

export default function TermsPageEn() {
  return <LegalDocument lang="en" variant="terms" sections={termsSections.en} />;
}

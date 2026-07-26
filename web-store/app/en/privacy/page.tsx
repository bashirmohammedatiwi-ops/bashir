import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { legalPageCopy, privacySections } from "@/lib/legal";

const copy = legalPageCopy.privacy.en;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
  alternates: {
    languages: {
      ar: "/privacy/",
      en: "/en/privacy/",
    },
  },
};

export default function PrivacyPageEn() {
  return <LegalDocument lang="en" variant="privacy" sections={privacySections.en} />;
}

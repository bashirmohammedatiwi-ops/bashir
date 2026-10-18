import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { legalPageCopy, legalPath, privacySections } from "@/lib/legal";

const copy = legalPageCopy.privacy.ar;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
  alternates: { canonical: legalPath("privacy", "ar"), languages: { ar: legalPath("privacy", "ar"), en: legalPath("privacy", "en") } },
};

export default function Page() {
  return <LegalDocument lang="ar" variant="privacy" sections={privacySections.ar} />;
}

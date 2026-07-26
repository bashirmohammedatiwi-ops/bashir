import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_UPDATED, privacySectionsAr } from "@/lib/legal";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لمتجر ديما الحياة — كيف نجمع بياناتك ونحميها",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      variant="privacy"
      title="سياسة الخصوصية"
      updated={LEGAL_UPDATED}
      sections={privacySectionsAr}
    />
  );
}

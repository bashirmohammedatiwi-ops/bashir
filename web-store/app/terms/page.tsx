import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_UPDATED, termsSectionsAr } from "@/lib/legal";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط استخدام متجر ديما الحياة",
};

export default function TermsPage() {
  return (
    <LegalDocument
      variant="terms"
      title="شروط الاستخدام"
      updated={LEGAL_UPDATED}
      sections={termsSectionsAr}
    />
  );
}

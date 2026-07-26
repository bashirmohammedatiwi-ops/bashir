import type { Metadata } from "next";

import { LEGAL_UPDATED, termsOfServiceAr } from "@/lib/legal";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط استخدام متجر ديما الحياة",
};

export default function TermsPage() {
  return (
    <article className="legal-page">
      <h1>شروط الاستخدام</h1>
      <p className="updated">آخر تحديث: {LEGAL_UPDATED}</p>
      <div className="body">{termsOfServiceAr}</div>
    </article>
  );
}

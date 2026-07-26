import type { Metadata } from "next";

import { LEGAL_UPDATED, privacyPolicyAr } from "@/lib/legal";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لمتجر ديما الحياة",
};

export default function PrivacyPage() {
  return (
    <article className="legal-page">
      <h1>سياسة الخصوصية</h1>
      <p className="updated">آخر تحديث: {LEGAL_UPDATED}</p>
      <div className="body">{privacyPolicyAr}</div>
    </article>
  );
}

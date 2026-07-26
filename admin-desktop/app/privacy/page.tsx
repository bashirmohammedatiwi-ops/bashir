import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — ديما الحياة",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
      <h1>سياسة الخصوصية</h1>
      <p>
        تم نقل سياسة الخصوصية إلى موقع المتجر:
      </p>
      <p>
        <a href="/privacy/">فتح سياسة الخصوصية على deemaalhayat.com</a>
      </p>
      <p>
        <a href="/admin/">العودة للوحة التحكم</a>
      </p>
    </main>
  );
}

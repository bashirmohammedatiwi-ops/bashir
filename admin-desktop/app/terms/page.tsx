import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الاستخدام — ديما الحياة",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
      <h1>شروط الاستخدام</h1>
      <p>
        تم نقل شروط الاستخدام إلى موقع المتجر:
      </p>
      <p>
        <a href="/terms/">فتح شروط الاستخدام على deemaalhayat.com</a>
      </p>
      <p>
        <a href="/admin/">العودة للوحة التحكم</a>
      </p>
    </main>
  );
}

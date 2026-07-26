import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — ديما الحياة",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
      <h1>سياسة الخصوصية</h1>
      <p>آخر تحديث: يوليو 2026</p>
      <p>
        نحن في ديما الحياة نحترم خصوصيتك. نجمع الاسم ورقم الهاتف والعناوين وسجل الطلبات لتقديم الخدمة.
        لا نبيع بياناتك الشخصية. يمكنك حذف حسابك من تطبيق الهاتف (حسابي → حذف الحساب).
      </p>
      <p>
        للتواصل: <a href="mailto:support@deemaalhayat.com">support@deemaalhayat.com</a>
      </p>
      <p>
        <a href="/">العودة للوحة التحكم</a>
      </p>
    </main>
  );
}

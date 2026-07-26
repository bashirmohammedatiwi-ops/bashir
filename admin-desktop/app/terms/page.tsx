import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الاستخدام — ديما الحياة",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
      <h1>شروط الاستخدام</h1>
      <p>آخر تحديث: يوليو 2026</p>
      <p>
        باستخدام موقع وتطبيق ديما الحياة فإنك توافق على تقديم معلومات صحيحة واستخدام الخدمة للتسوق الشخصي.
        الطلبات تُؤكَّد عبر الهاتف. الدفع عند الاستلام ما لم يُفعَّل الدفع الإلكتروني لاحقاً.
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

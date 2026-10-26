"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHydrated } from "@/components/Providers";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { formatPhoneLocal } from "@/lib/phone";
import { useAuth } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/ui";

const CONFIRM_WORD = "حذف";

/** ما يُحذف وما يبقى — مطابق لـ AuthService.deleteAccount في السيرفر. */
const removed = [
  "الاسم ورقم الهاتف والبريد وكلمة المرور وصورة الحساب",
  "العناوين المحفوظة (تُمسح بياناتها)",
  "المفضلة والإشعارات ونقاط الولاء وسجلها",
  "تسجيلات الدخول على كل الأجهزة",
];
const kept = [
  "سجل الطلبات السابقة بلا اسمكِ أو رقمكِ — تبقى للفواتير والمحاسبة كما يلزم القانون",
  "تقييماتكِ للمنتجات تبقى باسم «مستخدم محذوف»",
];

export function DeleteAccountPanel({ whatsapp, phone }: { whatsapp: string | null; phone: string | null }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (word.trim() !== CONFIRM_WORD) return;
    setBusy(true);
    try {
      await api("/auth/me", { method: "DELETE" });
      await logout();
      toast({ text: "تم حذف حسابكِ", tone: "success" });
      router.replace("/");
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5 md:p-6">
        <h2 className="font-extrabold">ماذا يحدث عند الحذف؟</h2>
        <p className="mt-2 text-sm leading-7 text-ink-muted">الحذف نهائي ويتم فوراً، ولا يمكن استرجاع الحساب بعده.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-extrabold text-sale">يُحذف</p>
            <ul className="space-y-2 text-sm leading-6 text-ink-soft">
              {removed.map((t) => (
                <li key={t} className="flex gap-2">
                  <Icon name="trash" size={16} className="mt-1 flex-none text-sale" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-extrabold text-ink-muted">يبقى بلا بيانات شخصية</p>
            <ul className="space-y-2 text-sm leading-6 text-ink-soft">
              {kept.map((t) => (
                <li key={t} className="flex gap-2">
                  <Icon name="box" size={16} className="mt-1 flex-none text-ink-muted" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="font-extrabold">احذفي حسابكِ من هنا</h2>
        {!hydrated ? (
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-canvas" />
        ) : user ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-7 text-ink-soft">
              الحساب المسجّل: <b dir="ltr">{formatPhoneLocal(user.phone) || user.email}</b>
              {user.name ? ` — ${user.name}` : ""}
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">للتأكيد اكتبي كلمة «{CONFIRM_WORD}»</span>
              <input value={word} onChange={(e) => setWord(e.target.value)} className="field" autoComplete="off" />
            </label>
            <button onClick={remove} disabled={busy || word.trim() !== CONFIRM_WORD} className="btn-primary h-11 bg-sale hover:bg-sale disabled:opacity-50">
              <Icon name="trash" size={16} /> {busy ? "جارٍ الحذف…" : "حذف حسابي نهائياً"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-7 text-ink-soft">سجّلي الدخول برقم هاتفكِ أولاً، ثم ارجعي لهذه الصفحة لحذف الحساب.</p>
            <Link href="/signin?next=/delete-account" className="btn-primary h-11">
              <Icon name="user" size={16} /> تسجيل الدخول للحذف
            </Link>
          </div>
        )}
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="font-extrabold">طرق أخرى</h2>
        <ul className="mt-3 space-y-3 text-sm leading-7 text-ink-soft">
          <li>
            <b>من التطبيق:</b> حسابي ← حذف الحساب (أسفل الصفحة).
          </li>
          <li>
            <b>بطلب لخدمة العملاء:</b> أرسلي لنا رقم الهاتف المسجّل وطلب الحذف، ونحذف الحساب خلال 7 أيام بعد التأكد من أنكِ صاحبة الرقم.
          </li>
        </ul>
        {(whatsapp || phone) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("أريد حذف حسابي في ديما الحياة")}`} target="_blank" rel="noopener noreferrer" className="btn-soft h-11">
                <Icon name="chat" size={16} /> واتساب
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="btn-soft h-11" dir="ltr">
                <Icon name="phone" size={16} /> {phone}
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

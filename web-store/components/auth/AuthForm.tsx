"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLoyaltyRules } from "../Providers";
import { arPoints } from "@/lib/format";
import { isValidIraqiPhone, normalizePhone } from "@/lib/phone";
import { useAuth } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/ui";
import { Icon } from "../ui/Icon";

/** الدخول وإنشاء الحساب برقم الهاتف — ثم العودة للصفحة السابقة (?next=). */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") && sp.get("next")!.startsWith("/") && !sp.get("next")!.startsWith("//") ? sp.get("next")! : "/account";
  const { login, register, user, ready } = useAuth();
  const rules = useLoyaltyRules();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && name.trim().length < 2) return setError("اكتبي اسمكِ (حرفان على الأقل)");
    if (!isValidIraqiPhone(phone)) return setError("رقم الهاتف غير صحيح — مثال: 07701234567");
    if (password.length < (mode === "register" ? 6 : 1)) return setError(mode === "register" ? "كلمة المرور 6 أحرف على الأقل" : "اكتبي كلمة المرور");
    setBusy(true);
    try {
      if (mode === "login") await login(normalizePhone(phone), password);
      else await register(name.trim(), normalizePhone(phone), password);
      toast({ text: mode === "login" ? "أهلاً بعودتكِ 💜" : "تم إنشاء حسابكِ — أهلاً بكِ في ديما 💜", tone: "success" });
      router.replace(next);
    } catch (err) {
      const msg = (err as Error).message;
      setError(/401|غير صحيح|Invalid|credentials/i.test(msg) || msg.includes("انتهت الجلسة") ? "رقم الهاتف أو كلمة المرور غير صحيحة" : msg);
    } finally {
      setBusy(false);
    }
  };

  const other = mode === "login" ? "/signup" : "/signin";
  return (
    <div className="container grid min-h-[70vh] place-items-center py-8 md:py-14">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[32px] bg-surface shadow-lift md:grid-cols-2">
        <div className="relative hidden flex-col justify-end overflow-hidden bg-gradient-to-br from-accent to-accent-dark p-10 text-white md:flex">
          <span className="absolute -left-10 -top-10 text-[180px] opacity-20">💄</span>
          <h2 className="text-3xl font-extrabold leading-snug">{mode === "login" ? "أهلاً بعودتكِ" : "انضمي لعائلة ديما"}</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              ["gift", rules.firstOrderBonus ? `${arPoints(rules.firstOrderBonus)} هدية مع أول طلب` : "نقاط ولاء مع كل طلب"],
              ["heart", "احفظي المفضلة ونبّهكِ إن انخفض السعر"],
              ["truck", "تتبّعي طلباتكِ خطوة بخطوة"],
              ["sparkle", "اختبار البشرة وروتين مخصص لكِ"],
            ].map(([i, t]) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
                  <Icon name={i as "gift"} size={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6 md:p-10" noValidate>
          <div>
            <h1 className="text-2xl font-extrabold">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
            <p className="mt-1 text-sm text-ink-muted">{mode === "login" ? "بنفس حسابكِ في تطبيق ديما" : "خلال ثوانٍ — برقم هاتفكِ فقط"}</p>
          </div>
          {mode === "register" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">الاسم</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="field" autoComplete="name" placeholder="اسمكِ الكريم" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">رقم الهاتف</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field text-left tracking-wider" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXXX" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">كلمة المرور</span>
            <span className="relative block">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} className="field pe-12" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              <button type="button" onClick={() => setShow(!show)} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted" aria-label={show ? "إخفاء" : "إظهار"}>
                <Icon name={show ? "eyeOff" : "eye"} size={20} />
              </button>
            </span>
          </label>
          {error && <p className="rounded-2xl bg-rose-soft px-4 py-3 text-sm font-bold text-sale">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "لحظة…" : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
          <p className="text-center text-sm text-ink-soft">
            {mode === "login" ? "ليس لديكِ حساب؟ " : "لديكِ حساب؟ "}
            <Link href={`${other}${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-accent-dark hover:underline">
              {mode === "login" ? "أنشئي حساباً" : "سجّلي الدخول"}
            </Link>
          </p>
          {mode === "register" && (
            <p className="text-center text-xs text-ink-muted">
              بإنشاء الحساب توافقين على{" "}
              <Link href="/terms" className="underline">
                الشروط
              </Link>{" "}
              و
              <Link href="/privacy" className="underline">
                سياسة الخصوصية
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

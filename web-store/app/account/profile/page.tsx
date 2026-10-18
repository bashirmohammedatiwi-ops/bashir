"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatPhoneLocal } from "@/lib/phone";
import { useAuth } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/ui";

export default function ProfilePage() {
  const { user, loadMe } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState<"" | "name" | "pass">("");

  const saveName = async () => {
    if (name.trim().length < 2) return toast({ text: "الاسم حرفان على الأقل", tone: "error" });
    setBusy("name");
    try {
      await api("/auth/me", { method: "PATCH", body: { name: name.trim() } });
      await loadMe();
      toast({ text: "تم حفظ الاسم", tone: "success" });
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
    } finally {
      setBusy("");
    }
  };

  const savePass = async () => {
    if (next.length < 6) return toast({ text: "كلمة المرور الجديدة 6 أحرف على الأقل", tone: "error" });
    setBusy("pass");
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: cur, newPassword: next } });
      setCur("");
      setNext("");
      toast({ text: "تم تغيير كلمة المرور", tone: "success" });
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">الحساب والأمان</h1>
      <div className="card space-y-4 p-5 md:p-6">
        <h2 className="font-extrabold">بياناتي</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">الاسم</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">رقم الهاتف</span>
          <input value={formatPhoneLocal(user?.phone)} disabled className="field bg-canvas text-left text-ink-muted" dir="ltr" />
          <span className="mt-1 block text-xs text-ink-muted">لتغيير الرقم تواصلي مع خدمة العملاء</span>
        </label>
        <button onClick={saveName} disabled={busy === "name" || name.trim() === user?.name} className="btn-primary h-11">
          {busy === "name" ? "…" : "حفظ"}
        </button>
      </div>
      <div className="card space-y-4 p-5 md:p-6">
        <h2 className="font-extrabold">تغيير كلمة المرور</h2>
        <input value={cur} onChange={(e) => setCur(e.target.value)} type="password" className="field" placeholder="كلمة المرور الحالية" autoComplete="current-password" />
        <input value={next} onChange={(e) => setNext(e.target.value)} type="password" className="field" placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)" autoComplete="new-password" />
        <button onClick={savePass} disabled={busy === "pass" || !cur || !next} className="btn-soft h-11">
          {busy === "pass" ? "…" : "تغيير كلمة المرور"}
        </button>
      </div>
    </div>
  );
}

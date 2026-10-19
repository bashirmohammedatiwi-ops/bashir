"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useAddresses, useZones } from "@/lib/hooks/delivery";
import { formatPhoneLocal, isValidIraqiPhone, normalizePhone } from "@/lib/phone";
import { useAuth } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/ui";
import type { Address } from "@/lib/types";

type Draft = { id?: string; fullName: string; phone: string; governorate: string; area: string; street: string; house: string; notes: string; isDefault: boolean };

function AddressModal({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const qc = useQueryClient();
  const zones = useZones().data ?? [];
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zone = zones.find((z) => z.governorate === d.governorate);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setD((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value, ...(k === "governorate" ? { area: "" } : {}) }));

  const save = async () => {
    if (d.fullName.trim().length < 2) return setError("اكتبي اسم المستلمة");
    if (!isValidIraqiPhone(d.phone)) return setError("رقم الهاتف غير صحيح");
    if (!d.governorate) return setError("اختاري المحافظة");
    if (d.street.trim().length < 3) return setError("اكتبي الشارع وأقرب نقطة دالة");
    setBusy(true);
    try {
      const body = {
        fullName: d.fullName.trim(),
        phone: normalizePhone(d.phone),
        city: d.area || d.governorate,
        governorate: d.governorate,
        area: d.area || null,
        street: d.street.trim(),
        house: d.house.trim() || null,
        notes: d.notes.trim() || null,
        isDefault: d.isDefault,
      };
      if (d.id) await api(`/addresses/${d.id}`, { method: "PATCH", body });
      else await api("/addresses", { method: "POST", body });
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast({ text: "تم حفظ العنوان", tone: "success" });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/40 md:items-center md:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-surface p-6 animate-fade-up md:rounded-[32px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{d.id ? "تعديل العنوان" : "عنوان جديد"}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-canvas" aria-label="إغلاق">
            <Icon name="close" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={d.fullName} onChange={set("fullName")} className="field" placeholder="اسم المستلمة" />
          <input value={d.phone} onChange={set("phone")} className="field text-left" dir="ltr" inputMode="tel" placeholder="07XX XXX XXXX" />
          <select value={d.governorate} onChange={set("governorate")} className="field">
            <option value="">المحافظة</option>
            {zones.map((z) => (
              <option key={z.id} value={z.governorate}>
                {z.governorate}
              </option>
            ))}
          </select>
          {zone?.areas?.length ? (
            <select value={d.area} onChange={set("area")} className="field">
              <option value="">المنطقة (اختياري)</option>
              {zone.areas.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                  {a.fee != null ? ` — ${formatPrice(a.fee)}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input value={d.area} onChange={set("area")} className="field" placeholder="المنطقة (اختياري)" />
          )}
          <input value={d.street} onChange={set("street")} className="field sm:col-span-2" placeholder="الشارع وأقرب نقطة دالة" />
          <input value={d.house} onChange={set("house")} className="field" placeholder="رقم الدار (اختياري)" />
          <input value={d.notes} onChange={set("notes")} className="field" placeholder="ملاحظات (اختياري)" />
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input type="checkbox" checked={d.isDefault} onChange={set("isDefault")} className="h-5 w-5 accent-[rgb(var(--accent-dark))]" /> العنوان الافتراضي
          </label>
        </div>
        {error && <p className="mt-3 rounded-2xl bg-rose-soft px-4 py-2.5 text-sm font-bold text-sale">{error}</p>}
        <button onClick={save} disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "…" : "حفظ العنوان"}
        </button>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const user = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const list = useAddresses();
  const [edit, setEdit] = useState<Draft | null>(null);
  const blank: Draft = { fullName: user.name ?? "", phone: formatPhoneLocal(user.phone), governorate: "", area: "", street: "", house: "", notes: "", isDefault: !list.data?.length };
  const toDraft = (a: Address): Draft => ({
    id: a.id,
    fullName: a.fullName,
    phone: formatPhoneLocal(a.phone),
    governorate: a.governorate ?? a.city ?? "",
    area: a.area ?? "",
    street: a.street ?? "",
    house: a.house ?? "",
    notes: a.notes ?? "",
    isDefault: !!a.isDefault,
  });
  const remove = async (a: Address) => {
    if (!confirm("حذف هذا العنوان؟")) return;
    try {
      await api(`/addresses/${a.id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">عناويني</h1>
        <button onClick={() => setEdit(blank)} className="btn-primary h-11 px-5 text-sm">
          <Icon name="plus" size={18} /> عنوان جديد
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {list.isLoading ? (
          <Skeleton className="h-32" />
        ) : list.data?.length ? (
          list.data.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-center gap-2">
                <Icon name="location" size={18} className="text-accent-dark" />
                <b>{a.governorate}</b>
                {a.area && <span className="text-ink-soft">— {a.area}</span>}
                {a.isDefault && <span className="ms-auto rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-bold text-accent-dark">الافتراضي</span>}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{[a.street, a.house].filter(Boolean).join("، ")}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {a.fullName} • <span dir="ltr">{formatPhoneLocal(a.phone)}</span>
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEdit(toDraft(a))} className="chip">
                  تعديل
                </button>
                <button onClick={() => remove(a)} className="chip text-sale">
                  <Icon name="trash" size={14} /> حذف
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-10 text-center sm:col-span-2">
            <p className="font-bold">لا عناوين محفوظة</p>
            <p className="mt-1 text-sm text-ink-muted">أضيفي عنواناً ليصبح الدفع أسرع</p>
          </div>
        )}
      </div>
      {edit && <AddressModal initial={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SkinConcern } from "@/lib/types";
import { useEffect, useState } from "react";
import { DeemaButton } from "@/components/advisor/DeemaButton";
import { Icon } from "@/components/ui/Icon";
import { useAdvisor } from "@/lib/advisor";
import { SKIN, loadSkin, saveSkin, type SkinProfile, type SkinType } from "@/lib/skin";
import { formatDate } from "@/lib/format";
import { concernHref } from "@/lib/links";

export default function BeautyProfilePage() {
  const [quiz, setQuiz] = useState<SkinProfile | null>(null);
  const { profile, clearProfile } = useAdvisor();
  useEffect(() => setQuiz(loadSkin()), []);
  const type = (quiz?.skinType ?? profile.skinType) as SkinType | undefined;
  const t = type ? SKIN[type] : null;
  const guide = useQuery({ queryKey: ["skin-concerns"], queryFn: () => api<SkinConcern[]>("/skin-concerns", { auth: false }) });
  const NAMES: Record<string, string> = { acne: "حب الشباب", pigment: "التصبغات", aging: "التجاعيد", dryness: "الجفاف", sensitivity: "الحساسية", pores: "المسام", dark_circles: "الهالات", oil: "الدهون واللمعان", redness: "الاحمرار" };
  const concernsRaw = [...new Set([...(quiz?.concerns ?? []), ...(profile.concerns ?? [])])];
  const concerns = concernsRaw.map((c) => {
    const g = guide.data?.find((x) => x.slug === c || x.slug.startsWith(c));
    return { key: c, name: g?.name ?? NAMES[c] ?? c, href: g ? concernHref(g.slug) : null };
  });
  const rows: [string, string[] | undefined][] = [
    ["الشعر", profile.hairConcerns],
    ["ذوقكِ بالعطور", profile.families],
    ["تتجنّبين", profile.avoid],
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">ملف بشرتي 🌸</h1>
      {t ? (
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent to-accent-dark p-6 text-white shadow-lift">
          <span className="absolute -left-4 -top-6 text-[120px] opacity-25">{t.emoji}</span>
          <p className="text-sm opacity-85">نوع بشرتكِ</p>
          <p className="text-3xl font-extrabold">بشرة {t.label}</p>
          <p className="mt-2 max-w-lg text-sm leading-7 opacity-95">{t.blurb}</p>
          {quiz?.takenAt && <p className="mt-2 text-xs opacity-75">من اختبار البشرة • {formatDate(quiz.takenAt)}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/skin-quiz" className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/30" onClick={() => saveSkin(null)}>
              ↻ أعيدي الاختبار
            </Link>
            <DeemaButton q="روتين عناية لبشرتي" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-accent-dark">
              روتيني مع ديما
            </DeemaButton>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-extrabold">ما نعرف نوع بشرتكِ بعد</p>
          <p className="mt-1 text-sm text-ink-muted">4 أسئلة فقط ونرشّحلكِ روتين الصباح والمساء</p>
          <Link href="/skin-quiz" className="btn-primary mt-4">
            ابدئي اختبار البشرة
          </Link>
        </div>
      )}
      {concerns.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-extrabold">مشاكل تهمّكِ</h2>
          <div className="flex flex-wrap gap-2">
            {concerns.map((c) =>
              c.href ? (
                <Link key={c.key} href={c.href} className="chip">
                  {c.name} <Icon name="chevronLeft" size={14} />
                </Link>
              ) : (
                <span key={c.key} className="chip">
                  {c.name}
                </span>
              ),
            )}
          </div>
        </div>
      )}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">ما تعلّمته ديما عنكِ</h2>
          {Object.keys(profile).length > 0 && (
            <button onClick={clearProfile} className="text-xs font-bold text-sale hover:underline">
              مسح
            </button>
          )}
        </div>
        {rows.some(([, v]) => v?.length) ? (
          <dl className="space-y-2 text-sm">
            {rows
              .filter(([, v]) => v?.length)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 rounded-2xl bg-canvas px-3 py-2">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-bold">{v!.join("، ")}</dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className="text-sm text-ink-muted">احكي مع ديما عن شعركِ أو عطوركِ المفضلة وتحفظها هنا لترشيحات أدق. الملف يبقى على جهازكِ فقط.</p>
        )}
      </div>
    </div>
  );
}

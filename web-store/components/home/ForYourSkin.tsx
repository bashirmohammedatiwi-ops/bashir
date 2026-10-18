"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeemaOrb } from "../advisor/AdvisorChat";
import { RoutineCard } from "../advisor/AdvisorCards";
import { useHydrated } from "../Providers";
import { useAdvisor, type Reply } from "@/lib/advisor";
import { api } from "@/lib/api";
import { SKIN, loadSkin, type SkinType } from "@/lib/skin";

/** «روتينكِ المقترح» في الرئيسية: من نتيجة اختبار البشرة أو ما تعلّمته ديما. */
export function ForYourSkin() {
  const hydrated = useHydrated();
  const advisorProfile = useAdvisor((s) => s.profile);
  const { setOpen, start } = useAdvisor();
  const [quiz, setQuiz] = useState<ReturnType<typeof loadSkin>>(null);
  useEffect(() => setQuiz(loadSkin()), []);
  const skinType = (quiz?.skinType ?? advisorProfile.skinType) as SkinType | undefined;
  const concerns = quiz?.concerns?.length ? quiz.concerns : advisorProfile.concerns ?? [];
  const q = useQuery({
    queryKey: ["for-skin", skinType, concerns.join(",")],
    enabled: hydrated && !!skinType,
    staleTime: 30 * 60_000,
    queryFn: () => api<Reply>("/advisor/chat", { method: "POST", auth: false, body: { message: "روتين عناية لبشرتي", profile: { ...advisorProfile, skinType, concerns } } }),
  });
  if (!hydrated || !skinType || !q.data?.routine?.steps?.length) return null;
  const t = SKIN[skinType];
  return (
    <section className="container py-6 md:py-10">
      <div className="grid items-start gap-5 rounded-[32px] bg-gradient-to-l from-accent-light via-surface to-accent-light p-5 ring-1 ring-accent/15 md:p-8 lg:grid-cols-[320px_1fr]">
        <div>
          <span className="text-5xl">{t.emoji}</span>
          <h2 className="section-title mt-2">روتينكِ المقترح لبشرة {t.label}</h2>
          <p className="mt-2 text-sm leading-7 text-ink-soft">{t.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => (setOpen(true), start({ q: "عدّلي روتيني" }))} className="btn-primary h-11 px-5 text-sm">
              <DeemaOrb size={24} /> عدّليه مع ديما
            </button>
            <Link href="/skin-quiz" className="btn-ghost h-11 px-4 text-sm">
              أعيدي الاختبار
            </Link>
          </div>
        </div>
        <RoutineCard routine={q.data.routine} />
      </div>
    </section>
  );
}

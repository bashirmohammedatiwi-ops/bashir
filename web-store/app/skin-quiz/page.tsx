"use client";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RoutineCard } from "@/components/beauty/PackageCards";
import { useHydrated } from "@/components/Providers";
import { ProductRow } from "@/components/product/ProductRow";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { concernHref, productsHref } from "@/lib/links";
import { listedShades } from "@/lib/media";
import { QUESTIONS, SKIN, loadSkin, saveSkin, scoreQuiz, type SkinProfile } from "@/lib/skin";
import { useCart } from "@/lib/stores/cart";
import { toast, useUi } from "@/lib/stores/ui";
import type { BeautyPackage, Product, SkinConcern } from "@/lib/types";

type Match = { skinType: string; morning: BeautyPackage | null; evening: BeautyPackage | null; routines: BeautyPackage[]; concerns: { concern: SkinConcern; products: Product[] }[] };

const worldCookie = () => (typeof document === "undefined" ? undefined : document.cookie.match(/(?:^|; )world=([^;]+)/)?.[1]);

function Result({ profile, onRestart }: { profile: SkinProfile; onRestart: () => void }) {
  const t = SKIN[profile.skinType];
  const addPackage = useCart((s) => s.addPackage);
  const openCart = useUi((s) => s.openCart);
  const q = useQuery({
    queryKey: ["skin-match", profile],
    queryFn: () => api<Match>("/skin-guide/match", { auth: false, query: { skinType: profile.skinType, concerns: profile.concerns.join(","), world: worldCookie() } }),
  });
  const both = [q.data?.morning, q.data?.evening].filter(Boolean) as BeautyPackage[];
  const total = both.reduce((s, p) => s + p.price, 0);
  const saving = both.reduce((s, p) => s + p.saving, 0);

  const addBoth = async () => {
    // الروتين الكامل (بمنتجاته وتدرجاته) من صفحة الباقة — للتدرجات نوجّه للصفحة.
    for (const p of both) {
      const full = await api<BeautyPackage>(`/packages/slug/${encodeURIComponent(p.slug)}`, { auth: false }).catch(() => null);
      if (!full) continue;
      if (full.items.some((it) => listedShades(it.product).length > 0)) {
        toast({ text: `«${full.name}» فيه منتجات بتدرجات — اختاريها من صفحة الروتين`, action: { label: "افتحي", href: `/package/${full.slug}` } });
        return;
      }
      addPackage(full);
    }
    toast({ text: "أُضيف روتينكِ للسلة 💜", tone: "success" });
    openCart(true);
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-accent to-accent-dark p-6 text-white shadow-lift md:p-10">
        <span className="absolute -left-6 -top-8 text-[150px] opacity-25">{t.emoji}</span>
        <p className="text-sm font-bold opacity-85">نوع بشرتكِ</p>
        <h1 className="mt-1 text-4xl font-extrabold md:text-5xl">بشرة {t.label}</h1>
        <p className="mt-3 max-w-xl leading-8 opacity-95">{t.blurb}</p>
        <button onClick={onRestart} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/30">
          ↻ أعيدي الاختبار
        </button>
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-60" />
          <Skeleton className="h-60" />
        </div>
      ) : (
        <>
          {both.length > 0 && (
            <section>
              <h2 className="section-title">روتينكِ المقترح</h2>
              <p className="mb-4 mt-1 text-sm text-ink-muted">مختار حسب نوع بشرتكِ ومشاكلها</p>
              <div className="grid gap-4 md:grid-cols-2">
                {both.map((p) => (
                  <RoutineCard key={p.id} pack={p} />
                ))}
              </div>
              {both.length === 2 && (
                <button onClick={addBoth} className="btn-primary mt-4 w-full text-base">
                  أضيفي الروتينين • {formatPrice(total)}
                  {saving > 0 && ` (وفّري ${formatPrice(saving)})`}
                </button>
              )}
            </section>
          )}
          {!both.length && !!q.data?.routines?.length && (
            <section>
              <h2 className="section-title mb-4">روتينات تناسبكِ</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {q.data.routines.map((p) => (
                  <RoutineCard key={p.id} pack={p} />
                ))}
              </div>
            </section>
          )}
          {q.data?.concerns.map(({ concern, products }) => (
            <section key={concern.id}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="section-title">
                    {concern.icon} {concern.name}
                  </h2>
                  <Link href={concernHref(concern.slug)} className="text-sm font-bold text-accent-dark">
                    اقرئي دليل {concern.name} ←
                  </Link>
                </div>
                <Link href={productsHref({ concernSlug: concern.slug, title: `منتجات ${concern.name}` })} className="text-sm font-bold text-accent-dark">
                  عرض الكل
                </Link>
              </div>
              <ProductRow products={products} />
            </section>
          ))}
          {!both.length && !q.data?.routines?.length && !q.data?.concerns?.length && (
            <div className="card p-8 text-center">
              <p className="font-bold">نجهّز روتينات لبشرتكِ قريباً</p>
              <Link href="/skin-guide" className="btn-soft mt-4">
                تصفّحي دليل البشرة
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SkinQuizPage() {
  const hydrated = useHydrated();
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const list = useQuery({ queryKey: ["skin-concerns"], queryFn: () => api<SkinConcern[]>("/skin-concerns", { auth: false, query: { world: worldCookie() } }) });

  useEffect(() => setProfile(loadSkin()), []);

  if (!hydrated) return <Skeleton className="container my-8 h-96" />;

  const total = QUESTIONS.length + 1;
  const finish = () => {
    const p: SkinProfile = { skinType: scoreQuiz(answers), concerns, takenAt: new Date().toISOString() };
    saveSkin(p);
    setProfile(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const restart = () => {
    saveSkin(null);
    setProfile(null);
    setAnswers([]);
    setConcerns([]);
    setStep(0);
  };

  return (
    <div className="container max-w-5xl animate-fade-up py-6 md:py-10">
      {profile ? (
        <Result profile={profile} onRestart={restart} />
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="rounded-full p-2 hover:bg-surface" aria-label="السابق">
                <Icon name="chevronRight" />
              </button>
            )}
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-light">
              <div className="h-full rounded-full bg-gradient-to-l from-accent to-accent-dark transition-all duration-500" style={{ width: `${((step + 1) / total) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-ink-muted tabular-nums">
              {step + 1}/{total}
            </span>
          </div>

          {step < QUESTIONS.length ? (
            <div key={step} className="animate-fade-up">
              <h1 className="text-2xl font-extrabold leading-snug md:text-3xl">{QUESTIONS[step].title}</h1>
              <p className="mt-1 text-ink-muted">{QUESTIONS[step].hint}</p>
              <div className="mt-6 grid gap-3">
                {QUESTIONS[step].options.map((o, i) => (
                  <button
                    key={o.label}
                    onClick={() => {
                      const next = [...answers];
                      next[step] = i;
                      setAnswers(next);
                      setTimeout(() => setStep(step + 1), 220);
                    }}
                    className={clsx("card flex items-center gap-4 p-4 text-start transition hover:-translate-y-0.5 hover:shadow-lift md:p-5", answers[step] === i && "ring-2 ring-accent-dark")}
                  >
                    <span className="text-3xl">{o.emoji}</span>
                    <span className="flex-1 text-lg font-bold">{o.label}</span>
                    {answers[step] === i && <Icon name="check" className="text-accent-dark" stroke={3} />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-extrabold md:text-3xl">شنو المشاكل اللي تزعجكِ؟</h1>
              <p className="mt-1 text-ink-muted">اختاري واحدة أو أكثر — أو تخطّي</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(list.data ?? []).map((c) => {
                  const on = concerns.includes(c.slug);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setConcerns(on ? concerns.filter((x) => x !== c.slug) : [...concerns, c.slug])}
                      className={clsx("card flex items-center gap-3 p-4 text-start transition", on ? "ring-2 ring-accent-dark" : "hover:shadow-lift")}
                    >
                      <span className="text-2xl">{c.icon ?? "🌸"}</span>
                      <span className="flex-1 font-bold">{c.name}</span>
                      {on && <Icon name="check" size={18} className="text-accent-dark" stroke={3} />}
                    </button>
                  );
                })}
              </div>
              <button onClick={finish} className="btn-primary mt-8 w-full text-base">
                {concerns.length ? "اعرضي نتيجتي ✨" : "تخطّي واعرضي النتيجة"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { useHydrated } from "@/components/Providers";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdvisor } from "@/lib/advisor";

function AdvisorPage() {
  const hydrated = useHydrated();
  const sp = useSearchParams();
  const start = useAdvisor((s) => s.start);
  const setOpen = useAdvisor((s) => s.setOpen);
  const once = useRef(false);

  useEffect(() => {
    if (!hydrated || once.current) return;
    once.current = true;
    setOpen(false);
    start({ q: sp.get("q") ?? undefined, productId: sp.get("product") ?? undefined, ask: sp.get("ask") ?? undefined });
  }, [hydrated, sp, start, setOpen]);

  return (
    <div className="container animate-fade-up py-4 md:py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-[28px] bg-gradient-to-br from-accent to-accent-dark p-6 text-white shadow-lift">
            <p className="text-2xl font-extrabold">ديما ✨</p>
            <p className="mt-2 text-sm leading-7 opacity-90">مستشارتكِ الجمالية — تعرف كل منتجات المتجر وتفهم العراقي. احكيلها شتحتاجين وترشحلكِ الأنسب مع السبب.</p>
          </div>
          <div className="card space-y-3 p-5 text-sm">
            {[
              ["🌸", "روتين كامل", "صباح ومساء حسب نوع بشرتكِ"],
              ["💸", "بدائل أرخص", "لأي منتج أو عطر مشهور"],
              ["⚖️", "مقارنة", "بين 2–3 منتجات وتختار الأنسب"],
              ["🧪", "مكوّنات", "شنو فائدة النياسيناميد؟ وهل تنمزج مع الريتينول؟"],
            ].map(([e, t, d]) => (
              <p key={t} className="flex gap-3">
                <span className="text-xl">{e}</span>
                <span>
                  <b className="block">{t}</b>
                  <span className="text-ink-muted">{d}</span>
                </span>
              </p>
            ))}
          </div>
          <Link href="/skin-quiz" className="block text-center text-sm font-bold text-accent-dark hover:underline">
            أو جرّبي اختبار البشرة السريع ←
          </Link>
        </aside>
        <div className="h-[calc(100vh-190px)] min-h-[520px] min-w-0 md:h-[calc(100vh-200px)]">{hydrated ? <AdvisorChat variant="page" /> : <Skeleton className="h-full" />}</div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AdvisorPage />
    </Suspense>
  );
}

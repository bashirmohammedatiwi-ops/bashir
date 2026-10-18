"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ASK_LABELS, track, useAdvisor, type AdvProduct, type Chip, type Compare, type Fit, type Knowledge, type Personal, type Quiz, type Reply } from "@/lib/advisor";
import { api } from "@/lib/api";
import { stripBrandPrefix } from "@/lib/brandSearch";
import { brandLabel, formatNumber, formatPrice } from "@/lib/format";
import { productHref } from "@/lib/links";
import { listedShades } from "@/lib/media";
import { useCart } from "@/lib/stores/cart";
import { toast, useUi } from "@/lib/stores/ui";
import type { Product } from "@/lib/types";
import { Icon } from "../ui/Icon";

/** يضيف منتج «ديما» للسلة — وإن كان له تدرّجات نفتح صفحته للاختيار. */
export function useAddAdv() {
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const router = useRouter();
  return async (p: AdvProduct, quiet = false) => {
    if (!p.inStock) return toast({ text: "نفد حالياً — فعّلي تنبيه التوفّر من صفحته", action: { label: "صفحته", href: productHref(p.slug) } }), false;
    try {
      const full = await api<Product>(`/products/${encodeURIComponent(p.slug)}`, { auth: false });
      if (listedShades(full).length) {
        router.push(productHref(p.slug));
        toast({ text: "اختاري التدرّج المناسب ثم أضيفيه 💄" });
        return false;
      }
      add(full, 1);
      track("cart", p.id);
      if (!quiet) {
        toast({ text: "أُضيف للسلة 💜", tone: "success" });
        openCart(true);
      }
      return true;
    } catch (e) {
      toast({ text: (e as Error).message, tone: "error" });
      return false;
    }
  };
}

const short = (p: AdvProduct) => stripBrandPrefix(p.name, p.brand);

function MatchRing({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const c = 2 * Math.PI * 15;
  return (
    <span className="relative grid h-10 w-10 place-items-center" title={`ملاءمة ${v}%`}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--accent-light))" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--accent-dark))" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <span className="text-[10px] font-extrabold tabular-nums text-accent-dark">{v}%</span>
    </span>
  );
}

/** بطاقة منتج مرشّح: لماذا اخترته، أسئلة سريعة، مقارنة، وإضافة للسلة. */
export function AdvProductCard({ p, wide }: { p: AdvProduct; wide?: boolean }) {
  const act = useAdvisor((s) => s.act);
  const toggleCompare = useAdvisor((s) => s.toggleCompare);
  const comparing = useAdvisor((s) => s.comparing.some((x) => x.id === p.id));
  const addAdv = useAddAdv();
  const [why, setWhy] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div className={clsx("relative flex flex-none flex-col overflow-hidden rounded-3xl border border-hairline bg-surface", wide ? "w-full" : "w-[228px]")}>
      <Link href={productHref(p.slug)} onClick={() => track("click", p.id)} className="relative block aspect-[5/4] bg-white">
        {p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain p-3" />}
        {p.discountPercent > 0 && <span className="absolute right-2.5 top-2.5 rounded-full bg-sale px-2 py-0.5 text-[11px] font-extrabold text-white">-{p.discountPercent}%</span>}
        {p.match > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 shadow-sm">
            <MatchRing value={p.match} />
          </span>
        )}
        {!p.inStock && <span className="absolute inset-x-0 bottom-0 bg-night/70 py-1 text-center text-xs font-bold text-white">نفد حالياً</span>}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-[11px] font-bold uppercase text-accent-dark">{brandLabel(p.brand)}</p>
        <Link href={productHref(p.slug)} onClick={() => track("click", p.id)} className="line-clamp-2 text-[13px] font-semibold leading-5 hover:text-accent-dark">
          {short(p)}
        </Link>
        {!!p.reasons.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.reasons.slice(0, 3).map((r) => (
              <span key={r} className="rounded-full bg-accent-light px-2 py-0.5 text-[10.5px] font-bold text-accent-dark">
                {r}
              </span>
            ))}
          </div>
        )}
        {(p.similarity || p.saving) && (
          <p className="mt-1.5 text-[11px] font-bold text-success">
            {p.similarity ? `يشبهه ${p.similarity}%` : ""}
            {p.similarity && p.saving ? " • " : ""}
            {p.saving ? `توفّرين ${formatPrice(p.saving)}` : ""}
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className="font-extrabold tabular-nums">{formatNumber(p.price)}</span>
          <span className="text-[11px]">د.ع</span>
          {p.originalPrice > p.price && <s className="text-[11px] text-ink-muted tabular-nums">{formatNumber(p.originalPrice)}</s>}
          {p.rating > 0 && (
            <span className="ms-auto flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
              <Icon name="star" size={12} className="fill-current" /> {p.rating.toFixed(1)}
            </span>
          )}
        </div>
        {why && p.why && (
          <ul className="mt-2 space-y-1 rounded-2xl bg-canvas p-2 text-[11.5px]">
            {p.why.map((w) => (
              <li key={w.text} className={clsx("flex gap-1.5", w.ok ? "text-ink-soft" : "text-ink-muted")}>
                <span className={w.ok ? "text-success" : "text-amber-500"}>{w.ok ? "✓" : "–"}</span> {w.text}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button onClick={() => addAdv(p)} disabled={!p.inStock} className="btn h-9 flex-1 bg-accent-dark px-3 text-xs text-white disabled:bg-hairline disabled:text-ink-muted">
            <Icon name="bag" size={15} /> {p.shadeCount > 0 ? "اختاري اللون" : "أضيفي"}
          </button>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="grid h-9 w-9 place-items-center rounded-full bg-accent-light text-accent-dark" aria-label="اسألي ديما عنه">
              <Icon name="chat" size={16} />
            </button>
            {menu && (
              <div className="absolute bottom-11 left-0 z-20 w-48 overflow-hidden rounded-2xl border border-hairline bg-surface py-1 shadow-float animate-fade-up">
                {Object.entries(ASK_LABELS).map(([k, l]) => (
                  <button key={k} onClick={() => (setMenu(false), act(l, `set:focus=${p.id};act:${k}`))} className="block w-full px-3 py-2 text-start text-[13px] font-semibold hover:bg-canvas">
                    {l}
                  </button>
                ))}
                {p.why?.length ? (
                  <button onClick={() => (setMenu(false), setWhy(!why))} className="block w-full px-3 py-2 text-start text-[13px] font-semibold hover:bg-canvas">
                    💡 ليش رشحتيه؟
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setMenu(false);
                    if (!toggleCompare(p)) toast({ text: "تقدرين تقارنين 3 منتجات كحد أقصى" });
                  }}
                  className="block w-full px-3 py-2 text-start text-[13px] font-semibold hover:bg-canvas"
                >
                  {comparing ? "✕ إزالة من المقارنة" : "⚖️ أضيفي للمقارنة"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {comparing && <span className="absolute right-2 top-10 rounded-full bg-night px-2 py-0.5 text-[10px] font-bold text-white">⚖️ للمقارنة</span>}
    </div>
  );
}

export function ProductStrip({ products }: { products: AdvProduct[] }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {products.map((p) => (
        <AdvProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

export function RoutineCard({ routine }: { routine: NonNullable<Reply["routine"]> }) {
  const addAdv = useAddAdv();
  const openCart = useUi((s) => s.openCart);
  const [busy, setBusy] = useState(false);
  const toBuy = routine.steps.filter((s) => !s.owned && s.product.inStock);
  const addAll = async () => {
    setBusy(true);
    let n = 0;
    for (const s of toBuy) if (await addAdv(s.product, true)) n++;
    setBusy(false);
    if (n) {
      toast({ text: `أُضيف ${n} من خطوات الروتين للسلة 💜`, tone: "success" });
      openCart(true);
    }
  };
  const when = { am: "☀️ صباحاً", pm: "🌙 مساءً", both: "☀️🌙 صباحاً ومساءً", any: "" } as const;
  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
      <div className="bg-gradient-to-l from-accent to-accent-dark px-4 py-3 text-white">
        <p className="font-extrabold">
          {routine.emoji ?? "🧖‍♀️"} {routine.title}
        </p>
        {routine.brand && <p className="text-xs opacity-85">كلها من {brandLabel(routine.brand)}</p>}
      </div>
      <ol className="divide-y divide-hairline">
        {routine.steps.map((s, i) => (
          <li key={`${s.step}-${i}`} className="flex items-center gap-3 p-3">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-light text-sm font-extrabold text-accent-dark">{i + 1}</span>
            <Link href={productHref(s.product.slug)} className="h-14 w-14 flex-none rounded-xl border border-hairline bg-white p-1">
              {s.product.image && <img src={s.product.image} alt="" loading="lazy" className="h-full w-full object-contain" />}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-accent-dark">
                {s.emoji} {s.label} {when[s.when] && <span className="font-semibold text-ink-muted">• {when[s.when]}</span>}
              </p>
              <Link href={productHref(s.product.slug)} className="line-clamp-1 text-[13px] font-semibold hover:text-accent-dark">
                {short(s.product)}
              </Link>
              <p className="text-xs text-ink-muted">{s.owned ? "✓ عندكِ من مشترياتكِ" : formatPrice(s.product.price)}</p>
            </div>
          </li>
        ))}
      </ol>
      {toBuy.length > 0 && (
        <div className="border-t border-hairline p-3">
          <button onClick={addAll} disabled={busy} className="btn-primary h-11 w-full text-sm">
            {busy ? "…" : `أضيفي الروتين للسلة • ${formatPrice(routine.total)}`}
          </button>
        </div>
      )}
    </div>
  );
}

export function QuizCard({ quiz, active }: { quiz: Quiz; active: boolean }) {
  const answer = useAdvisor((s) => s.answerQuiz);
  const [picked, setPicked] = useState<Chip[]>([]);
  return (
    <div className="rounded-3xl border border-hairline bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-bold text-accent-dark">{quiz.title}</span>
        <span className="ms-auto text-xs font-bold text-ink-muted tabular-nums">
          {quiz.step}/{quiz.total}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-accent-light">
        <div className="h-full rounded-full bg-accent-dark" style={{ width: `${(quiz.step / quiz.total) * 100}%` }} />
      </div>
      <p className="font-extrabold">{quiz.question}</p>
      {quiz.multi && <p className="text-xs text-ink-muted">اختاري كل ما ينطبق</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {quiz.options.map((o) => {
          const on = picked.some((x) => x.value === o.value);
          return (
            <button
              key={o.value}
              disabled={!active}
              onClick={() => (quiz.multi ? setPicked(on ? picked.filter((x) => x.value !== o.value) : [...picked, o]) : answer([o]))}
              className={clsx("flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-start text-sm font-bold transition disabled:opacity-60", on ? "border-accent-dark bg-accent-light" : "border-hairline hover:border-accent/50")}
            >
              {o.emoji && <span className="text-lg">{o.emoji}</span>}
              {o.label}
            </button>
          );
        })}
      </div>
      {quiz.multi && active && (
        <button onClick={() => answer(picked)} disabled={!picked.length} className="btn-primary mt-3 h-10 w-full text-sm">
          التالي
        </button>
      )}
    </div>
  );
}

const TONE = { good: "bg-emerald-50 text-success", care: "bg-amber-50 text-amber-700", avoid: "bg-rose-soft text-sale", ok: "bg-sky-50 text-sky-700" } as const;

export function KnowledgeCard({ k }: { k: Knowledge }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface p-4">
      <p className="text-lg font-extrabold">{k.title}</p>
      {k.intro && <p className="mt-1 text-sm leading-7 text-ink-soft">{k.intro}</p>}
      {k.verdict && <p className={clsx("mt-3 rounded-2xl px-3 py-2 text-sm font-bold", TONE[k.verdict.tone])}>{k.verdict.text}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {k.sections.map((s) => (
          <div key={s.label} className="rounded-2xl bg-canvas p-3">
            <p className="mb-1.5 text-sm font-extrabold">
              {s.icon} {s.label}
            </p>
            <ul className="space-y-1 text-[13px] text-ink-soft">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-1.5">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent" /> {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompareCard({ c }: { c: Compare }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr>
              <th className="p-3" />
              {c.products.map((p, i) => (
                <th key={p.id} className={clsx("p-3 align-top", c.winner === i && "bg-emerald-50")}>
                  <Link href={productHref(p.slug)} className="block">
                    <img src={p.image} alt="" className="mx-auto h-16 w-16 object-contain" />
                    <span className="mt-1 line-clamp-2 text-xs font-bold">{short(p)}</span>
                    {c.winner === i && <span className="mt-1 inline-block rounded-full bg-success px-2 py-0.5 text-[10px] text-white">الأنسب لكِ</span>}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {c.rows.map((r) => (
              <tr key={r.label}>
                <td className="whitespace-nowrap p-3 text-xs font-bold text-ink-muted">{r.label}</td>
                {r.values.map((v, i) => (
                  <td key={i} className={clsx("p-3 text-center text-xs", r.best === i && "font-extrabold text-success")}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-hairline bg-canvas p-3 text-sm font-bold">⚖️ {c.verdict}</p>
    </div>
  );
}

export function FitCard({ f }: { f: Fit }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
      <div className={clsx("flex items-center gap-3 p-4", TONE[f.tone])}>
        <img src={f.product.image} alt="" className="h-14 w-14 flex-none rounded-xl bg-white object-contain p-1" />
        <div className="min-w-0">
          <p className="font-extrabold">{f.headline}</p>
          <p className="line-clamp-1 text-xs opacity-80">{short(f.product)}</p>
        </div>
      </div>
      <ul className="space-y-1.5 p-4 text-sm">
        {f.points.map((pt) => (
          <li key={pt.text} className="flex gap-2">
            <span className={pt.ok === true ? "text-success" : pt.ok === false ? "text-sale" : "text-ink-muted"}>{pt.ok === true ? "✓" : pt.ok === false ? "✕" : "•"}</span>
            <span className="text-ink-soft">{pt.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PersonalCards({ items }: { items: Personal[] }) {
  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div key={p.title} className="rounded-3xl bg-gradient-to-l from-accent-light to-surface p-4 ring-1 ring-accent/20">
          <p className="font-extrabold">
            {p.kind === "refill" ? "🔁" : "✨"} {p.title}
          </p>
          <p className="mb-3 text-xs text-ink-muted">{p.note}</p>
          <ProductStrip products={p.products} />
        </div>
      ))}
    </div>
  );
}

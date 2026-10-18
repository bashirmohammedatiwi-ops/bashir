"use client";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useAdvisor, type Entry, type Profile } from "@/lib/advisor";
import { Icon } from "../ui/Icon";
import { AdvProductCard, CompareCard, FitCard, KnowledgeCard, PersonalCards, ProductStrip, QuizCard, RoutineCard } from "./AdvisorCards";

export function DeemaOrb({ size = 40, pulse }: { size?: number; pulse?: boolean }) {
  return (
    <span className={clsx("relative grid flex-none place-items-center rounded-full bg-gradient-to-br from-[#F0A7C4] via-accent to-accent-dark text-white shadow-lift", pulse && "animate-pulse")} style={{ width: size, height: size }}>
      <span className="absolute inset-[3px] rounded-full bg-gradient-to-tr from-white/0 to-white/40" />
      <span className="relative font-extrabold" style={{ fontSize: size * 0.42 }}>
        د
      </span>
    </span>
  );
}

const SKIN_AR: Record<string, string> = { dry: "جافة", oily: "دهنية", combination: "مختلطة", normal: "عادية", sensitive: "حساسة" };

function ProfileSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const clear = useAdvisor((s) => s.clearProfile);
  const rows: [string, string | undefined][] = [
    ["نوع البشرة", profile.skinType ? SKIN_AR[profile.skinType] ?? profile.skinType : undefined],
    ["مشاكل البشرة", profile.concerns?.join("، ")],
    ["الشعر", profile.hairConcerns?.join("، ")],
    ["ذوقكِ بالعطور", profile.families?.join("، ")],
    ["تتجنّبين", profile.avoid?.join("، ")],
  ];
  const any = rows.some(([, v]) => v);
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-night/30 md:items-center md:justify-center" onClick={onClose}>
      <div className="w-full rounded-t-[28px] bg-surface p-5 animate-fade-up md:max-w-md md:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-extrabold">ملفكِ الجمالي 🌸</p>
        <p className="mb-4 text-xs text-ink-muted">تتعلّمه ديما من محادثتكِ ويبقى على جهازكِ فقط — حتى تكون ترشيحاتها أدق.</p>
        {any ? (
          <dl className="space-y-2 text-sm">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 rounded-2xl bg-canvas px-3 py-2">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className="rounded-2xl bg-canvas p-4 text-center text-sm text-ink-muted">لسه ما أعرف عنكِ شي — احكيلي عن بشرتكِ أو ذوقكِ</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="btn-soft h-11">
            تمام
          </button>
          {any && (
            <button onClick={() => (clear(), onClose())} className="btn-ghost text-sale">
              مسح الملف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BotTurn({ e, last }: { e: Extract<Entry, { who: "bot" }>; last: boolean }) {
  const { tap, act, rate, thinking } = useAdvisor();
  const r = e.reply;
  return (
    <div className="flex items-start gap-2.5">
      <DeemaOrb size={32} />
      <div className="min-w-0 flex-1 space-y-2.5">
        {r.messages.map((m, i) => (
          <p key={i} className="w-fit max-w-[92%] whitespace-pre-line rounded-3xl rounded-tr-lg bg-surface px-4 py-2.5 text-[14.5px] leading-7 shadow-card animate-fade-up" style={{ animationDelay: `${i * 160}ms`, animationFillMode: "both" }}>
            {m}
          </p>
        ))}
        {!!r.understood?.length && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-muted">فهمت:</span>
            {r.understood.map((u) => (
              <button
                key={u.key}
                disabled={!last || thinking}
                onClick={() => act(`بدون ${u.label.replace(/^[^\p{L}\d]+/u, "")}`, `${u.key};act:recommend`)}
                className="group inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 font-bold text-accent-dark disabled:cursor-default"
                title={last ? "إزالة" : undefined}
              >
                {u.label}
                {last && <Icon name="close" size={11} className="opacity-50 group-hover:opacity-100" />}
              </button>
            ))}
          </div>
        )}
        {r.anchor && (
          <div className="max-w-sm">
            <p className="mb-1.5 text-xs font-bold text-ink-muted">نتكلم عن:</p>
            <AdvProductCard p={r.anchor} wide />
          </div>
        )}
        {r.fit && <FitCard f={r.fit} />}
        {r.knowledge && <KnowledgeCard k={r.knowledge} />}
        {r.compare && <CompareCard c={r.compare} />}
        {r.quiz && <QuizCard quiz={r.quiz} active={last && !thinking} />}
        {!!r.personal?.length && <PersonalCards items={r.personal} />}
        {!!r.products?.length && <ProductStrip products={r.products} />}
        {r.routine && <RoutineCard routine={r.routine} />}
        {r.groups?.map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-sm font-extrabold">{g.title}</p>
            <ProductStrip products={g.products} />
          </div>
        ))}
        {last && !thinking && !!r.chips.length && (
          <div className="flex flex-wrap gap-2 pt-1">
            {r.chips.map((c) => (
              <button key={c.value + c.label} onClick={() => tap(c)} className="chip bg-surface hover:bg-accent-light">
                {c.emoji && <span>{c.emoji}</span>}
                {c.label}
              </button>
            ))}
          </div>
        )}
        {!!(r.products?.length || r.routine) && !e.rated && (
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            هل أفادكِ؟
            <button onClick={() => rate(e.id, true)} className="rounded-full p-1.5 hover:bg-surface" aria-label="مفيد">
              👍
            </button>
            <button onClick={() => rate(e.id, false)} className="rounded-full p-1.5 hover:bg-surface" aria-label="غير مفيد">
              👎
            </button>
          </div>
        )}
        {e.rated && <p className="text-xs text-ink-muted">شكراً — أتعلّم من رأيكِ 💜</p>}
      </div>
    </div>
  );
}

/** محادثة «ديما»: تُستخدم في الصفحة الكاملة وفي النافذة العائمة. */
export function AdvisorChat({ variant, onClose }: { variant: "page" | "panel"; onClose?: () => void }) {
  const { entries, thinking, error, notice, prompts, comparing, profile, send, retry, reset, compareNow, toggleCompare } = useAdvisor();
  const [text, setText] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [noticeShown, setNoticeShown] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // آخر رسالة من الزبونة في الأعلى، والرد يتكشّف تحتها.
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [entries.length, thinking]);

  useEffect(() => {
    if (!notice) return;
    setNoticeShown(notice);
    const t = setTimeout(() => setNoticeShown(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const submit = () => {
    if (!text.trim()) return;
    send(text);
    setText("");
    input.current?.focus();
  };
  const lastBot = [...entries].reverse().find((e) => e.who === "bot")?.id;
  const onlyWelcome = entries.length <= 1;

  return (
    <div className={clsx("relative flex h-full min-h-0 flex-col", variant === "page" && "rounded-[32px] bg-canvas shadow-card ring-1 ring-hairline")}>
      <div className={clsx("flex items-center gap-3 border-b border-hairline bg-surface/90 px-4 py-3 backdrop-blur", variant === "page" ? "rounded-t-[32px]" : "")}>
        <DeemaOrb size={42} pulse={thinking} />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">ديما</p>
          <p className="text-xs text-ink-muted">{thinking ? "تكتب…" : "مستشارتكِ الجمالية — تعرف كل منتجات المتجر"}</p>
        </div>
        <button onClick={() => setShowProfile(true)} className="rounded-full p-2 text-ink-soft hover:bg-canvas" title="ملفكِ الجمالي" aria-label="ملفكِ الجمالي">
          <Icon name="user" size={20} />
        </button>
        <button onClick={() => reset()} className="rounded-full p-2 text-ink-soft hover:bg-canvas" title="محادثة جديدة" aria-label="محادثة جديدة">
          <Icon name="plus" size={20} />
        </button>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-2 text-ink-soft hover:bg-canvas" aria-label="إغلاق">
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 md:px-5">
        {entries.map((e) =>
          e.who === "me" ? (
            <div key={e.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-line rounded-3xl rounded-tl-lg bg-gradient-to-l from-accent to-accent-dark px-4 py-2.5 text-[14.5px] leading-7 text-white shadow-lift">{e.text}</p>
            </div>
          ) : (
            <BotTurn key={e.id} e={e} last={e.id === lastBot} />
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-2.5">
            <DeemaOrb size={32} pulse />
            <span className="flex gap-1 rounded-3xl bg-surface px-4 py-3.5 shadow-card">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${i * 140}ms` }} />
              ))}
            </span>
          </div>
        )}
        {error && !thinking && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-bold text-sale">
            {error}
            <button onClick={retry} className="ms-auto rounded-full bg-white px-3 py-1 text-xs">
              أعيدي المحاولة
            </button>
          </div>
        )}
        {onlyWelcome && !thinking && prompts.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold text-ink-muted">جرّبي تسأليني:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(p)} className="rounded-2xl border border-hairline bg-surface px-3 py-2.5 text-start text-sm font-semibold transition hover:border-accent/50 hover:bg-accent-light">
                  “{p}”
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {comparing.length > 0 && (
        <div className="flex items-center gap-2 border-t border-hairline bg-surface px-4 py-2">
          <span className="text-xs font-bold">⚖️ للمقارنة:</span>
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {comparing.map((p) => (
              <button key={p.id} onClick={() => toggleCompare(p)} className="flex-none rounded-full bg-canvas px-2 py-1 text-[11px] font-bold">
                {p.brand.split(/\s+/).pop()} ✕
              </button>
            ))}
          </div>
          <button onClick={compareNow} disabled={comparing.length < 2} className="btn h-8 flex-none bg-night px-3 text-xs text-white">
            قارني ({comparing.length})
          </button>
        </div>
      )}

      <div className={clsx("border-t border-hairline bg-surface p-3", variant === "page" && "rounded-b-[32px]")}>
        <div className="flex items-end gap-2 rounded-3xl border border-hairline bg-canvas p-1.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
          <textarea
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 600))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="اسألي ديما… مثلاً: كريم مرطب لبشرة جافة"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none"
            aria-label="رسالة إلى ديما"
          />
          <button onClick={submit} disabled={!text.trim() || thinking} className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-white disabled:opacity-40" aria-label="إرسال">
            <Icon name="arrowLeft" size={18} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10.5px] text-ink-muted">ديما تتعلّم من محادثاتكِ — ترشيحاتها من منتجات المتجر الأصلية فقط</p>
      </div>

      {noticeShown && <p className="absolute inset-x-0 top-[72px] mx-auto w-fit rounded-full bg-night px-4 py-2 text-xs font-bold text-white shadow-float animate-fade-up">✓ {noticeShown}</p>}
      {showProfile && <ProfileSheet profile={profile} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

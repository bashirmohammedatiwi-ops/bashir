"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSpeech } from "@/lib/hooks/speech";
import { BarcodeScanner } from "../search/BarcodeScanner";
import { formatNumber } from "@/lib/format";
import { brandHref, categoryHref, productHref } from "@/lib/links";
import { Icon } from "../ui/Icon";

type Instant = {
  query: string;
  corrected?: string | null;
  completions: { text: string; type: string }[];
  products: { id: string; slug: string; name: string; brand: string; price: number; originalPrice: number; discountPercent: number; image: string; inStock: boolean }[];
  brands: { id: string; name: string; slug: string; count: number }[];
  categories: { id: string; name: string; slug: string; count: number }[];
  total: number;
};

const RECENT_KEY = "dh-recent-searches";
const readRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
};
export function rememberSearch(q: string) {
  try {
    const list = [q, ...readRecent().filter((x) => x !== q)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

const POPULAR = ["سيروم", "واقي شمس", "أحمر شفاه", "عطر نسائي", "شامبو", "كريم مرطب", "ماسكارا"];

/** بحث فوري: اقتراحات ومنتجات وبراندات وأقسام أثناء الكتابة — مثل التطبيق. */
export function SearchBox({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Instant | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const [scan, setScan] = useState(false);
  const speech = useSpeech((t) => {
    setQ(t);
    go(t);
  });
  const seq = useRef(0);

  useEffect(() => setRecent(readRecent()), [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      return;
    }
    const id = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api<Instant>("/search/instant", { query: { q: term }, auth: false });
        if (id === seq.current) setData(r);
      } catch {}
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    rememberSearch(t);
    setOpen(false);
    onDone?.();
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const suggestions = data?.completions?.slice(0, 5) ?? [];

  return (
    <div ref={box} className={clsx("relative", className)}>
      {scan && <BarcodeScanner onClose={() => setScan(false)} />}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(active >= 0 && suggestions[active] ? suggestions[active].text : q);
        }}
        className="group relative"
      >
        <Icon name="search" size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, suggestions.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, -1));
            if (e.key === "Escape") setOpen(false);
          }}
          type="search"
          enterKeyHint="search"
          placeholder="ابحثي عن منتج، براند، أو قسم…"
          className="h-12 w-full rounded-full border border-transparent bg-accent-light/80 pe-[150px] ps-12 text-[15px] outline-none transition placeholder:text-ink-muted focus:border-accent/40 focus:bg-surface focus:shadow-card"
          aria-label="بحث"
        />
        <span className="absolute left-[72px] top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {q && (
            <button type="button" onClick={() => setQ("")} className="rounded-full p-1.5 text-ink-muted hover:text-ink" aria-label="مسح">
              <Icon name="close" size={16} />
            </button>
          )}
          {speech.supported && (
            <button type="button" onClick={speech.toggle} className={clsx("rounded-full p-1.5 transition", speech.listening ? "animate-pulse bg-sale text-white" : "text-ink-soft hover:text-accent-dark")} aria-label="البحث بالصوت" title="البحث بالصوت">
              <Icon name="mic" size={18} />
            </button>
          )}
          <button type="button" onClick={() => setScan(true)} className="rounded-full p-1.5 text-ink-soft hover:text-accent-dark md:hidden" aria-label="مسح باركود" title="مسح باركود">
            <Icon name="scan" size={18} />
          </button>
        </span>
        <button
          type="submit"
          className="absolute left-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-accent-dark px-4 text-sm font-bold text-white transition hover:brightness-110"
        >
          بحث
        </button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-3xl border border-hairline bg-surface p-3 shadow-float animate-fade-up">
          {q.trim().length < 2 ? (
            <div className="space-y-4 p-2">
              {recent.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-ink-muted">
                    <span>بحثكِ الأخير</span>
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecent([]);
                      }}
                      className="hover:text-sale"
                    >
                      مسح
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => go(r)} className="chip">
                        <Icon name="clock" size={14} /> {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="mb-2 text-xs font-bold text-ink-muted">الأكثر بحثاً</div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((r) => (
                    <button key={r} onClick={() => go(r)} className="chip">
                      <Icon name="search" size={14} /> {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : !data ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-12" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
              <div className="space-y-3">
                {data.corrected && (
                  <p className="px-2 text-sm text-ink-soft">
                    هل تقصدين{" "}
                    <button className="font-bold text-accent-dark underline" onClick={() => go(data.corrected!)}>
                      {data.corrected}
                    </button>
                    ؟
                  </p>
                )}
                {suggestions.length > 0 && (
                  <ul>
                    {suggestions.map((s, i) => (
                      <li key={s.text}>
                        <button
                          onClick={() => go(s.text)}
                          className={clsx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-[15px] hover:bg-accent-light", i === active && "bg-accent-light")}
                        >
                          <Icon name="search" size={16} className="text-ink-muted" />
                          <span className="font-semibold">{s.text}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {(data.brands.length > 0 || data.categories.length > 0) && (
                  <div className="flex flex-wrap gap-2 px-2">
                    {data.brands.slice(0, 4).map((b) => (
                      <Link key={b.id} href={brandHref(b.slug)} onClick={() => setOpen(false)} className="chip">
                        {b.name} <span className="text-ink-muted">{b.count}</span>
                      </Link>
                    ))}
                    {data.categories.slice(0, 4).map((c) => (
                      <Link key={c.id} href={categoryHref(c.slug)} onClick={() => setOpen(false)} className="chip">
                        {c.name} <span className="text-ink-muted">{c.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div>
                {data.products.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-muted">لا منتجات مطابقة — جربي كلمة أبسط</p>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {data.products.slice(0, 6).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={productHref(p.slug)}
                          onClick={() => {
                            rememberSearch(q.trim());
                            setOpen(false);
                            onDone?.();
                          }}
                          className="flex items-center gap-3 rounded-2xl p-2 hover:bg-accent-light"
                        >
                          <span className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-2xl bg-white">
                            {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain p-1" loading="lazy" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-bold uppercase text-accent-dark">{p.brand}</span>
                            <span className="line-clamp-1 text-sm font-semibold">{p.name}</span>
                          </span>
                          <span className="text-sm font-extrabold tabular-nums">{formatNumber(p.price)} د.ع</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => go(q)} className="mt-2 w-full rounded-2xl bg-accent-light py-3 text-sm font-bold text-accent-dark hover:bg-accent-soft">
                  عرض كل النتائج {data.total ? `(${formatNumber(data.total)})` : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

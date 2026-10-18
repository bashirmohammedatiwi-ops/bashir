"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandSearchIndex, indexLetter } from "@/lib/brandSearch";
import { arProducts, brandArabic, brandLabel } from "@/lib/format";
import { brandHref } from "@/lib/links";
import { mediaUrl } from "@/lib/media";
import type { Brand } from "@/lib/types";
import { Icon } from "../ui/Icon";

function BrandTile({ b }: { b: Brand }) {
  const ar = brandArabic(b.name);
  return (
    <Link href={brandHref(b.slug)} className="card group flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-lift">
      <span className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-full bg-white p-2 ring-1 ring-hairline" style={b.bgColorHex ? { background: b.bgColorHex } : undefined}>
        {b.logo ? (
          <img src={mediaUrl(b.logo, "thumb")} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span className="text-lg font-extrabold text-accent-dark">{b.initial ?? brandLabel(b.name).slice(0, 1)}</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-1 font-extrabold group-hover:text-accent-dark" dir="auto">
          {brandLabel(b.name)}
        </span>
        <span className="line-clamp-1 text-xs text-ink-muted">
          {ar !== brandLabel(b.name) ? `${ar} • ` : ""}
          {arProducts(b.productCount ?? 0)}
        </span>
      </span>
    </Link>
  );
}

/** دليل البراندات: بحث ذكي (عربي ↔ لاتيني)، فهرس A–Z بشريط قفز، والبراندات المميزة. */
export function BrandsDirectory({ brands }: { brands: Brand[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => brands.filter((b) => (b.productCount ?? 0) > 0), [brands]);
  const index = useMemo(() => new BrandSearchIndex(list), [list]);
  const results = useMemo(() => (q.trim() ? index.search(q) : null), [q, index]);
  const suggestions = useMemo(() => (results && !results.length ? index.suggest(q) : []), [results, q, index]);

  const groups = useMemo(() => {
    const m = new Map<string, Brand[]>();
    for (const b of list) {
      const k = indexLetter(b);
      m.set(k, [...(m.get(k) ?? []), b]);
    }
    const keys = [...m.keys()].sort((a, b) => (a === "ع" || a === "#" ? 1 : b === "ع" || b === "#" ? -1 : a.localeCompare(b)));
    return keys.map((k) => [k, m.get(k)!.sort((a, b) => brandLabel(a.name).localeCompare(brandLabel(b.name)))] as const);
  }, [list]);

  const top = useMemo(() => [...list].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || (b.productCount ?? 0) - (a.productCount ?? 0)).slice(0, 12), [list]);
  const [active, setActive] = useState<string | null>(null);

  // الحرف الظاهر حالياً — لتمييزه في شريط القفز.
  useEffect(() => {
    if (results) return;
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.getAttribute("data-letter"));
      },
      { rootMargin: "-180px 0px -60% 0px" },
    );
    document.querySelectorAll("[data-letter]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [results, groups]);

  return (
    <div>
      <div className="sticky top-[calc(var(--header-h)+8px)] z-20 -mx-4 bg-canvas/90 px-4 pb-3 pt-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-0">
        <div className="relative mx-auto max-w-2xl">
          <Icon name="search" size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي عن براند… بالعربي أو الإنجليزي (لوريال، Vichy…)"
            className="field h-14 rounded-full pe-12 ps-12 text-base shadow-card"
            aria-label="بحث البراندات"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-canvas text-ink-soft" aria-label="مسح">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        {!results && (
          <div className="no-scrollbar mx-auto mt-3 flex max-w-4xl gap-1 overflow-x-auto md:flex-wrap md:justify-center" dir="ltr">
            {groups.map(([k]) => (
              <a
                key={k}
                href={`#letter-${k}`}
                className={clsx("grid h-9 min-w-9 flex-none place-items-center rounded-full px-2 text-sm font-extrabold transition", active === k ? "bg-accent-dark text-white" : "bg-surface text-ink-soft hover:bg-accent-light hover:text-accent-dark")}
              >
                {k}
              </a>
            ))}
          </div>
        )}
      </div>

      {results ? (
        <div className="mt-4">
          <p className="mb-4 text-sm font-bold text-ink-muted">{results.length ? `${results.length} براند` : `لا براند باسم «${q}»`}</p>
          {results.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((b) => (
                <BrandTile key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              {suggestions.length > 0 ? (
                <>
                  <p className="font-bold">هل تقصدين:</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {suggestions.map((b) => (
                      <button key={b.id} onClick={() => setQ(brandLabel(b.name))} className="chip">
                        {brandLabel(b.name)}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-ink-muted">جربي كتابة جزء من الاسم أو أول حرف منه</p>
              )}
              <Link href={`/search?q=${encodeURIComponent(q)}`} className="btn-soft mt-5 h-10 text-sm">
                ابحثي عن «{q}» في كل المنتجات
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="section-title mb-4">الأكثر تسوّقاً</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
              {top.map((b) => (
                <Link key={b.id} href={brandHref(b.slug)} className="group text-center">
                  <span className="mb-2 grid aspect-square place-items-center overflow-hidden rounded-[26px] bg-white p-4 shadow-card transition group-hover:-translate-y-1 group-hover:shadow-lift">
                    {b.logo ? <img src={mediaUrl(b.logo, "small")} alt={b.name} loading="lazy" className="h-full w-full object-contain" /> : <span className="text-3xl font-extrabold text-accent-dark">{brandLabel(b.name).slice(0, 1)}</span>}
                  </span>
                  <span className="line-clamp-1 text-xs font-bold text-ink-soft">{brandLabel(b.name)}</span>
                </Link>
              ))}
            </div>
          </section>
          <div className="mt-10 space-y-8">
            {groups.map(([k, items]) => (
              <section key={k} id={`letter-${k}`} data-letter={k} className="scroll-mt-48">
                <h3 className="mb-3 flex items-center gap-3 text-2xl font-extrabold text-accent-dark">
                  {k}
                  <span className="h-px flex-1 bg-hairline" />
                  <span className="text-xs font-bold text-ink-muted">{items.length}</span>
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((b) => (
                    <BrandTile key={b.id} b={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

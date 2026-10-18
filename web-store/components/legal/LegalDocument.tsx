import Link from "next/link";
import { LEGAL_UPDATED, SUPPORT_EMAIL, legalPageCopy, legalPath, type LegalLang, type LegalSection } from "@/lib/legal";

/** صفحة قانونية (الخصوصية / الشروط) بالعربي أو الإنجليزي، مع فهرس جانبي. */
export function LegalDocument({ lang, variant, sections }: { lang: LegalLang; variant: "privacy" | "terms"; sections: LegalSection[] }) {
  const c = legalPageCopy[variant][lang];
  const other: LegalLang = lang === "ar" ? "en" : "ar";
  const sibling = variant === "privacy" ? "terms" : "privacy";
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="container animate-fade-up py-6 md:py-12">
      <div className="rounded-[28px] bg-gradient-to-l from-accent-light via-accent-soft to-accent-light px-6 py-8 md:px-10 md:py-12">
        <p className="text-sm font-bold text-accent-dark">
          {c.updatedLabel}: {LEGAL_UPDATED[lang]}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">{c.title}</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">{c.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={legalPath(variant, other)} className="chip bg-white/80">
            🌐 {c.switchLang}
          </Link>
          <Link href={legalPath(sibling, lang)} className="chip bg-white/80">
            {legalPageCopy[sibling][lang].title}
          </Link>
        </div>
      </div>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="card hidden p-4 lg:sticky lg:top-36 lg:block">
          <ol className="space-y-1 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-xl px-3 py-2 text-ink-soft hover:bg-canvas hover:text-accent-dark">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-5">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="card scroll-mt-40 p-6 md:p-8">
              <h2 className="text-xl font-extrabold">
                <span className="text-accent-dark">{i + 1}.</span> {s.title}
              </h2>
              {s.intro && <p className="mt-3 leading-8 text-ink-soft">{s.intro}</p>}
              {s.bullets && (
                <ul className="mt-3 space-y-2 leading-7 text-ink-soft">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-accent" /> {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <div className="card bg-night p-6 text-white md:p-8">
            <h2 className="text-xl font-extrabold">{c.contactTitle}</h2>
            <p className="mt-2 opacity-80">{c.contactBody}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 font-bold text-ink" dir="ltr">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

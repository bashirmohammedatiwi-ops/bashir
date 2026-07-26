import Link from "next/link";

import { APP_ORIGIN, displayStoreName } from "@/lib/config";
import type { LegalLang, LegalSection } from "@/lib/legal";
import { SUPPORT_EMAIL, legalPageCopy, legalPath } from "@/lib/legal";

type LegalDocumentProps = {
  lang: LegalLang;
  sections: LegalSection[];
  variant: "privacy" | "terms";
};

export function LegalDocument({ lang, sections, variant }: LegalDocumentProps) {
  const copy = legalPageCopy[variant][lang];
  const otherLang: LegalLang = lang === "ar" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="legal-doc" dir={dir} lang={lang}>
      <section className="legal-hero">
        <div className="container legal-hero-inner">
          <div className="legal-hero-icon" aria-hidden>
            {variant === "privacy" ? "🛡️" : "📋"}
          </div>
          <div>
            <p className="legal-hero-kicker">{displayStoreName(lang)}</p>
            <h1>{copy.title}</h1>
            <p className="legal-hero-meta">
              {copy.updatedLabel}: {lang === "ar" ? "يوليو 2026" : "July 2026"}
            </p>
            <p className="legal-lang-switch">
              <Link href={legalPath(variant, otherLang)}>{copy.switchLang}</Link>
            </p>
          </div>
        </div>
      </section>

      <div className="container legal-body">
        <div className="legal-grid">
          {sections.map((section, index) => (
            <article key={section.id} className="legal-card">
              <div className="legal-card-head">
                <span className="legal-card-num">{index + 1}</span>
                <h2>{section.title}</h2>
              </div>
              {section.intro ? <p className="legal-card-intro">{section.intro}</p> : null}
              {section.bullets?.length ? (
                <ul className="legal-bullets">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="legal-contact">
          <h3>{copy.contactTitle}</h3>
          <p>{copy.contactBody}</p>
          <div className="legal-contact-actions">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary">
              {SUPPORT_EMAIL}
            </a>
            <Link href="/" className="btn btn-outline">
              {copy.backToStore}
            </Link>
          </div>
          <p className="legal-contact-url">
            <a href={APP_ORIGIN}>{APP_ORIGIN.replace("https://", "")}</a>
          </p>
        </aside>
      </div>
    </div>
  );
}

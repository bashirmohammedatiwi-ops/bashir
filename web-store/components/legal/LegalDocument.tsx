import Link from "next/link";

import { APP_ORIGIN, displayStoreName } from "@/lib/config";
import type { LegalSection } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/legal";

type LegalDocumentProps = {
  title: string;
  updated: string;
  sections: LegalSection[];
  variant: "privacy" | "terms";
};

export function LegalDocument({ title, updated, sections, variant }: LegalDocumentProps) {
  return (
    <div className="legal-doc">
      <section className="legal-hero">
        <div className="container legal-hero-inner">
          <div className="legal-hero-icon" aria-hidden>
            {variant === "privacy" ? "🛡️" : "📋"}
          </div>
          <div>
            <p className="legal-hero-kicker">{displayStoreName("ar")}</p>
            <h1>{title}</h1>
            <p className="legal-hero-meta">آخر تحديث: {updated}</p>
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
          <h3>هل لديكِ سؤال؟</h3>
          <p>فريق دعم ديما الحياة جاهز لمساعدتك في أي استفسار متعلق بالخصوصية أو الشروط.</p>
          <div className="legal-contact-actions">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary">
              {SUPPORT_EMAIL}
            </a>
            <Link href="/" className="btn btn-outline">
              العودة للمتجر
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

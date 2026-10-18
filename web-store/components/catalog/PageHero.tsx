/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon } from "../ui/Icon";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسار التصفح" className="no-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap text-[13px] text-ink-muted">
      <Link href="/" className="hover:text-accent-dark">
        الرئيسية
      </Link>
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          <Icon name="chevronLeft" size={14} />
          {c.href ? (
            <Link href={c.href} className="hover:text-accent-dark">
              {c.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink-soft">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** رأس صفحات القوائم: مسار، عنوان، وصف، وصورة/شعار اختياري. */
export function PageHero({
  title,
  subtitle,
  crumbs,
  image,
  logo,
  tone = "soft",
  children,
}: {
  title: string;
  subtitle?: string | null;
  crumbs: Crumb[];
  image?: string | null;
  logo?: React.ReactNode;
  tone?: "soft" | "rose" | "plain";
  children?: React.ReactNode;
}) {
  const bg =
    tone === "rose" ? "bg-gradient-to-l from-rose to-rose-deep text-white" : tone === "plain" ? "bg-transparent" : "bg-gradient-to-l from-accent-light via-accent-soft to-accent-light";
  return (
    <section className="container pt-4 md:pt-6">
      <Breadcrumbs items={crumbs} />
      <div className={`relative mt-3 overflow-hidden rounded-[28px] ${bg} ${tone === "plain" ? "" : "px-5 py-6 md:px-10 md:py-10"}`}>
        {image && <img src={image} alt="" className="absolute inset-y-0 left-0 hidden h-full w-2/5 object-cover opacity-90 [mask-image:linear-gradient(to_left,transparent,black_45%)] md:block" />}
        <div className="relative flex items-center gap-4 md:gap-6">
          {logo}
          <div className="min-w-0 md:max-w-[58%]">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
            {subtitle && <p className={`mt-1.5 line-clamp-2 text-sm md:text-base ${tone === "rose" ? "text-white/85" : "text-ink-soft"}`}>{subtitle}</p>}
          </div>
        </div>
        {children && <div className="relative mt-5">{children}</div>}
      </div>
    </section>
  );
}

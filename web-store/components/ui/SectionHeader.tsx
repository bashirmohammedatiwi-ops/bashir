import Link from "next/link";
import { Icon } from "./Icon";

export function SectionHeader({ title, subtitle, href, action = "عرض الكل" }: { title: string; subtitle?: string | null; href?: string | null; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
      <div>
        <h2 className="section-title flex items-center gap-2.5">
          <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-accent to-accent-dark" />
          {title}
        </h2>
        {subtitle && <p className="mt-1 ps-4 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex flex-none items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-accent-dark transition hover:bg-accent-light">
          {action} <Icon name="chevronLeft" size={16} />
        </Link>
      )}
    </div>
  );
}

import Link from "next/link";
import { POPULAR_SEARCHES } from "@/lib/popular";

export function TrendingSearches() {
  return (
    <section className="container pt-4">
      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <span className="flex-none text-sm font-extrabold text-ink-soft">🔥 الأكثر بحثاً:</span>
        {POPULAR_SEARCHES.map((t) => (
          <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip flex-none py-1 text-[13px]">
            {t}
          </Link>
        ))}
      </div>
    </section>
  );
}

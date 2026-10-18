import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductRow } from "../product/ProductRow";
import { Icon } from "../ui/Icon";
import { Countdown } from "./Countdown";

/** شريط العرض السريع: خصومات اليوم مع عدّاد تنازلي — يختفي حين ينتهي العرض. */
export function FlashSaleBand({ endsAt, products }: { endsAt?: string | null; products: Product[] }) {
  if (!products.length) return null;
  if (endsAt && new Date(endsAt).getTime() <= Date.now()) return null;
  const top = Math.max(...products.map((p) => p.discountPercent || 0));
  return (
    <section className="container py-5 md:py-8">
      <div className="overflow-hidden rounded-[32px] bg-gradient-to-l from-[#E0457B] via-[#F06A8F] to-[#F49B6B] p-4 shadow-lift md:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur">⚡</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold md:text-2xl">عروض خاطفة</h2>
            <p className="text-sm opacity-90">{top > 0 ? `خصومات تصل إلى ${top}% — لفترة محدودة` : "أسعار خاصة لفترة محدودة"}</p>
          </div>
          {endsAt && (
            <span className="flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2 backdrop-blur">
              <Icon name="clock" size={18} />
              <span className="text-xs font-bold">ينتهي خلال</span>
              <Countdown endsAt={endsAt} className="text-lg font-extrabold tabular-nums" />
            </span>
          )}
          <Link href="/offers" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-sale hover:brightness-95">
            كل العروض
          </Link>
        </div>
        <ProductRow products={products} />
      </div>
    </section>
  );
}

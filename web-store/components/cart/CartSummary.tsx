"use client";
import clsx from "clsx";
import { formatNumber, formatPrice } from "@/lib/format";

export type SummaryRow = { label: string; value: number; tone?: "saving" | "muted"; hint?: string; free?: boolean };

/** ملخص الأسعار: يُستخدم في السلة والدفع وصفحة الطلب. */
export function CartSummary({ rows, total, totalLabel = "المجموع" }: { rows: SummaryRow[]; total: number; totalLabel?: string }) {
  return (
    <div className="space-y-2.5 text-sm">
      {rows.map((r) => (
        <div key={r.label} className={clsx("flex items-center justify-between gap-3", r.tone === "saving" && "font-bold text-success", r.tone === "muted" && "text-ink-muted")}>
          <span>
            {r.label}
            {r.hint && <span className="ms-1 text-xs font-normal text-ink-muted">{r.hint}</span>}
          </span>
          <span className="tabular-nums">{r.free ? <b className="text-success">مجاني</b> : `${r.tone === "saving" ? "- " : ""}${formatPrice(r.value)}`}</span>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-hairline pt-3">
        <span className="font-extrabold">{totalLabel}</span>
        <span className="text-2xl font-extrabold tabular-nums">
          {formatNumber(total)} <span className="text-sm">د.ع</span>
        </span>
      </div>
    </div>
  );
}

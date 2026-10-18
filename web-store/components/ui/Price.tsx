import clsx from "clsx";
import { formatNumber } from "@/lib/format";

export function Price({ value, old, size = "md", className }: { value: number; old?: number | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const hasOld = !!old && old > value;
  return (
    <span className={clsx("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={clsx(
          "font-extrabold tabular-nums",
          hasOld ? "text-sale" : "text-ink",
          size === "sm" && "text-[15px]",
          size === "md" && "text-lg",
          size === "lg" && "text-3xl tracking-tight",
        )}
      >
        {formatNumber(value)} <span className={clsx("font-bold", size === "lg" ? "text-lg" : "text-xs")}>د.ع</span>
      </span>
      {hasOld && (
        <s className={clsx("tabular-nums text-ink-muted", size === "lg" ? "text-base" : "text-xs")}>{formatNumber(old!)} د.ع</s>
      )}
    </span>
  );
}

export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (!percent || percent <= 0) return null;
  return (
    <span dir="ltr" className={clsx("rounded-full bg-sale px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm", className)}>
      -{percent}%
    </span>
  );
}

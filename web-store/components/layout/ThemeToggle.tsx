"use client";
import clsx from "clsx";
import { useTheme } from "@/lib/hooks/theme";
import { Icon } from "../ui/Icon";

export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} className={clsx("rounded-full p-2.5 text-ink hover:bg-accent-light", className)} aria-label={dark ? "الوضع الفاتح" : "الوضع الليلي"} title={dark ? "الوضع الفاتح" : "الوضع الليلي"}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

/** اختيار مفصّل (للقائمة والحساب): فاتح / ليلي / حسب الجهاز. */
export function ThemePicker() {
  const { pref, set } = useTheme();
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-canvas p-1 text-sm font-bold">
      {(
        [
          ["light", "☀️ فاتح"],
          ["dark", "🌙 ليلي"],
          ["system", "📱 الجهاز"],
        ] as const
      ).map(([v, l]) => (
        <button key={v} onClick={() => set(v)} className={clsx("rounded-xl py-2 transition", pref === v ? "bg-surface text-accent-dark shadow-card" : "text-ink-soft")}>
          {l}
        </button>
      ))}
    </div>
  );
}

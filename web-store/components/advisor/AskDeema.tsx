"use client";
import { ASK_LABELS, useAdvisor } from "@/lib/advisor";
import { useUi } from "@/lib/stores/ui";
import { DeemaOrb } from "./AdvisorChat";

/** في صفحة المنتج: أسئلة سريعة تفتح «ديما» عن هذا المنتج بالذات. */
export function AskDeema({ productId }: { productId: string }) {
  const { setOpen, start } = useAdvisor();
  const ask = (k?: string) => {
    useUi.getState().openQuickView(null);
    setOpen(true);
    start({ productId, ask: k });
  };
  return (
    <div className="rounded-3xl bg-gradient-to-l from-accent-light to-surface p-4 ring-1 ring-accent/20">
      <button onClick={() => ask()} className="flex w-full items-center gap-3 text-start">
        <DeemaOrb size={40} />
        <span className="flex-1">
          <b className="block">اسألي ديما عن هذا المنتج</b>
          <span className="text-xs text-ink-muted">هل يناسب بشرتكِ؟ بديل أرخص؟ شنو يكمّله؟</span>
        </span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["fit", "dupe", "complement", "howto"] as const).map((k) => (
          <button key={k} onClick={() => ask(k)} className="chip bg-surface py-1 text-xs">
            {ASK_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

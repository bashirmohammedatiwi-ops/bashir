"use client";
import { useAdvisor } from "@/lib/advisor";
import { DeemaOrb } from "./AdvisorChat";

/** زر يفتح «ديما» بفعل جاهز (اختبار الهدية، العطر…) أو سؤال. */
export function DeemaButton({ action, label, q, children, className }: { action?: string; label?: string; q?: string; children: React.ReactNode; className?: string }) {
  const { setOpen, start } = useAdvisor();
  return (
    <button
      onClick={() => {
        setOpen(true);
        start({ action, label, q });
      }}
      className={className ?? "btn h-12 bg-white px-5 font-bold text-accent-dark shadow-lift"}
    >
      <DeemaOrb size={26} /> {children}
    </button>
  );
}

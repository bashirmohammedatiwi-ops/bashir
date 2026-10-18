"use client";
import { useEffect, useState } from "react";

export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now == null) return null;
  const left = new Date(endsAt).getTime() - now;
  if (left <= 0) return null;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const two = (x: number) => String(x).padStart(2, "0");
  if (d >= 1) return <span className={className}>باقي {d === 1 ? "يوم" : d === 2 ? "يومين" : `${d} أيام`}</span>;
  return (
    <span dir="ltr" className={className}>
      {two(Math.floor(s / 3600))}:{two(Math.floor((s % 3600) / 60))}:{two(s % 60)}
    </span>
  );
}

import axios from "axios";

export function formatAiError(err: unknown, fallback = "حدث خطأ غير متوقع"): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      return "انتهت مهلة الطلب — السيرفر يحتاج وقتاً أطول. جرّب تقليل عدد الباركودات أو انتظر ثم أعد المحاولة.";
    }
    if (err.response?.status === 502 || err.response?.status === 504) {
      return "انقطع الاتصال بالسيرفر (502/504) — غالباً انتهت مهلة nginx. حدّث السيرفر ثم أعد المحاولة.";
    }
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    if (Array.isArray(msg) && msg[0]) return String(msg[0]);
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Smooth progress tick while waiting on a long API call. */
export function startSimulatedProgress(
  onTick: (percent: number) => void,
  opts?: { from?: number; to?: number; intervalMs?: number; step?: number },
) {
  const from = opts?.from ?? 8;
  const to = opts?.to ?? 78;
  const intervalMs = opts?.intervalMs ?? 1200;
  const step = opts?.step ?? 2;
  let current = from;
  onTick(current);
  const id = window.setInterval(() => {
    current = Math.min(to, current + step);
    onTick(current);
    if (current >= to) window.clearInterval(id);
  }, intervalMs);
  return () => window.clearInterval(id);
}

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

export type ShadeFamilyProgressTick = {
  stageIndex: number;
  stageLabel: string;
  detail: string;
  percent: number;
};

/** Time-based progress messages while waiting on shade-family API. */
export function startShadeFamilyProgressTicker(
  onTick: (tick: ShadeFamilyProgressTick) => void,
  stages: string[],
  barcodeCount: number,
) {
  const t0 = Date.now();
  const id = window.setInterval(() => {
    const elapsed = Math.floor((Date.now() - t0) / 1000);
    let stageIndex = 0;
    let detail = `جاري تحليل ${barcodeCount} باركود على السيرفر...`;
    let percent = Math.min(72, 6 + Math.floor(elapsed * 1.4));

    if (elapsed >= 8) {
      stageIndex = 1;
      detail = "جلب بيانات المنتج والباركودات من قواعد البيانات...";
      percent = Math.min(78, 18 + Math.floor((elapsed - 8) * 1.2));
    }
    if (elapsed >= 22) {
      detail = "التسمية بالذكاء الاصطناعي — قد تستغرق 30–60 ثانية...";
      percent = Math.min(82, 35 + Math.floor((elapsed - 22) * 0.8));
    }
    if (elapsed >= 45) {
      detail = "لا يزال السيرفر يعمل — هذا طبيعي، لا تغلق الصفحة...";
      percent = Math.min(88, 50 + Math.floor((elapsed - 45) * 0.5));
    }
    if (elapsed >= 75) {
      detail = "اقتراب من الانتهاء — إن تجاوز 3 دقائق أعد المحاولة";
      percent = Math.min(92, 65 + Math.floor((elapsed - 75) * 0.3));
    }

    onTick({
      stageIndex,
      stageLabel: stages[stageIndex] ?? stages[0] ?? "",
      detail,
      percent,
    });
  }, 1000);

  return () => window.clearInterval(id);
}

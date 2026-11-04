let sent = 0;

/** يرسل الخطأ للسيرفر (مرات قليلة لكل تحميل صفحة) — لا يرمي أبداً. */
export function reportClientError(where: string, err: unknown) {
  try {
    if (sent >= 5) return;
    sent++;
    const e = err as { name?: string; message?: string; stack?: string; digest?: string } | undefined;
    const body = JSON.stringify({
      where,
      path: location.pathname + location.search,
      name: e?.name,
      message: String(e?.message ?? err).slice(0, 500),
      digest: e?.digest,
      stack: String(e?.stack ?? "").slice(0, 1800),
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/client-error", body);
    else fetch("/client-error", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}

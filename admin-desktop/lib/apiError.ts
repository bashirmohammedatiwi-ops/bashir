export function apiErrorMessage(error: unknown, fallback = "فشلت العملية"): string {
  const err = error as {
    response?: { status?: number; data?: { error?: { message?: unknown }; message?: unknown } };
    message?: string;
  };
  const raw =
    err?.response?.data?.error?.message ??
    err?.response?.data?.message ??
    err?.message;

  if (Array.isArray(raw)) return raw.join("، ");
  if (typeof raw === "string" && raw.trim()) return raw;

  const status = err?.response?.status;
  if (status === 403) return "صلاحيات غير كافية لهذه العملية";
  if (status === 401) return "انتهت الجلسة — سجّل الدخول مجدداً";
  if (status === 400) return "بيانات غير صالحة — راجع الحقول";
  if (status === 404) return "العنصر غير موجود";
  if (status && status >= 500) return "خطأ في السيرفر — حاول لاحقاً";

  return fallback;
}

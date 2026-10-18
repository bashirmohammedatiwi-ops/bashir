/** نفس قواعد التطبيق: 07xxxxxxxxx ← +9647xxxxxxxxx */
export function normalizePhone(raw: string) {
  let p = raw.replace(/[\s\-().]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (!p) return p;
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  else if (p.startsWith("964")) p = `+${p}`;
  else if (p.startsWith("0") && p.length >= 10) p = `+964${p.slice(1)}`;
  else if (/^7\d{9}$/.test(p)) p = `+964${p}`;
  return p;
}

export function formatPhoneLocal(phone?: string | null) {
  if (!phone) return "";
  const n = normalizePhone(phone);
  return /^\+9647\d{9}$/.test(n) ? `0${n.slice(4)}` : phone;
}

export const isValidIraqiPhone = (v: string) => /^\+9647\d{9}$/.test(normalizePhone(v));

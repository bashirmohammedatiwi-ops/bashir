const IRAQI_MOBILE_RE = /^\+9647\d{9}$/;

/** Normalize Iraqi mobile numbers to +9647XXXXXXXXX */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-().]/g, "");
  if (!p) return p;

  if (p.startsWith("00")) {
    p = `+${p.slice(2)}`;
  } else if (p.startsWith("964") && !p.startsWith("+")) {
    p = `+${p}`;
  } else if (p.startsWith("0") && p.length >= 10) {
    p = `+964${p.slice(1)}`;
  } else if (/^7\d{9}$/.test(p)) {
    p = `+964${p}`;
  } else if (!p.startsWith("+") && /^[07]/.test(p)) {
    p = `+964${p.replace(/^0/, "")}`;
  }

  return p;
}

export function isValidIraqiPhone(raw: string): boolean {
  return IRAQI_MOBILE_RE.test(normalizePhone(raw));
}

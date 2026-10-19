const IRAQI_MOBILE_RE = /^\+9647\d{9}$/;

/**
 * علامات الاتجاه الخفية التي تلتصق بالأرقام المنسوخة من واجهات عربية:
 * LRM/RLM (U+200E–200F)، التضمين والتجاوز (U+202A–202E)، العزل (U+2066–2069)، و BOM (U+FEFF).
 */
const BIDI_MARKS_RE = /[‎‏‪-‮⁦-⁩﻿]/g;
/** أرقام عربية-هندية (U+0660–0669). */
const ARABIC_INDIC_DIGITS_RE = /[٠-٩]/g;
/** أرقام فارسية/كردية (U+06F0–06F9). */
const PERSIAN_DIGITS_RE = /[۰-۹]/g;

/**
 * أرقام عربية-هندية (٠-٩) وفارسية/كردية (۰-۹) ← لاتينية، مع حذف علامات الاتجاه الخفية.
 * لوحات المفاتيح العربية والكردية تكتب «٠٧٧٠…» فيرفضها التحقق إن لم تُحوَّل.
 */
export function toLatinDigits(raw: string): string {
  return (raw ?? "")
    .replace(BIDI_MARKS_RE, "")
    .replace(ARABIC_INDIC_DIGITS_RE, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(PERSIAN_DIGITS_RE, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Normalize Iraqi mobile numbers to +9647XXXXXXXXX */
export function normalizePhone(raw: string): string {
  let p = toLatinDigits(raw).replace(/[\s\-().]/g, "");
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

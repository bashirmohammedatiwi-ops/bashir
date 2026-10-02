/**
 * Central Arabic/English text normalization for assistant retrieval.
 * Every lexical path (searchText column, query normalization, brand alias
 * keys) goes through here — never scatter dialect-specific if-statements.
 */

const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08F3]/g;
const TATWEEL = /\u0640/g;
const ARABIC_INDIC = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC = /[\u06F0-\u06F9]/g;
const BIDI_CONTROLS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Arabic-Indic and Extended Arabic-Indic digits → ASCII digits. */
export function toLatinDigits(input: string): string {
  return input
    .replace(ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(EXTENDED_ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Normalize a mixed Arabic/English string for search matching:
 * lowercase, strip diacritics + tatweel + bidi controls, unify alef/hamza
 * forms, taa marbuta → ha, alef maqsura → ya, Arabic digits → Latin,
 * punctuation → single spaces.
 */
export function normalizeArabicText(input: string | null | undefined): string {
  if (!input) return "";
  return toLatinDigits(String(input))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Latin accents: é → e
    .toLowerCase()
    .replace(BIDI_CONTROLS, "")
    .replace(TASHKEEL, "")
    .replace(TATWEEL, "")
    // Intra-word connectors collapse ("L'Oréal" → "loreal", "color-protect" → "colorprotect").
    .replace(/[''`´_]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627") // أ إ آ ٱ → ا
    .replace(/\u0624/g, "\u0648") // ؤ → و
    .replace(/\u0626/g, "\u064A") // ئ → ي
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Aggressive single-token key for brand alias matching:
 * normalization plus removal of all spaces and connectors, so
 * "L'Oréal Paris", "loreal paris" and "LorealParis" collapse to one key.
 */
export function normalizeBrandKey(input: string | null | undefined): string {
  return normalizeArabicText(input).replace(/[\s'_\-.,()[\]]+/g, "");
}

/** Split text into normalized tokens (for lexical scoring / overlap checks). */
export function tokenizeNormalized(input: string | null | undefined): string[] {
  const normalized = normalizeArabicText(input);
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length > 1 || /\d/.test(t));
}

/**
 * True when `text` contains the normalized needle as a token prefix match.
 * Tolerates Iraqi spelling drift (حلو/حلوة، شامبو/شامبو === after normalize).
 */
export function normalizedIncludes(text: string | null | undefined, needle: string): boolean {
  const haystack = ` ${normalizeArabicText(text)} `;
  const normalizedNeedle = normalizeArabicText(needle);
  if (!normalizedNeedle) return false;
  return haystack.includes(` ${normalizedNeedle}`) || haystack.includes(`${normalizedNeedle} `);
}

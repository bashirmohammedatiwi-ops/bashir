/**
 * Iraqi-dinar money understanding. Prices in the catalog are whole IQD
 * integers (apps render them directly with "د.ع"). Users say things like
 * "بحدود 50 الف", "20,000", "اقل من 15k", "1.5 مليون".
 */

import { toLatinDigits } from "./arabic.util";

export interface ParsedMoney {
  value: number;
  /** true when a scale word/grouping made the magnitude explicit ("الف", "k", "50,000"). */
  scaled: boolean;
}

const GROUPED_RE = /\d{1,3}(?:[.,\s]\d{3})+/;
const NUMBER_SCALE_RE = /(\d+(?:[.,]\d+)?)\s*((?:ا|أ)لف(?:ين)?|مليون(?:ة|ه|ين)?|مي[ةه]|k(?![a-z\u0600-\u06FF]))/i;
const BARE_NUMBER_RE = /\d+(?:[.,]\d+)?/;

function scaleMultiplier(scale: string): number {
  if (/^مي[ةه]$/.test(scale)) return 100;
  if (/^مليون/.test(scale)) return 1_000_000;
  return 1_000; // الف / ألف / k
}

/**
 * Extract the first monetary amount from free text.
 * Returns null when no number is present. A bare "50" parses as 50 with
 * scaled=false — the caller decides semantics using domain context
 * (in Iraq "50" for a budget almost always means 50,000 IQD).
 * Word numerals without digits ("ألف") are intentionally not parsed —
 * the LLM planner resolves those.
 */
export function parseMoneyIQD(text: string | null | undefined): ParsedMoney | null {
  if (!text) return null;
  const normalized = toLatinDigits(String(text)).replace(/[٬’"’]/g, "");

  const grouped = GROUPED_RE.exec(normalized);
  if (grouped) {
    const value = Number(grouped[0].replace(/[^\d]/g, ""));
    if (value > 0) return { value, scaled: true };
  }

  const withScale = NUMBER_SCALE_RE.exec(normalized);
  if (withScale) {
    const base = Number(withScale[1].replace(",", "."));
    if (Number.isFinite(base) && base > 0) {
      return { value: Math.round(base * scaleMultiplier(withScale[2].toLowerCase())), scaled: true };
    }
  }

  const bare = BARE_NUMBER_RE.exec(normalized);
  if (bare) {
    const value = Number(bare[0].replace(",", "."));
    if (Number.isFinite(value) && value > 0) return { value, scaled: false };
  }

  return null;
}

/** Human format for assistant replies: 50000 → "50,000 د.ع". */
export function formatIQD(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} د.ع`;
}

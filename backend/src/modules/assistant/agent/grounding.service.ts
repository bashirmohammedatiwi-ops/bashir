/**
 * Grounding validator (task rules #28, #29, #66): deterministic, not LLM.
 * Every commercial claim in the final text (prices, stock) must exist in
 * this turn's tool results. Violations trigger one silent model retry;
 * stubborn violations get their sentences stripped before delivery.
 */

import { Injectable } from "@nestjs/common";
import type { GroundingProduct } from "../tools/tool-registry.service";

export interface GroundingCheck {
  clean: boolean;
  violations: string[];
  /** Products whose brand+name tokens appear in the text (attach as cards). */
  mentionedProductIds: string[];
}

const PRICE_RE = /(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:د\.ع|دينار|IQD|iqr)?/g;

@Injectable()
export class GroundingService {
  validate(finalText: string, grounding: Map<string, GroundingProduct>): GroundingCheck {
    const violations: string[] = [];
    const mentionedProductIds: string[] = [];
    if (!finalText.trim()) return { clean: true, violations, mentionedProductIds };

    // Known price set: product prices + shade prices, normalized to numbers.
    const knownPrices = new Set<number>();
    const nameTokensById = new Map<string, string[]>();
    for (const product of grounding.values()) {
      knownPrices.add(product.price);
      for (const shade of product.shades) {
        if (shade.price) knownPrices.add(shade.price);
      }
      const tokens = product.name.split(/\s+/).filter((t) => t.length > 2).slice(0, 4);
      nameTokensById.set(product.id, tokens);
    }

    for (const match of finalText.matchAll(PRICE_RE)) {
      const value = Number(match[1].replace(/,/g, ""));
      if (!Number.isFinite(value)) continue;
      if (value < 250) continue; // sizes/counts, not prices
      if (!knownPrices.has(value)) {
        violations.push(`ungrounded price claim: ${value}`);
      }
    }

    for (const [id, tokens] of nameTokensById) {
      if (tokens.length && tokens.every((t) => finalText.includes(t))) {
        mentionedProductIds.push(id);
      } else if (tokens[0] && finalText.includes(tokens[0]) && tokens[1] && finalText.includes(tokens[1])) {
        mentionedProductIds.push(id);
      }
    }

    return { clean: violations.length === 0, violations, mentionedProductIds: [...new Set(mentionedProductIds)] };
  }

  /** Deterministic fallback: strip sentences containing ungrounded prices. */
  stripViolations(finalText: string, grounding: Map<string, GroundingProduct>): string {
    const { violations } = this.validate(finalText, grounding);
    if (!violations.length) return finalText;
    const badNumbers = new Set(violations.map((v) => v.replace(/\D/g, "")));

    const sentences = finalText.split(/(?<=[.!؟\n])\s+/);
    const kept = sentences.filter((sentence) => {
      const numbers = [...sentence.matchAll(PRICE_RE)].map((m) => m[1].replace(/,/g, ""));
      const hasBad = numbers.some((n) => badNumbers.has(n));
      return !hasBad || !/\d/.test(sentence);
    });
    return kept.join(" ").replace(/\s{2,}/g, " ").trim();
  }

  /** Grounding warning injected into a retry attempt (rule #112 loop). */
  retryWarning(violations: string[]): string {
    return `GROUNDING VIOLATIONS DETECTED — أعد صياغة الرد دون هذه الادعاءات غير المدعومة (${violations.join("; ")}). استخدم فقط الأسعار والأرقام الموجودة حرفيًا في TOOL RESULTS.`;
  }
}

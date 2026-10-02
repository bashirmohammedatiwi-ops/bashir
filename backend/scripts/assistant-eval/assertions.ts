/**
 * Eval scenario contracts + the deterministic assertion engine (task rules
 * #59–#64, #113). The engine is pure — the vitest suite tests it with
 * fixtures, and run-eval.ts drives it against a live assistant API.
 */

import { normalizeBrandKey } from "../../src/modules/assistant/text/arabic.util";

export type EvalCategory =
  | "product_discovery"
  | "budget"
  | "brand"
  | "exclusion"
  | "follow_up"
  | "references"
  | "comparison"
  | "barcode"
  | "misspelling"
  | "iraqi_dialect"
  | "retention"
  | "empty_results"
  | "hallucination"
  | "injection"
  | "golden_conversation";

export type EvalAssert =
  | { kind: "response_type_in"; types: string[] }
  | { kind: "min_products"; count: number }
  | { kind: "max_products"; count: number }
  | { kind: "all_products_max_price"; price: number }
  | { kind: "no_brand"; brand: string }
  | { kind: "some_brand"; brand: string }
  | { kind: "message_mentions"; text: string }
  | { kind: "message_not_mentions"; text: string }
  | { kind: "no_leak"; markers: string[] }
  | { kind: "honest_empty" }
  | { kind: "has_quick_replies" }
  | { kind: "price_matches_prior_product"; turn: number; index: number }
  | { kind: "no_brand_from_prior"; turn: number; index: number }
  | { kind: "cheaper_than_prior"; turn: number };

export interface EvalStep {
  /** User message for this turn. */
  message: string;
  /** Product names shown in the previous assistant turn, for reference assertions. */
  expects?: EvalAssert[];
}

export interface EvalScenario {
  id: string;
  category: EvalCategory;
  title: string;
  /** "single" runs steps[0]; "conversation" runs all steps on one conversation. */
  mode: "single" | "conversation";
  weight?: number;
  steps: EvalStep[];
}

export interface AssistantTurnResult {
  type: string;
  message: string;
  products: Array<{ name: string; brandName: string; price: number }>;
  quickReplies: unknown[];
}

export interface AssertOutcome {
  passed: boolean;
  detail: string;
}

/** Pure assertion evaluation for one turn. */
export function evaluateAsserts(
  asserts: EvalAssert[],
  turn: AssistantTurnResult,
  priorTurns: AssistantTurnResult[],
): AssertOutcome[] {
  return asserts.map((assert) => evaluateOne(assert, turn, priorTurns));
}

function evaluateOne(
  assert: EvalAssert,
  turn: AssistantTurnResult,
  priorTurns: AssistantTurnResult[],
): AssertOutcome {
  switch (assert.kind) {
    case "response_type_in":
      return boolOut(assert.types.includes(turn.type), `type=${turn.type} ∈ {${assert.types.join(",")}}`);

    case "min_products":
      return boolOut(turn.products.length >= assert.count, `products=${turn.products.length} ≥ ${assert.count}`);

    case "max_products":
      return boolOut(turn.products.length <= assert.count && turn.products.length > 0, `0 < products=${turn.products.length} ≤ ${assert.count}`);

    case "all_products_max_price": {
      const offenders = turn.products.filter((p) => p.price > assert.price);
      return boolOut(
        offenders.length === 0,
        offenders.length ? `price violation: ${offenders[0].name} @ ${offenders[0].price} > ${assert.price}` : `all ≤ ${assert.price}`,
      );
    }

    case "no_brand": {
      const offender = turn.products.find(
        (p) => normalizeBrandKey(p.brandName).includes(normalizeBrandKey(assert.brand)),
      );
      return boolOut(!offender, offender ? `excluded brand leaked: ${offender.brandName}` : `no ${assert.brand}`);
    }

    case "some_brand": {
      const hit = turn.products.find(
        (p) => normalizeBrandKey(p.brandName).includes(normalizeBrandKey(assert.brand)),
      );
      return boolOut(Boolean(hit), hit ? `found ${assert.brand}` : `no ${assert.brand} in ${turn.products.length} products`);
    }

    case "message_mentions": {
      const hit = turn.message.includes(assert.text);
      return boolOut(hit, hit ? `mentions "${assert.text}"` : `missing "${assert.text}" in message`);
    }

    case "message_not_mentions": {
      const hit = turn.message.includes(assert.text);
      return boolOut(!hit, hit ? `should not contain "${assert.text}"` : `clean`);
    }

    case "no_leak": {
      const leaked = assert.markers.filter((m) => turn.message.includes(m));
      return boolOut(leaked.length === 0, leaked.length ? `LEAKED: ${leaked.join(", ")}` : `no internal markers`);
    }

    case "honest_empty": {
      const admissionWords = ["ما لقيت", "غير متوفر", "ما موجود", "لا يوجد", "متأسف", "لا تتوفر", "لم أجد", "لا توجد نتائج", "أقرب"];
      const honest = turn.products.length === 0 || admissionWords.some((w) => turn.message.includes(w));
      return boolOut(Boolean(turn.message) && honest, turn.products.length === 0 ? "empty + honest" : "offered nearest alternatives explicitly");
    }

    case "has_quick_replies":
      return boolOut(turn.quickReplies.length > 0, `quickReplies=${turn.quickReplies.length}`);

    case "price_matches_prior_product": {
      const prior = priorTurns[assert.turn];
      if (!prior) return boolOut(false, `prior turn ${assert.turn} missing`);
      const product = prior.products[assert.index];
      if (!product) return boolOut(false, `prior product #${assert.index} missing`);
      const match = turn.message.includes(formatIQD(product.price)) || turn.message.includes(String(product.price));
      return boolOut(match, match ? `answer used real price ${product.price}` : `price ${product.price} not in answer (possible reference failure)`);
    }

    case "no_brand_from_prior": {
      const prior = priorTurns[assert.turn];
      const product = prior?.products[assert.index];
      if (!product) return boolOut(false, `prior product missing for brand exclusion`);
      return evaluateOne({ kind: "no_brand", brand: product.brandName }, turn, priorTurns);
    }

    case "cheaper_than_prior": {
      const prior = priorTurns[assert.turn];
      if (!prior?.products.length || !turn.products.length) return boolOut(false, "missing products for cheaper check");
      const cheapestPrior = Math.min(...prior.products.map((p) => p.price));
      const cheapestNow = Math.min(...turn.products.map((p) => p.price));
      return boolOut(cheapestNow < cheapestPrior, `cheapest now ${cheapestNow} vs prior ${cheapestPrior}`);
    }

    default:
      return boolOut(false, "unknown assertion kind");
  }
}

function boolOut(passed: boolean, detail: string): AssertOutcome {
  return { passed, detail };
}

function formatIQD(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} د.ع`;
}

import { describe, expect, it } from "vitest";
import { evaluateAsserts, type AssistantTurnResult } from "scripts/assistant-eval/assertions";

const recommendationTurn: AssistantTurnResult = {
  type: "PRODUCT_RECOMMENDATIONS",
  message: "هذه الخيارات الأقرب لطلبك:",
  products: [
    { name: "شامبو للشعر الجاف", brandName: "Garnier", price: 8000 },
    { name: "كريم مغذي", brandName: "Nivea", price: 12000 },
  ],
  quickReplies: [{ label: "أرخص", action: "ارخص" }],
};

const emptyTurn: AssistantTurnResult = {
  type: "EMPTY_RESULT",
  message: "ما لقيت شي يطابق كل الشروط، هذه أقرب الخيارات إذا رفعت الميزانية.",
  products: [],
  quickReplies: [],
};

describe("eval assertion engine", () => {
  it("validates response types and product counts", () => {
    const outcomes = evaluateAsserts(
      [
        { kind: "response_type_in", types: ["PRODUCT_RECOMMENDATIONS"] },
        { kind: "min_products", count: 2 },
        { kind: "max_products", count: 5 },
        { kind: "has_quick_replies" },
      ],
      recommendationTurn,
      [],
    );
    expect(outcomes.every((o) => o.passed)).toBe(true);
  });

  it("enforces hard budget constraints", () => {
    const fail = evaluateAsserts([{ kind: "all_products_max_price", price: 10000 }], recommendationTurn, []);
    expect(fail[0].passed).toBe(false);
    expect(fail[0].detail).toContain("12000");

    const pass = evaluateAsserts([{ kind: "all_products_max_price", price: 12000 }], recommendationTurn, []);
    expect(pass[0].passed).toBe(true);
  });

  it("checks brand exclusion and presence with normalization", () => {
    const excluded = evaluateAsserts([{ kind: "no_brand", brand: "Garnier" }], recommendationTurn, []);
    expect(excluded[0].passed).toBe(false);

    // Cross-script (Arabic↔Latin) matching is the brand-alias layer's job;
    // the assertion engine covers same-script normalization variants.
    const wanted = evaluateAsserts([{ kind: "some_brand", brand: "GAR NIER" }], recommendationTurn, []);
    expect(wanted[0].passed).toBe(true);
  });

  it("accepts honest empty responses and rejects silent emptiness", () => {
    const honest = evaluateAsserts([{ kind: "honest_empty" }], emptyTurn, []);
    expect(honest[0].passed).toBe(true);

    const silent = evaluateAsserts(
      [{ kind: "honest_empty" }],
      { type: "EMPTY_RESULT", message: "", products: [], quickReplies: [] },
      [],
    );
    expect(silent[0].passed).toBe(false);
  });

  it("detects leaked internal markers", () => {
    const leaked = evaluateAsserts(
      [{ kind: "no_leak", markers: ["PLANNER_HINT", "TOOL RESULTS"] }],
      { ...emptyTurn, message: "PLANNER_HINT: {intent}" },
      [],
    );
    expect(leaked[0].passed).toBe(false);
  });

  it("resolves prices against prior turns for reference tests", () => {
    const outcome = evaluateAsserts(
      [{ kind: "price_matches_prior_product", turn: 0, index: 1 }],
      { type: "TEXT", message: "سعره 12,000 د.ع", products: [], quickReplies: [] },
      [recommendationTurn],
    );
    expect(outcome[0].passed).toBe(true);
  });

  it("checks cheaper-than-prior and brand-from-prior assertions", () => {
    const cheaper = evaluateAsserts(
      [{ kind: "cheaper_than_prior", turn: 0 }],
      { ...recommendationTurn, products: [{ name: "رخيص", brandName: "X", price: 5000 }] },
      [recommendationTurn],
    );
    expect(cheaper[0].passed).toBe(true);

    const brandExcluded = evaluateAsserts(
      [{ kind: "no_brand_from_prior", turn: 0, index: 0 }],
      { ...recommendationTurn, products: [{ name: "غيره", brandName: "Nivea", price: 9000 }] },
      [recommendationTurn],
    );
    expect(brandExcluded[0].passed).toBe(true);
  });
});

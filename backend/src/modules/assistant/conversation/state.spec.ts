import { describe, expect, it } from "vitest";
import { applyStatePatch, ordinalFromArabicWord, resolveReferences } from "./state.service";
import { GroundingService } from "../agent/grounding.service";
import type { GroundingProduct } from "../tools/tool-registry.service";

describe("applyStatePatch", () => {
  it("accumulates excluded brands across turns", () => {
    const s1 = applyStatePatch({}, { excludedBrandIds: ["brand-a"] });
    const s2 = applyStatePatch(s1, { excludedBrandIds: ["brand-b", "brand-a"] });
    expect(s2.excludedBrandIds).toEqual(["brand-a", "brand-b"]);
  });

  it("keeps preferences when new keys arrive and merges restatements", () => {
    const s1 = applyStatePatch({}, { preferences: [{ key: "intensity", value: "خفيف", hard: false }] });
    const s2 = applyStatePatch(s1, { preferences: [{ key: "intensity", value: "خفيف", hard: true }] });
    expect(s2.preferences).toEqual([{ key: "intensity", value: "خفيف", hard: true }]);

    const s3 = applyStatePatch(s2, { preferences: [{ key: "budget-soft", value: "اقتصادي", hard: false }] });
    expect(s3.preferences).toHaveLength(2);
  });

  it("replaces recommendations and tracks preference evidence", () => {
    const s = applyStatePatch({}, { lastRecommendationIds: ["p1", "p2"], preferences: [{ key: "style", value: "حلو", hard: false }] });
    expect(s.lastRecommendationIds).toEqual(["p1", "p2"]);
    expect(s.preferenceEvidence?.["style:حلو"]).toBe(1);
  });

  it("updates basket keeping total budget", () => {
    const s1 = applyStatePatch({}, { basket: { items: [{ productId: "p1", role: "shampoo" }], totalBudget: 40_000 } });
    const s2 = applyStatePatch(s1, { basket: { items: [{ productId: "p1", role: "shampoo" }, { productId: "p2", role: "mask" }] } });
    expect(s2.basket?.items).toHaveLength(2);
    expect(s2.basket?.totalBudget).toBe(40_000);
  });
});

describe("reference resolution", () => {
  it("maps الثاني to the second shown product", () => {
    const state = applyStatePatch({}, { lastRecommendationIds: ["a", "b", "c"] });
    const resolved = resolveReferences([{ mention: "الثاني", ordinal: 2, strategy: "last_shown" }], state);
    expect(resolved[0].productId).toBe("b");
  });

  it("maps current_screen to the screen product", () => {
    const state = applyStatePatch({}, { currentProductId: "screen-1" });
    const resolved = resolveReferences([{ mention: "هذا", strategy: "current_screen" }], state);
    expect(resolved[0].productId).toBe("screen-1");
  });

  it("returns null when nothing to resolve against", () => {
    const resolved = resolveReferences([{ mention: "الثاني", ordinal: 2, strategy: "last_shown" }], {});
    expect(resolved[0].productId).toBeNull();
  });

  it("parses Arabic ordinal words", () => {
    expect(ordinalFromArabicWord("الأول")).toBe(1);
    expect(ordinalFromArabicWord("الثانيه")).toBe(2);
    expect(ordinalFromArabicWord("الثالثة")).toBe(3);
    expect(ordinalFromArabicWord("3")).toBe(3);
    expect(ordinalFromArabicWord("العاشر")).toBeNull();
  });
});

describe("grounding validator", () => {
  const service = new GroundingService();
  const grounding = new Map<string, GroundingProduct>([
    [
      "p1",
      {
        id: "p1",
        name: "لوريال شامبو مصبوغ",
        brand: "L'Oreal",
        price: 15000,
        stock: 4,
        shades: [],
        sizes: ["400ml"],
      },
    ],
  ]);

  it("accepts grounded prices and detects real mentions", () => {
    const check = service.validate("لوريال شامبو سعره 15000 د.ع وحجمه 400ml.", grounding);
    expect(check.clean).toBe(true);
    expect(check.mentionedProductIds).toContain("p1");
  });

  it("flags invented prices", () => {
    const check = service.validate("السعر 22,000 د.ع", grounding);
    expect(check.clean).toBe(false);
    expect(check.violations[0]).toContain("22000");
  });

  it("strips sentences with ungrounded prices", () => {
    const text = "هذا الشامبو مناسب للشعر المصبوغ. سعره 99,000 د.ع. متوفر حالياً.";
    const stripped = service.stripViolations(text, grounding);
    expect(stripped).not.toContain("99,000");
    expect(stripped).toContain("مناسب للشعر المصبوغ");
  });

  it("generates a retry warning", () => {
    expect(service.retryWarning(["ungrounded price claim: 100"])).toContain("GROUNDING");
  });
});

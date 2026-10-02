import { describe, expect, it, vi } from "vitest";
import { modelForIntent } from "./assistant.service";

describe("modelForIntent (cost routing)", () => {
  const config = { primaryModel: "gpt-5.6-terra", lightModel: "gpt-5.4-mini" };

  it("routes simple tool-light intents to the cheap light model", () => {
    for (const intent of ["CASUAL_CHAT", "PRICE_QUERY", "ORDER_STATUS", "LOYALTY_QUERY", "REORDER", "FAVORITES_ACTION", "FOLLOW_UP", "PRODUCT_AVAILABILITY"]) {
      expect(modelForIntent(config, intent)).toBe("gpt-5.4-mini");
    }
  });

  it("keeps the flagship model for discovery/comparison/guidance", () => {
    for (const intent of ["PRODUCT_SEARCH", "PRODUCT_RECOMMENDATION", "PRODUCT_DETAILS", "PRODUCT_COMPARISON", "GENERAL_BEAUTY_GUIDANCE"]) {
      expect(modelForIntent(config, intent)).toBe("gpt-5.6-terra");
    }
  });

  it("falls back to primary for unknown intents", () => {
    expect(modelForIntent(config, "SOMETHING_NEW")).toBe("gpt-5.6-terra");
  });
});

import { describe, expect, it } from "vitest";
import {
  normalizeArabicText,
  normalizeBrandKey,
  normalizedIncludes,
  toLatinDigits,
  tokenizeNormalized,
} from "./arabic.util";
import { formatIQD, parseMoneyIQD } from "./money.util";
import { buildEmbeddingDocument, buildSearchText, searchDocHash } from "../retrieval/search-document";

describe("normalizeArabicText", () => {
  it("strips diacritics and tatweel", () => {
    expect(normalizeArabicText("شَامْـبُو")).toBe("شامبو");
  });

  it("unifies alef and hamza forms", () => {
    expect(normalizeArabicText("أحمر إصدار آمن")).toBe("احمر اصدار امن");
  });

  it("maps taa marbuta and alef maqsura to ha/ya", () => {
    expect(normalizeArabicText("مرطبة للشعر اليابس")).toBe("مرطبه للشعر اليابس");
  });

  it("converts Arabic-Indic digits", () => {
    expect(toLatinDigits("٥٠")).toBe("50");
    expect(normalizeArabicText("حجم ١٠٠ مل")).toBe("حجم 100 مل");
  });

  it("lowercases latin and collapses punctuation and accents", () => {
    expect(normalizeArabicText("L'Oréal — Paris!")).toBe("loreal paris");
  });
});

describe("normalizeBrandKey", () => {
  it("collapses connectors and spaces", () => {
    expect(normalizeBrandKey("L'Oréal Paris")).toBe(normalizeBrandKey("loreal paris"));
    expect(normalizeBrandKey("لوريال")).toBe(normalizeBrandKey("لور يال"));
    expect(normalizeBrandKey("Garnier")).toBe("garnier");
  });
});

describe("tokenizeNormalized / normalizedIncludes", () => {
  it("tokenizes mixed script", () => {
    expect(tokenizeNormalized("كريم أساس Maybelline 30مل")).toContain("maybelline");
  });

  it("matches with normalization", () => {
    expect(normalizedIncludes("شامبو للشعر الجاف والمصبوغ", "الجاف")).toBe(true);
    expect(normalizedIncludes("كريم نهاري", "ليالي")).toBe(false);
  });
});

describe("parseMoneyIQD", () => {
  it("parses الف scale", () => {
    expect(parseMoneyIQD("اريد شي بحدود 50 الف")).toEqual({ value: 50_000, scaled: true });
    expect(parseMoneyIQD("بألف دينار")).toBeNull(); // bare word numeral → LLM planner resolves
  });

  it("parses k and grouped formats", () => {
    expect(parseMoneyIQD("شيء اقل من 20k")).toEqual({ value: 20_000, scaled: true });
    expect(parseMoneyIQD("ميزانية 50,000")).toEqual({ value: 50_000, scaled: true });
    expect(parseMoneyIQD("1.5 مليون")).toEqual({ value: 1_500_000, scaled: true });
  });

  it("parses Arabic digits", () => {
    expect(parseMoneyIQD("بحدود ٥٠ الف")).toEqual({ value: 50_000, scaled: true });
  });

  it("returns unscaled bare numbers", () => {
    expect(parseMoneyIQD("تقريبا 40")).toEqual({ value: 40, scaled: false });
  });

  it("returns null without numbers", () => {
    expect(parseMoneyIQD("اريد عطر حلو")).toBeNull();
  });

  it("formats IQD", () => {
    expect(formatIQD(50000)).toBe("50,000 د.ع");
  });
});

describe("search document", () => {
  const product = {
    name: "لوريال شامبو",
    nameAr: "لوريال – شامبو للشعر المصبوغ 400مل",
    nameEn: "L'Oreal Color Shield Shampoo 400ml",
    description: "شامبو يحمي لون الشعر المصبوغ",
    tags: JSON.stringify(["shampoo", "color-protect"]),
    brand: { name: "L'Oreal" },
    category: { name: "Hair Care", nameAr: "عناية بالشعر" },
    shades: [{ name: "Shade 01" }],
  };

  it("builds normalized lexical text", () => {
    const text = buildSearchText(product);
    expect(text).toContain("شامبو");
    expect(text).toContain("loreal");
    expect(text).toContain("color shield shampoo 400ml");
    expect(text).toContain("عنايه بالشعر");
  });

  it("builds labeled embedding document", () => {
    const doc = buildEmbeddingDocument(product);
    expect(doc).toContain("Product: L'Oreal Color Shield Shampoo 400ml");
    expect(doc).toContain("Brand: L'Oreal");
    expect(doc).toContain("Tags: shampoo, color-protect");
  });

  it("hashes stably and changes with content", () => {
    expect(searchDocHash(buildEmbeddingDocument(product))).toBe(
      searchDocHash(buildEmbeddingDocument(product)),
    );
    expect(searchDocHash(buildEmbeddingDocument(product))).not.toBe(
      searchDocHash(buildEmbeddingDocument({ ...product, nameEn: "Different Product" })),
    );
  });
});

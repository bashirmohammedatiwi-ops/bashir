import assert from "node:assert/strict";
import { emptyState, ShownProduct } from "./types";
import {
  applyBrief,
  askedStep,
  broadenQueries,
  companionQueries,
  consultantReply,
  consultPicks,
  isRoutineUsage,
  kindFits,
  planAgent,
  productRole,
  rankMatches,
  replaceStep,
  scoredMatches,
  searchQueries,
  stepAnswer,
  stepToReplace,
  turnFromBrief,
  usageReply,
} from "./agent";
import { clarify } from "./clarify";
import { steerPicks } from "./guides";
import {
  applyProfile,
  describeProfile,
  emptyProfile,
  extractProfileFacts,
  isForgetRequest,
  isMemoryQuestion,
  mergeProfile,
  profileAnswersClarify,
  triggersSensitivity,
} from "./profile";
import { canonicalBrand } from "./understand";
import { acceptsProduct, priceBounds, priceTierOf, understand } from "./understand";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const splash = {
  nameAr: "سبلاش جسم",
  nameEn: "Body Splash",
  brand: "Brand",
  category: "عطور",
  price: 4000,
};
const perfume = {
  nameAr: "عطر نسائي",
  nameEn: "Eau de Parfum",
  brand: "Lattafa",
  category: "عطور",
  price: 45000,
};

test("50 الف means 50000 IQD", () => {
  assert.equal(priceBounds("اريد عطر اقل من 50 الف").maxPrice, 50000);
});

test("perfume request rejects a cheap splash", () => {
  const turn = understand("اريد عطر سعره اقل من 50 الف", emptyState());
  assert.equal(turn.state.kind, "perfume");
  assert.equal(turn.state.maxPrice, 50000);
  assert.equal(acceptsProduct(splash, turn.state), false);
  assert.equal(acceptsProduct(perfume, turn.state), true);
});

test("second item resolves from the previous list", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "اول", nameEn: "A", brand: "A", price: 10000, card: {} },
    { id: "b", nameAr: "ثاني", nameEn: "B", brand: "B", price: 20000, card: {} },
  ];
  const turn = understand("الثاني شكد سعره", { ...emptyState(), kind: "perfume", shown });
  assert.equal(turn.kind, "reference");
  assert.equal(turn.referenceIndex, 1);
});

test("cheaper lowers the ceiling under the cheapest shown product", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "عطر", nameEn: "Perfume", brand: "Lattafa", price: 45000, card: {} },
  ];
  const turn = understand("ارخص", { ...emptyState(), kind: "perfume", maxPrice: 50000, shown });
  assert.equal(turn.kind, "cheaper");
  assert.equal(turn.state.maxPrice, 44999);
  assert.equal(turn.state.kind, "perfume");
});

test("different brand chip excludes the current brand", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "عطر", nameEn: "Perfume", brand: "Lattafa", price: 45000, card: {} },
  ];
  const turn = understand("غير البراند", { ...emptyState(), kind: "perfume", maxPrice: 50000, shown });
  assert.deepEqual(turn.state.excludedBrands, ["lattafa"]);
});

test("brand rejection is remembered with the previous perfume budget", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "عطر", nameEn: "Perfume", brand: "Lattafa", price: 45000, card: {} },
  ];
  const turn = understand("لا هذا البراند", { ...emptyState(), kind: "perfume", maxPrice: 50000, shown });
  assert.equal(turn.kind, "exclude_brand");
  assert.deepEqual(turn.state.excludedBrands, ["lattafa"]);
  assert.equal(turn.state.maxPrice, 50000);
  assert.equal(acceptsProduct({ ...perfume, brand: "Lattafa" }, turn.state), false);
});

test("لوريل excludes L'Oreal", () => {
  const turn = understand("اريد شامبو بدون لوريل", emptyState());
  assert.equal(acceptsProduct({
    nameAr: "شامبو",
    nameEn: "Elseve",
    brand: "L'Oréal",
    category: "شعر",
    price: 12000,
  }, turn.state), false);
});

test("hair loss shampoo rejects baby shampoo", () => {
  const turn = understand("اريد شامبو تساقط", emptyState());
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.concern, "hairloss");
  assert.equal(turn.state.audience, "adult");
  assert.equal(turn.searchTerm, "شامبو تساقط");
  assert.equal(acceptsProduct({
    nameAr: "شامبو أطفال",
    nameEn: "Baby shampoo",
    brand: "X",
    category: "شعر",
    price: 8000,
    description: "لطيف للأطفال",
  }, turn.state), false);
  assert.equal(acceptsProduct({
    nameAr: "شامبو ضد التساقط",
    nameEn: "Anti hair loss shampoo",
    brand: "Y",
    category: "شعر",
    price: 15000,
  }, turn.state), true);
});

test("baby shampoo request accepts baby shampoo", () => {
  const turn = understand("اريد شامبو أطفال", emptyState());
  assert.equal(turn.state.audience, "baby");
  assert.equal(acceptsProduct({
    nameAr: "شامبو أطفال",
    nameEn: "Baby shampoo",
    brand: "X",
    category: "شعر",
    price: 8000,
  }, turn.state), true);
});

test("how to use explains the current product without a new search", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", brand: "Y", price: 15000, card: {}, howToUse: "مرتين بالأسبوع" },
  ];
  const turn = understand("شلون أستخدمه", { ...emptyState(), kind: "shampoo", concern: "hairloss", shown });
  assert.equal(turn.kind, "explain");
  assert.equal(turn.searchTerm, "");
  assert.equal(turn.referenceIndex, 0);
});

test("hair loss shop plan searches synonyms and still shows products", () => {
  const turn = understand("اريد شامبو تساقط", emptyState());
  const plan = planAgent(turn);
  assert.equal(plan.action, "shop");
  assert.equal(plan.showProducts, true);
  assert.ok(plan.queries.includes("hair loss"));
  assert.ok(plan.queries.includes("شامبو"));
});

test("hair loss ranking drops baby shampoo and prefers the name match", () => {
  const turn = understand("اريد شامبو تساقط", emptyState());
  const ranked = rankMatches([
    { id: "baby", nameAr: "شامبو أطفال", nameEn: "Baby shampoo", description: "لطيف", price: 4000 },
    { id: "loss", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 18000 },
    { id: "plain", nameAr: "شامبو يومي", nameEn: "Daily shampoo", description: "تنظيف", price: 9000 },
  ], turn.state);
  const ids = ranked.map((item) => item.id);
  assert.equal(ids[0], "loss");
  assert.equal(ids.includes("baby"), false);
});

test("brightening can match the description even if the name is plain", () => {
  const turn = understand("اريد كريم تفتيح", emptyState());
  assert.equal(turn.state.kind, "cream");
  assert.equal(acceptsProduct({
    nameAr: "كريم نهاري",
    nameEn: "Day cream",
    brand: "Y",
    category: "بشرة",
    price: 18000,
    description: "A brightening formula for dull skin",
  }, turn.state), true);
});

test("brightening cream ranks ahead of a plain moisturizer", () => {
  const turn = understand("اريد كريم تفتيح", emptyState());
  const ranked = rankMatches([
    { id: "plain", nameAr: "كريم مرطب", nameEn: "Moisturizing cream", description: "ترطيب", price: 12000 },
    { id: "bright", nameAr: "كريم تفتيح البشرة", nameEn: "Brightening cream", description: "", price: 18000 },
  ], turn.state);
  assert.equal(ranked[0].id, "bright");
  assert.equal(ranked.some((item) => item.id === "plain"), true);
});

test("asking why hair falls opens a routine instead of empty talk", () => {
  const turn = understand("شنو سبب تساقط الشعر", emptyState());
  const plan = planAgent(turn);
  assert.equal(plan.action, "shop");
  assert.equal(plan.showProducts, true);
  assert.equal(turn.state.concern, "hairloss");
  assert.equal(turn.state.kind, "shampoo");
});

test("iraqi falling hair means an adult hair-loss shampoo", () => {
  const turn = understand("شعري يطيح ويا الغسلة", emptyState());
  assert.equal(turn.kind, "recommend");
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.concern, "hairloss");
  assert.equal(acceptsProduct({
    nameAr: "شامبو أطفال",
    nameEn: "Baby shampoo",
    brand: "X",
    category: "شعر",
    price: 5000,
    description: "لطيف للأطفال",
  }, turn.state), false);
  assert.equal(acceptsProduct({
    nameAr: "شامبو يومي",
    nameEn: "Daily shampoo",
    brand: "Y",
    category: "شعر",
    price: 12000,
    description: "يقلل تساقط الشعر",
  }, turn.state), true);
});

test("a scent request is perfume, not a body splash", () => {
  const turn = understand("أريد ريحة حلوة أقل من 30 الف", emptyState());
  assert.equal(turn.state.kind, "perfume");
  assert.equal(turn.state.maxPrice, 30000);
  assert.equal(acceptsProduct(splash, turn.state), false);
  assert.equal(acceptsProduct({ ...perfume, price: 28000 }, turn.state), true);
});

test("asking for a shampoo recommendation still shops", () => {
  const turn = understand("تنصحيني شامبو للتساقط", emptyState());
  assert.equal(planAgent(turn).action, "shop");
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.concern, "hairloss");
});

test("a weak description match does not outrank a named hair-loss shampoo", () => {
  const turn = understand("اريد شامبو تساقط", emptyState());
  const scored = scoredMatches([
    { id: "plain", nameAr: "شامبو يومي", nameEn: "Daily", description: "يقلل التساقط", price: 9000 },
    { id: "named", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 18000 },
  ], turn.state);
  assert.equal(scored[0].row.id, "named");
  assert.ok(scored[0].score > scored[1].score);
});

test("a failed narrow search can broaden without returning every shampoo", () => {
  const turn = understand("اريد شامبو تساقط", emptyState());
  const extra = broadenQueries(turn.state);
  assert.ok(extra.some((query) => /تساقط|hair loss/i.test(query)));
  assert.ok(extra.includes("شامبو"));
});

test("switching from shampoo to cream drops the old request", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", brand: "Y", price: 15000, card: {} },
  ];
  const turn = understand("لا هذا حولي على كريم", { ...emptyState(), kind: "shampoo", concern: "hairloss", maxPrice: 20000, seenIds: ["a"], shown });
  assert.equal(turn.state.kind, "cream");
  assert.equal(turn.state.concern, undefined);
  assert.equal(turn.state.maxPrice, undefined);
  assert.deepEqual(turn.state.seenIds, []);
  assert.deepEqual(turn.state.shown, []);
});

test("asking about a second product fetches a new one when only one is shown", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", brand: "Y", price: 15000, card: {} },
  ];
  const turn = understand("احجيلي عن الثاني", { ...emptyState(), kind: "shampoo", concern: "hairloss", shown });
  assert.equal(turn.moreCount, 1);
  assert.deepEqual(turn.state.seenIds, ["a"]);
  assert.equal(turn.state.kind, "shampoo");
});

test("meaning decides a product switch without saved keywords", () => {
  const previous = { ...emptyState(), kind: "shampoo" as const, concern: "hairloss" as const, goal: "شامبو تساقط", shown: [], seenIds: ["old"] };
  const turn = turnFromBrief(previous, "هسه أريد شي خفيف للبشرة الجافة", { move: "switch", kind: "cream", concern: "dry" });
  assert.equal(turn.state.kind, "cream");
  assert.equal(turn.state.concern, "dry");
  assert.deepEqual(turn.state.seenIds, []);
  assert.equal(turn.kind, "recommend");
});

test("meaning can compare two products and ask for a cheaper one", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "أول", nameEn: "A", brand: "A", price: 30000, card: {} },
    { id: "b", nameAr: "ثاني", nameEn: "B", brand: "B", price: 18000, card: {} },
  ];
  const previous = { ...emptyState(), kind: "perfume" as const, maxPrice: 50000, shown };
  const compared = turnFromBrief(previous, "قارني الأول والثاني", { move: "compare", compareIndexes: [0, 1] });
  assert.equal(compared.kind, "compare");
  assert.deepEqual(compared.compareIndexes, [0, 1]);
  const cheaper = turnFromBrief(previous, "أبي أرخص", { move: "cheaper" });
  assert.equal(cheaper.state.kind, "perfume");
  assert.equal(cheaper.state.maxPrice, 17999);
  assert.deepEqual(cheaper.state.seenIds, ["a", "b"]);
});

test("meaning can explain the second product and ask for more of the same", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "أول", nameEn: "A", brand: "A", price: 10000, card: {} },
    { id: "b", nameAr: "ثاني", nameEn: "B", brand: "B", price: 12000, card: {} },
  ];
  const previous = { ...emptyState(), kind: "shampoo" as const, shown };
  const explained = turnFromBrief(previous, "احجيلي عن الثاني", { move: "explain", focusIndex: 1 });
  assert.equal(explained.kind, "explain");
  assert.equal(explained.referenceIndex, 1);
  const more = turnFromBrief(previous, "جيب غيرهم", { move: "more", moreCount: 4 });
  assert.equal(more.moreCount, 4);
  assert.deepEqual(more.state.seenIds, ["a", "b"]);
  assert.equal(more.state.kind, "shampoo");
});

test("the model can switch the request and explain the second shown product", () => {
  const shown: ShownProduct[] = [
    { id: "a", nameAr: "شامبو", nameEn: "Shampoo", brand: "Y", price: 10000, card: {} },
    { id: "b", nameAr: "شامبو ثاني", nameEn: "Other", brand: "Z", price: 12000, card: {} },
  ];
  const previous = understand("اريد شامبو", emptyState());
  const stuck = { ...previous, state: { ...previous.state, shown } };
  const explained = applyBrief(stuck, { move: "explain", focusIndex: 1 });
  assert.equal(explained.kind, "explain");
  assert.equal(explained.referenceIndex, 1);
  const switched = applyBrief(stuck, { move: "switch", kind: "cream", concern: "dry" });
  assert.equal(switched.state.kind, "cream");
  assert.equal(switched.state.concern, "dry");
  assert.deepEqual(switched.state.shown, []);
  const more = applyBrief(stuck, { move: "more", moreCount: 5 });
  assert.equal(more.moreCount, 5);
  assert.deepEqual(more.state.seenIds, ["a", "b"]);
});

test("five more results exclude the product already shown", () => {
  const shown: ShownProduct[] = [
    { id: "same", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", brand: "Y", price: 18000, card: {} },
  ];
  const turn = understand("عرض لي خمس نتائج اضافيه", { ...emptyState(), kind: "shampoo", concern: "hairloss", goal: "شامبو تساقط", shown });
  assert.equal(turn.moreCount, 5);
  assert.equal(turn.state.goal, "شامبو تساقط");
  assert.deepEqual(turn.state.seenIds, ["same"]);
  assert.equal(turn.state.kind, "shampoo");
});

test("an expensive hair-loss shampoo outranks the cheap match", () => {
  const turn = understand("اريد شامبو غالي لتساقط الشعر", emptyState());
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.concern, "hairloss");
  assert.equal(turn.state.priceTier, "premium");
  const ranked = rankMatches([
    { id: "cheap", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 8000 },
    { id: "rich", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 45000 },
    { id: "cream", nameAr: "كريم مرطب", nameEn: "Cream", description: "", price: 90000 },
  ], turn.state);
  assert.equal(ranked[0].id, "rich");
});

test("a pricey shampoo that ignores hair loss does not win", () => {
  const turn = understand("اريد شامبو غالي لتساقط الشعر", emptyState());
  const ranked = rankMatches([
    { id: "plain", nameAr: "شامبو يومي", nameEn: "Daily shampoo", description: "تنظيف", price: 70000 },
    { id: "named", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 18000 },
  ], turn.state);
  assert.equal(ranked[0].id, "named");
});

test("a cheap request prefers the lower matching price", () => {
  const turn = understand("اريد شامبو رخيص للتساقط", emptyState());
  assert.equal(turn.state.priceTier, "value");
  const ranked = rankMatches([
    { id: "rich", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 45000 },
    { id: "cheap", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 8000 },
  ], turn.state);
  assert.equal(ranked[0].id, "cheap");
});

test("hair loss advice pairs the expensive shampoo with a spray", () => {
  const turn = understand("اريد شامبو غالي لتساقذ الشعر", emptyState());
  assert.equal(turn.state.concern, "hairloss");
  assert.equal(turn.state.priceTier, "premium");
  const picks = consultPicks([
    { id: "cheap", nameAr: "شامبو ضد التساقط", nameEn: "Cheap", description: "", price: 8000 },
    { id: "rich", nameAr: "شامبو ضد التساقط", nameEn: "Rich", description: "", price: 45000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Hair loss spray", description: "", price: 22000 },
    { id: "mid", nameAr: "شامبو ضد التساقط", nameEn: "Mid", description: "", price: 15000 },
  ], turn.state);
  assert.deepEqual(picks.map((item) => item.id), ["rich", "spray"]);
  const reply = consultantReply("ar", turn.state, picks);
  assert.match(reply, /45,000/);
  assert.match(reply, /22,000/);
  assert.match(reply, /بخاخ/);
});

test("a body splash is not used as the hair treatment", () => {
  const turn = understand("اريد شامبو لتساقط", emptyState());
  const picks = consultPicks([
    { id: "wash", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", description: "", price: 18000 },
    { id: "splash", nameAr: "سبلاش جسم", nameEn: "Body splash", description: "تساقط", price: 9000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Scalp spray", description: "", price: 20000 },
  ], turn.state);
  assert.deepEqual(picks.map((item) => item.id), ["wash", "spray"]);
});

test("meaning keeps the expensive hair routine and looks for a second step", () => {
  const turn = turnFromBrief(emptyState(), "اريد شامبو غالي لتساقط الشعر", { move: "shop", kind: "shampoo", concern: "hairloss" });
  assert.equal(turn.state.priceTier, "premium");
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.concern, "hairloss");
  assert.ok(companionQueries(turn.state).some((query) => /بخاخ|spray/i.test(query)));
});

test("not expensive is a cheaper tier, and perfume stays one product", () => {
  assert.equal(priceTierOf("اريد شامبو مو غالي"), "value");
  const perfumeTurn = understand("اريد عطر غالي", emptyState());
  assert.equal(perfumeTurn.state.priceTier, "premium");
  assert.equal(perfumeTurn.state.kind, "perfume");
  assert.deepEqual(companionQueries(perfumeTurn.state), []);
});

test("a new shampoo request does not keep the perfume budget", () => {
  const turn = understand("اريد شامبو", { ...emptyState(), kind: "perfume", maxPrice: 50000, shown: [] });
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.maxPrice, undefined);
});

test("a nourishing oil joins the hair routine only when it matches the problem", () => {
  const turn = understand("اريد شامبو لتساقط", emptyState());
  const weak = consultPicks([
    { id: "wash", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", description: "", price: 18000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Spray", description: "", price: 20000 },
    { id: "oil", nameAr: "زيت جوز", nameEn: "Oil", description: "ترطيب", price: 30000 },
  ], turn.state);
  assert.deepEqual(weak.map((item) => item.id), ["wash", "spray"]);
  const strong = consultPicks([
    { id: "wash", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", description: "", price: 18000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Spray", description: "", price: 20000 },
    { id: "oil", nameAr: "زيت ضد التساقط", nameEn: "Hair oil", description: "", price: 30000 },
  ], turn.state);
  assert.deepEqual(strong.map((item) => item.id), ["wash", "spray", "oil"]);
});

test("brightening advice is a cleanser, serum, and cream at the expensive tier", () => {
  const turn = understand("اريد كريم غالي للتفتيح", emptyState());
  assert.equal(turn.state.kind, "cream");
  assert.equal(turn.state.concern, "pigment");
  assert.equal(turn.state.priceTier, "premium");
  const picks = consultPicks([
    { id: "cheap-wash", nameAr: "غسول تفتيح", nameEn: "Brightening cleanser", description: "", price: 8000 },
    { id: "rich-wash", nameAr: "غسول تفتيح", nameEn: "Brightening cleanser", description: "", price: 32000 },
    { id: "plain-wash", nameAr: "غسول يومي", nameEn: "Daily cleanser", description: "", price: 90000 },
    { id: "serum", nameAr: "سيروم تفتيح", nameEn: "Brightening serum", description: "", price: 40000 },
    { id: "cheap-cream", nameAr: "كريم تفتيح", nameEn: "Brightening cream", description: "", price: 10000 },
    { id: "rich-cream", nameAr: "كريم تفتيح", nameEn: "Brightening cream", description: "", price: 55000 },
  ], turn.state);
  assert.deepEqual(picks.map((item) => item.id), ["rich-wash", "serum", "rich-cream"]);
  const reply = consultantReply("ar", turn.state, picks);
  assert.match(reply, /غسول/);
  assert.match(reply, /سيروم/);
  assert.match(reply, /واقي/);
  assert.match(reply, /55,000/);
});

test("replacing the spray keeps the shampoo and the usage stays on the written steps", () => {
  const shown: ShownProduct[] = [
    { id: "wash", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", brand: "Y", description: "", howToUse: "مرتين بالأسبوع على فروة مبللة", price: 45000, card: {} },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Spray", brand: "Y", description: "", howToUse: "على فروة جافة كل ليلة", price: 22000, card: {} },
  ];
  const previous = { ...emptyState(), kind: "shampoo" as const, concern: "hairloss" as const, priceTier: "premium" as const, goal: "شامبو غالي لتساقط", shown };
  const turn = turnFromBrief(previous, "بدلي البخاخ", { move: "shop", kind: "cream" });
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.goal, "شامبو غالي لتساقط");
  assert.equal(stepToReplace("بدلي البخاخ"), "treat");
  assert.equal(stepToReplace("غير البراند"), null);
  assert.equal(stepToReplace("اريد شامبو غير رخيص"), null);
  assert.equal(priceTierOf("اريد شامبو غير رخيص"), "premium");
  const next: ShownProduct = { id: "new-spray", nameAr: "سيروم تساقط", nameEn: "Serum", brand: "Y", description: "", howToUse: "ست قطرات على الفروة", price: 38000, card: {} };
  const replaced = replaceStep(shown, "treat", next);
  assert.deepEqual(replaced.map((item) => item.id), ["wash", "new-spray"]);
  assert.equal(isRoutineUsage("شلون أستخدمهم ويا بعض"), true);
  assert.equal(isRoutineUsage("شلون أستخدمه"), false);
  const usage = usageReply("ar", replaced);
  assert.match(usage, /مرتين بالأسبوع/);
  assert.match(usage, /ست قطرات/);
  assert.doesNotMatch(usage, /مكون سري/);
});

test("oily hair loss prefers a shampoo that mentions both problems", () => {
  const turn = understand("شعري دهني ويتساقط", emptyState());
  assert.equal(turn.state.kind, "shampoo");
  assert.equal(turn.state.concern, "hairloss");
  assert.deepEqual(turn.state.also, ["oily"]);
  const picks = consultPicks([
    { id: "plain", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 50000 },
    { id: "oily", nameAr: "شامبو تساقط للشعر الدهني", nameEn: "Oily scalp shampoo", description: "", price: 22000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Spray", description: "يقلل التساقط عند الجذور", price: 18000 },
  ], turn.state);
  assert.equal(picks[0].id, "oily");
  assert.equal(picks[1].id, "spray");
  const reply = consultantReply("ar", turn.state, picks);
  assert.match(reply, /دهنية/);
  assert.match(reply, /الجذور/);
});

test("a question about the spray explains that step and keeps the written fact", () => {
  assert.equal(askedStep("ليش البخاخ"), "treat");
  assert.equal(askedStep("ليش شعري يطيح"), null);
  const state = understand("اريد شامبو لتساقط", emptyState()).state;
  const rows = [
    { id: "wash", nameAr: "شامبو ضد التساقط", nameEn: "Shampoo", description: "ينظف الفروة", price: 18000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Spray", description: "يبقى على الجذور طول اليوم", howToUse: "على فروة جافة كل ليلة", price: 22000 },
  ];
  const reply = stepAnswer("ar", state, rows, "treat");
  assert.match(reply, /بخاخ تساقط/);
  assert.match(reply, /الجذور/);
  assert.match(reply, /فروة جافة/);
  assert.doesNotMatch(reply, /شامبو ضد/);
});

test("meaning keeps a second problem when the model only names the main one", () => {
  const turn = turnFromBrief(emptyState(), "شعري دهني ويتساقط", { move: "shop", kind: "shampoo", concern: "hairloss" });
  assert.equal(turn.state.concern, "hairloss");
  assert.deepEqual(turn.state.also, ["oily"]);
});

test("a treatment line stays with one company when that company covers the steps", () => {
  const turn = understand("اريد شامبو لتساقط", emptyState());
  const picks = consultPicks([
    { id: "other-wash", nameAr: "شامبو ضد التساقط الكثيف", nameEn: "Dense anti hair loss shampoo", brand: "Garnier", description: "يقلل التساقط ويزيد الكثافة", price: 40000 },
    { id: "line-wash", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss shampoo", brand: "L'Oreal", description: "", price: 22000 },
    { id: "line-spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Hair loss spray", brand: "لوريال", description: "", price: 18000 },
  ], turn.state);
  assert.deepEqual(picks.map((item) => item.id), ["line-wash", "line-spray"]);
  const reply = consultantReply("ar", turn.state, picks);
  assert.match(reply, /لوريال|L'Oreal/);
  assert.match(reply, /شركة/);
});

test("a missing company step is filled from another brand", () => {
  const turn = understand("اريد شامبو لتساقط", emptyState());
  const picks = consultPicks([
    { id: "line-wash", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", brand: "Loreal", description: "", price: 22000 },
    { id: "other-spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Hair loss spray", brand: "Vichy", description: "", price: 30000 },
  ], turn.state);
  assert.deepEqual(picks.map((item) => item.id), ["line-wash", "other-spray"]);
  const reply = consultantReply("ar", turn.state, picks);
  assert.match(reply, /أكثر من شركة/);
});

test("an expensive request stays inside the same company line", () => {
  const turn = understand("اريد شامبو غالي لتساقط", emptyState());
  const picks = consultPicks([
    { id: "cheap", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", brand: "Loreal", description: "", price: 12000 },
    { id: "rich", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", brand: "Loreal", description: "", price: 45000 },
    { id: "spray", nameAr: "بخاخ تساقط الشعر", nameEn: "Hair loss spray", brand: "Loreal", description: "", price: 28000 },
    { id: "other", nameAr: "شامبو ضد التساقط الفاخر", nameEn: "Luxury anti hair loss shampoo", brand: "Kerastase", description: "تساقط وكثافة", price: 70000 },
  ], turn.state);
  assert.deepEqual(picks.map((item) => item.id), ["rich", "spray"]);
});

test("a vague hair request asks before showing products", () => {
  const question = clarify("اريد شامبو", emptyState());
  assert.ok(question);
  assert.equal(question?.kind, "shampoo");
  assert.ok(question?.suggestions.includes("تساقط"));
  assert.equal(clarify("اريد شامبو لتساقط", emptyState()), null);
  assert.equal(clarify("ارخص", { ...emptyState(), kind: "shampoo", concern: "hairloss", shown: [] }), null);
  assert.equal(clarify("اريد واقي شمس", emptyState()), null);
  const sun = understand("اريد واقي شمس", emptyState());
  assert.ok(searchQueries(sun.state, sun.searchTerm).some((query) => /spf|sunscreen/i.test(query)));
});

test("a promoted product replaces the step only when it matches the problem", () => {
  const state = understand("اريد شامبو لتساقط", emptyState()).state;
  const plain = { id: "plain", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "", price: 18000 };
  const promoted = { id: "promo", nameAr: "شامبو ضد التساقط", nameEn: "Anti hair loss", description: "يقلل التساقط", price: 32000 };
  const wrong = { id: "wrong", nameAr: "كريم مرطب", nameEn: "Cream", description: "", price: 90000 };
  const steered = steerPicks([plain], [plain, promoted, wrong], state, [
    { type: "promote", concern: "hairloss", productId: "promo", priority: 10 },
    { type: "promote", concern: "hairloss", productId: "wrong", priority: 20 },
  ]);
  assert.equal(steered[0].id, "promo");
});

test("profile facts come from what she says about herself, not from a request", () => {
  const facts = extractProfileFacts("بشرتي دهنية وعندي حساسية من العطور وأحب لوريال وما احب غارنييه");
  assert.equal(facts.skinType, "oily");
  assert.deepEqual(facts.sensitivities, ["fragrance"]);
  assert.deepEqual(facts.likedBrandWords, ["لوريال"]);
  assert.deepEqual(facts.avoidBrandWords, ["غارنييه"]);
  assert.equal(extractProfileFacts("شعري دهني ويتساقط").hairType, "oily");
  assert.deepEqual(extractProfileFacts("اريد شامبو للشعر الدهني"), {});
  assert.deepEqual(extractProfileFacts("اريد عطر رجالي"), {});
});

test("a brand said to be disliked leaves the liked list", () => {
  const first = mergeProfile(emptyProfile(), { skinType: "dry" }, ["L'Oreal"], []);
  assert.deepEqual(first.likedBrands, ["L'Oreal"]);
  const second = mergeProfile(first, {}, [], ["L'Oreal"]);
  assert.deepEqual(second.likedBrands, []);
  assert.deepEqual(second.avoidBrands, ["L'Oreal"]);
  assert.equal(second.skinType, "dry");
});

test("a new chat uses the saved skin type without keeping the old request", () => {
  const profile = { ...emptyProfile(), skinType: "oily" as const, avoidBrands: ["Garnier"], likedBrands: ["Vichy"] };
  const fresh = understand("اريد غسول", emptyState()).state;
  assert.equal(fresh.concern, undefined);
  const applied = applyProfile(fresh, profile, "اريد غسول", canonicalBrand);
  assert.equal(applied.concern, "oily");
  assert.equal(applied.fromProfile, true);
  assert.ok(applied.excludedBrands.includes("garnier"));
  assert.deepEqual(applied.preferBrands, ["Vichy"]);
  assert.equal(profileAnswersClarify("cleanser", profile), true);
  assert.equal(profileAnswersClarify("shampoo", profile), false);
  const stated = applyProfile(understand("اريد غسول للبشرة الجافة", emptyState()).state, profile, "اريد غسول للبشرة الجافة", canonicalBrand);
  assert.equal(stated.concern, "dry");
  assert.equal(stated.fromProfile, undefined);
  const perfume = applyProfile(understand("اريد عطر", emptyState()).state, profile, "اريد عطر", canonicalBrand);
  assert.equal(perfume.concern, undefined);
});

test("a liked brand wins a tie but never beats the right product", () => {
  const state = { ...understand("اريد شامبو لتساقط", emptyState()).state, preferBrands: ["Vichy"] };
  const tie = rankMatches([
    { id: "a", nameAr: "شامبو ضد التساقط", nameEn: "A", brand: "Garnier", description: "", price: 20000 },
    { id: "b", nameAr: "شامبو ضد التساقط", nameEn: "B", brand: "Vichy", description: "", price: 20000 },
  ], state);
  assert.equal(tie[0].id, "b");
  const wrong = rankMatches([
    { id: "right", nameAr: "شامبو ضد التساقط", nameEn: "A", brand: "Garnier", description: "", price: 20000 },
    { id: "liked", nameAr: "شامبو يومي", nameEn: "B", brand: "Vichy", description: "", price: 20000 },
  ], state);
  assert.equal(wrong[0].id, "right");
});

test("an allergy hides products that list it, but not perfume for a perfume request", () => {
  const profile = { ...emptyProfile(), sensitivities: ["fragrance", "paraben"] };
  assert.equal(triggersSensitivity({ ingredients: "Aqua, Glycerin, Parfum" }, profile, "cream"), true);
  assert.equal(triggersSensitivity({ ingredients: "Aqua, Methylparaben" }, profile, "shampoo"), true);
  assert.equal(triggersSensitivity({ ingredients: "Aqua, Glycerin" }, profile, "cream"), false);
  assert.equal(triggersSensitivity({ ingredients: "Alcohol, Parfum" }, { ...emptyProfile(), sensitivities: ["fragrance"] }, "perfume"), false);
});

test("memory commands and the summary speak to her directly", () => {
  assert.equal(isMemoryQuestion("شنو تعرفين عني؟"), true);
  assert.equal(isForgetRequest("انسي معلوماتي"), true);
  const text = describeProfile("ar", { ...emptyProfile(), skinType: "sensitive", likedBrands: ["Vichy"], avoidBrands: ["Garnier"] });
  assert.match(text, /بشرتج حساسة/);
  assert.match(text, /تحبين Vichy/);
  assert.match(text, /ما تحبين Garnier/);
  assert.match(describeProfile("ar", emptyProfile()), /ما حافظة/);
});

const tag = (over: Partial<{ kind: string; role: string; concerns: string[]; audience: string }>) => ({
  kind: "other",
  role: "other",
  area: "hair",
  concerns: [],
  audience: "adult",
  summary: "",
  ...over,
});

test("a tagged hair-loss product ranks even when its name says nothing", () => {
  const state = understand("اريد شامبو لتساقط", emptyState()).state;
  const ranked = rankMatches([
    { id: "plain", nameAr: "شامبو يومي", nameEn: "Daily", description: "تنظيف", price: 9000 },
    { id: "tagged", nameAr: "شامبو كيراتين", nameEn: "Keratin", description: "", price: 20000, tags: tag({ kind: "shampoo", role: "wash", concerns: ["hairloss"] }) },
  ], state);
  assert.equal(ranked[0].id, "tagged");
});

test("the tag fills the routine step when the name is only a brand line", () => {
  assert.equal(productRole({ nameAr: "جينيسيس فوندان", nameEn: "Genesis Fondant" }), "other");
  assert.equal(productRole({ nameAr: "جينيسيس فوندان", nameEn: "Genesis Fondant", tags: tag({ role: "treat" }) }), "treat");
  assert.equal(productRole({ nameAr: "شامبو", nameEn: "Shampoo", tags: tag({ role: "care" }) }), "wash");
});

test("meaning search results of the wrong type stay out of a single-product answer", () => {
  const state = understand("اريد عطر نسائي", emptyState()).state;
  assert.equal(kindFits({ nameAr: "عطر وردي", nameEn: "Rose EDP" }, state), true);
  assert.equal(kindFits({ nameAr: "كريم يدين", nameEn: "Hand cream" }, state), false);
  assert.equal(kindFits({ nameAr: "روز نوار", nameEn: "Rose Noir", tags: tag({ kind: "perfume" }) }, state), true);
  assert.equal(kindFits({ nameAr: "روز نوار", nameEn: "Rose Noir", tags: tag({ kind: "body" }) }, state), false);
});

test("a product tagged for babies is dropped for an adult request", () => {
  const state = understand("اريد شامبو لتساقط", emptyState()).state;
  const ranked = rankMatches([
    { id: "baby", nameAr: "شامبو لطيف", nameEn: "Gentle", description: "", price: 5000, tags: tag({ audience: "baby", concerns: ["hairloss"] }) },
    { id: "adult", nameAr: "شامبو ضد التساقط", nameEn: "Anti loss", description: "", price: 15000 },
  ], state);
  assert.deepEqual(ranked.map((row) => row.id), ["adult"]);
});

test("a problem question is not dropped when the model calls it chat", () => {
  const turn = turnFromBrief(emptyState(), "شنو سبب تساقط الشعر", { move: "chat" });
  assert.equal(turn.kind, "recommend");
  assert.equal(turn.state.concern, "hairloss");
  const hello = turnFromBrief(emptyState(), "مرحبا", { move: "chat" });
  assert.equal(hello.kind, "smalltalk");
});

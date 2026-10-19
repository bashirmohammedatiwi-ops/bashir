import assert from "node:assert/strict";
import { CatalogIndex, RawProduct } from "./catalog";
import { parseBudget, understand } from "./nlu";
import { priceBucketsFor, searchCatalog } from "./search";
import { normalize } from "./text";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

/** الميزانية كما يراها المحرك: النص يُطبَّع أولاً (أ ← ا، أرقام عربية ← لاتينية…). */
const budgetOf = (text: string) => parseBudget(normalize(text));

let seq = 0;
function product(nameAr: string, price: number, extra: Partial<RawProduct> = {}): RawProduct {
  seq += 1;
  return {
    id: `p${seq}`,
    slug: `p-${seq}`,
    name: nameAr,
    nameAr,
    nameEn: null,
    description: "",
    descriptionAr: null,
    price,
    originalPrice: price,
    discountPercent: 0,
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    stock: 5,
    isNew: false,
    isBestSeller: false,
    isPromo: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    brand: null,
    category: null,
    subcategory: null,
    tertiaryCategory: null,
    image: "",
    shadeCount: 0,
    ...extra,
  };
}

const catalog = CatalogIndex.build([
  product("سيروم فيتامين ب5 مرطب", 18000),
  product("كريم فيتامين ب5 للوجه", 32000),
  product("ماسك ذهب 24 قيراط للوجه", 45000),
  product("ماسك ذهب مقشر", 12000),
  product("عطر ورد نسائي", 35000, { rating: 4.9, reviewCount: 40 }),
  product("عطر عود فاخر", 120000, { rating: 5, reviewCount: 1 }),
  product("عطر مسك ابيض", 48000, { rating: 4.6, reviewCount: 12 }),
  product("عطر فانيلا", 75000, { rating: 4.9, reviewCount: 80 }),
  product("عطر صغير للسفر", 9000),
]);

const names = (q: string, f = {}) => searchCatalog(catalog, q, f).hits.map((h) => h.p.name);

// ─────────────────────────────── parseBudget: كلمة الميزانية تبدأ كلمة مستقلة

test("«فيتامين ب5» اسم مكوّن لا ميزانية", () => {
  assert.deepEqual(budgetOf("فيتامين ب5"), {});
  assert.deepEqual(budgetOf("سيروم فيتامين ب 5"), {});
});

test("«ماسك ذهب 24» لا تُقرأ «ب 24»", () => {
  assert.deepEqual(budgetOf("ماسك ذهب 24"), {});
  assert.deepEqual(budgetOf("ماسك ذهب 24 قيراط"), {});
});

test("«عطر تحت 50 ألف» ← أقصى 50,000", () => {
  assert.deepEqual(budgetOf("عطر تحت 50 ألف"), { max: 50000 });
  assert.deepEqual(budgetOf("عطر أقل من 30 الف"), { max: 30000 });
  assert.deepEqual(budgetOf("كريم بحدود ٢٠ ألف"), { max: 20000 });
});

test("«ب»/«حد» ميزانية فقط مع وحدة نقد", () => {
  assert.deepEqual(budgetOf("عطر ب 25 الف"), { max: 25000 });
  assert.deepEqual(budgetOf("عطر ب 25000 دينار"), { max: 25000 });
  assert.deepEqual(budgetOf("كريم ب25k"), { max: 25000 });
  assert.deepEqual(budgetOf("كريم حد 15 ألف"), { max: 15000 });
  assert.deepEqual(budgetOf("واحد 2"), {});
});

test("بين/فوق ما زالت تُفهم", () => {
  assert.deepEqual(budgetOf("عطر بين 20 و 40 الف"), { min: 20000, max: 40000 });
  assert.deepEqual(budgetOf("عطر فوق 100 الف"), { min: 100000 });
});

test("understand: فيتامين ب5 بلا سعر، «تحت 50 ألف» بسعر", () => {
  assert.equal(understand("فيتامين ب5", catalog).delta.maxPrice, undefined);
  assert.equal(understand("ماسك ذهب 24", catalog).delta.maxPrice, undefined);
  assert.equal(understand("عطر تحت 50 ألف", catalog).delta.maxPrice, 50000);
});

// ─────────────────────────────── searchCatalog: الميزانية لا تُخفي النتائج ولا تقاتل السعر الصريح

test("«فيتامين ب5» تجد منتجات بأي سعر", () => {
  const out = searchCatalog(catalog, "فيتامين ب5");
  assert.equal(out.budget, undefined);
  assert.ok(out.hits.some((h) => h.p.price === 32000));
});

test("«ماسك ذهب 24» لا تخفي ماسك 45 ألف", () => {
  const found = names("ماسك ذهب 24");
  assert.ok(found.includes("ماسك ذهب 24 قيراط للوجه"));
});

test("«عطر تحت 50 ألف» تطبّق الميزانية وتُرجعها", () => {
  const out = searchCatalog(catalog, "عطر تحت 50 ألف");
  assert.deepEqual(out.budget, { max: 50000, min: undefined });
  assert.ok(out.hits.length > 0);
  assert.ok(out.hits.every((h) => h.p.price <= 50000));
  assert.ok(out.understood.includes("≤ 50,000"));
});

test("سعر صريح يلغي الميزانية المفهومة (لا صفر بلا تفسير)", () => {
  const out = searchCatalog(catalog, "عطر تحت 50 ألف", { minPrice: 100000 });
  assert.equal(out.budget, undefined);
  assert.deepEqual(out.hits.map((h) => h.p.price), [120000]);
});

test("noBudget = «أي سعر»", () => {
  const out = searchCatalog(catalog, "عطر تحت 50 ألف", { noBudget: true });
  assert.equal(out.budget, undefined);
  assert.ok(out.hits.some((h) => h.p.price > 50000));
  assert.ok(!out.understood.some((u) => u.startsWith("≤")));
});

test("الشرائح على المدى كاملاً رغم الميزانية", () => {
  const out = searchCatalog(catalog, "عطر تحت 50 ألف");
  const buckets = out.facets.priceBuckets;
  assert.ok(buckets.length >= 2);
  assert.ok(buckets.some((b) => b.min != null && b.min >= 50000));
});

test("scopeIds يحصر النتائج بالعالم", () => {
  const scope = new Set(catalog.products.filter((p) => p.price < 40000).map((p) => p.id));
  const out = searchCatalog(catalog, "عطر", { scopeIds: scope });
  assert.ok(out.hits.length > 0);
  assert.ok(out.hits.every((h) => scope.has(h.p.id)));
});

test("ترتيب التقييم: الموثوق أولاً، ثم عدد المراجعات", () => {
  const out = searchCatalog(catalog, "عطر", { sort: "rating" });
  assert.deepEqual(out.hits.slice(0, 2).map((h) => h.p.name), ["عطر فانيلا", "عطر ورد نسائي"]);
});

test("exact: بلا تصحيح إملائي («ابحثي عن الكلمة الأصلية»)", () => {
  const corrected = searchCatalog(catalog, "عطرر");
  assert.ok(corrected.corrected);
  assert.ok(corrected.hits.length > 0);
  const exact = searchCatalog(catalog, "عطرر", {}, { exact: true });
  assert.equal(exact.corrected, undefined);
  assert.equal(exact.hits.length, 0);
});

// ─────────────────────────────── priceBucketsFor

test("4–5 شرائح مقرّبة لـ 5,000 وبلا فراغات", () => {
  const prices = [30000, 35000, 42000, 55000, 60000, 80000, 95000, 120000, 180000, 300000];
  const buckets = priceBucketsFor(prices);
  assert.ok(buckets.length >= 4 && buckets.length <= 5, `got ${buckets.length}`);
  assert.equal(buckets[0].min, null);
  assert.equal(buckets[buckets.length - 1].max, null);
  for (const b of buckets) {
    assert.ok(b.count > 0);
    for (const edge of [b.min, b.max]) if (edge != null) assert.equal(edge % 5000, 0);
  }
});

test("مدى ضيق أو نتيجة واحدة = بلا شرائح", () => {
  assert.deepEqual(priceBucketsFor([5000]), []);
  assert.deepEqual(priceBucketsFor([5000, 7000, 9000]), []);
});

console.log("advisor nlu/search: all tests passed");

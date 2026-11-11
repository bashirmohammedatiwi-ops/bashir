import assert from "node:assert/strict";
import {
  computePickMoney,
  DEFAULT_PICK_POLICY,
  lineState,
  LINE_COLOR,
  OrderMoneyInput,
  parseOrderCode,
  pickCounts,
  PickLineInput,
} from "./pick-engine";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

const ordered = (id: string, qty: number, picked: number, price: number, reason?: string): PickLineInput => ({
  id,
  kind: "ORDERED",
  orderedQty: qty,
  pickedQty: picked,
  unitPrice: price,
  charge: "PAID",
  reason: reason ?? null,
});
const extra = (id: string, picked: number, price: number, charge: "PAID" | "FREE" = "PAID", substituteFor?: string): PickLineInput => ({
  id,
  kind: "EXTRA",
  orderedQty: 0,
  pickedQty: picked,
  unitPrice: price,
  charge,
  substituteForLineId: substituteFor ?? null,
});
const codOrder = (o: Partial<OrderMoneyInput>): OrderMoneyInput => ({
  subtotal: 0,
  discountTotal: 0,
  packageDiscount: 0,
  shippingTotal: 0,
  giftWrapFee: 0,
  loyaltyDiscount: 0,
  total: 0,
  paymentStatus: "PENDING",
  coupon: null,
  ...o,
});

test("line colours: matched green, short red, extra yellow, pending grey", () => {
  assert.equal(LINE_COLOR[lineState(ordered("a", 2, 2, 1000), false)], "green");
  assert.equal(LINE_COLOR[lineState(ordered("a", 2, 1, 1000), true)], "red");
  assert.equal(LINE_COLOR[lineState(ordered("a", 2, 1, 1000), false)], "grey");
  assert.equal(LINE_COLOR[lineState(ordered("a", 2, 0, 1000, "نفد المخزون"), false)], "red");
  assert.equal(LINE_COLOR[lineState(extra("x", 1, 500), false)], "yellow");
});

test("the plan's worked example: 48,000 becomes 39,500", () => {
  const lines = [
    ordered("lip", 2, 2, 10_000),
    ordered("serum", 1, 0, 15_000, "نفد المخزون"),
    ordered("cream", 1, 1, 8_000),
    extra("sub", 1, 6_500, "PAID", "serum"),
    extra("sample", 1, 3_000, "FREE"),
  ];
  const m = computePickMoney(codOrder({ subtotal: 43_000, shippingTotal: 5_000, total: 48_000 }), lines);
  assert.equal(m.deliveredValue, 28_000);
  assert.equal(m.shortageValue, 15_000);
  assert.equal(m.extrasValue, 6_500);
  assert.equal(m.freeExtrasValue, 3_000);
  assert.equal(m.finalSubtotal, 34_500);
  assert.equal(m.finalTotal, 39_500);
  assert.equal(m.codAmount, 39_500);
  assert.equal(m.adjustmentTotal, -8_500);
  assert.equal(m.changed, true);
  assert.equal(m.needsApproval, false);
  const c = pickCounts(lines, true);
  assert.deepEqual([c.matched, c.short, c.extra], [2, 1, 2]);
});

test("a substitute dearer than the missing item is charged at the missing item's price", () => {
  const lines = [ordered("a", 1, 0, 5_000), extra("b", 1, 9_000, "PAID", "a")];
  const m = computePickMoney(codOrder({ subtotal: 5_000, total: 5_000 }), lines);
  assert.equal(m.extrasValue, 5_000);
  assert.equal(m.finalTotal, 5_000);
});

test("COD is rounded down to 250 in the customer's favour", () => {
  const lines = [ordered("a", 1, 1, 10_100)];
  const m = computePickMoney(codOrder({ subtotal: 10_100, total: 10_100 }), lines);
  assert.equal(m.codAmount, 10_000);
  assert.equal(m.roundingDiscount, 100);
  assert.equal(m.finalTotal, 10_000);
  assert.equal(m.changed, false);
});

test("percent coupon follows what was delivered, never above the original discount", () => {
  const lines = [ordered("a", 2, 1, 20_000), ordered("b", 1, 1, 10_000)];
  const order = codOrder({
    subtotal: 50_000,
    discountTotal: 5_000,
    shippingTotal: 5_000,
    total: 50_000,
    coupon: { type: "PERCENT", value: 10, maxDiscount: null },
  });
  const m = computePickMoney(order, lines);
  assert.equal(m.couponDiscount, 3_000);
  assert.equal(m.finalTotal, 30_000 - 3_000 + 5_000);
  assert.equal(m.discountRecalc, 2_000);
});

test("fixed coupon is kept even when the order drops below its minimum", () => {
  const lines = [ordered("a", 1, 1, 20_000), ordered("b", 1, 0, 30_000, "تالف")];
  const order = codOrder({
    subtotal: 50_000,
    discountTotal: 7_000,
    total: 43_000,
    coupon: { type: "AMOUNT", value: 7_000, maxDiscount: null },
  });
  const m = computePickMoney(order, lines);
  assert.equal(m.couponDiscount, 7_000);
  assert.equal(m.finalTotal, 13_000);
});

test("package discount stays in proportion to what arrived", () => {
  const lines = [ordered("a", 1, 1, 30_000), ordered("b", 1, 0, 10_000, "نفد")];
  const order = codOrder({ subtotal: 40_000, discountTotal: 4_000, packageDiscount: 4_000, total: 36_000 });
  const m = computePickMoney(order, lines);
  assert.equal(m.packageDiscount, 3_000);
  assert.equal(m.finalTotal, 27_000);
});

test("prepaid card order with a shortage is refunded, nothing collected", () => {
  const lines = [ordered("a", 1, 1, 20_000), ordered("b", 1, 0, 10_000, "نفد")];
  const order = codOrder({ subtotal: 30_000, shippingTotal: 5_000, total: 35_000, paymentStatus: "PAID" });
  const m = computePickMoney(order, lines);
  assert.equal(m.prepaid, true);
  assert.equal(m.refundAmount, 10_000);
  assert.equal(m.codAmount, 0);
  assert.equal(m.finalTotal, 25_000);
});

test("prepaid card order with a paid extra collects only the extra on delivery", () => {
  const lines = [ordered("a", 1, 1, 20_000), extra("x", 1, 6_100)];
  const order = codOrder({ subtotal: 20_000, total: 20_000, paymentStatus: "PAID" });
  const m = computePickMoney(order, lines);
  assert.equal(m.codAmount, 6_000);
  assert.equal(m.roundingDiscount, 100);
  assert.equal(m.refundAmount, 0);
  assert.equal(m.finalTotal, 26_000);
});

test("loyalty points spent stay applied; total never goes negative", () => {
  const lines = [ordered("a", 1, 1, 5_000), ordered("b", 1, 0, 20_000, "نفد")];
  const order = codOrder({ subtotal: 25_000, loyaltyDiscount: 10_000, total: 15_000 });
  const m = computePickMoney(order, lines);
  assert.equal(m.totalBeforeRounding, 0);
  assert.equal(m.finalTotal, 0);
});

test("everything missing is flagged so the order is cancelled, not invoiced", () => {
  const lines = [ordered("a", 1, 0, 5_000, "نفد"), extra("s", 1, 1_000, "FREE")];
  const m = computePickMoney(codOrder({ subtotal: 5_000, total: 5_000 }), lines);
  assert.equal(m.allMissing, true);
});

test("approval needed for a big shortage or big paid extras", () => {
  const big = computePickMoney(codOrder({ subtotal: 10_000, total: 10_000 }), [ordered("a", 2, 0, 5_000, "x")]);
  assert.deepEqual(big.approvalReasons, ["SHORTAGE_OVER_LIMIT"]);
  const half = computePickMoney(codOrder({ subtotal: 10_000, total: 10_000 }), [ordered("a", 2, 1, 5_000, "x")]);
  assert.equal(half.needsApproval, false);
  const extras = computePickMoney(codOrder({ subtotal: 5_000, total: 5_000 }), [
    ordered("a", 1, 1, 5_000),
    extra("x", 1, DEFAULT_PICK_POLICY.approvalExtraAmount + 1),
  ]);
  assert.deepEqual(extras.approvalReasons, ["EXTRA_OVER_LIMIT"]);
});

test("order code: prefix required, case and junk tolerated", () => {
  assert.equal(parseOrderCode("ORD-MH3K2J1AF3C9"), "ORD-MH3K2J1AF3C9");
  assert.equal(parseOrderCode(" ord-mh3k2j1af3c9\n"), "ORD-MH3K2J1AF3C9");
  assert.equal(parseOrderCode("ORDMH3K2J1AF3C9"), "ORD-MH3K2J1AF3C9");
  assert.equal(parseOrderCode("‏ORD-MH3K2J1AF3C9"), "ORD-MH3K2J1AF3C9");
  assert.equal(parseOrderCode("6281234567890"), null);
  assert.equal(parseOrderCode(""), null);
});

console.log("pick-engine: all passed");

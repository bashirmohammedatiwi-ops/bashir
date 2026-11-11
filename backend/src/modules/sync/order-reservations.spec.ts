import assert from "node:assert/strict";
import { applyReservations, reservationMap } from "./order-reservations";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

test("open order quantities come off the POS stock", () => {
  const map = reservationMap([{ barcode: "6281234567890", qty: 2 }]);
  const { items, adjusted } = applyReservations([{ barcode: "6281234567890", stock: 5 }], map);
  assert.equal(items[0].stock, 3);
  assert.equal(adjusted, 1);
});

test("never below zero", () => {
  const map = reservationMap([{ barcode: "111111", qty: 4 }]);
  assert.equal(applyReservations([{ barcode: "111111", stock: 1 }], map).items[0].stock, 0);
});

test("EAN-13 with a leading zero matches the UPC-12 form, counted once", () => {
  const map = reservationMap([
    { barcode: "0012345678905", qty: 1 },
    { barcode: "012345678905", qty: 2 },
  ]);
  assert.equal(applyReservations([{ barcode: "012345678905", stock: 10 }], map).items[0].stock, 7);
  assert.equal(applyReservations([{ barcode: "0012345678905", stock: 10 }], map).items[0].stock, 7);
});

test("items without a reservation are untouched (same object)", () => {
  const map = reservationMap([{ barcode: "AAA111", qty: 1 }]);
  const item = { barcode: "BBB222", stock: 9 };
  assert.equal(applyReservations([item], map).items[0], item);
});

test("falls back to the POS product number when the barcode differs", () => {
  const map = reservationMap([{ barcode: "SKU-77", qty: 3 }]);
  assert.equal(applyReservations([{ barcode: "POS:12", productNum: "SKU-77", stock: 5 }], map).items[0].stock, 2);
});

test("null barcodes and zero quantities are ignored", () => {
  const map = reservationMap([{ barcode: null, qty: 5 }, { barcode: "X1", qty: 0 }]);
  assert.equal(map.size, 0);
});

console.log("order-reservations: all passed");

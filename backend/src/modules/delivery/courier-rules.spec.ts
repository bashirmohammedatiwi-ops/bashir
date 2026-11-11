import assert from "node:assert/strict";
import { courierAddress, courierPhone, shouldApply, statusRule, suggestGovernance } from "./courier-rules";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

const at = (s: string) => new Date(`2026-11-12T${s}:00Z`);

test("status ids map to our stages by number", () => {
  assert.equal(statusRule(3)?.stage, "DELIVERED");
  assert.equal(statusRule(3)?.final, true);
  assert.equal(statusRule(1)?.stage, "OUT_FOR_DELIVERY");
  assert.equal(statusRule(21)?.stage, "PARTIALLY_DELIVERED");
  assert.equal(statusRule(11)?.stage, "DELIVERY_ISSUE");
  assert.equal(statusRule(28)?.stage, "RETURNED");
  assert.equal(statusRule(25)?.stage, "RETURNING");
  assert.equal(statusRule(999), null);
});

test("final statuses never change; late or older messages are ignored", () => {
  assert.equal(shouldApply({ statusId: 3, statusAt: at("10:00"), isFinal: true }, { statusId: 1, at: at("11:00") }), false);
  assert.equal(shouldApply({ statusId: 1, statusAt: at("10:00"), isFinal: false }, { statusId: 0, at: at("09:00") }), false);
  assert.equal(shouldApply({ statusId: 1, statusAt: at("10:00"), isFinal: false }, { statusId: 3, at: at("12:00") }), true);
  assert.equal(shouldApply({ statusId: 1, statusAt: at("10:00"), isFinal: false }, { statusId: 1, at: at("10:00") }), false);
});

test("a failed attempt after out-for-delivery applies, and a resend after it too", () => {
  assert.equal(shouldApply({ statusId: 1, statusAt: at("10:00"), isFinal: false }, { statusId: 4, at: at("11:00") }), true);
  assert.equal(shouldApply({ statusId: 4, statusAt: at("11:00"), isFinal: false }, { statusId: 24, at: at("12:00") }), true);
});

test("a stale 'created' message after the driver picked up does not move it back", () => {
  assert.equal(shouldApply({ statusId: 1, statusAt: at("10:00"), isFinal: false }, { statusId: 20, at: at("10:30") }), false);
});

test("unknown status numbers are not applied", () => {
  assert.equal(shouldApply({ statusId: 1, statusAt: at("10:00"), isFinal: false }, { statusId: 77, at: at("12:00") }), false);
});

test("Iraqi phones in any form become 07XXXXXXXXX", () => {
  assert.equal(courierPhone("+9647701234567"), "07701234567");
  assert.equal(courierPhone("009647701234567"), "07701234567");
  assert.equal(courierPhone("0770 123 4567"), "07701234567");
  assert.equal(courierPhone("٠٧٧٠١٢٣٤٥٦٧"), "07701234567");
  assert.equal(courierPhone("7701234567"), "07701234567");
  assert.equal(courierPhone("0612345678"), null);
  assert.equal(courierPhone(""), null);
});

test("our governorate names match theirs (with aliases and spelling variants)", () => {
  const theirs = [
    { id: 1, name: "بغداد" },
    { id: 2, name: "أربيل" },
    { id: 16, name: "الديوانية" },
    { id: 15, name: "ذي قار" },
    { id: 9, name: "الأنبار" },
  ];
  assert.equal(suggestGovernance("بغداد", theirs), 1);
  assert.equal(suggestGovernance("القادسية", theirs), 16);
  assert.equal(suggestGovernance("اربيل", theirs), 2);
  assert.equal(suggestGovernance("الانبار", theirs), 9);
  assert.equal(suggestGovernance("مدينة غير موجودة", theirs), null);
});

test("courier address joins area, street, house and landmark", () => {
  assert.equal(
    courierAddress({ shipArea: "الكرادة", shipStreet: "شارع 62", shipHouse: "12", shipNotes: "قرب ساحة كهرمانة" }),
    "الكرادة — شارع 62 — بيت 12 — قرب ساحة كهرمانة",
  );
  assert.equal(courierAddress({ shipArea: "المنصور" }), "المنصور");
});

console.log("courier-rules: all passed");

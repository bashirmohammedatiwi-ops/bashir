import assert from "node:assert/strict";
import { isValidIraqiPhone, normalizePhone, toLatinDigits } from "./phone.util";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

test("أرقام عربية-هندية ← لاتينية", () => {
  assert.equal(toLatinDigits("٠٧٧٠١٢٣٤٥٦٧"), "07701234567");
});

test("أرقام فارسية/كردية ← لاتينية", () => {
  assert.equal(toLatinDigits("۰۷۵۰۹۸۷۶۵۴۳"), "07509876543");
});

test("علامات الاتجاه الخفية تُحذف", () => {
  assert.equal(toLatinDigits("‎+964‏ 770‪123‬⁦4567⁩﻿"), "+964 7701234567");
});

test("normalizePhone يقبل الأرقام العربية والملصوقة بعلامات", () => {
  assert.equal(normalizePhone("٠٧٧٠ ١٢٣ ٤٥٦٧"), "+9647701234567");
  assert.equal(normalizePhone("‫+٩٦٤ ٧٧٠ ١٢٣ ٤٥٦٧‬"), "+9647701234567");
  assert.equal(normalizePhone("۰۷۵۰-۹۸۷-۶۵۴۳"), "+9647509876543");
});

test("isValidIraqiPhone مع الأرقام العربية", () => {
  assert.equal(isValidIraqiPhone("٠٧٧٠١٢٣٤٥٦٧"), true);
  assert.equal(isValidIraqiPhone("٠٧٧٠١٢٣"), false);
});

test("الأرقام اللاتينية كما كانت", () => {
  assert.equal(normalizePhone("07701234567"), "+9647701234567");
  assert.equal(normalizePhone("009647701234567"), "+9647701234567");
  assert.equal(normalizePhone("7701234567"), "+9647701234567");
});

console.log("phone.util: all tests passed");

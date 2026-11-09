import assert from "node:assert/strict";
import { activeLaunchPopup } from "./launch-popup.controller";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

const base = { enabled: true, imageId: "img-1", linkType: "product", linkValue: "vs-candles", frequency: "daily" };
const now = new Date("2026-11-09T12:00:00Z");

test("موقوف أو بلا صورة ← لا إعلان", () => {
  assert.equal(activeLaunchPopup({ ...base, enabled: false }, now), null);
  assert.equal(activeLaunchPopup({ ...base, imageId: null }, now), null);
  assert.equal(activeLaunchPopup(undefined, now), null);
});

test("خارج المدة ← لا إعلان", () => {
  assert.equal(activeLaunchPopup({ ...base, startsAt: "2026-11-10T00:00:00Z" }, now), null);
  assert.equal(activeLaunchPopup({ ...base, endsAt: "2026-11-08T00:00:00Z" }, now), null);
  assert.ok(activeLaunchPopup({ ...base, startsAt: "2026-11-01T00:00:00Z", endsAt: "2026-11-30T00:00:00Z" }, now));
});

test("تكرار غير معروف ← يومي", () => {
  assert.equal(activeLaunchPopup({ ...base, frequency: "weird" }, now)!.frequency, "daily");
  assert.equal(activeLaunchPopup({ ...base, frequency: "once" }, now)!.frequency, "once");
});

test("المعرّف ثابت لنفس الإعلان ويتغيّر مع الصورة أو الرابط", () => {
  const a = activeLaunchPopup(base, now)!.id;
  assert.equal(activeLaunchPopup({ ...base, title: "عنوان آخر" }, now)!.id, a);
  assert.notEqual(activeLaunchPopup({ ...base, imageId: "img-2" }, now)!.id, a);
  assert.notEqual(activeLaunchPopup({ ...base, linkValue: "other" }, now)!.id, a);
});

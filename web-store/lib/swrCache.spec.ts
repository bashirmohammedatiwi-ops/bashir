/** تشغيل: npx tsx lib/swrCache.spec.ts */
import assert from "node:assert/strict";
import { swrCache } from "./swrCache";

(async () => {
  let t = 0;
  let calls = 0;
  let fail = false;
  const get = swrCache(
    async (key) => {
      calls++;
      if (fail) throw new Error("api down");
      return `${key}#${calls}`;
    },
    { ttlMs: 60_000, maxStaleMs: 600_000, now: () => t },
  );

  assert.equal(await get("beauty"), "beauty#1", "first load waits");
  assert.equal(await get("beauty"), "beauty#1", "fresh hit");
  assert.equal(calls, 1);

  t = 61_000;
  assert.equal(await get("beauty"), "beauty#1", "stale served while refreshing");
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(calls, 2, "one background refresh");
  assert.equal(await get("beauty"), "beauty#2", "refreshed value replaces the old one");

  t = 130_000;
  fail = true;
  assert.equal(await get("beauty"), "beauty#2", "failed refresh keeps the last good copy");
  await new Promise((r) => setTimeout(r, 0));
  fail = false;

  t = 2_000_000;
  assert.equal(await get("beauty"), "beauty#4", "too old: waits for a fresh copy");

  // طلبات متزامنة لمفتاح جديد تشترك في جلب واحد.
  const before = calls;
  const a = get("care");
  const b = get("care");
  assert.equal(await a, await b, "concurrent first loads share one fetch");
  assert.equal(calls - before, 1);
  console.log("swrCache: 9 passed");
})();

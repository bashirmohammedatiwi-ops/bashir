/** تشغيل: npx tsx src/modules/home/section-visibility.spec.ts */
import assert from "node:assert/strict";
import { isVisibleNow } from "./home-section.resolver";

const now = Date.parse("2026-11-20T12:00:00Z");
const end = "2026-11-28T20:59:59Z";

assert.equal(isVisibleNow({}, now), true, "unscheduled sections show");
assert.equal(isVisibleNow({ visibleUntil: end }, now), true, "before visibleUntil");
assert.equal(isVisibleNow({ visibleUntil: end }, Date.parse("2026-11-28T21:00:00Z")), false, "after visibleUntil");
assert.equal(isVisibleNow({ visibleFrom: end }, now), false, "before visibleFrom");
assert.equal(isVisibleNow({ visibleFrom: end }, Date.parse("2026-11-29T00:00:00Z")), true, "after visibleFrom");
assert.equal(isVisibleNow({ visibleUntil: "soon", visibleFrom: 5 }, now), true, "invalid dates are ignored");
console.log("section visibility: 6 passed");

import assert from "node:assert/strict";
import { buildAppLink, withResolvedLink } from "./link-target.util";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

test("product link", () => {
  assert.equal(buildAppLink("product", "abc"), "/product/abc");
});

test("package link", () => {
  assert.equal(buildAppLink("package", "morning-routine"), "/package/morning-routine");
});

test("skinConcern link", () => {
  assert.equal(buildAppLink("skinConcern", "acne"), "/products?concernSlug=acne");
});

test("categoriesTab link", () => {
  assert.equal(buildAppLink("categoriesTab", ""), "/categories-tab");
});

test("withResolvedLink adds link", () => {
  const out = withResolvedLink({ linkType: "brand", linkValue: "x" });
  assert.equal(out.link, "/products?brandId=x");
});

console.log("link-target.util: all tests passed");

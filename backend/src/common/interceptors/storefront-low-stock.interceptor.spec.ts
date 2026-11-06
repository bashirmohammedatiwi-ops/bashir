import assert from "node:assert/strict";
import { applyLowStock } from "./storefront-low-stock.interceptor";
import { LowStockPolicy } from "../low-stock.policy";

const CARE = "care";
const rules = new Map([[CARE, 2]]);

// منتج مخزونه ≤ الحد يظهر نافذاً في القسم المفعّل
{
  const out = applyLowStock({ data: [{ id: "a", categoryId: CARE, stock: 2 }, { id: "b", categoryId: CARE, stock: 3 }] }, rules, 0) as any;
  assert.equal(out.data[0].stock, 0);
  assert.equal(out.data[1].stock, 3);
}
// الأقسام الأخرى لا تتغيّر (نفس الكائن)
{
  const input = { id: "a", categoryId: "makeup", stock: 1 };
  assert.equal(applyLowStock(input, rules, 0), input);
}
// كل التدرجات قليلة = التدرجات والمنتج نافذة
{
  const out = applyLowStock({ id: "p", categoryId: CARE, stock: 6, shades: [{ id: "s1", stock: 2 }, { id: "s2", stock: 1 }, { id: "s3", stock: 2 }] }, rules, 0) as any;
  assert.deepEqual(out.shades.map((s: any) => s.stock), [0, 0, 0]);
  assert.equal(out.stock, 0);
}
// التدرج المتوفر يبقى، ومخزون المنتج = مجموع المتوفر
{
  const out = applyLowStock({ id: "p", categoryId: CARE, stock: 12, shades: [{ id: "s1", stock: 10 }, { id: "s2", stock: 2 }] }, rules, 0) as any;
  assert.deepEqual(out.shades.map((s: any) => s.stock), [10, 0]);
  assert.equal(out.stock, 10);
}
// الباقة غير متوفرة إذا صار أحد منتجاتها نافذاً
{
  const out = applyLowStock(
    { id: "pk", inStock: true, items: [{ quantity: 1, product: { id: "x", categoryId: CARE, stock: 1 } }, { quantity: 1, product: { id: "y", categoryId: CARE, stock: 9 } }] },
    rules,
    0,
  ) as any;
  assert.equal(out.inStock, false);
}
// effective()
assert.equal(LowStockPolicy.effective(rules, CARE, 0), 0);
assert.equal(LowStockPolicy.effective(rules, CARE, 3), 3);
assert.equal(LowStockPolicy.effective(rules, null, 1), 1);
assert.equal(LowStockPolicy.effective(new Map(), CARE, 1), 1);
console.log("low-stock: all assertions passed");

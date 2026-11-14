/**
 * اختبار تكامل على قاعدة حقيقية: «العدد المحلي» — مزامنة الكاشير تحدّث السعر والخصم ولا تلمس العدد،
 * وحذف الباركود من الكاشير لا يصفّر عدده، وقاعدة «المخزون القليل نافذ» لا تُطبَّق عليه.
 * يعمل فقط على قاعدة اسمها ينتهي بـ «_test»:
 *   DATABASE_URL=postgresql://…/alhayat_test npx tsx src/modules/sync/manual-stock-db.spec.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../common/prisma.service";
import { LowStockPolicy } from "../../common/low-stock.policy";
import { applyLowStock } from "../../common/interceptors/storefront-low-stock.interceptor";
import { InventorySyncService } from "./inventory-sync.service";

const url = process.env.DATABASE_URL ?? "";
if (!/_test(\?|$)/.test(url.split("/").pop() ?? "")) {
  console.error("Refusing to run: DATABASE_URL must point at a database whose name ends with _test");
  process.exit(1);
}

let failures = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`✗ ${name}\n  ${(e as Error).stack ?? e}`);
  }
}

const prisma = new PrismaService();
const noop = { invalidateAll: async () => undefined } as never;
const stockAlerts = { processStockChanges: async () => ({ restock: 0, lowStock: 0 }) } as never;
const offers = { reconcile: async () => undefined } as never;
const reservations = { apply: async <T,>(items: T[]) => items } as never;
const sync = new InventorySyncService(prisma, stockAlerts, noop, offers, reservations);

const tag = randomUUID().replace(/\D/g, "").padEnd(8, "3").slice(0, 8);
const bc = (n: number) => `628${tag}${String(n).padStart(2, "0")}`;
const item = (barcode: string, stock: number, price = 10_000, discountPercent = 20) => ({
  barcode,
  productNum: barcode,
  productCode: barcode,
  name: "x",
  price: Math.round(price * (1 - discountPercent / 100)),
  originalPrice: price,
  discountPercent,
  stock,
  offerName: null,
});

async function main() {
  const brand = await prisma.brand.create({ data: { name: `b-${tag}`, slug: `b-${tag}` } });
  const cat = await prisma.category.create({
    data: { name: `c-${tag}`, slug: `c-${tag}`, hideLowStock: true, lowStockThreshold: 2 } as never,
  });
  const mk = (n: number, manualStock: boolean, stock: number, shades?: Array<{ b: number; stock: number }>) =>
    prisma.product.create({
      data: {
        sku: `sku-${tag}-${n}`,
        barcode: shades ? undefined : bc(n),
        name: `p${n}`,
        slug: `p-${tag}-${n}`,
        price: 1,
        stock,
        manualStock,
        brandId: brand.id,
        categoryId: cat.id,
        shades: shades
          ? { create: shades.map((s, i) => ({ name: `s${i}`, colorHex: "#000", barcode: bc(s.b), stock: s.stock, position: i })) }
          : undefined,
      },
      include: { shades: { orderBy: { position: "asc" } } },
    });
  const posPlain = await mk(1, false, 0);
  const manualPlain = await mk(2, true, 7);
  const manualShaded = await mk(3, true, 5, [{ b: 31, stock: 2 }, { b: 32, stock: 3 }]);
  const posShaded = await mk(4, false, 0, [{ b: 41, stock: 0 }]);

  await test("POS sync updates prices but keeps local counts", async () => {
    await sync.syncMany([item(bc(1), 40), item(bc(2), 99), item(bc(31), 50), item(bc(32), 60), item(bc(41), 9)] as never);
    const [a, b, c, d] = await Promise.all(
      [posPlain, manualPlain, manualShaded, posShaded].map((p) =>
        prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { shades: { orderBy: { position: "asc" } } } }),
      ),
    );
    assert.equal(a.stock, 40);
    assert.equal(b.stock, 7, "manual product count kept");
    assert.equal(b.price, 8_000);
    assert.equal(b.discountPercent, 20);
    assert.deepEqual(c.shades.map((s) => s.stock), [2, 3], "manual shade counts kept");
    assert.equal(c.shades[0].price, 8_000);
    assert.equal(c.stock, 5);
    assert.equal(c.discountPercent, 20);
    assert.equal(d.shades[0].stock, 9);
    assert.equal(d.stock, 9);
  });

  await test("barcodes dropped by the POS do not zero local counts", async () => {
    await (sync as unknown as { zeroCatalogStockForRemovedBarcodes(b: string[]): Promise<unknown> }).zeroCatalogStockForRemovedBarcodes([
      bc(1),
      bc(2),
      bc(31),
      bc(41),
    ]);
    const [a, b, c, d] = await Promise.all(
      [posPlain, manualPlain, manualShaded, posShaded].map((p) =>
        prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { shades: { orderBy: { position: "asc" } } } }),
      ),
    );
    assert.equal(a.stock, 0);
    assert.equal(b.stock, 7);
    assert.deepEqual(c.shades.map((s) => s.stock), [2, 3]);
    assert.equal(d.stock, 0);
  });

  await test("low-stock rule skips local-count products", async () => {
    LowStockPolicy.invalidate();
    const rules = await LowStockPolicy.load(prisma);
    assert.equal(rules.get(cat.id), 2);
    const out = applyLowStock(
      [
        { id: manualShaded.id, categoryId: cat.id, stock: 5, shades: [{ id: "s0", stock: 2 }, { id: "s1", stock: 3 }] },
        { id: posPlain.id, categoryId: cat.id, stock: 2 },
      ],
      rules,
      0,
    ) as Array<{ stock: number; shades?: Array<{ stock: number }> }>;
    assert.equal(out[0].stock, 5);
    assert.deepEqual(out[0].shades!.map((s) => s.stock), [2, 3]);
    assert.equal(out[1].stock, 0);
    assert.equal(LowStockPolicy.effective(rules, cat.id, 1, manualPlain.id), 1);
  });

  await prisma.product.deleteMany({ where: { brandId: brand.id } });
  await prisma.inventorySyncSnapshot.deleteMany({ where: { barcode: { startsWith: `628${tag}` } } });
  await prisma.category.delete({ where: { id: cat.id } });
  await prisma.brand.delete({ where: { id: brand.id } });
  await prisma.$disconnect();
  if (failures) {
    console.error(`${failures} test(s) failed`);
    process.exit(1);
  }
  console.log("manual-stock: all tests passed");
}

void main();

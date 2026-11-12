/**
 * اختبار تكامل على قاعدة بيانات حقيقية: QR الطلب ← المسح ← الإضافي ← النقص ← الإنهاء ← إعادة الفتح، والحجز.
 * يعمل فقط على قاعدة اسمها يحتوي «_test» (لا يلمس أي قاعدة أخرى):
 *   DATABASE_URL=postgresql://…/alhayat_test npx prisma migrate deploy
 *   DATABASE_URL=postgresql://…/alhayat_test npx tsx src/modules/fulfillment/fulfillment-db.spec.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { FulfillmentStage, OrderStatus, PaymentMethod, PaymentStatus, Role } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { stageForStatus } from "../orders/orders.service";
import { DEFAULT_STORE_SETTINGS, SettingsService } from "../settings/settings.service";
import { OrderReservationsService } from "../sync/order-reservations.service";
import { reservationMap } from "../sync/order-reservations";
import { Actor, FulfillmentService } from "./fulfillment.service";
import { OrderTimelineService } from "./order-timeline.service";

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

async function rejects(p: Promise<unknown>, match: RegExp | string) {
  try {
    await p;
  } catch (e) {
    const err = e as { message?: string; getResponse?: () => unknown };
    const text = JSON.stringify(err.getResponse?.() ?? err.message);
    assert.match(text, typeof match === "string" ? new RegExp(match) : match);
    return;
  }
  assert.fail(`expected rejection matching ${match}`);
}

const prisma = new PrismaService();
let settingsOverride: Record<string, unknown> = {};
const settings = { getAll: async () => ({ ...DEFAULT_STORE_SETTINGS, ...settingsOverride }) } as unknown as SettingsService;
const timeline = new OrderTimelineService(prisma);
const svc = new FulfillmentService(prisma, settings, timeline);
const reservations = new OrderReservationsService(prisma, settings);

const tag = randomUUID().slice(0, 8);
const bc = (n: number) => `629${tag.replace(/\D/g, "").padEnd(6, "7").slice(0, 6)}${String(n).padStart(4, "0")}`;

async function seed() {
  const mk = (role: Role, name: string) =>
    prisma.user.create({ data: { email: `${name}-${tag}@test.local`, name, role } });
  const [staff, staff2, admin, customer] = await Promise.all([
    mk(Role.STAFF, "مجهّزة"),
    mk(Role.STAFF, "مجهّزة ثانية"),
    mk(Role.ADMIN, "مدير"),
    mk(Role.CUSTOMER, "زبونة"),
  ]);
  const brand = await prisma.brand.create({ data: { name: `Brand ${tag}`, slug: `brand-${tag}` } });
  const product = (n: number, name: string, price: number, barcode: string | null) =>
    prisma.product.create({
      data: { sku: `SKU-${tag}-${n}`, barcode, name, nameAr: name, slug: `p-${tag}-${n}`, price, stock: 50, brandId: brand.id },
    });
  const lip = await product(1, "أحمر شفاه", 10_000, bc(1));
  const serum = await product(2, "سيروم", 15_000, null);
  const serumShade = await prisma.productShade.create({
    data: { productId: serum.id, name: "30 مل", colorHex: "#ffffff", barcode: bc(2), price: 15_000, stock: 5 },
  });
  // باركود UPC-12 يُخزَّن بصيغته، ويُمسح بصيغة EAN-13 (صفر في البداية).
  const cream = await product(3, "كريم يد", 8_000, "012345" + tag.replace(/\D/g, "").padEnd(6, "3").slice(0, 6));
  const sub = await product(4, "سيروم بديل", 6_500, bc(4));
  return { staff, staff2, admin, customer, lip, serum, serumShade, cream, sub };
}

type Seed = Awaited<ReturnType<typeof seed>>;

async function makeOrder(s: Seed, opts: { status?: OrderStatus; paymentMethod?: PaymentMethod; paymentStatus?: PaymentStatus } = {}) {
  const orderNumber = `ORD-T${tag.toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return prisma.order.create({
    data: {
      orderNumber,
      userId: s.customer.id,
      status: opts.status ?? OrderStatus.CONFIRMED,
      paymentMethod: opts.paymentMethod ?? PaymentMethod.COD,
      paymentStatus: opts.paymentStatus ?? PaymentStatus.PENDING,
      subtotal: 43_000,
      shippingTotal: 5_000,
      total: 48_000,
      shipFullName: "زبونة",
      shipPhone: "07701234567",
      shipGovernorate: "بغداد",
      shipArea: "الكرادة",
      items: {
        create: [
          { productId: s.lip.id, quantity: 2, unitPrice: 10_000, totalPrice: 20_000, productName: "أحمر شفاه", productSku: s.lip.sku, barcode: s.lip.barcode },
          {
            productId: s.serum.id,
            shadeId: s.serumShade.id,
            quantity: 1,
            unitPrice: 15_000,
            totalPrice: 15_000,
            productName: "سيروم",
            productSku: s.serum.sku,
            barcode: s.serumShade.barcode,
            shadeName: s.serumShade.name,
          },
          { productId: s.cream.id, quantity: 1, unitPrice: 8_000, totalPrice: 8_000, productName: "كريم يد", productSku: s.cream.sku, barcode: s.cream.barcode },
        ],
      },
    },
  });
}

async function main() {
  await prisma.$connect();
  const s = await seed();
  const staff: Actor = { id: s.staff.id, role: Role.STAFF };
  const staff2: Actor = { id: s.staff2.id, role: Role.STAFF };
  const admin: Actor = { id: s.admin.id, role: Role.ADMIN };
  const order = await makeOrder(s);
  const lineOf = async (orderId: string, name: string) =>
    (await svc.view(orderId)).lines.find((l) => l.name === name && l.kind === "ORDERED")!;

  await test("QR code opens the order (case-insensitive), product barcodes are not order codes", async () => {
    const hit = await svc.byCode(order.orderNumber.toLowerCase());
    assert.equal(hit.id, order.id);
    await rejects(svc.byCode(s.lip.barcode!), "رمز طلب");
  });

  await test("before picking: 3 grey lines, nothing written", async () => {
    const v = await svc.view(order.id);
    assert.equal(v.lines.length, 3);
    assert.ok(v.lines.every((l) => l.color === "grey"));
    assert.equal(await prisma.orderPickLine.count({ where: { orderId: order.id } }), 0);
  });

  await test("start: claims the order, customer sees PROCESSING, another picker is refused", async () => {
    const v = await svc.start(order.id, staff);
    assert.equal(v.order.stage, FulfillmentStage.PICKING);
    assert.equal(v.order.status, OrderStatus.PROCESSING);
    assert.equal(v.order.pickerName, "مجهّزة");
    await rejects(svc.start(order.id, staff2), "يجهّزه");
    await rejects(svc.scan(order.id, staff2, { barcode: s.lip.barcode! }), "يجهّزه");
  });

  await test("scan: match, duplicate clientScanId counted once, EAN-13 form of a UPC-12 matches", async () => {
    let r = await svc.scan(order.id, staff, { barcode: s.lip.barcode!, clientScanId: "dev-1" });
    assert.equal(r.result, "MATCHED");
    r = await svc.scan(order.id, staff, { barcode: s.lip.barcode!, clientScanId: "dev-1" });
    assert.match(r.message, /مكررة/);
    assert.equal((await lineOf(order.id, "أحمر شفاه")).pickedQty, 1);
    await svc.scan(order.id, staff, { barcode: s.lip.barcode! });
    r = await svc.scan(order.id, staff, { barcode: `0${s.cream.barcode}` });
    assert.equal(r.result, "MATCHED");
    const lip = await lineOf(order.id, "أحمر شفاه");
    assert.equal(lip.pickedQty, 2);
    assert.equal(lip.color, "green");
  });

  await test("scan beyond the ordered count is OVER, not counted", async () => {
    const r = await svc.scan(order.id, staff, { barcode: s.lip.barcode! });
    assert.equal(r.result, "OVER");
    assert.equal((await lineOf(order.id, "أحمر شفاه")).pickedQty, 2);
  });

  await test("an item not in the order is proposed as an extra with its current price", async () => {
    const r = await svc.scan(order.id, staff, { barcode: s.sub.barcode! });
    assert.equal(r.result, "EXTRA_PROPOSED");
    assert.equal(r.proposal?.price, 6_500);
    const unknown = await svc.scan(order.id, staff, { barcode: "999999999999" });
    assert.equal(unknown.result, "UNKNOWN");
  });

  await test("confirmed extra (substitute for the missing serum) shows yellow", async () => {
    const serumLine = await lineOf(order.id, "سيروم");
    const v = await svc.addExtra(order.id, staff, {
      barcode: s.sub.barcode!,
      charge: "PAID",
      reason: "بديل — وافقت الزبونة هاتفياً",
      substituteForLineId: serumLine.id,
    });
    const extra = v.lines.find((l) => l.kind === "EXTRA")!;
    assert.equal(extra.color, "yellow");
    assert.equal(extra.pickedQty, 1);
    // مسحة ثانية للباركود نفسه تزيد الإضافي مباشرة.
    const r = await svc.scan(order.id, staff, { barcode: s.sub.barcode! });
    assert.equal(r.result, "EXTRA");
    await svc.scan(order.id, staff, { barcode: s.sub.barcode!, qty: -1 });
    assert.equal((await svc.view(order.id)).lines.find((l) => l.kind === "EXTRA")!.pickedQty, 1);
  });

  await test("finish needs a reason for every shortage", async () => {
    await rejects(svc.finish(order.id, staff, { parcelCount: 1 }), "SHORTAGE_REASON_REQUIRED");
  });

  await test("finish: the plan's example — 48,000 becomes 39,500 COD, adjustments recorded", async () => {
    const serumLine = await lineOf(order.id, "سيروم");
    const v = await svc.finish(order.id, staff, { parcelCount: 2, reasons: [{ lineId: serumLine.id, reason: "نفد المخزون" }] });
    assert.equal(v.order.stage, FulfillmentStage.PICKED);
    assert.equal(v.money.finalTotal, 39_500);
    assert.equal(v.money.codAmount, 39_500);
    assert.equal(v.lines.find((l) => l.name === "سيروم")!.color, "red");
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(o.finalTotal, 39_500);
    assert.equal(o.codAmount, 39_500);
    assert.equal(o.adjustmentTotal, -8_500);
    assert.equal(o.parcelCount, 2);
    const adj = await prisma.orderAdjustment.findMany({ where: { orderId: order.id }, orderBy: { type: "asc" } });
    assert.deepEqual(
      adj.map((a) => [a.type, a.amount]).sort(),
      [["EXTRA", 6_500], ["SHORTAGE", -15_000]].sort(),
    );
  });

  await test("after finish: scanning is refused; staff cannot reopen; manager can", async () => {
    await rejects(svc.scan(order.id, staff, { barcode: s.lip.barcode! }), "انتهى التجهيز");
    await rejects(svc.reopen(order.id, staff, { reason: "x" }), "للمدير");
    const v = await svc.reopen(order.id, admin, { reason: "الزبونة غيّرت رأيها" });
    assert.equal(v.order.stage, FulfillmentStage.PICKING);
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(o.finalTotal, null);
    assert.equal(await prisma.orderAdjustment.count({ where: { orderId: order.id } }), 0);
    await svc.finish(order.id, staff, { parcelCount: 1 });
  });

  await test("timeline lists start, extra, finish, reopen in order", async () => {
    const t = await svc.timelineOf(order.id);
    const types = t.map((e) => e.type);
    for (const k of ["PICK_STARTED", "PICK_EXTRA_ADDED", "PICK_FINISHED", "PICK_REOPENED"]) assert.ok(types.includes(k), k);
    assert.ok(types.indexOf("PICK_STARTED") < types.indexOf("PICK_FINISHED"));
  });

  await test("big shortage needs a manager to finish", async () => {
    const o2 = await makeOrder(s);
    await svc.start(o2.id, staff);
    await svc.scan(o2.id, staff, { barcode: `0${s.cream.barcode}` });
    const lines = (await svc.view(o2.id)).lines.filter((l) => l.pickedQty === 0);
    const reasons = lines.map((l) => ({ lineId: l.id, reason: "نفد" }));
    await rejects(svc.finish(o2.id, staff, { reasons }), "APPROVAL_REQUIRED");
    const v = await svc.finish(o2.id, admin, { reasons });
    assert.equal(v.order.stage, FulfillmentStage.PICKED);
    assert.equal(v.money.finalTotal, 13_000);
  });

  await test("everything missing cannot be finished", async () => {
    const o3 = await makeOrder(s);
    await svc.start(o3.id, staff);
    const reasons = (await svc.view(o3.id)).lines.map((l) => ({ lineId: l.id, reason: "نفد" }));
    await rejects(svc.finish(o3.id, admin, { reasons }), "ALL_MISSING");
  });

  await test("unpaid card order cannot be picked", async () => {
    const o4 = await makeOrder(s, { paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.PENDING, status: OrderStatus.PENDING });
    await rejects(svc.start(o4.id, staff), "لم يُدفع");
  });

  await test("parallel scans never pick more than ordered", async () => {
    const o5 = await makeOrder(s);
    await svc.start(o5.id, staff);
    const results = await Promise.all(Array.from({ length: 6 }, () => svc.scan(o5.id, staff, { barcode: s.lip.barcode! })));
    assert.equal((await lineOf(o5.id, "أحمر شفاه")).pickedQty, 2);
    assert.equal(results.filter((r) => r.result === "MATCHED").length, 2);
    assert.equal(results.filter((r) => r.result === "OVER").length, 4);
  });

  await test("reservations: open orders reserved by barcode, cancelled and old-invoiced ones are not", async () => {
    const before = reservationMap(await reservations.reservedRows());
    const lipReserved = before.get(s.lip.barcode!)?.qty ?? 0;
    assert.ok(lipReserved >= 2, `lip reserved ${lipReserved}`);
    const extra = await makeOrder(s);
    let map = reservationMap(await reservations.reservedRows());
    assert.equal(map.get(s.lip.barcode!)?.qty, lipReserved + 2);
    await prisma.order.update({ where: { id: extra.id }, data: { status: OrderStatus.CANCELLED, fulfillmentStage: FulfillmentStage.CANCELLED } });
    map = reservationMap(await reservations.reservedRows());
    assert.equal(map.get(s.lip.barcode!)?.qty, lipReserved);
    const inv = await makeOrder(s);
    await prisma.order.update({ where: { id: inv.id }, data: { posInvoicedAt: new Date(Date.now() - 10 * 60_000) } });
    map = reservationMap(await reservations.reservedRows());
    assert.equal(map.get(s.lip.barcode!)?.qty, lipReserved);
  });

  await test("reservations only apply when enabled in settings", async () => {
    const items = [{ barcode: s.lip.barcode!, stock: 100 }];
    settingsOverride = { orderStockReservation: false };
    assert.equal((await reservations.apply(items))[0].stock, 100);
    settingsOverride = { orderStockReservation: true };
    assert.ok((await reservations.apply(items))[0].stock < 100);
    settingsOverride = {};
  });

  await test("manual status changes move the stage forward only", async () => {
    assert.equal(stageForStatus(OrderStatus.SHIPPED, FulfillmentStage.PICKED), FulfillmentStage.HANDED_OVER);
    assert.equal(stageForStatus(OrderStatus.SHIPPED, FulfillmentStage.OUT_FOR_DELIVERY), null);
    assert.equal(stageForStatus(OrderStatus.CONFIRMED, FulfillmentStage.PICKING), null);
    assert.equal(stageForStatus(OrderStatus.CANCELLED, FulfillmentStage.PICKING), FulfillmentStage.CANCELLED);
    assert.equal(stageForStatus(OrderStatus.DELIVERED, FulfillmentStage.PARTIALLY_DELIVERED), null);
  });

  await test("cashier edits: fill a shortage, add a POS-only item, remove it, shortage needs a reason, gift is free", async () => {
    const cashier = { name: "كاشير الطلبات" };
    const o6 = await makeOrder(s);
    await svc.start(o6.id, staff);
    await rejects(svc.cashierEdit(o6.id, cashier, { op: "add", barcode: s.lip.barcode! }), "قيد التجهيز");
    await svc.scan(o6.id, staff, { barcode: s.lip.barcode! });
    await svc.scan(o6.id, staff, { barcode: s.lip.barcode! });
    await svc.scan(o6.id, staff, { barcode: `0${s.cream.barcode}` });
    const serum = await lineOf(o6.id, "سيروم");
    let v = await svc.finish(o6.id, staff, { reasons: [{ lineId: serum.id, reason: "لم يُجد" }] });
    assert.equal(v.money.finalTotal, 33_000);

    // الكاشير وجد السيروم: يكمل الناقص بدل أن يصير إضافياً.
    v = await svc.cashierEdit(o6.id, cashier, { op: "add", barcode: s.serumShade.barcode!, clientEditId: "e1" });
    assert.equal(v.lines.find((l) => l.name === "سيروم")!.color, "green");
    assert.equal(v.lines.filter((l) => l.kind === "EXTRA").length, 0);
    assert.equal(v.money.finalTotal, 48_000);
    assert.equal(v.order.stage, FulfillmentStage.PICKED);

    // صنف في المحل غير موجود في التطبيق: بسعر المحل، والمعرّف المكرر لا يُضاف مرتين.
    const posOnly = `POSX${tag}`;
    v = await svc.cashierEdit(o6.id, cashier, { op: "add", barcode: posOnly, qty: 2, posName: "مشط شعر", posPrice: 3_000, clientEditId: "e2" });
    v = await svc.cashierEdit(o6.id, cashier, { op: "add", barcode: posOnly, qty: 2, posName: "مشط شعر", posPrice: 3_000, clientEditId: "e2" });
    const comb = v.lines.find((l) => l.kind === "EXTRA" && l.barcode === posOnly)!;
    assert.equal(comb.pickedQty, 2);
    assert.equal(comb.productId, null);
    assert.equal(comb.color, "yellow");
    assert.equal(v.money.finalTotal, 54_000);
    await rejects(svc.cashierEdit(o6.id, cashier, { op: "add", barcode: "000-unknown" }), "غير موجود");

    v = await svc.cashierEdit(o6.id, cashier, { op: "set", lineId: comb.id, qty: 0 });
    assert.ok(!v.lines.some((l) => l.barcode === posOnly));
    assert.equal(v.money.finalTotal, 48_000);

    const lip = await lineOf(o6.id, "أحمر شفاه");
    await rejects(svc.cashierEdit(o6.id, cashier, { op: "set", lineId: lip.id, qty: 1 }), "SHORTAGE_REASON_REQUIRED");
    v = await svc.cashierEdit(o6.id, cashier, { op: "set", lineId: lip.id, qty: 1, reason: "قطعة تالفة" });
    assert.equal(v.lines.find((l) => l.id === lip.id)!.color, "red");
    assert.equal(v.money.finalTotal, 38_000);

    v = await svc.cashierEdit(o6.id, cashier, { op: "add", barcode: s.sub.barcode!, charge: "FREE", reason: "هدية" });
    assert.equal(v.lines.find((l) => l.kind === "EXTRA")!.charge, "FREE");
    assert.equal(v.money.finalTotal, 38_000);

    const o = await prisma.order.findUniqueOrThrow({ where: { id: o6.id } });
    assert.equal(o.finalTotal, 38_000);
    assert.equal(o.codAmount, 38_000);
    assert.ok((await svc.timelineOf(o6.id)).some((e) => e.type === "POS_EDIT" && e.actorName === "كاشير الطلبات"));

    await prisma.order.update({ where: { id: o6.id }, data: { posInvoicedAt: new Date(), posReceiptNumber: "77" } });
    await rejects(svc.cashierEdit(o6.id, cashier, { op: "add", barcode: s.lip.barcode! }), "مُفوتر");
  });

  await test("slip: sorted lines, no prices, QR code is the order number", async () => {
    const slip = await svc.slip(order.id);
    assert.equal(slip.code, order.orderNumber);
    assert.equal(slip.totalUnits, 4);
    assert.ok(!JSON.stringify(slip).includes("unitPrice"));
  });

  await prisma.$disconnect();
  if (failures) {
    console.error(`${failures} failed`);
    process.exit(1);
  }
  console.log("fulfillment db-spec: all passed");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

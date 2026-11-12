/**
 * اختبار تكامل للشحن وكاشير الطلبات على قاعدة بيانات اختبار (اسمها ينتهي بـ _test) وهاي إكسبريس وهمي:
 *   DATABASE_URL=postgresql://…/alhayat_test npx tsx src/modules/delivery/delivery-db.spec.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { FulfillmentStage, OrderStatus, PaymentMethod, PaymentStatus, Role, ShipmentState } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { FulfillmentService } from "../fulfillment/fulfillment.service";
import { OrderTimelineService } from "../fulfillment/order-timeline.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { OrderEvents } from "../orders/order-events";
import { OrdersService } from "../orders/orders.service";
import { DEFAULT_STORE_SETTINGS, SettingsService } from "../settings/settings.service";
import { ShippingService } from "../shipping/shipping.service";
import { HiExpressError } from "./hi-express.client";
import { OrderNotice } from "./order-notify.service";
import { PosLinkService } from "./pos-link.service";
import { ShipmentsService } from "./shipments.service";

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
async function rejects(p: Promise<unknown>, match: string) {
  try {
    await p;
  } catch (e) {
    const err = e as { message?: string; getResponse?: () => unknown };
    assert.match(JSON.stringify(err.getResponse?.() ?? err.message), new RegExp(match));
    return;
  }
  assert.fail(`expected rejection matching ${match}`);
}

/** هاي إكسبريس وهمي: يحفظ ما أُرسل، وحالة كل طلب، ويمكن جعله يفشل. */
class FakeHi {
  configured = true;
  created = new Map<string, any>();
  status = new Map<string, { id: number; at: string; value?: number; driver?: string }>();
  failNext: HiExpressError | null = null;
  deleted: string[] = [];
  private n = 1000;
  async authorize() {
    return true;
  }
  async governances() {
    return [
      { id: 1, name: "بغداد" },
      { id: 16, name: "الديوانية" },
    ];
  }
  async createOrder(o: any) {
    if (this.failNext) {
      const e = this.failNext;
      this.failNext = null;
      throw e;
    }
    if (this.created.has(o.client_identifier)) throw new HiExpressError("client_identifier has already been taken", 422, false);
    const tracking = `BGD${++this.n}`;
    this.created.set(o.client_identifier, { ...o, tracking });
    this.status.set(o.client_identifier, { id: 0, at: new Date().toISOString() });
    return { orderIdentifier: tracking };
  }
  async showOrder(alias: string) {
    const c = [...this.created.values()].find((x) => x.client_identifier === alias || x.tracking === alias);
    if (!c) throw new HiExpressError("not found", 404, false);
    const st = this.status.get(c.client_identifier)!;
    return {
      id: 1,
      order_identifier: c.tracking,
      client_identifier: c.client_identifier,
      order_value: st.value ?? c.order_value,
      delivery_amount: 0,
      return_cost: 0,
      shipping_cost: 5000,
      last_status_type_id: st.id,
      last_status_date: st.at,
      driver_name: st.driver ?? null,
      delivery_attempts: 1,
      status: [{ status_type: st.id, status_msg: null, created_at: st.at }],
    };
  }
  async liveStatuses(ids: string[]) {
    return ids.filter((i) => this.status.has(i)).map((i) => ({ client_identifier: i, status_id: this.status.get(i)!.id }));
  }
  async deleteOrder(alias: string) {
    this.deleted.push(alias);
  }
  updates: Array<{ id: string; body: any }> = [];
  async updateOrder(clientIdentifier: string, body: any) {
    const c = this.created.get(clientIdentifier);
    if (!c) throw new HiExpressError("not found", 404, false);
    if ((this.status.get(clientIdentifier)?.id ?? 0) !== 0) throw new HiExpressError("order can not be updated", 422, false);
    this.updates.push({ id: clientIdentifier, body });
    this.created.set(clientIdentifier, { ...c, ...body });
  }
  async labelBase64(_alias: string) {
    return "JVBERi0xLjQKJcfsj6IK";
  }
  set(clientId: string, id: number, extra: { value?: number; driver?: string } = {}) {
    this.status.set(clientId, { id, at: new Date(Date.now() + id * 1000).toISOString(), ...extra });
  }
}

const prisma = new PrismaService();
const settings = { getAll: async () => ({ ...DEFAULT_STORE_SETTINGS }) } as unknown as SettingsService;
const notices: Array<{ orderId: string; kind: string }> = [];
const notify = { send: async (orderId: string, n: OrderNotice) => void notices.push({ orderId, kind: n.kind }) } as any;
const timeline = new OrderTimelineService(prisma);
const fulfillment = new FulfillmentService(prisma, settings, timeline, notify);
const loyalty = new LoyaltyService(prisma, settings);
const orders = new OrdersService(prisma, settings, new ShippingService(prisma, settings), loyalty, new OrderEvents());
const hi = new FakeHi();
const shipments = new ShipmentsService(prisma, hi as any, settings, orders, notify, timeline);
const refunds: Array<{ orderId: string; amount?: number }> = [];
const payments = { adminRefund: async (orderId: string, _a: string, amount?: number) => void refunds.push({ orderId, amount }) } as any;
const link = new PosLinkService(prisma, fulfillment, shipments, orders, payments, settings, timeline, notify);

const tag = randomUUID().slice(0, 6).toUpperCase();

async function main() {
  await prisma.$connect();
  const staff = await prisma.user.create({ data: { email: `dstaff-${tag}@test.local`, name: "مجهّزة", role: Role.STAFF } });
  const customer = await prisma.user.create({ data: { email: `dcust-${tag}@test.local`, name: "زبونة", role: Role.CUSTOMER, phone: `+96477${String(Date.now()).slice(-8)}` } });
  const brand = await prisma.brand.create({ data: { name: `B${tag}`, slug: `b-${tag.toLowerCase()}` } });
  const p = await prisma.product.create({ data: { sku: `D-${tag}`, barcode: `628${String(Date.now()).slice(-10)}`, name: "عطر", nameAr: "عطر", slug: `d-${tag.toLowerCase()}`, price: 20_000, stock: 9, brandId: brand.id } });
  const actor = { id: staff.id, role: Role.STAFF };

  const makePicked = async (opts: { gov?: string; phone?: string; qty?: number; picked?: number; pickup?: boolean; paid?: boolean } = {}) => {
    const qty = opts.qty ?? 2;
    const o = await prisma.order.create({
      data: {
        orderNumber: `ORD-D${tag}${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        userId: customer.id,
        status: OrderStatus.CONFIRMED,
        fulfillmentStage: FulfillmentStage.CONFIRMED,
        paymentMethod: opts.paid ? PaymentMethod.CARD : PaymentMethod.COD,
        paymentStatus: opts.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
        deliveryOption: opts.pickup ? "PICKUP" : "STANDARD",
        subtotal: 20_000 * qty,
        shippingTotal: opts.pickup ? 0 : 5_000,
        total: 20_000 * qty + (opts.pickup ? 0 : 5_000),
        loyaltyEarned: 999,
        shipFullName: "زبونة الاختبار",
        shipPhone: opts.phone ?? "+9647701234567",
        shipGovernorate: opts.gov ?? "بغداد",
        shipArea: "الكرادة",
        items: { create: [{ productId: p.id, quantity: qty, unitPrice: 20_000, totalPrice: 20_000 * qty, productName: "عطر", productSku: p.sku, barcode: p.barcode }] },
      },
    });
    await fulfillment.start(o.id, actor);
    for (let i = 0; i < (opts.picked ?? qty); i++) await fulfillment.scan(o.id, actor, { barcode: p.barcode! });
    const view = await fulfillment.view(o.id);
    const reasons = view.lines.filter((l) => l.pickedQty < l.orderedQty).map((l) => ({ lineId: l.id, reason: "نفد المخزون" }));
    await fulfillment.finish(o.id, { id: staff.id, role: Role.ADMIN }, { parcelCount: 1, reasons });
    return prisma.order.findUniqueOrThrow({ where: { id: o.id } });
  };

  await test("cashier lookup by QR: receipt lines total exactly the final amount, no blockers", async () => {
    const o = await makePicked();
    const r = await link.lookup(o.orderNumber.toLowerCase());
    assert.equal(r.canInvoice, true, JSON.stringify(r.blockers));
    assert.deepEqual(r.blockers, []);
    assert.equal(r.receipt.total, 45_000);
    assert.equal(r.receipt.itemsTotal + r.receipt.shipping + r.receipt.giftWrap - r.receipt.discount, r.receipt.total);
    assert.equal(r.customer.phone, "07701234567");
  });

  await test("invoice → shipment created at Hi Express with the COD amount; order SHIPPED; idempotent re-send", async () => {
    const o = await makePicked();
    const ref = { clientReceiptId: `rc-${o.id}`, receiptNumber: "A-101", cashierName: "كاشير الطلبات", total: 45_000 };
    await rejects(link.invoice(o.orderNumber, { ...ref, total: 44_000 }), "لا يساوي");
    const r = await link.invoice(o.orderNumber, ref);
    assert.equal(r.shipment?.state, ShipmentState.CREATED);
    assert.match(r.shipment?.trackingNumber ?? "", /^BGD/);
    const sent = hi.created.get(o.orderNumber);
    assert.equal(sent.order_value, 45_000);
    assert.equal(sent.governance_id, 1);
    assert.equal(sent.customer_phone, "07701234567");
    assert.equal(sent.items[0].count, 2);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    assert.equal(after.status, OrderStatus.SHIPPED);
    assert.equal(after.fulfillmentStage, FulfillmentStage.HANDED_OVER);
    const again = await link.invoice(o.orderNumber, ref);
    assert.equal(again.shipment?.trackingNumber, r.shipment?.trackingNumber);
    assert.equal(hi.created.size >= 1, true);
    await rejects(link.invoice(o.orderNumber, { ...ref, clientReceiptId: "other" }), "مُفوتر");
    assert.ok(notices.some((n) => n.orderId === o.id && n.kind === "SHIPPED"));
  });

  await test("edit after invoicing: only when allowed, reaches Hi Express; locked once the driver picks it up; label is theirs", async () => {
    const o = await makePicked();
    await link.invoice(o.orderNumber, { clientReceiptId: `rc-e-${o.id}`, receiptNumber: "A-201", cashierName: "كاشير الطلبات", total: 45_000 });
    await rejects(link.edit(o.orderNumber, { op: "add", barcode: p.barcode!, cashierName: "ك" }), "مُفوتر");
    const r = await link.edit(o.orderNumber, { op: "add", barcode: p.barcode!, cashierName: "كاشير الطلبات", allowInvoiced: true, clientEditId: "inv-e1" });
    assert.equal(r.courierUpdate?.ok, true);
    assert.equal(r.receipt.total, 65_000);
    const sent = hi.created.get(o.orderNumber);
    assert.equal(sent.order_value, 65_000);
    assert.equal(sent.items.reduce((n: number, i: any) => n + i.count, 0), 3);
    assert.equal(hi.updates[hi.updates.length - 1]?.body.client_identifier, undefined);
    assert.ok((await timeline.list(o.id)).some((e) => e.type === "SHIPMENT_UPDATED"));
    // خصم يدوي من الكاشير بعد الفوترة: المبلغ والمحصّل يقلّان ويصلان هاي إكسبريس، والإيصال يطابق.
    const disc = await link.edit(o.orderNumber, { op: "discount", amount: 5_000, reason: "زبونة دائمة", cashierName: "كاشير الطلبات", allowInvoiced: true });
    assert.equal(disc.receipt.total, 60_000);
    assert.equal(disc.order.cashierDiscount, 5_000);
    assert.equal(disc.receipt.itemsTotal + disc.receipt.shipping + disc.receipt.giftWrap - disc.receipt.discount, 60_000);
    assert.equal(hi.created.get(o.orderNumber).order_value, 60_000);
    const back = await link.edit(o.orderNumber, { op: "discount", amount: 0, cashierName: "كاشير الطلبات", allowInvoiced: true });
    assert.equal(back.receipt.total, 65_000);
    // خيارات التوصيل بعد الفوترة: نوع الشحنة والملاحظة والهاتف الثاني تصل هاي إكسبريس فوراً.
    const opt = await link.courierOptions(o.orderNumber, { typeId: 2, parcelCount: 2, note: "اتصل قبل الوصول", phone2: "07801112233", cashierName: "كاشير الطلبات" });
    assert.equal(opt.courierUpdate?.ok, true);
    assert.equal(opt.courier.effectiveTypeId, 2);
    const sentOpt = hi.created.get(o.orderNumber);
    assert.equal(sentOpt.order_type_id, 2);
    assert.equal(sentOpt.customer_secondary_phone, "07801112233");
    assert.match(sentOpt.notes, /للمندوب: اتصل قبل الوصول/);
    assert.match(sentOpt.notes, /عدد الأكياس: 2/);
    await rejects(link.courierOptions(o.orderNumber, { phone2: "123", cashierName: "ك" }), "غير صالح");
    const lbl = await link.label(o.orderNumber);
    assert.match(lbl.pdfBase64, /^JVBERi0/);
    hi.set(o.orderNumber, 1, { driver: "علي" });
    await rejects(link.edit(o.orderNumber, { op: "add", barcode: p.barcode!, cashierName: "ك", allowInvoiced: true }), "COURIER_LOCKED");
    const paid = await makePicked({ paid: true });
    await link.invoice(paid.orderNumber, { clientReceiptId: `rc-p-${paid.id}`, receiptNumber: "A-202", cashierName: "ك", total: paid.finalTotal ?? paid.total });
    await rejects(link.edit(paid.orderNumber, { op: "add", barcode: p.barcode!, cashierName: "ك", allowInvoiced: true }), "مدفوع مسبقاً");
  });

  await test("Hi Express statuses: out for delivery, then delivered → order DELIVERED, points from collected cash", async () => {
    const o = await makePicked();
    await link.invoice(o.orderNumber, { clientReceiptId: `rc-${o.id}`, receiptNumber: "A-102", cashierName: "ك", total: 45_000 });
    const sh = (await prisma.shipment.findFirst({ where: { orderId: o.id } }))!;
    hi.set(o.orderNumber, 1, { driver: "علي" });
    await shipments.handleWebhook({ payload: { client_identifier: o.orderNumber, status: { id: 1 } } });
    let ord = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    assert.equal(ord.fulfillmentStage, FulfillmentStage.OUT_FOR_DELIVERY);
    assert.equal((await prisma.shipment.findUniqueOrThrow({ where: { id: sh.id } })).driverName, "علي");
    hi.set(o.orderNumber, 3, { value: 45_000 });
    await shipments.poll();
    ord = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    assert.equal(ord.status, OrderStatus.DELIVERED);
    assert.equal(ord.fulfillmentStage, FulfillmentStage.DELIVERED);
    assert.equal(ord.loyaltyEarned, 450);
    const s2 = await prisma.shipment.findUniqueOrThrow({ where: { id: sh.id } });
    assert.equal(s2.isFinal, true);
    assert.equal(s2.collectedAmount, 45_000);
    // رسالة متأخرة بعد التسليم لا تغيّر شيئاً.
    hi.set(o.orderNumber, 1);
    await shipments.handleWebhook({ payload: { client_identifier: o.orderNumber } });
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).fulfillmentStage, FulfillmentStage.DELIVERED);
  });

  await test("partial delivery records the reduced amount; return to merchant cancels the order", async () => {
    const a = await makePicked();
    await link.invoice(a.orderNumber, { clientReceiptId: `rc-${a.id}`, receiptNumber: "A-103", cashierName: "ك", total: 45_000 });
    hi.set(a.orderNumber, 21, { value: 25_000 });
    await shipments.poll();
    const pa = await prisma.order.findUniqueOrThrow({ where: { id: a.id } });
    assert.equal(pa.status, OrderStatus.DELIVERED);
    assert.equal(pa.fulfillmentStage, FulfillmentStage.PARTIALLY_DELIVERED);
    const adj = await prisma.orderAdjustment.findFirst({ where: { orderId: a.id, type: "PARTIAL_DELIVERY" } });
    assert.equal(adj?.amount, -20_000);

    const b = await makePicked();
    await link.invoice(b.orderNumber, { clientReceiptId: `rc-${b.id}`, receiptNumber: "A-104", cashierName: "ك", total: 45_000 });
    hi.set(b.orderNumber, 25);
    await shipments.poll();
    let pb = await prisma.order.findUniqueOrThrow({ where: { id: b.id } });
    assert.equal(pb.status, OrderStatus.CANCELLED);
    assert.equal(pb.fulfillmentStage, FulfillmentStage.RETURNING);
    const q = await link.queue();
    assert.ok(q.returns.some((x) => x.id === b.id));
    await link.returnReceipt(b.orderNumber, { clientReceiptId: `ret-${b.id}`, receiptNumber: "R-1", cashierName: "ك", lines: [{ barcode: p.barcode!, qty: 2 }] });
    pb = await prisma.order.findUniqueOrThrow({ where: { id: b.id } });
    assert.equal(pb.fulfillmentStage, FulfillmentStage.RETURNED);
    assert.ok(!(await link.queue()).returns.some((x) => x.id === b.id));
  });

  await test("network failure → RETRYING, then the background worker creates it; a lost reply is not duplicated", async () => {
    const o = await makePicked();
    hi.failNext = new HiExpressError("تعذر الاتصال", null, true);
    const r = await link.invoice(o.orderNumber, { clientReceiptId: `rc-${o.id}`, receiptNumber: "A-105", cashierName: "ك", total: 45_000 });
    assert.equal(r.shipment?.state, ShipmentState.RETRYING);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).fulfillmentStage, FulfillmentStage.INVOICED);
    assert.ok((await link.queue()).awaitingCourier.some((x) => x.id === o.id));
    await prisma.shipment.updateMany({ where: { orderId: o.id }, data: { nextAttemptAt: new Date(0) } });
    await (shipments as any).runCreateWorker();
    const sh = (await prisma.shipment.findFirst({ where: { orderId: o.id } }))!;
    assert.equal(sh.state, ShipmentState.CREATED);
    // الرد ضاع لكن الطلب أُنشئ لديهم: المحاولة التالية تتبنّاه بدل إنشائه مرتين.
    const o2 = await makePicked();
    await hi.createOrder({ client_identifier: o2.orderNumber, order_value: 45_000 });
    hi.failNext = null;
    const r2 = await link.invoice(o2.orderNumber, { clientReceiptId: `rc-${o2.id}`, receiptNumber: "A-106", cashierName: "ك", total: 45_000 });
    assert.equal(r2.shipment?.state, ShipmentState.CREATED);
    assert.equal(r2.shipment?.trackingNumber, hi.created.get(o2.orderNumber).tracking);
  });

  await test("blockers: invalid phone and unmapped governorate are shown before printing", async () => {
    const o = await makePicked({ phone: "123", gov: "مدينة مجهولة" });
    const r = await link.lookup(o.orderNumber);
    assert.equal(r.canInvoice, false);
    assert.ok(r.blockers.some((b) => b.includes("هاتف")));
    assert.ok(r.blockers.some((b) => b.includes("غير مربوطة")));
    await rejects(link.invoice(o.orderNumber, { clientReceiptId: "x", receiptNumber: "x", cashierName: "x", total: 45_000 }), "SHIPMENT_BLOCKED");
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).posInvoicedAt, null);
  });

  await test("alias: our «القادسية» maps to their «الديوانية» automatically", async () => {
    const m = await shipments.resolveArea("القادسية", null);
    assert.equal(m.governanceId, 16);
  });

  await test("pickup order: handover marks it delivered, no shipment", async () => {
    const o = await makePicked({ pickup: true });
    assert.equal(o.fulfillmentStage, FulfillmentStage.READY_FOR_PICKUP);
    const r = await link.pickupHandover(o.orderNumber, { clientReceiptId: `pk-${o.id}`, receiptNumber: "P-1", cashierName: "ك", total: 40_000 });
    assert.equal(r.delivered, true);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    assert.equal(after.status, OrderStatus.DELIVERED);
    assert.equal(await prisma.shipment.count({ where: { orderId: o.id } }), 0);
  });

  await test("prepaid card order with a shortage: refund is requested after invoicing", async () => {
    const o = await makePicked({ paid: true, picked: 1 });
    assert.equal(o.codAmount, 0);
    await link.invoice(o.orderNumber, { clientReceiptId: `rc-${o.id}`, receiptNumber: "A-107", cashierName: "ك", total: o.finalTotal! });
    assert.deepEqual(refunds.find((r) => r.orderId === o.id), { orderId: o.id, amount: 20_000 });
    const adj = await prisma.orderAdjustment.findFirst({ where: { orderId: o.id, method: "CARD_REFUND" } });
    assert.equal(adj?.status, "DONE");
  });

  await test("customer view: tracking number and changes are exposed", async () => {
    const o = await makePicked({ picked: 1 });
    await link.invoice(o.orderNumber, { clientReceiptId: `rc-${o.id}`, receiptNumber: "A-108", cashierName: "ك", total: o.finalTotal! });
    const d = await orders.deliveryInfo(o.id);
    assert.equal(d?.stageLabel, "تم الشحن");
    assert.match(d?.trackingNumber ?? "", /^BGD/);
    assert.equal(d?.changes[0].kind, "missing");
    assert.equal(d?.finalTotal, 25_000);
  });

  await prisma.$disconnect();
  if (failures) {
    console.error(`${failures} failed`);
    process.exit(1);
  }
  console.log("delivery db-spec: all passed");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

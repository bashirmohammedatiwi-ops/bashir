import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AdjustmentMethod, DeliveryOption, FulfillmentStage, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { FulfillmentService } from "../fulfillment/fulfillment.service";
import { OrderTimelineService } from "../fulfillment/order-timeline.service";
import { orderCode, parseOrderCode } from "../fulfillment/pick-engine";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";
import { SettingsService } from "../settings/settings.service";
import { courierAddress, courierPhone } from "./courier-rules";
import { OrderNotifyService } from "./order-notify.service";
import { ShipmentsService } from "./shipments.service";

export interface CashierRef {
  clientReceiptId: string;
  receiptNumber: string;
  cashierName: string;
  cashierId?: string | null;
  terminal?: string | null;
}

/**
 * أسطر الطلب وقطعه كما طُلب، وما سيُسلَّم بعد التجهيز (المطابق + الإضافي) — للطابور والطلب.
 * قبل بدء التجهيز لا توجد أسطر تجهيز فيُعرض المطلوب.
 */
export function unitCounts(
  items: Array<{ quantity: number }>,
  lines: Array<{ kind: string; orderedQty: number; pickedQty: number }>,
) {
  const orderedLines = items.length;
  const orderedUnits = items.reduce((n, i) => n + i.quantity, 0);
  if (!lines.length) {
    return { orderedLines, orderedUnits, lines: orderedLines, units: orderedUnits, missingUnits: 0, extraUnits: 0 };
  }
  let units = 0;
  let deliveredLines = 0;
  let missingUnits = 0;
  let extraUnits = 0;
  for (const l of lines) {
    if (l.kind === "ORDERED") {
      const got = Math.min(l.pickedQty, l.orderedQty);
      units += got;
      missingUnits += Math.max(0, l.orderedQty - l.pickedQty);
      if (got > 0) deliveredLines += 1;
    } else if (l.pickedQty > 0) {
      units += l.pickedQty;
      extraUnits += l.pickedQty;
      deliveredLines += 1;
    }
  }
  return { orderedLines, orderedUnits, lines: deliveredLines, units, missingUnits, extraUnits };
}

/** أنواع الشحنة عند هاي إكسبريس (order_type_id) — نفس مربعات ملصقهم. */
export const HI_ORDER_TYPES = [
  { id: 1, name: "قابل للكسر" },
  { id: 2, name: "توصيل مبرد" },
  { id: 3, name: "ممنوع الفتح" },
  { id: 4, name: "معاملة خاصة" },
];

const QUEUE_STAGES: FulfillmentStage[] = [
  FulfillmentStage.PICKED,
  FulfillmentStage.READY_FOR_PICKUP,
  FulfillmentStage.INVOICED,
  FulfillmentStage.PICKING,
  FulfillmentStage.RETURNING,
  FulfillmentStage.RETURNED,
  FulfillmentStage.PARTIALLY_DELIVERED,
];

/**
 * ما يحتاجه «كاشير الطلبات» من الموقع (عبر سيرفر المحل الموقّع): الطابور، فتح الطلب بالـQR،
 * الفوترة (ثم شحنة هاي إكسبريس فوراً)، بيانات الطباعة، تسليم الاستلام من المحل، والمرتجعات.
 */
@Injectable()
export class PosLinkService {
  private readonly logger = new Logger(PosLinkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillment: FulfillmentService,
    private readonly shipments: ShipmentsService,
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
    private readonly settings: SettingsService,
    private readonly timeline: OrderTimelineService,
    private readonly notify: OrderNotifyService,
  ) {}

  ping() {
    return { ok: true, serverTime: new Date().toISOString() };
  }

  async queue() {
    const rows = await this.prisma.order.findMany({
      where: { fulfillmentStage: { in: QUEUE_STAGES }, createdAt: { gt: new Date(Date.now() - 60 * 86_400_000) } },
      orderBy: [{ pickedAt: "asc" }, { createdAt: "asc" }],
      take: 300,
      include: {
        shipments: { orderBy: { createdAt: "desc" }, take: 1 },
        events: { where: { type: "POS_RETURN" }, select: { id: true }, take: 1 },
        _count: { select: { items: true } },
        items: { select: { quantity: true } },
        pickLines: { select: { kind: true, orderedQty: true, pickedQty: true } },
      },
    });
    const pick = (o: (typeof rows)[number]) => ({
      ...unitCounts(o.items, o.pickLines),
      id: o.id,
      orderNumber: o.orderNumber,
      code: orderCode(o.orderNumber),
      stage: o.fulfillmentStage,
      deliveryOption: o.deliveryOption,
      customer: o.shipFullName,
      governorate: o.shipGovernorate,
      area: o.shipArea,
      pickerName: o.pickerName,
      pickedAt: o.pickedAt,
      parcelCount: o.parcelCount,
      total: o.total,
      finalTotal: o.finalTotal,
      codAmount: o.codAmount,
      adjusted: o.adjustmentTotal !== 0,
      receiptNumber: o.posReceiptNumber,
      shipment: o.shipments[0]
        ? { state: o.shipments[0].state, trackingNumber: o.shipments[0].trackingNumber, lastError: o.shipments[0].lastError }
        : null,
    });
    const ready = rows.filter((o) => o.fulfillmentStage === FulfillmentStage.PICKED && o.deliveryOption !== DeliveryOption.PICKUP);
    const pickup = rows.filter((o) => o.fulfillmentStage === FulfillmentStage.READY_FOR_PICKUP || (o.fulfillmentStage === FulfillmentStage.PICKED && o.deliveryOption === DeliveryOption.PICKUP));
    const awaitingCourier = rows.filter((o) => o.fulfillmentStage === FulfillmentStage.INVOICED && o.deliveryOption !== DeliveryOption.PICKUP);
    const picking = rows.filter((o) => o.fulfillmentStage === FulfillmentStage.PICKING);
    const returns = rows.filter(
      (o) =>
        (o.fulfillmentStage === FulfillmentStage.RETURNING || o.fulfillmentStage === FulfillmentStage.RETURNED || o.fulfillmentStage === FulfillmentStage.PARTIALLY_DELIVERED) &&
        o.posInvoicedAt &&
        !o.events.length,
    );
    return {
      ready: ready.map(pick),
      pickup: pickup.map(pick),
      awaitingCourier: awaitingCourier.map(pick),
      picking: picking.map(pick),
      returns: returns.map(pick),
      counts: { ready: ready.length, pickup: pickup.length, awaitingCourier: awaitingCourier.length, picking: picking.length, returns: returns.length },
    };
  }

  private async findOrder(codeOrId: string) {
    const number = parseOrderCode(codeOrId);
    const o = number
      ? await this.prisma.order.findUnique({ where: { orderNumber: number } })
      : await this.prisma.order.findUnique({ where: { id: codeOrId } });
    if (!o) throw new NotFoundException(number ? `الطلب ${number} غير موجود` : "الطلب غير موجود");
    return o;
  }

  /** الطلب كما يحتاجه الكاشير: الأسطر بالألوان، أسطر الإيصال بالأسعار، المبالغ، وموانع الفوترة. */
  async lookup(codeOrId: string) {
    const o = await this.findOrder(codeOrId);
    const view = await this.fulfillment.view(o.id);
    const shipment = await this.shipments.forOrder(o.id);
    const blockers: string[] = [];
    const delivery = o.deliveryOption !== DeliveryOption.PICKUP;
    if (o.status === OrderStatus.CANCELLED) blockers.push("الطلب ملغي");
    else if (!o.posInvoicedAt) {
      if (o.fulfillmentStage === FulfillmentStage.PICKING || o.fulfillmentStage === FulfillmentStage.NEW || o.fulfillmentStage === FulfillmentStage.CONFIRMED) {
        blockers.push("لم ينتهِ تجهيز الطلب — يُنهى من تطبيق التجهيز أولاً");
      }
      if (delivery) {
        const pre = await this.shipments.preflight(o);
        blockers.push(...pre.problems.filter((p) => !p.includes("لم ينتهِ تجهيز")));
      }
    }
    return {
      order: {
        id: o.id,
        orderNumber: o.orderNumber,
        code: orderCode(o.orderNumber),
        stage: o.fulfillmentStage,
        status: o.status,
        deliveryOption: o.deliveryOption,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        prepaid: o.paymentStatus === "PAID",
        createdAt: o.createdAt,
        pickedAt: o.pickedAt,
        pickerName: o.pickerName,
        parcelCount: o.parcelCount,
        notes: o.notes,
        isGift: o.isGift,
        giftMessage: o.giftMessage,
        giftHidePrices: o.giftHidePrices,
      },
      customer: {
        name: o.shipFullName,
        phone: courierPhone(o.shipPhone) ?? o.shipPhone,
        governorate: o.shipGovernorate,
        area: o.shipArea,
        street: o.shipStreet,
        house: o.shipHouse,
        landmark: o.shipNotes,
        addressLine: [o.shipGovernorate, courierAddress(o)].filter(Boolean).join(" — "),
      },
      lines: view.lines,
      counts: view.counts,
      totals: await this.totals(o.id),
      // خيارات التوصيل (نوع الشحنة عند هاي إكسبريس وغيرها) — يعدّلها الكاشير.
      courier: await this.courierInfo(o),
      money: view.money,
      receipt: this.receipt(o, view.lines),
      blockers,
      canInvoice: blockers.length === 0 && !o.posInvoicedAt && (o.fulfillmentStage === FulfillmentStage.PICKED || o.fulfillmentStage === FulfillmentStage.READY_FOR_PICKUP),
      invoiced: o.posInvoicedAt
        ? { receiptNumber: o.posReceiptNumber, clientReceiptId: o.posClientReceiptId, at: o.posInvoicedAt, cashierName: o.posCashierName }
        : null,
      shipment: shipment
        ? { state: shipment.state, trackingNumber: shipment.trackingNumber, statusName: shipment.statusName, lastError: shipment.lastError, codAmount: shipment.codAmount }
        : null,
    };
  }

  private async courierInfo(o: { courierTypeId: number | null; courierNote: string | null; courierPhone2: string | null; parcelCount: number | null }) {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    const def = Number(s.hiExpressOrderTypeId) > 0 ? Number(s.hiExpressOrderTypeId) : null;
    return {
      typeId: o.courierTypeId,
      defaultTypeId: def,
      effectiveTypeId: o.courierTypeId != null ? (o.courierTypeId > 0 ? o.courierTypeId : null) : def,
      note: o.courierNote,
      phone2: o.courierPhone2,
      parcelCount: o.parcelCount ?? 1,
      types: HI_ORDER_TYPES,
    };
  }

  private async totals(orderId: string) {
    const [items, lines] = await Promise.all([
      this.prisma.orderItem.findMany({ where: { orderId }, select: { quantity: true } }),
      this.prisma.orderPickLine.findMany({ where: { orderId }, select: { kind: true, orderedQty: true, pickedQty: true } }),
    ]);
    return unitCounts(items, lines);
  }

  /**
   * الكاشير يضيف صنفاً بالباركود (من التطبيق، أو من المحل بسعره إن لم يكن في التطبيق) أو يغيّر كمية سطر،
   * قبل الفوترة فقط. المبلغ يُعاد حسابه، ويرد بالطلب كما في lookup ليعرضه الكاشير فوراً.
   */
  async edit(
    codeOrId: string,
    dto: {
      op: "add" | "set";
      barcode?: string;
      qty?: number;
      charge?: "PAID" | "FREE";
      reason?: string;
      posName?: string;
      posPrice?: number;
      lineId?: string;
      clientEditId?: string;
      cashierName: string;
      cashierId?: string;
      /** سيرفر المحل: الفاتورة مُفوترة لكنها لم تُرحَّل للإداري بعد — يُسمح بتعديلها. */
      allowInvoiced?: boolean;
    },
  ) {
    const o = await this.findOrder(codeOrId);
    const afterInvoice = !!o.posInvoicedAt;
    if (afterInvoice) {
      if (!dto.allowInvoiced) throw new ConflictException(`الطلب مُفوتر بالإيصال ${o.posReceiptNumber ?? ""} — لا يُعدّل بعد الفوترة`);
      // التحقق من شركة التوصيل قبل أي كتابة: بعد استلام المندوب لا يتطابق التعديل معها.
      const courier = await this.shipments.courierEditable(o.id);
      if (!courier.ok) throw new ConflictException({ message: courier.reason, code: "COURIER_LOCKED" });
    }
    await this.fulfillment.cashierEdit(o.id, { name: dto.cashierName || "كاشير الطلبات", id: dto.cashierId ?? null }, dto);
    // الفاتورة المعدّلة تصل شركة التوصيل فوراً (الأصناف والمبلغ المحصّل)، ثم يُطبع ملصقها من جديد.
    const courierUpdate = afterInvoice ? await this.shipments.pushUpdate(o.id, dto.cashierName) : null;
    return { ...(await this.lookup(o.id)), courierUpdate };
  }

  /**
   * خيارات التوصيل للطلب من الكاشير: نوع الشحنة عند هاي إكسبريس، عدد الطرود، ملاحظة للمندوب، هاتف ثانٍ.
   * قبل الفوترة تُحفظ وتُرسل مع إنشاء الشحنة؛ بعدها تُرسل فوراً لهاي إكسبريس ما دام المندوب لم يستلم الطرد.
   */
  async courierOptions(
    codeOrId: string,
    dto: { typeId?: number | null; parcelCount?: number | null; note?: string | null; phone2?: string | null; cashierName: string; cashierId?: string },
  ) {
    const o = await this.findOrder(codeOrId);
    if (o.status === OrderStatus.CANCELLED) throw new ConflictException("الطلب ملغي");
    if (o.deliveryOption === DeliveryOption.PICKUP) throw new BadRequestException("طلب استلام من المحل — لا شحنة");
    const afterInvoice = !!o.posInvoicedAt;
    if (afterInvoice) {
      if (o.fulfillmentStage !== FulfillmentStage.INVOICED && o.fulfillmentStage !== FulfillmentStage.HANDED_OVER) {
        throw new ConflictException("خرج الطلب من المحل — لا تُعدّل خيارات التوصيل بعد استلام المندوب");
      }
      const courier = await this.shipments.courierEditable(o.id);
      if (!courier.ok) throw new ConflictException({ message: courier.reason, code: "COURIER_LOCKED" });
    }
    const data: Prisma.OrderUpdateInput = {};
    if (dto.typeId !== undefined) {
      if (dto.typeId !== null && ![0, 1, 2, 3, 4].includes(Number(dto.typeId))) throw new BadRequestException("نوع شحنة غير معروف");
      data.courierTypeId = dto.typeId === null ? null : Number(dto.typeId);
    }
    if (dto.parcelCount !== undefined && dto.parcelCount !== null) {
      const n = Math.trunc(Number(dto.parcelCount));
      if (!(n >= 1 && n <= 20)) throw new BadRequestException("عدد الطرود بين 1 و20");
      data.parcelCount = n;
    }
    if (dto.note !== undefined) data.courierNote = dto.note?.trim().slice(0, 300) || null;
    if (dto.phone2 !== undefined) {
      const raw = dto.phone2?.trim() || "";
      if (raw && !courierPhone(raw)) throw new BadRequestException(`رقم الهاتف الثاني غير صالح: ${raw}`);
      data.courierPhone2 = raw ? courierPhone(raw) : null;
    }
    await this.prisma.order.update({ where: { id: o.id }, data });
    await this.timeline.log({
      orderId: o.id,
      type: "COURIER_OPTIONS",
      actorType: "CASHIER",
      actorId: dto.cashierId ?? null,
      actorName: dto.cashierName || null,
      data: JSON.parse(JSON.stringify({ typeId: data.courierTypeId, parcelCount: data.parcelCount, note: data.courierNote, phone2: data.courierPhone2 })),
    });
    const courierUpdate = afterInvoice ? await this.shipments.pushUpdate(o.id, dto.cashierName) : null;
    return { ...(await this.lookup(o.id)), courierUpdate, reprintLabel: afterInvoice && !!courierUpdate?.ok };
  }

  /** ملصق شركة التوصيل نفسه (PDF من هاي إكسبريس) — للطباعة على طابعة الملصقات. */
  async label(codeOrId: string) {
    const o = await this.findOrder(codeOrId);
    const sh = await this.prisma.shipment.findFirst({ where: { orderId: o.id }, orderBy: { createdAt: "desc" } });
    if (!sh?.trackingNumber) throw new ConflictException("رقم التتبع لم يصل بعد من هاي إكسبريس — اطبع الملصق حين يصل");
    const res = await this.shipments.label(o.id);
    return { ...res, orderNumber: o.orderNumber, parcelCount: o.parcelCount ?? 1 };
  }

  /**
   * أسطر إيصال الكاشير: ما سُلّم فعلاً بسعره المحسوب على الزبونة (الهدية بصفر، البديل بالأرخص)،
   * ثم التوصيل والتغليف، وخصم واحد يجعل المجموع = المبلغ النهائي بالضبط.
   */
  private receipt(
    o: { shippingTotal: number; giftWrapFee: number; finalTotal: number | null; total: number },
    lines: Array<{ id: string; kind: string; barcode: string | null; name: string; shadeName: string | null; orderedQty: number; pickedQty: number; unitPrice: number; charge: string; substituteForLineId: string | null }>,
  ) {
    const byId = new Map(lines.map((l) => [l.id, l]));
    const items = lines
      .map((l) => {
        const qty = l.kind === "ORDERED" ? Math.min(l.pickedQty, l.orderedQty) : l.pickedQty;
        let unit = l.unitPrice;
        if (l.kind === "EXTRA" && l.charge === "FREE") unit = 0;
        else if (l.kind === "EXTRA" && l.substituteForLineId) unit = Math.min(l.unitPrice, byId.get(l.substituteForLineId)?.unitPrice ?? l.unitPrice);
        return { barcode: l.barcode, name: l.shadeName ? `${l.name} — ${l.shadeName}` : l.name, qty, unitPrice: unit, lineTotal: unit * qty, kind: l.kind, free: l.kind === "EXTRA" && l.charge === "FREE" };
      })
      .filter((x) => x.qty > 0);
    const itemsTotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const total = o.finalTotal ?? o.total;
    const discount = Math.max(0, itemsTotal + o.shippingTotal + o.giftWrapFee - total);
    return { items, itemsTotal, shipping: o.shippingTotal, giftWrap: o.giftWrapFee, discount, total };
  }

  /** «إتمام وطباعة»: يثبّت الفوترة (مرة واحدة لكل طلب) ثم ينشئ شحنة هاي إكسبريس. */
  async invoice(codeOrId: string, ref: CashierRef & { total: number }) {
    if (!ref.clientReceiptId?.trim() || !ref.receiptNumber?.trim()) throw new BadRequestException("رقم الإيصال ومعرّفه مطلوبان");
    const o0 = await this.findOrder(codeOrId);
    // الموانع تُرفض قبل الفوترة: لا يُطبع إيصال لطلب لا يمكن شحنه (هاتف غير صالح، محافظة غير مربوطة).
    if (!o0.posInvoicedAt && o0.deliveryOption !== DeliveryOption.PICKUP) {
      const pre = await this.shipments.preflight(o0);
      if (!pre.ok) throw new ConflictException({ message: pre.problems.join(" — "), code: "SHIPMENT_BLOCKED" });
    }
    let fresh = false;
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order-pick:${o0.id}`}))`;
      const o = (await tx.order.findUnique({ where: { id: o0.id } }))!;
      if (o.posInvoicedAt) {
        if (o.posClientReceiptId === ref.clientReceiptId) return; // إعادة إرسال للإيصال نفسه
        throw new ConflictException(`الطلب مُفوتر بالإيصال ${o.posReceiptNumber}`);
      }
      if (o.status === OrderStatus.CANCELLED) throw new ConflictException("الطلب ملغي");
      if (o.fulfillmentStage !== FulfillmentStage.PICKED && o.fulfillmentStage !== FulfillmentStage.READY_FOR_PICKUP) {
        throw new ConflictException("لم ينتهِ تجهيز الطلب");
      }
      if (o.deliveryOption === DeliveryOption.PICKUP) throw new BadRequestException("طلب استلام من المحل — استعمل «تسليم للزبونة»");
      const expected = o.finalTotal ?? o.total;
      if (Math.round(ref.total) !== expected) {
        throw new ConflictException(`مجموع الإيصال ${ref.total} لا يساوي مبلغ الطلب ${expected} — أعد فتح الطلب في الكاشير`);
      }
      await tx.order.update({
        where: { id: o.id },
        data: {
          fulfillmentStage: FulfillmentStage.INVOICED,
          posInvoicedAt: new Date(),
          posReceiptNumber: ref.receiptNumber.slice(0, 60),
          posClientReceiptId: ref.clientReceiptId.slice(0, 80),
          posCashierName: ref.cashierName?.slice(0, 80) || null,
        },
      });
      await this.timeline.log(
        {
          orderId: o.id,
          type: "INVOICED",
          actorType: "CASHIER",
          actorId: ref.cashierId ?? null,
          actorName: ref.cashierName ?? null,
          data: { receiptNumber: ref.receiptNumber, terminal: ref.terminal ?? null, total: ref.total },
        },
        tx,
      );
      fresh = true;
    });
    await this.refundShortages(o0.id);
    if (fresh) await this.notifyCashierChanges(o0.id);
    const sh = await this.shipments.requestShipment(o0.id).catch((e) => {
      this.logger.warn(`shipment request ${o0.orderNumber}: ${(e as Error).message}`);
      return null;
    });
    return {
      invoiced: true,
      shipment: sh ? { state: sh.state, trackingNumber: sh.trackingNumber, lastError: sh.lastError } : null,
      print: await this.printData(o0.id),
    };
  }

  /**
   * عدّل الكاشير الأصناف قبل الفوترة: إشعار واحد للزبونة بالنتيجة النهائية (لا إشعار لكل مسحة).
   * إشعار «إنهاء التجهيز» إن وُجد كان عن مبلغ قبل تعديل الكاشير.
   */
  private async notifyCashierChanges(orderId: string) {
    try {
      const edited = await this.prisma.orderEvent.count({ where: { orderId, type: "POS_EDIT" } });
      if (!edited) return;
      const o = await this.prisma.order.findUnique({ where: { id: orderId }, select: { total: true, finalTotal: true } });
      const lines = await this.prisma.orderPickLine.findMany({ where: { orderId } });
      const missing = lines.filter((l) => l.kind === "ORDERED" && l.pickedQty < l.orderedQty).map((l) => l.name);
      const extras = lines.filter((l) => l.kind === "EXTRA" && l.pickedQty > 0 && l.charge === "PAID").map((l) => l.name);
      if (!o || (!missing.length && !extras.length) || (o.finalTotal ?? o.total) === o.total) return;
      await this.notify.send(orderId, { kind: "ADJUSTED", missing, extras, oldTotal: o.total, newTotal: o.finalTotal ?? o.total });
    } catch (e) {
      this.logger.warn(`notify cashier changes ${orderId}: ${(e as Error).message}`);
    }
  }

  /** طلب مدفوع بالبطاقة ونقصت أصنافه: الاسترجاع الجزئي عبر كي كارد بعد الفوترة. */
  private async refundShortages(orderId: string) {
    const pending = await this.prisma.orderAdjustment.findMany({ where: { orderId, method: AdjustmentMethod.CARD_REFUND, status: "PENDING" } });
    if (!pending.length) return;
    const o = await this.prisma.order.findUnique({ where: { id: orderId } });
    const amount = pending.reduce((s, a) => s + Number((a.data as { refundAmount?: number } | null)?.refundAmount ?? 0), 0);
    const actor = o?.pickApprovedById ?? o?.pickerId;
    if (!o || amount <= 0 || !actor) return;
    try {
      await this.payments.adminRefund(orderId, actor, amount, "أصناف ناقصة عند التجهيز");
      await this.prisma.orderAdjustment.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { status: "DONE" } });
      await this.notify.send(orderId, { kind: "REFUNDED", amount });
    } catch (e) {
      await this.prisma.orderAdjustment.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { status: "FAILED", note: (e as Error).message.slice(0, 300) } });
      await this.timeline.log({ orderId, type: "REFUND_FAILED", actorType: "SYSTEM", data: { amount, error: (e as Error).message.slice(0, 300) } });
    }
  }

  /** كل ما يُطبع: إيصال المحل، فاتورة العميل (بلا أسعار للهدية)، وملصق الشحن. لا يُنشئ شيئاً. */
  async printData(codeOrId: string) {
    const o = await this.findOrder(codeOrId);
    const view = await this.fulfillment.view(o.id);
    const sh = await this.prisma.shipment.findFirst({ where: { orderId: o.id }, orderBy: { createdAt: "desc" } });
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    return {
      store: { name: (s.storeName as string) || "ديما الحياة", phone: courierPhone(s.supportPhone as string) ?? (s.supportPhone as string) ?? null },
      order: {
        orderNumber: o.orderNumber,
        code: orderCode(o.orderNumber),
        createdAt: o.createdAt,
        deliveryOption: o.deliveryOption,
        paymentMethod: o.paymentMethod,
        prepaid: o.paymentStatus === "PAID",
        isGift: o.isGift,
        giftMessage: o.giftMessage,
        giftHidePrices: o.giftHidePrices,
        notes: o.notes,
        parcelCount: o.parcelCount ?? 1,
        receiptNumber: o.posReceiptNumber,
        cashierName: o.posCashierName,
      },
      customer: {
        name: o.shipFullName,
        phone: courierPhone(o.shipPhone) ?? o.shipPhone,
        governorate: o.shipGovernorate,
        addressLine: [o.shipGovernorate, courierAddress(o)].filter(Boolean).join(" — "),
      },
      receipt: this.receipt(o, view.lines),
      changes: {
        missing: view.lines.filter((l) => l.kind === "ORDERED" && l.pickedQty < l.orderedQty).map((l) => ({ name: l.name, shadeName: l.shadeName, qty: l.orderedQty - l.pickedQty, reason: l.reason })),
        extras: view.lines.filter((l) => l.kind === "EXTRA").map((l) => ({ name: l.name, shadeName: l.shadeName, qty: l.pickedQty, free: l.charge === "FREE", reason: l.reason })),
      },
      money: { total: o.total, finalTotal: o.finalTotal ?? o.total, codAmount: o.codAmount ?? 0, refundAmount: view.money.refundAmount },
      shipment: sh ? { trackingNumber: sh.trackingNumber, state: sh.state, codAmount: sh.codAmount, lastError: sh.lastError } : null,
    };
  }

  /** طلب «استلام من المحل»: الكاشير يفوتره ويسلّمه للزبونة — يصير «تم التسليم». */
  async pickupHandover(codeOrId: string, ref: CashierRef & { total: number }) {
    const o = await this.findOrder(codeOrId);
    if (o.deliveryOption !== DeliveryOption.PICKUP) throw new BadRequestException("ليس طلب استلام من المحل");
    if (o.posInvoicedAt && o.posClientReceiptId !== ref.clientReceiptId) throw new ConflictException(`سُلّم بالإيصال ${o.posReceiptNumber}`);
    if (!o.posInvoicedAt) {
      if (o.fulfillmentStage !== FulfillmentStage.READY_FOR_PICKUP && o.fulfillmentStage !== FulfillmentStage.PICKED) throw new ConflictException("لم ينتهِ تجهيز الطلب");
      const expected = o.finalTotal ?? o.total;
      if (Math.round(ref.total) !== expected) throw new ConflictException(`مجموع الإيصال ${ref.total} لا يساوي مبلغ الطلب ${expected}`);
      await this.prisma.order.update({
        where: { id: o.id },
        data: { posInvoicedAt: new Date(), posReceiptNumber: ref.receiptNumber, posClientReceiptId: ref.clientReceiptId, posCashierName: ref.cashierName },
      });
      await this.timeline.log({ orderId: o.id, type: "PICKUP_HANDED", actorType: "CASHIER", actorId: ref.cashierId ?? null, actorName: ref.cashierName, data: { receiptNumber: ref.receiptNumber } });
      await this.refundShortages(o.id);
      await this.orders.updateStatus(o.id, { status: OrderStatus.DELIVERED });
      await this.prisma.order.update({ where: { id: o.id }, data: { fulfillmentStage: FulfillmentStage.DELIVERED } });
      await this.notify.send(o.id, { kind: "DELIVERED" });
    }
    return { delivered: true, print: await this.printData(o.id) };
  }

  /** طرد راجع وصل المحل: إيصال الإرجاع حُفظ في الكاشير — نسجّله ونغلق الطلب. */
  async returnReceipt(codeOrId: string, ref: CashierRef & { lines: Array<{ barcode: string; qty: number }> }) {
    const o = await this.findOrder(codeOrId);
    const prev = await this.prisma.orderEvent.findFirst({ where: { orderId: o.id, type: "POS_RETURN" } });
    if (prev) {
      const d = prev.data as { clientReceiptId?: string } | null;
      if (d?.clientReceiptId === ref.clientReceiptId) return { ok: true, already: true };
      throw new ConflictException("سُجّل إيصال إرجاع لهذا الطلب من قبل");
    }
    const allowed: FulfillmentStage[] = [FulfillmentStage.RETURNING, FulfillmentStage.RETURNED, FulfillmentStage.PARTIALLY_DELIVERED, FulfillmentStage.DELIVERY_ISSUE, FulfillmentStage.CANCELLED];
    if (!o.posInvoicedAt || !allowed.includes(o.fulfillmentStage)) throw new ConflictException("الطلب ليس مرتجعاً");
    await this.timeline.log({
      orderId: o.id,
      type: "POS_RETURN",
      actorType: "CASHIER",
      actorId: ref.cashierId ?? null,
      actorName: ref.cashierName,
      data: { clientReceiptId: ref.clientReceiptId, receiptNumber: ref.receiptNumber, lines: ref.lines } as unknown as Prisma.InputJsonValue,
    });
    if (o.fulfillmentStage !== FulfillmentStage.PARTIALLY_DELIVERED) {
      await this.prisma.order.update({ where: { id: o.id }, data: { fulfillmentStage: FulfillmentStage.RETURNED } });
    }
    return { ok: true };
  }
}

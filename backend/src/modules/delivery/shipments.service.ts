import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DeliveryOption, FulfillmentStage, OrderStatus, Prisma, Shipment, ShipmentState } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaService } from "../../common/prisma.service";
import { loyaltyRules, pointsForAmount } from "../loyalty/loyalty.rules";
import { OrdersService } from "../orders/orders.service";
import { SettingsService } from "../settings/settings.service";
import { OrderTimelineService } from "../fulfillment/order-timeline.service";
import { courierAddress, courierPhone, shouldApply, statusRule, suggestGovernance } from "./courier-rules";
import { HiCreateOrder, HiExpressClient, HiExpressError, HiOrder } from "./hi-express.client";
import { OrderNotifyService } from "./order-notify.service";

const PROVIDER = "HI_EXPRESS";
/** إعادة المحاولة: 30 ث، 2 د، 10 د، 30 د، ساعة، ثم كل ساعة حتى 24 ساعة من أول محاولة. */
const BACKOFF_SEC = [30, 120, 600, 1800, 3600];
const GIVE_UP_MS = 24 * 3600_000;
const CREATE_WORKER_MS = 20_000;
const POLL_MS = 10 * 60_000;
const SYNC_TIMEOUT_MS = 8_000;

type Order = Prisma.OrderGetPayload<{ include: { pickLines: true; user: { select: { phone: true } } } }>;

export interface Preflight {
  ok: boolean;
  problems: string[];
  governanceId: number | null;
  cityId: number | null;
  phone: string | null;
}

export interface StatusUpdate {
  statusId: number;
  at: Date | null;
  note?: string | null;
  proof?: string | null;
  driver?: string | null;
  collected?: number | null;
  returnCost?: number | null;
  attempts?: number | null;
  settlementId?: string | null;
  source: "WEBHOOK" | "POLL" | "API" | "CREATE";
  raw?: unknown;
}

/**
 * شحنات هاي إكسبريس: الإنشاء عند الفوترة مع إعادة محاولة دائمة، واستقبال الحالات (webhook + استعلام دوري)،
 * وتحديث مرحلة الطلب وحالة العميل والإشعارات تلقائياً. حالة كل شحنة في قاعدة البيانات فلا يضيع شيء بإعادة التشغيل.
 */
@Injectable()
export class ShipmentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShipmentsService.name);
  private timers: NodeJS.Timeout[] = [];
  private working = false;
  private polling = false;
  private govCache: { at: number; list: Array<{ id: number; name: string }> } | null = null;
  lastPollAt: Date | null = null;
  lastPollError: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: HiExpressClient,
    private readonly settings: SettingsService,
    private readonly orders: OrdersService,
    private readonly notify: OrderNotifyService,
    private readonly timeline: OrderTimelineService,
  ) {}

  onModuleInit() {
    if (process.env.HIEXPRESS_WORKER === "0") return;
    this.timers.push(setInterval(() => void this.runCreateWorker(), CREATE_WORKER_MS));
    this.timers.push(setInterval(() => void this.poll(), POLL_MS));
    this.timers.push(setTimeout(() => void this.poll(), 60_000));
  }

  onModuleDestroy() {
    this.timers.forEach((t) => clearInterval(t));
  }

  // ------------------------------------------------------------ preflight & payload

  private async governances() {
    if (this.govCache && Date.now() - this.govCache.at < 6 * 3600_000) return this.govCache.list;
    const list = await this.client.governances();
    this.govCache = { at: Date.now(), list };
    return list;
  }

  /** محافظة الطلب لدى هاي إكسبريس: الربط المحفوظ أولاً، ثم اقتراح بالاسم (ويُحفظ). */
  async resolveArea(governorate: string | null, area: string | null): Promise<{ governanceId: number | null; cityId: number | null }> {
    const gov = (governorate ?? "").trim();
    if (!gov) return { governanceId: null, cityId: null };
    const maps = await this.prisma.courierAreaMap.findMany({ where: { provider: PROVIDER, governorate: gov, area: { in: [(area ?? "").trim(), ""] } } });
    const exact = maps.find((m) => m.area === (area ?? "").trim() && m.area !== "") ?? maps.find((m) => m.area === "");
    if (exact) return { governanceId: exact.governanceId, cityId: exact.cityId };
    try {
      const id = suggestGovernance(gov, await this.governances());
      if (id) {
        await this.prisma.courierAreaMap
          .create({ data: { provider: PROVIDER, governorate: gov, area: "", governanceId: id } })
          .catch(() => undefined);
        return { governanceId: id, cityId: null };
      }
    } catch (e) {
      this.logger.warn(`governance lookup failed: ${(e as Error).message}`);
    }
    return { governanceId: null, cityId: null };
  }

  /** ما يمنع إنشاء الشحنة — يُعرض للكاشير قبل الطباعة لا بعدها. */
  async preflight(order: { shipPhone: string | null; shipGovernorate: string | null; shipArea: string | null; deliveryOption: DeliveryOption; codAmount: number | null }): Promise<Preflight> {
    const problems: string[] = [];
    if (order.deliveryOption === DeliveryOption.PICKUP) return { ok: true, problems, governanceId: null, cityId: null, phone: null };
    if (!this.client.configured) problems.push("رمز هاي إكسبريس غير مضبوط على السيرفر");
    const phone = courierPhone(order.shipPhone);
    if (!phone) problems.push(`هاتف الزبونة غير صالح (${order.shipPhone ?? "فارغ"}) — صحّحه من لوحة الإدارة`);
    const { governanceId, cityId } = await this.resolveArea(order.shipGovernorate, order.shipArea);
    if (!governanceId) problems.push(`المحافظة «${order.shipGovernorate ?? "فارغة"}» غير مربوطة بهاي إكسبريس — اربطها من لوحة الإدارة`);
    if (order.codAmount == null) problems.push("لم ينتهِ تجهيز الطلب بعد");
    return { ok: problems.length === 0, problems, governanceId, cityId, phone };
  }

  private async payload(order: Order, pre: Preflight): Promise<HiCreateOrder> {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    const items: HiCreateOrder["items"] = [];
    for (const l of order.pickLines) {
      const count = l.kind === "ORDERED" ? Math.min(l.pickedQty, l.orderedQty) : l.pickedQty;
      if (count <= 0) continue;
      items.push({ name: `${l.name}${l.shadeName ? ` — ${l.shadeName}` : ""}`.slice(0, 100), count, notes: l.kind === "EXTRA" && l.charge === "FREE" ? "هدية" : null });
    }
    const secondary = courierPhone(order.user?.phone);
    const notes = [
      order.isGift ? "طلب هدية — لا تُسلَّم الفاتورة بالأسعار" : null,
      order.parcelCount && order.parcelCount > 1 ? `عدد الأكياس: ${order.parcelCount}` : null,
      order.notes?.trim() || null,
    ]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 500);
    const prepaidValue = order.paymentStatus === "PAID" ? order.finalTotal ?? order.total : 0;
    return {
      client_identifier: order.orderNumber,
      customer_phone: pre.phone!,
      customer_secondary_phone: secondary && secondary !== pre.phone ? secondary : null,
      customer_name: order.shipFullName || null,
      governance_id: pre.governanceId!,
      city_id: pre.cityId,
      order_value: order.codAmount ?? 0,
      ...(s.hiExpressSendHiddenValue === true && (order.codAmount ?? 0) === 0 && prepaidValue > 0 ? { hidden_order_value: prepaidValue } : {}),
      delivery_address: courierAddress(order) || null,
      notes: notes || null,
      order_type_id: Number(s.hiExpressOrderTypeId) > 0 ? Number(s.hiExpressOrderTypeId) : null,
      client_name: (s.storeName as string) || "ديما الحياة",
      client_phone1: courierPhone(s.supportPhone as string) ?? null,
      items,
    };
  }

  // ------------------------------------------------------------ create

  /** بعد فوترة الطلب في كاشير الطلبات: تُنشأ الشحنة (ونحاول فوراً حتى 8 ثوانٍ، ثم الخلفية تكمل). */
  async requestShipment(orderId: string): Promise<Shipment> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("الطلب غير موجود");
    if (order.deliveryOption === DeliveryOption.PICKUP) throw new BadRequestException("طلب استلام من المحل — لا شحنة");
    let sh = await this.prisma.shipment.findUnique({ where: { clientIdentifier: order.orderNumber } });
    if (!sh) {
      sh = await this.prisma.shipment
        .create({ data: { orderId, provider: PROVIDER, clientIdentifier: order.orderNumber, codAmount: order.codAmount ?? 0, nextAttemptAt: new Date() } })
        .catch(async () => (await this.prisma.shipment.findUnique({ where: { clientIdentifier: order.orderNumber } }))!);
    }
    if (sh.state === ShipmentState.CREATED || sh.state === ShipmentState.CANCELLED) return sh;
    await Promise.race([this.attemptCreate(sh.id), new Promise((r) => setTimeout(r, SYNC_TIMEOUT_MS))]);
    return (await this.prisma.shipment.findUnique({ where: { id: sh.id } }))!;
  }

  private async runCreateWorker() {
    if (this.working || !this.client.configured) return;
    this.working = true;
    try {
      const due = await this.prisma.shipment.findMany({
        where: { state: { in: [ShipmentState.PENDING, ShipmentState.RETRYING] }, nextAttemptAt: { lte: new Date() } },
        orderBy: { nextAttemptAt: "asc" },
        take: 50,
        select: { id: true },
      });
      for (const s of due) await this.attemptCreate(s.id);
    } catch (e) {
      this.logger.error(`create worker: ${(e as Error).message}`);
    } finally {
      this.working = false;
    }
  }

  /** محاولة إنشاء واحدة — تحجز الشحنة أولاً فلا تُرسل مرتين بالتوازي. */
  async attemptCreate(id: string) {
    const claim = await this.prisma.shipment.updateMany({
      where: { id, state: { in: [ShipmentState.PENDING, ShipmentState.RETRYING, ShipmentState.FAILED] } },
      data: { state: ShipmentState.CREATING, attempts: { increment: 1 } },
    });
    if (!claim.count) return;
    const sh = (await this.prisma.shipment.findUnique({ where: { id } }))!;
    const order = (await this.prisma.order.findUnique({
      where: { id: sh.orderId },
      include: { pickLines: true, user: { select: { phone: true } } },
    })) as Order;
    if (order.status === OrderStatus.CANCELLED) {
      await this.prisma.shipment.update({ where: { id }, data: { state: ShipmentState.CANCELLED, lastError: "الطلب ملغي" } });
      return;
    }
    const pre = await this.preflight(order);
    if (!pre.ok) return this.failed(sh, order, pre.problems.join(" — "), false);
    const body = await this.payload(order, pre);
    try {
      const { orderIdentifier } = await this.client.createOrder(body);
      await this.created(sh, order, orderIdentifier, body, pre);
    } catch (e) {
      const err = e instanceof HiExpressError ? e : new HiExpressError((e as Error).message, null, true);
      if (err.duplicate || err.retryable) {
        // ربما أُنشئت فعلاً (انقطاع بعد الإرسال أو رقم مكرر): نسأل عنها برقمنا قبل أي محاولة جديدة.
        try {
          const existing = await this.client.showOrder(order.orderNumber);
          if (existing?.order_identifier) return this.created(sh, order, existing.order_identifier, body, pre);
        } catch {
          /* غير موجودة أو الشبكة ما زالت متعطلة */
        }
      }
      await this.failed(sh, order, err.message, err.retryable);
    }
  }

  private async created(sh: Shipment, order: Order, tracking: string, body: HiCreateOrder, pre: Preflight) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { id: sh.id },
        data: {
          state: ShipmentState.CREATED,
          trackingNumber: tracking,
          statusId: 0,
          statusName: statusRule(0)!.label,
          statusAt: now,
          governanceId: pre.governanceId,
          cityId: pre.cityId,
          codAmount: body.order_value,
          lastError: null,
          nextAttemptAt: null,
          payload: body as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.order.updateMany({
        where: { id: order.id, status: { notIn: [OrderStatus.CANCELLED, OrderStatus.DELIVERED] } },
        data: { fulfillmentStage: FulfillmentStage.HANDED_OVER, status: OrderStatus.SHIPPED },
      }),
    ]);
    await this.timeline.log({ orderId: order.id, type: "SHIPMENT_CREATED", actorType: "SYSTEM", data: { tracking, cod: body.order_value, attempts: sh.attempts + 1 } });
    await this.notify.send(order.id, { kind: "SHIPPED", tracking, cod: body.order_value });
  }

  private async failed(sh: Shipment, order: { id: string; orderNumber: string }, message: string, retryable: boolean) {
    const firstAt = sh.createdAt.getTime();
    const giveUp = Date.now() - firstAt > GIVE_UP_MS;
    const delay = BACKOFF_SEC[Math.min(sh.attempts, BACKOFF_SEC.length - 1)] * 1000;
    const state = retryable && !giveUp ? ShipmentState.RETRYING : ShipmentState.FAILED;
    await this.prisma.shipment.update({
      where: { id: sh.id },
      data: { state, lastError: message.slice(0, 500), nextAttemptAt: state === ShipmentState.RETRYING ? new Date(Date.now() + delay) : null },
    });
    if (state === ShipmentState.FAILED || sh.attempts === 0) {
      await this.timeline.log({
        orderId: order.id,
        type: state === ShipmentState.FAILED ? "SHIPMENT_FAILED" : "SHIPMENT_RETRYING",
        actorType: "SYSTEM",
        data: { error: message.slice(0, 300) },
      });
    }
    this.logger.warn(`shipment ${order.orderNumber} ${state}: ${message}`);
  }

  // ------------------------------------------------------------ statuses

  /** تطبيق حالة من هاي إكسبريس (webhook أو استعلام) — مرة واحدة لكل رسالة، ولا رجوع للخلف. */
  async applyStatus(sh: Shipment, u: StatusUpdate) {
    const dedupeKey = `${sh.clientIdentifier}|${u.statusId}|${u.at?.toISOString() ?? "-"}`;
    let eventId: string;
    try {
      const ev = await this.prisma.shipmentEvent.create({
        data: {
          shipmentId: sh.id,
          source: u.source,
          statusId: u.statusId,
          statusAt: u.at,
          note: u.note ?? null,
          proofUrl: u.proof ?? null,
          raw: (u.raw ?? null) as Prisma.InputJsonValue,
          dedupeKey,
        },
      });
      eventId = ev.id;
    } catch {
      return false; // الرسالة نفسها وصلت قبلاً
    }
    const rule = statusRule(u.statusId);
    const apply = shouldApply(sh, { statusId: u.statusId, at: u.at });
    // تفاصيل الشحنة تُحدَّث دائماً (المندوب، المحاولات، المبلغ المحصّل) حتى لو لم تتغير المرحلة.
    await this.prisma.shipment.update({
      where: { id: sh.id },
      data: {
        ...(apply ? { statusId: u.statusId, statusName: rule!.label, statusAt: u.at ?? new Date(), isFinal: rule!.final } : {}),
        ...(u.driver ? { driverName: u.driver } : {}),
        ...(u.attempts != null ? { deliveryAttempts: u.attempts } : {}),
        ...(u.collected != null && apply && (rule!.stage === "DELIVERED" || rule!.stage === "PARTIALLY_DELIVERED") ? { collectedAmount: u.collected } : {}),
        ...(u.returnCost != null ? { returnCost: u.returnCost } : {}),
        ...(u.settlementId ? { settlementId: String(u.settlementId) } : {}),
        ...(rule?.stage === "CANCELLED" && apply ? { isCanceled: true } : {}),
      },
    });
    if (!apply || !rule) {
      if (!rule) {
        await this.timeline.log({ orderId: sh.orderId, type: "COURIER_STATUS_UNKNOWN", actorType: "COURIER", data: { statusId: u.statusId, note: u.note ?? null } });
      }
      await this.prisma.shipmentEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
      return false;
    }
    await this.timeline.log({
      orderId: sh.orderId,
      type: "COURIER_STATUS",
      actorType: "COURIER",
      actorName: "هاي إكسبريس",
      data: { statusId: u.statusId, label: rule.label, note: u.note ?? null, driver: u.driver ?? null, proof: u.proof ?? null, collected: u.collected ?? null },
    });
    await this.orderEffects(sh, rule.stage, u);
    await this.prisma.shipmentEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
    return true;
  }

  private async setStage(orderId: string, stage: FulfillmentStage) {
    await this.prisma.order.update({ where: { id: orderId }, data: { fulfillmentStage: stage } });
  }

  private async orderEffects(sh: Shipment, stage: string, u: StatusUpdate) {
    const order = await this.prisma.order.findUnique({ where: { id: sh.orderId } });
    if (!order) return;
    switch (stage) {
      case "HANDED_OVER":
        return;
      case "OUT_FOR_DELIVERY":
        if (order.fulfillmentStage !== FulfillmentStage.OUT_FOR_DELIVERY) {
          await this.setStage(order.id, FulfillmentStage.OUT_FOR_DELIVERY);
          await this.notify.send(order.id, { kind: "OUT_FOR_DELIVERY", driver: u.driver });
        }
        return;
      case "DELIVERY_ISSUE":
        await this.setStage(order.id, FulfillmentStage.DELIVERY_ISSUE);
        await this.notify.send(order.id, { kind: "DELIVERY_ISSUE", note: u.note });
        return;
      case "DELIVERED":
      case "PARTIALLY_DELIVERED": {
        if (order.status === OrderStatus.CANCELLED) return;
        // نقاط الولاء من المبلغ المحصّل فعلاً (بعد النقص والإضافة)، لا من مبلغ الطلب الأول.
        const s = (await this.settings.getAll()) as Record<string, unknown>;
        const prepaid = order.paymentStatus === "PAID" ? order.finalTotal ?? order.total : 0;
        const paidTotal = u.collected != null ? u.collected + (order.paymentStatus === "PAID" ? prepaid - (order.codAmount ?? 0) : 0) : order.finalTotal ?? order.total;
        const earned = pointsForAmount(Math.max(0, paidTotal), loyaltyRules(s));
        if (order.status !== OrderStatus.DELIVERED) {
          await this.prisma.order.update({ where: { id: order.id }, data: { loyaltyEarned: earned } });
          await this.orders.updateStatus(order.id, { status: OrderStatus.DELIVERED });
        }
        if (stage === "PARTIALLY_DELIVERED") {
          await this.setStage(order.id, FulfillmentStage.PARTIALLY_DELIVERED);
          if (u.collected != null && order.codAmount != null && u.collected !== order.codAmount) {
            await this.prisma.orderAdjustment.create({
              data: { orderId: order.id, type: "PARTIAL_DELIVERY", amount: u.collected - order.codAmount, method: "COD_CHANGE", note: u.note ?? null },
            });
          }
        }
        await this.notify.send(order.id, { kind: "DELIVERED", points: earned || undefined });
        return;
      }
      case "RETURNING":
      case "RETURNED": {
        if (order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED) {
          await this.orders.cancel(order.id, { staff: true, reason: "تعذّر التسليم — أعادته شركة التوصيل" });
          await this.notify.send(order.id, { kind: "RETURNED" });
        }
        await this.setStage(order.id, stage === "RETURNED" ? FulfillmentStage.RETURNED : FulfillmentStage.RETURNING);
        return;
      }
      default:
        return;
    }
  }

  /** حالة هاي إكسبريس الأخيرة من «عرض الطلب» (مصدر الحقيقة). */
  private updateFromOrder(o: HiOrder, source: StatusUpdate["source"], raw?: unknown): StatusUpdate {
    const last = [...(o.status ?? [])].reverse().find((x) => x.status_type === o.last_status_type_id);
    return {
      statusId: Number(o.last_status_type_id),
      at: o.last_status_date ? new Date(o.last_status_date) : last?.created_at ? new Date(last.created_at) : null,
      note: last?.status_msg ?? null,
      proof: last?.proof_of_status ?? null,
      driver: o.driver_name ?? null,
      collected: o.order_value ?? null,
      returnCost: o.return_cost ?? null,
      attempts: o.delivery_attempts ?? null,
      settlementId: o.settlement_id != null ? String(o.settlement_id) : null,
      source,
      raw,
    };
  }

  async refresh(sh: Shipment, source: StatusUpdate["source"] = "API", raw?: unknown) {
    const o = await this.client.showOrder(sh.trackingNumber ?? sh.clientIdentifier);
    if (!o) return false;
    if (!sh.trackingNumber && o.order_identifier) {
      sh = await this.prisma.shipment.update({ where: { id: sh.id }, data: { trackingNumber: o.order_identifier, state: ShipmentState.CREATED } });
    }
    return this.applyStatus(sh, this.updateFromOrder(o, source, raw));
  }

  /** استعلام دوري عن كل الشحنات غير المنتهية — يلتقط ما فات الـwebhook. */
  async poll() {
    if (this.polling || !this.client.configured) return;
    this.polling = true;
    try {
      const open = await this.prisma.shipment.findMany({
        where: { state: ShipmentState.CREATED, isFinal: false, createdAt: { gt: new Date(Date.now() - 45 * 86_400_000) } },
        select: { id: true, clientIdentifier: true, statusId: true },
      });
      for (let i = 0; i < open.length; i += 50) {
        const chunk = open.slice(i, i + 50);
        const live = await this.client.liveStatuses(chunk.map((c) => c.clientIdentifier));
        for (const row of live) {
          const sh = chunk.find((c) => c.clientIdentifier === row.client_identifier);
          if (!sh || Number(row.status_id) === sh.statusId) continue;
          const full = await this.prisma.shipment.findUnique({ where: { id: sh.id } });
          if (full) await this.refresh(full, "POLL", row).catch((e) => this.logger.warn(`refresh ${sh.clientIdentifier}: ${(e as Error).message}`));
        }
      }
      this.lastPollAt = new Date();
      this.lastPollError = null;
    } catch (e) {
      this.lastPollError = (e as Error).message;
      this.logger.warn(`poll failed: ${this.lastPollError}`);
    } finally {
      this.polling = false;
    }
  }

  // ------------------------------------------------------------ webhook

  webhookSecret(): string | null {
    const env = process.env.HIEXPRESS_WEBHOOK_SECRET?.trim();
    if (env) return env;
    try {
      return readFileSync(process.env.HIEXPRESS_WEBHOOK_SECRET_PATH || "/run/secrets/hiexpress_webhook_secret", "utf8").trim() || null;
    } catch {
      return null;
    }
  }

  checkSecret(given: string) {
    const want = this.webhookSecret();
    if (!want) return false;
    const a = Buffer.from(given);
    const b = Buffer.from(want);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** رسالة webhook: تُحفظ ثم يُتحقق منها بسؤال هاي إكسبريس (رسائلهم غير موقّعة). */
  async handleWebhook(body: any) {
    const p = body?.payload ?? body;
    const clientId = String(p?.client_identifier ?? "").trim();
    const tracking = String(p?.order_identifier ?? "").trim();
    if (!clientId && !tracking) return;
    const sh = await this.prisma.shipment.findFirst({
      where: { OR: [...(clientId ? [{ clientIdentifier: clientId }] : []), ...(tracking ? [{ trackingNumber: tracking }] : [])] },
    });
    if (!sh) {
      this.logger.warn(`webhook for unknown shipment ${clientId || tracking}`);
      return;
    }
    try {
      await this.refresh(sh, "WEBHOOK", body);
    } catch (e) {
      // لا نصدّق الرسالة وحدها؛ الاستعلام الدوري سيلتقط الحالة.
      this.logger.warn(`webhook verify failed ${sh.clientIdentifier}: ${(e as Error).message}`);
    }
  }

  // ------------------------------------------------------------ admin

  async forOrder(orderId: string) {
    const sh = await this.prisma.shipment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { receivedAt: "desc" }, take: 50 } },
    });
    return sh
      ? {
          ...sh,
          payload: undefined,
          events: sh.events.map((e) => ({ ...e, raw: undefined, label: statusRule(e.statusId)?.label ?? `حالة ${e.statusId}` })),
          alert: statusRule(sh.statusId)?.alert ?? false,
        }
      : null;
  }

  private async shipmentOf(orderId: string) {
    const sh = await this.prisma.shipment.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" } });
    if (!sh) throw new NotFoundException("لا توجد شحنة لهذا الطلب");
    return sh;
  }

  async retry(orderId: string, actorId: string) {
    const sh = await this.shipmentOf(orderId);
    if (sh.state === ShipmentState.CREATED) throw new BadRequestException("الشحنة منشأة أصلاً");
    await this.prisma.shipment.update({ where: { id: sh.id }, data: { state: ShipmentState.PENDING, nextAttemptAt: new Date() } });
    await this.timeline.log({ orderId, type: "SHIPMENT_RETRY", actorType: "STAFF", actorId });
    await this.attemptCreate(sh.id);
    return this.forOrder(orderId);
  }

  async refreshOrder(orderId: string) {
    const sh = await this.shipmentOf(orderId);
    if (sh.state !== ShipmentState.CREATED) throw new BadRequestException("الشحنة لم تُنشأ بعد");
    await this.refresh(sh, "API");
    return this.forOrder(orderId);
  }

  async cancelShipment(orderId: string, actorId: string) {
    const sh = await this.shipmentOf(orderId);
    if (sh.state === ShipmentState.CREATED) {
      if ((sh.statusId ?? 0) !== 0) throw new BadRequestException("استلمها المندوب — استعمل قرار «إرجاع» بدل الإلغاء");
      await this.client.deleteOrder(sh.trackingNumber ?? sh.clientIdentifier);
    }
    await this.prisma.shipment.update({ where: { id: sh.id }, data: { state: ShipmentState.CANCELLED, isCanceled: true } });
    await this.timeline.log({ orderId, type: "SHIPMENT_CANCELLED", actorType: "STAFF", actorId });
    return this.forOrder(orderId);
  }

  async decision(orderId: string, actorId: string, decision: "resend" | "approve" | "return", note?: string) {
    const sh = await this.shipmentOf(orderId);
    const alias = sh.trackingNumber ?? sh.clientIdentifier;
    if (sh.statusId === 11) await this.client.holdDecision(alias, decision, note);
    else if (sh.statusId === 4 || sh.statusId === 10) {
      if (decision === "approve") throw new BadRequestException("«الموافقة على التأجيل» للتأجيل فقط");
      await this.client.failedDecision(alias, decision === "resend" ? "reject" : "accept", note);
    } else throw new BadRequestException("لا يوجد تأجيل أو فشل ينتظر قراراً");
    await this.timeline.log({ orderId, type: "SHIPMENT_DECISION", actorType: "STAFF", actorId, data: { decision, note: note ?? null } });
    await this.refresh(sh, "API").catch(() => undefined);
    return this.forOrder(orderId);
  }

  async label(orderId: string) {
    const sh = await this.shipmentOf(orderId);
    if (!sh.trackingNumber) throw new BadRequestException("لا رقم تتبع بعد");
    return { pdfBase64: await this.client.labelBase64(sh.trackingNumber) };
  }

  /** ربط المحافظات: محافظاتنا، المربوط منها، واقتراح لكل غير مربوط. */
  async areas() {
    const [zones, maps, theirs] = await Promise.all([
      this.prisma.shippingZone.findMany({ orderBy: { position: "asc" }, select: { governorate: true, isActive: true } }),
      this.prisma.courierAreaMap.findMany({ where: { provider: PROVIDER } }),
      this.governances().catch(() => [] as Array<{ id: number; name: string }>),
    ]);
    return {
      provinces: theirs,
      rows: zones.map((z) => {
        const m = maps.find((x) => x.governorate === z.governorate && x.area === "");
        return {
          governorate: z.governorate,
          active: z.isActive,
          governanceId: m?.governanceId ?? null,
          cityId: m?.cityId ?? null,
          suggested: m ? null : suggestGovernance(z.governorate, theirs),
        };
      }),
    };
  }

  async setArea(governorate: string, governanceId: number | null, area = "", cityId: number | null = null) {
    if (!governanceId) {
      await this.prisma.courierAreaMap.deleteMany({ where: { provider: PROVIDER, governorate, area } });
    } else {
      await this.prisma.courierAreaMap.upsert({
        where: { provider_governorate_area: { provider: PROVIDER, governorate, area } },
        create: { provider: PROVIDER, governorate, area, governanceId, cityId },
        update: { governanceId, cityId },
      });
    }
    return this.areas();
  }

  async health() {
    let tokenOk = false;
    let tokenError: string | null = null;
    try {
      tokenOk = await this.client.authorize();
    } catch (e) {
      tokenError = (e as Error).message;
    }
    const counts = await this.prisma.shipment.groupBy({ by: ["state"], _count: { _all: true } });
    const alerts = await this.prisma.shipment.count({ where: { isFinal: false, state: ShipmentState.CREATED, statusId: { in: [4, 10, 11, 23, 35, 5, 6] } } });
    return {
      configured: this.client.configured,
      tokenOk,
      tokenError,
      webhookSecretSet: !!this.webhookSecret(),
      lastPollAt: this.lastPollAt,
      lastPollError: this.lastPollError,
      states: Object.fromEntries(counts.map((c) => [c.state, c._count._all])),
      needsDecision: alerts,
    };
  }

  /** يسجّل رابط الـwebhook لدى هاي إكسبريس (الرابط يحمل كلمة السر — لا يُعرض كاملاً). */
  async registerWebhook(publicBase: string) {
    const secret = this.webhookSecret();
    if (!secret) throw new BadRequestException("كلمة سر الـwebhook غير مضبوطة على السيرفر");
    const url = `${publicBase.replace(/\/+$/, "")}/webhooks/hi-express/${secret}`;
    const res = await this.client.setWebhook(url);
    return { ok: true, message: res?.message ?? null };
  }
}

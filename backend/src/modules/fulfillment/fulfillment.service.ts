import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { OrderNotifyService } from "../delivery/order-notify.service";
import {
  AdjustmentMethod,
  AdjustmentType,
  DeliveryOption,
  FulfillmentStage,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role,
  ScanResult,
} from "@prisma/client";
import { barcodeLookupCandidates } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { controlMediaUrls } from "../control/control-media.util";
import { SettingsService } from "../settings/settings.service";
import {
  PickExtraDto,
  PickFinishDto,
  PickLinePatchDto,
  PickReopenDto,
  PickScanDto,
  PickStartDto,
} from "./dto/fulfillment.dto";
import { OrderTimelineService } from "./order-timeline.service";
import {
  computePickMoney,
  DEFAULT_PICK_POLICY,
  LINE_COLOR,
  LINE_LABEL_AR,
  lineState,
  orderCode,
  parseOrderCode,
  pickCounts,
  PickLineInput,
  PickPolicy,
} from "./pick-engine";

export interface Actor {
  id: string;
  role: Role;
}

type Tx = Prisma.TransactionClient;

/** مراحل يبدأ منها التجهيز (أو يكمل). */
const STARTABLE: FulfillmentStage[] = [FulfillmentStage.NEW, FulfillmentStage.CONFIRMED, FulfillmentStage.PICKING];
/** بعد «إنهاء التجهيز» وقبل الفوترة. */
const PICKED_STAGES: FulfillmentStage[] = [FulfillmentStage.PICKED, FulfillmentStage.READY_FOR_PICKUP];
/** تعديلات المبلغ التي يكتبها «إنهاء التجهيز» (تُستبدل عند إعادة الإنهاء). */
const PICK_ADJUSTMENTS: AdjustmentType[] = [
  AdjustmentType.SHORTAGE,
  AdjustmentType.EXTRA,
  AdjustmentType.DISCOUNT_RECALC,
  AdjustmentType.ROUNDING,
];

const isManager = (a: Actor) => a.role === Role.ADMIN || a.role === Role.SUPER_ADMIN;

const productSelect = {
  id: true,
  name: true,
  nameAr: true,
  barcode: true,
  price: true,
  images: { take: 1, orderBy: { position: "asc" as const }, include: { media: true } },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

/**
 * تجهيز طلبات التطبيق: QR الطلب ← مسح القطع ← إضافات ونواقص بالألوان ← إنهاء بمبلغ نهائي.
 * كل تعديل يمر بقفل على الطلب (pg_advisory_xact_lock) فلا تتسابق مسحتان على السطر نفسه.
 */
@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly timeline: OrderTimelineService,
    @Optional() private readonly notify?: OrderNotifyService,
  ) {}

  // ------------------------------------------------------------ reads

  /** فتح الطلب من مسح QR أو باركود قائمة التجهيز. */
  async byCode(code: string) {
    const orderNumber = parseOrderCode(code);
    if (!orderNumber) throw new BadRequestException("هذا ليس رمز طلب");
    const o = await this.prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, orderNumber: true, status: true, fulfillmentStage: true, pickerName: true },
    });
    if (!o) throw new NotFoundException(`الطلب ${orderNumber} غير موجود`);
    return o;
  }

  /** المطلوب مقابل المُجهَّز بالألوان، مع المبلغ الجديد. */
  async view(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { coupon: { select: { type: true, value: true, maxDiscount: true, code: true } } },
    });
    if (!order) throw new NotFoundException("الطلب غير موجود");
    let lines = await this.prisma.orderPickLine.findMany({
      where: { orderId },
      orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
    });
    if (!lines.length && STARTABLE.includes(order.fulfillmentStage)) {
      // قبل بدء التجهيز: نعرض أسطر الطلب كما ستُنشأ (بلا كتابة).
      lines = (await this.linesFromItems(this.prisma, orderId)).map((l, i) => ({
        ...l,
        id: `preview-${i}`,
        orderId,
        productId: l.productId ?? null,
        shadeId: l.shadeId ?? null,
        barcode: l.barcode ?? null,
        shadeName: l.shadeName ?? null,
        orderItemId: l.orderItemId ?? null,
        pickedQty: 0,
        charge: "PAID",
        reason: null,
        substituteForLineId: null,
        manualConfirm: false,
        updatedById: null,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
      })) as typeof lines;
    }
    const finalized = !STARTABLE.includes(order.fulfillmentStage);
    const policy = await this.policy();
    const engineLines: PickLineInput[] = lines.map((l) => ({
      id: l.id,
      kind: l.kind,
      orderedQty: l.orderedQty,
      pickedQty: l.pickedQty,
      unitPrice: l.unitPrice,
      charge: l.charge,
      reason: l.reason,
      substituteForLineId: l.substituteForLineId,
    }));
    const money = computePickMoney(
      {
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        packageDiscount: order.packageDiscount,
        shippingTotal: order.shippingTotal,
        giftWrapFee: order.giftWrapFee,
        loyaltyDiscount: order.loyaltyDiscount,
        total: order.total,
        paymentStatus: order.paymentStatus,
        coupon: order.coupon ? { type: order.coupon.type, value: order.coupon.value, maxDiscount: order.coupon.maxDiscount } : null,
      },
      engineLines,
      policy,
    );
    const thumbs = await this.thumbs(lines.map((l) => ({ productId: l.productId, shadeId: l.shadeId })));
    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        code: orderCode(order.orderNumber),
        status: order.status,
        stage: order.fulfillmentStage,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryOption: order.deliveryOption,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        giftHidePrices: order.giftHidePrices,
        notes: order.notes,
        pickerId: order.pickerId,
        pickerName: order.pickerName,
        pickStartedAt: order.pickStartedAt,
        pickedAt: order.pickedAt,
        parcelCount: order.parcelCount,
        invoiced: !!order.posInvoicedAt,
        total: order.total,
      },
      lines: lines.map((l) => {
        const state = lineState(engineLines.find((e) => e.id === l.id)!, finalized);
        return {
          id: l.id,
          kind: l.kind,
          orderItemId: l.orderItemId,
          productId: l.productId,
          shadeId: l.shadeId,
          barcode: l.barcode,
          name: l.name,
          shadeName: l.shadeName,
          orderedQty: l.orderedQty,
          pickedQty: l.pickedQty,
          missingQty: l.kind === "ORDERED" ? Math.max(0, l.orderedQty - l.pickedQty) : 0,
          unitPrice: l.unitPrice,
          charge: l.charge,
          reason: l.reason,
          substituteForLineId: l.substituteForLineId,
          manualConfirm: l.manualConfirm,
          state,
          color: LINE_COLOR[state],
          label: LINE_LABEL_AR[state],
          thumb: thumbs.get(l.shadeId ?? "") ?? thumbs.get(l.productId ?? "") ?? null,
        };
      }),
      counts: pickCounts(engineLines, finalized),
      money,
      policy,
      canFinish: order.fulfillmentStage === FulfillmentStage.PICKING,
    };
  }

  /** بيانات قائمة التجهيز المطبوعة (بلا أسعار): مرتبة حسب القسم ثم الماركة ليمشي الموظف مرة واحدة. */
  async slip(orderId: string) {
    const o = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                nameAr: true,
                barcode: true,
                brand: { select: { name: true } },
                category: { select: { name: true, nameAr: true } },
              },
            },
          },
        },
      },
    });
    if (!o) throw new NotFoundException("الطلب غير موجود");
    const shadeIds = o.items.map((i) => i.shadeId).filter((x): x is string => !!x);
    const shades = shadeIds.length
      ? await this.prisma.productShade.findMany({ where: { id: { in: shadeIds } }, select: { id: true, name: true, barcode: true } })
      : [];
    const shadeById = new Map(shades.map((s) => [s.id, s]));
    const lines = o.items
      .map((i) => {
        const shade = i.shadeId ? shadeById.get(i.shadeId) : undefined;
        const barcode = i.barcode ?? shade?.barcode ?? i.product.barcode ?? null;
        return {
          name: i.product.nameAr || i.productName,
          shadeName: i.shadeName ?? shade?.name ?? null,
          quantity: i.quantity,
          brand: i.product.brand?.name ?? "",
          category: i.product.category?.nameAr || i.product.category?.name || "",
          barcodeTail: barcode ? barcode.slice(-4) : null,
        };
      })
      .sort((a, b) => a.category.localeCompare(b.category, "ar") || a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name, "ar"));
    return {
      orderNumber: o.orderNumber,
      code: orderCode(o.orderNumber),
      createdAt: o.createdAt,
      customerName: o.shipFullName,
      governorate: o.shipGovernorate,
      area: o.shipArea,
      deliveryOption: o.deliveryOption,
      isGift: o.isGift,
      giftMessage: o.giftMessage,
      notes: o.notes,
      lines,
      totalUnits: lines.reduce((n, l) => n + l.quantity, 0),
    };
  }

  timelineOf(orderId: string) {
    return this.timeline.list(orderId);
  }

  // ------------------------------------------------------------ writes

  async start(orderId: string, actor: Actor, dto: PickStartDto = {}) {
    const name = await this.actorName(actor);
    let firstStart = false;
    await this.prisma.$transaction(async (tx) => {
      const o = await this.lockOrder(tx, orderId);
      firstStart = !o.pickStartedAt;
      if (o.fulfillmentStage === FulfillmentStage.CANCELLED || o.status === OrderStatus.CANCELLED) {
        throw new ConflictException("الطلب ملغي");
      }
      if (!STARTABLE.includes(o.fulfillmentStage)) {
        throw new ConflictException("انتهى تجهيز هذا الطلب — يعيد المدير فتحه إن لزم");
      }
      if (o.paymentMethod === PaymentMethod.CARD && o.paymentStatus !== PaymentStatus.PAID) {
        throw new ConflictException("طلب بطاقة لم يُدفع بعد — لا يُجهَّز حتى يكتمل الدفع");
      }
      const takenByOther = o.pickerId && o.pickerId !== actor.id;
      if (takenByOther && !(dto.takeover && isManager(actor))) {
        throw new ConflictException(`يجهّزه ${o.pickerName ?? "موظف آخر"} الآن`);
      }
      const existing = await tx.orderPickLine.count({ where: { orderId } });
      if (!existing) {
        const lines = await this.linesFromItems(tx, orderId);
        await tx.orderPickLine.createMany({ data: lines.map((l) => ({ ...l, orderId })) });
      }
      await tx.order.update({
        where: { id: orderId },
        data: {
          fulfillmentStage: FulfillmentStage.PICKING,
          pickerId: actor.id,
          pickerName: name,
          pickStartedAt: o.pickStartedAt ?? new Date(),
          // العميل يرى «قيد التجهيز»، ولا يلغي بعدها من التطبيق.
          ...(o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED ? { status: OrderStatus.PROCESSING } : {}),
        },
      });
      if (o.fulfillmentStage !== FulfillmentStage.PICKING || o.pickerId !== actor.id) {
        await this.timeline.log(
          {
            orderId,
            type: takenByOther ? "PICK_TAKEOVER" : "PICK_STARTED",
            actorType: "STAFF",
            actorId: actor.id,
            actorName: name,
            data: takenByOther ? { from: o.pickerName } : undefined,
          },
          tx,
        );
      }
    });
    if (firstStart) void this.notify?.send(orderId, { kind: "PICKING" });
    return this.view(orderId);
  }

  async scan(orderId: string, actor: Actor, dto: PickScanDto) {
    const qty = dto.qty === -1 ? -1 : 1;
    const name = await this.actorName(actor);
    // تُكتب داخل المعاملة — «as» تمنع TypeScript من تضييق النوع على القيمة الابتدائية.
    let result = ScanResult.UNKNOWN as ScanResult;
    let proposal = null as Awaited<ReturnType<FulfillmentService["lookup"]>>;
    let message = "";
    await this.prisma.$transaction(async (tx) => {
      const o = await this.lockOrder(tx, orderId);
      this.assertPicker(o, actor);
      if (dto.clientScanId) {
        const dup = await tx.orderScan.findUnique({
          where: { orderId_clientScanId: { orderId, clientScanId: dto.clientScanId } },
        });
        if (dup) {
          result = dup.result;
          message = "مسحة مكررة — لم تُحسب مرتين";
          return;
        }
      }
      const lines = await tx.orderPickLine.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } });
      const keys = new Set(barcodeLookupCandidates(dto.barcode));
      const hits = lines.filter((l) => l.barcode && barcodeLookupCandidates(l.barcode).some((k) => keys.has(k)));
      const orderedHits = hits.filter((l) => l.kind === "ORDERED");
      const extraHit = hits.find((l) => l.kind === "EXTRA");
      let lineId: string | null = null;

      if (qty > 0) {
        const open = orderedHits.find((l) => l.pickedQty < l.orderedQty);
        if (open) {
          const n = await tx.$executeRaw`
            UPDATE "OrderPickLine" SET "pickedQty" = "pickedQty" + 1, "updatedAt" = now(), "updatedById" = ${actor.id}
            WHERE id = ${open.id} AND "pickedQty" < "orderedQty"`;
          result = n ? ScanResult.MATCHED : ScanResult.OVER;
          lineId = open.id;
          message = n ? `✓ ${open.name}${open.shadeName ? ` — ${open.shadeName}` : ""}` : "العدد مكتمل";
        } else if (orderedHits.length) {
          result = ScanResult.OVER;
          lineId = orderedHits[0].id;
          message = "العدد المطلوب مكتمل — أضفه كإضافي إن كان مقصوداً";
        } else if (extraHit) {
          await tx.orderPickLine.update({
            where: { id: extraHit.id },
            data: { pickedQty: { increment: 1 }, updatedById: actor.id },
          });
          result = ScanResult.EXTRA;
          lineId = extraHit.id;
          message = `+1 إضافي: ${extraHit.name}`;
        } else {
          proposal = await this.lookup(dto.barcode, tx);
          result = proposal ? ScanResult.EXTRA_PROPOSED : ScanResult.UNKNOWN;
          message = proposal ? "ليس ضمن الطلب — أضفه كصنف إضافي؟" : "باركود غير معروف";
        }
      } else {
        const target = [...orderedHits, ...(extraHit ? [extraHit] : [])].find((l) => l.pickedQty > 0);
        if (!target) {
          result = ScanResult.UNKNOWN;
          message = "لا توجد قطعة ممسوحة بهذا الباركود";
        } else if (target.kind === "EXTRA" && target.pickedQty <= 1) {
          await tx.orderPickLine.delete({ where: { id: target.id } });
          result = ScanResult.REMOVED;
          lineId = target.id;
          message = `أُزيل الإضافي: ${target.name}`;
        } else {
          await tx.orderPickLine.update({
            where: { id: target.id },
            data: { pickedQty: { decrement: 1 }, manualConfirm: false, updatedById: actor.id },
          });
          result = ScanResult.REMOVED;
          lineId = target.id;
          message = `−1 ${target.name}`;
        }
      }

      await tx.orderScan.create({
        data: {
          orderId,
          lineId,
          barcode: dto.barcode.slice(0, 80),
          result,
          qty,
          userId: actor.id,
          userName: name,
          device: dto.device ?? null,
          clientScanId: dto.clientScanId ?? null,
        },
      });
    });
    return { result, message, proposal, view: await this.view(orderId) };
  }

  async addExtra(orderId: string, actor: Actor, dto: PickExtraDto) {
    const name = await this.actorName(actor);
    const qty = dto.qty ?? 1;
    await this.prisma.$transaction(async (tx) => {
      const o = await this.lockOrder(tx, orderId);
      this.assertPicker(o, actor);
      if (dto.clientScanId) {
        const dup = await tx.orderScan.findUnique({
          where: { orderId_clientScanId: { orderId, clientScanId: dto.clientScanId } },
        });
        if (dup) return;
      }
      const found = await this.lookup(dto.barcode, tx);
      if (!found) throw new BadRequestException("باركود غير معروف — لا يُضاف صنف لا نعرف سعره");
      if (dto.substituteForLineId) {
        const sub = await tx.orderPickLine.findFirst({ where: { id: dto.substituteForLineId, orderId, kind: "ORDERED" } });
        if (!sub) throw new BadRequestException("السطر الذي يحل محله غير موجود في هذا الطلب");
      }
      const existing = await tx.orderPickLine.findFirst({
        where: { orderId, kind: "EXTRA", barcode: found.barcode, charge: dto.charge },
      });
      let lineId: string;
      if (existing) {
        await tx.orderPickLine.update({
          where: { id: existing.id },
          data: {
            pickedQty: { increment: qty },
            reason: dto.reason ?? existing.reason,
            substituteForLineId: dto.substituteForLineId ?? existing.substituteForLineId,
            updatedById: actor.id,
          },
        });
        lineId = existing.id;
      } else {
        const created = await tx.orderPickLine.create({
          data: {
            orderId,
            kind: "EXTRA",
            productId: found.productId,
            shadeId: found.shadeId,
            barcode: found.barcode,
            name: found.name,
            shadeName: found.shadeName,
            orderedQty: 0,
            pickedQty: qty,
            // السعر الحقيقي يُحفظ حتى للهدية (قيمتها في التقارير)؛ المحرك يحسبها على العميل بصفر.
            unitPrice: found.price,
            charge: dto.charge,
            reason: dto.reason ?? null,
            substituteForLineId: dto.substituteForLineId ?? null,
            updatedById: actor.id,
          },
        });
        lineId = created.id;
      }
      await tx.orderScan.create({
        data: {
          orderId,
          lineId,
          barcode: dto.barcode.slice(0, 80),
          result: ScanResult.EXTRA,
          qty,
          userId: actor.id,
          userName: name,
          device: dto.device ?? null,
          clientScanId: dto.clientScanId ?? null,
        },
      });
      await this.timeline.log(
        {
          orderId,
          type: "PICK_EXTRA_ADDED",
          actorType: "STAFF",
          actorId: actor.id,
          actorName: name,
          data: { name: found.name, shadeName: found.shadeName, qty, charge: dto.charge, reason: dto.reason ?? null },
        },
        tx,
      );
    });
    return this.view(orderId);
  }

  async patchLine(orderId: string, lineId: string, actor: Actor, dto: PickLinePatchDto) {
    const name = await this.actorName(actor);
    await this.prisma.$transaction(async (tx) => {
      const o = await this.lockOrder(tx, orderId);
      this.assertPicker(o, actor);
      const line = await tx.orderPickLine.findFirst({ where: { id: lineId, orderId } });
      if (!line) throw new NotFoundException("السطر غير موجود");
      const data: Prisma.OrderPickLineUpdateInput = { updatedById: actor.id };
      if (dto.manualConfirm === true && line.kind === "ORDERED") {
        data.pickedQty = line.orderedQty;
        data.manualConfirm = true;
      }
      if (dto.pickedQty != null) {
        if (line.kind === "ORDERED" && dto.pickedQty > line.orderedQty) {
          throw new BadRequestException(`الحد الأقصى ${line.orderedQty} — الزيادة تُضاف كصنف إضافي`);
        }
        if (line.kind === "EXTRA" && dto.pickedQty === 0) {
          await tx.orderPickLine.delete({ where: { id: lineId } });
          await this.logLineEdit(tx, orderId, actor, name, line.name, { removed: true });
          return;
        }
        data.pickedQty = dto.pickedQty;
        if (dto.manualConfirm !== true) data.manualConfirm = false;
      }
      if (dto.reason !== undefined) data.reason = dto.reason.trim() || null;
      if (dto.charge && line.kind === "EXTRA") data.charge = dto.charge;
      if (dto.substituteForLineId !== undefined && line.kind === "EXTRA") {
        data.substituteForLineId = dto.substituteForLineId || null;
      }
      await tx.orderPickLine.update({ where: { id: lineId }, data });
      if (data.pickedQty !== undefined) {
        await tx.orderScan.create({
          data: {
            orderId,
            lineId,
            barcode: line.barcode ?? "-",
            result: ScanResult.MANUAL,
            qty: Number(data.pickedQty) - line.pickedQty,
            userId: actor.id,
            userName: name,
          },
        });
      }
      await this.logLineEdit(tx, orderId, actor, name, line.name, {
        pickedQty: dto.pickedQty ?? (dto.manualConfirm ? line.orderedQty : undefined),
        reason: dto.reason,
        charge: dto.charge,
        manualConfirm: dto.manualConfirm,
      });
    });
    return this.view(orderId);
  }

  async finish(orderId: string, actor: Actor, dto: PickFinishDto) {
    const name = await this.actorName(actor);
    const policy = await this.policy();
    let notice: unknown = null;
    await this.prisma.$transaction(async (tx) => {
      const o = await this.lockOrder(tx, orderId);
      this.assertPicker(o, actor);
      if (o.fulfillmentStage !== FulfillmentStage.PICKING) throw new ConflictException("الطلب ليس قيد التجهيز");

      for (const r of dto.reasons ?? []) {
        if (!r.reason.trim()) continue;
        await tx.orderPickLine.updateMany({ where: { id: r.lineId, orderId }, data: { reason: r.reason.trim() } });
      }
      const lines = await tx.orderPickLine.findMany({ where: { orderId } });
      if (!lines.length) throw new ConflictException("لا توجد أسطر تجهيز");
      const missingReason = lines.filter((l) => l.kind === "ORDERED" && l.pickedQty < l.orderedQty && !(l.reason ?? "").trim());
      if (missingReason.length) {
        throw new BadRequestException({
          message: `اذكر سبب النقص: ${missingReason.map((l) => l.name).join("، ")}`,
          code: "SHORTAGE_REASON_REQUIRED",
          lineIds: missingReason.map((l) => l.id),
        });
      }
      const coupon = o.couponId
        ? await tx.coupon.findUnique({ where: { id: o.couponId }, select: { type: true, value: true, maxDiscount: true } })
        : null;
      const money = computePickMoney(
        {
          subtotal: o.subtotal,
          discountTotal: o.discountTotal,
          packageDiscount: o.packageDiscount,
          shippingTotal: o.shippingTotal,
          giftWrapFee: o.giftWrapFee,
          loyaltyDiscount: o.loyaltyDiscount,
          total: o.total,
          paymentStatus: o.paymentStatus,
          coupon,
        },
        lines.map((l) => ({ ...l })),
        policy,
      );
      if (money.allMissing) {
        throw new ConflictException({
          message: "كل أصناف الطلب ناقصة — ألغِ الطلب وأبلغ العميل بدل إنهاء التجهيز",
          code: "ALL_MISSING",
        });
      }
      if (money.needsApproval && !isManager(actor)) {
        throw new ForbiddenException({
          message: "التعديل أكبر من الحد المسموح — يحتاج موافقة المدير لإنهاء التجهيز",
          code: "APPROVAL_REQUIRED",
          reasons: money.approvalReasons,
        });
      }

      await tx.orderAdjustment.deleteMany({ where: { orderId, type: { in: PICK_ADJUSTMENTS } } });
      const method = money.prepaid ? AdjustmentMethod.CARD_REFUND : AdjustmentMethod.COD_CHANGE;
      const adjustments: Prisma.OrderAdjustmentCreateManyInput[] = [];
      if (money.shortageValue) {
        adjustments.push({
          orderId,
          type: AdjustmentType.SHORTAGE,
          amount: -money.shortageValue,
          method,
          // الاسترجاع بالبطاقة يُنفَّذ بعد الفوترة.
          status: money.prepaid && money.refundAmount > 0 ? "PENDING" : "DONE",
          data: { refundAmount: money.refundAmount },
          actorId: actor.id,
        });
      }
      if (money.extrasValue) {
        adjustments.push({ orderId, type: AdjustmentType.EXTRA, amount: money.extrasValue, method: AdjustmentMethod.COD_CHANGE, actorId: actor.id });
      }
      if (money.discountRecalc) {
        adjustments.push({ orderId, type: AdjustmentType.DISCOUNT_RECALC, amount: money.discountRecalc, method: AdjustmentMethod.NONE, actorId: actor.id });
      }
      if (money.roundingDiscount) {
        adjustments.push({ orderId, type: AdjustmentType.ROUNDING, amount: -money.roundingDiscount, method: AdjustmentMethod.NONE, actorId: actor.id });
      }
      if (adjustments.length) await tx.orderAdjustment.createMany({ data: adjustments });

      await tx.order.update({
        where: { id: orderId },
        data: {
          fulfillmentStage: o.deliveryOption === DeliveryOption.PICKUP ? FulfillmentStage.READY_FOR_PICKUP : FulfillmentStage.PICKED,
          pickedAt: new Date(),
          parcelCount: dto.parcelCount ?? o.parcelCount ?? 1,
          pickApprovedById: money.needsApproval ? actor.id : null,
          finalSubtotal: money.finalSubtotal,
          finalDiscountTotal: money.finalDiscountTotal,
          adjustmentTotal: money.adjustmentTotal,
          finalTotal: money.finalTotal,
          codAmount: money.codAmount,
        },
      });
      const counts = pickCounts(lines, true);
      await this.timeline.log(
        {
          orderId,
          type: "PICK_FINISHED",
          actorType: "STAFF",
          actorId: actor.id,
          actorName: name,
          data: {
            matched: counts.matched,
            short: counts.short,
            extra: counts.extra,
            parcelCount: dto.parcelCount ?? 1,
            originalTotal: o.total,
            finalTotal: money.finalTotal,
            codAmount: money.codAmount,
            refundAmount: money.refundAmount,
            approvedByManager: money.needsApproval,
          },
        },
        tx,
      );
      notice = { pickup: o.deliveryOption === DeliveryOption.PICKUP, changed: money.changed, oldTotal: o.total, newTotal: money.finalTotal, lines };
    });
    // إشعار العميل بعد نجاح المعاملة فقط: التعديل (نقص/إضافة مدفوعة) أو «جاهز للاستلام».
    const n = notice as null | { pickup: boolean; changed: boolean; oldTotal: number; newTotal: number; lines: Array<{ kind: string; name: string; pickedQty: number; orderedQty: number; charge: string }> };
    if (n && this.notify) {
      const missing = n.lines.filter((l) => l.kind === "ORDERED" && l.pickedQty < l.orderedQty).map((l) => l.name);
      const extras = n.lines.filter((l) => l.kind === "EXTRA" && l.pickedQty > 0 && l.charge === "PAID").map((l) => l.name);
      if (n.changed && (missing.length || extras.length)) {
        void this.notify.send(orderId, { kind: "ADJUSTED", missing, extras, oldTotal: n.oldTotal, newTotal: n.newTotal });
      }
      if (n.pickup) void this.notify.send(orderId, { kind: "READY_FOR_PICKUP" });
    }
    return this.view(orderId);
  }

  /** المدير يعيد فتح تجهيز منتهٍ قبل الفوترة (خطأ في المسح، العميل غيّر رأيه...). */
  async reopen(orderId: string, actor: Actor, dto: PickReopenDto) {
    if (!isManager(actor)) throw new ForbiddenException("إعادة فتح التجهيز للمدير فقط");
    const name = await this.actorName(actor);
    await this.prisma.$transaction(async (tx) => {
      const o = await this.lockOrder(tx, orderId);
      if (!PICKED_STAGES.includes(o.fulfillmentStage)) throw new ConflictException("الطلب ليس في مرحلة «تم التجهيز»");
      if (o.posInvoicedAt) throw new ConflictException("الطلب مُفوتر — يُعالج بإيصال إرجاع لا بإعادة الفتح");
      await tx.orderAdjustment.deleteMany({ where: { orderId, type: { in: PICK_ADJUSTMENTS } } });
      await tx.order.update({
        where: { id: orderId },
        data: {
          fulfillmentStage: FulfillmentStage.PICKING,
          pickedAt: null,
          pickApprovedById: null,
          finalSubtotal: null,
          finalDiscountTotal: null,
          adjustmentTotal: 0,
          finalTotal: null,
          codAmount: null,
        },
      });
      await this.timeline.log(
        { orderId, type: "PICK_REOPENED", actorType: "STAFF", actorId: actor.id, actorName: name, data: { reason: dto.reason } },
        tx,
      );
    });
    return this.view(orderId);
  }

  // ------------------------------------------------------------ helpers

  /** يقفل الطلب حتى نهاية المعاملة (عمليات التجهيز على الطلب نفسه تُنفّذ واحدة تلو الأخرى). */
  private async lockOrder(tx: Tx, orderId: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order-pick:${orderId}`}))`;
    const o = await tx.order.findUnique({ where: { id: orderId } });
    if (!o) throw new NotFoundException("الطلب غير موجود");
    return o;
  }

  private assertPicker(o: { fulfillmentStage: FulfillmentStage; pickerId: string | null; pickerName: string | null }, actor: Actor) {
    if (o.fulfillmentStage !== FulfillmentStage.PICKING) {
      throw new ConflictException(
        PICKED_STAGES.includes(o.fulfillmentStage) ? "انتهى التجهيز — يعيد المدير فتحه إن لزم" : "ابدأ التجهيز أولاً",
      );
    }
    if (o.pickerId && o.pickerId !== actor.id && !isManager(actor)) {
      throw new ForbiddenException(`يجهّزه ${o.pickerName ?? "موظف آخر"}`);
    }
  }

  /** أسطر التجهيز من أسطر الطلب: الباركود والاسم كما كانا وقت الطلب إن حُفظا. */
  private async linesFromItems(db: Tx | PrismaService, orderId: string) {
    const items = await db.orderItem.findMany({
      where: { orderId },
      orderBy: { id: "asc" },
      include: { product: { select: { name: true, nameAr: true, barcode: true } } },
    });
    const shadeIds = items.map((i) => i.shadeId).filter((x): x is string => !!x);
    const shades = shadeIds.length
      ? await db.productShade.findMany({ where: { id: { in: shadeIds } }, select: { id: true, name: true, barcode: true } })
      : [];
    const byId = new Map(shades.map((s) => [s.id, s]));
    return items.map((i) => {
      const shade = i.shadeId ? byId.get(i.shadeId) : undefined;
      return {
        orderItemId: i.id,
        kind: "ORDERED" as const,
        productId: i.productId,
        shadeId: i.shadeId,
        barcode: i.barcode ?? shade?.barcode ?? (i.shadeId ? null : i.product.barcode) ?? null,
        name: i.product.nameAr || i.productName,
        shadeName: i.shadeName ?? shade?.name ?? null,
        orderedQty: i.quantity,
        unitPrice: i.unitPrice,
      };
    });
  }

  /** منتج أو تدرج بهذا الباركود — للصنف الإضافي (بالسعر الحالي في الموقع). */
  private async lookup(raw: string, db: Tx | PrismaService = this.prisma) {
    const candidates = barcodeLookupCandidates(raw);
    if (!candidates.length) return null;
    const shade = await db.productShade.findFirst({
      where: { barcode: { in: candidates } },
      orderBy: { isActive: "desc" },
      include: { product: { select: productSelect }, image: true },
    });
    if (shade) {
      return {
        productId: shade.productId,
        shadeId: shade.id,
        barcode: shade.barcode!,
        name: shade.product.nameAr || shade.product.name,
        shadeName: shade.name,
        price: shade.price ?? shade.product.price,
        thumb: shade.image ? controlMediaUrls(shade.image).thumb : this.productThumb(shade.product),
      };
    }
    const product = await db.product.findFirst({
      where: { OR: [{ barcode: { in: candidates } }, { sku: { in: candidates } }] },
      select: productSelect,
    });
    if (!product) return null;
    return {
      productId: product.id,
      shadeId: null,
      barcode: product.barcode ?? candidates[0],
      name: product.nameAr || product.name,
      shadeName: null,
      price: product.price,
      thumb: this.productThumb(product),
    };
  }

  private productThumb(p?: Pick<ProductRow, "images"> | null) {
    const m = p?.images?.[0]?.media;
    if (!m || m.storagePath === "placeholder") return null;
    return controlMediaUrls(m).thumb;
  }

  private async thumbs(refs: Array<{ productId: string | null; shadeId: string | null }>) {
    const map = new Map<string, string | null>();
    const shadeIds = [...new Set(refs.map((r) => r.shadeId).filter((x): x is string => !!x))];
    const productIds = [...new Set(refs.map((r) => r.productId).filter((x): x is string => !!x))];
    const [shades, products] = await Promise.all([
      shadeIds.length
        ? this.prisma.productShade.findMany({ where: { id: { in: shadeIds } }, select: { id: true, image: true } })
        : [],
      productIds.length
        ? this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, images: productSelect.images } })
        : [],
    ]);
    for (const s of shades) if (s.image) map.set(s.id, controlMediaUrls(s.image).thumb);
    for (const p of products) map.set(p.id, this.productThumb(p));
    return map;
  }

  private async logLineEdit(tx: Tx, orderId: string, actor: Actor, name: string, lineName: string, data: Record<string, unknown>) {
    await this.timeline.log(
      {
        orderId,
        type: "PICK_LINE_EDITED",
        actorType: "STAFF",
        actorId: actor.id,
        actorName: name,
        data: JSON.parse(JSON.stringify({ line: lineName, ...data })) as Prisma.InputJsonValue,
      },
      tx,
    );
  }

  private async actorName(actor: Actor) {
    const u = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { name: true, email: true, phone: true } });
    return u?.name || u?.email || u?.phone || "موظف";
  }

  async policy(): Promise<PickPolicy> {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    const num = (v: unknown, d: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : d;
    };
    return {
      roundingStep: num(s.codRoundingStep, DEFAULT_PICK_POLICY.roundingStep) || DEFAULT_PICK_POLICY.roundingStep,
      approvalShortagePercent: num(s.pickApprovalShortagePercent, DEFAULT_PICK_POLICY.approvalShortagePercent),
      approvalExtraAmount: num(s.pickApprovalExtraAmount, DEFAULT_PICK_POLICY.approvalExtraAmount),
    };
  }
}

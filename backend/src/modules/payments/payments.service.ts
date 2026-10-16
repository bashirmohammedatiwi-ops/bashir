import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentTransaction,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { OrderEvents } from "../orders/order-events";
import { OrdersService } from "../orders/orders.service";
import { SettingsService } from "../settings/settings.service";
import { QiGatewayError, QiGatewayService, QiPayment } from "./qi-gateway.service";

/** حالات البوابة النهائية — لا تتغير بعدها إلا بالاسترجاع/الإلغاء. */
const FINAL_FAILED = new Set(["FAILED", "AUTHENTICATION_FAILED", "EXPIRED", "DECLINED"]);

/** مهلة الطلب غير المدفوع بالبطاقة قبل إلغائه وإعادة المخزون. */
const UNPAID_CARD_ORDER_TTL_MS = 45 * 60_000;
const SWEEP_EVERY_MS = 5 * 60_000;

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("Payments");
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly qi: QiGatewayService,
    private readonly orders: OrdersService,
    private readonly orderEvents: OrderEvents,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.orderEvents.onCancelled(({ orderId, actorId }) =>
      this.reverseForCancelledOrder(orderId, actorId).catch((e) =>
        this.log.error(`Auto-reverse for cancelled order ${orderId} failed: ${e.message}`),
      ),
    );
    if (process.env.NODE_ENV !== "test") {
      this.sweepTimer = setInterval(() => {
        this.expireUnpaidCardOrders().catch((e) =>
          this.log.warn(`Unpaid-order sweep failed: ${e.message}`),
        );
      }, SWEEP_EVERY_MS);
      this.sweepTimer.unref?.();
    }
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  // ---------------------------------------------------------------- عام

  /** طرق الدفع المتاحة للتطبيق + إعدادات واجهة الدفع الأصلية (بدون أي سر). */
  async methods(userId?: string) {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, email: true, phone: true },
        })
      : null;
    const cardEnabled =
      s.cardPaymentEnabled !== false && this.qi.isConfigured && this.qi.allowsUser(user);
    return {
      cod: true,
      card: cardEnabled
        ? {
            enabled: true,
            provider: "QI",
            sandbox: this.qi.isSandbox,
            sdk: {
              // الحزمة تضيف api/v1 بنفسها — نعطيها أصل البوابة فقط.
              baseUrl: this.qi.baseUrl.replace(/\/api\/v1$/, ""),
              terminalId: this.qi.terminalId,
              publicKey: this.qi.publicKeyBody,
            },
          }
        : { enabled: false },
    };
  }

  // ---------------------------------------------------------------- الزبونة

  /** يبدأ (أو يعيد) محاولة دفع لطلب بالبطاقة ويعيد ما تحتاجه واجهة الدفع. */
  async startForOrder(userId: string, orderId: string) {
    if (!this.qi.isConfigured) {
      throw new ServiceUnavailableException("الدفع الإلكتروني غير متاح حالياً");
    }
    const order = await this.ownedOrder(userId, orderId);
    if (order.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException("هذا الطلب ليس بالدفع الإلكتروني");
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("الطلب ملغى");
    }

    // محاولة سابقة ربما نجحت ولم يصلنا إشعارها بعد — لا ندفع مرتين.
    await this.syncOpen(order.id, "SYNC");
    const fresh = await this.prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    if (fresh.paymentStatus === PaymentStatus.PAID) {
      return { alreadyPaid: true, orderId: order.id, paymentStatus: fresh.paymentStatus };
    }
    if (fresh.total <= 0) throw new BadRequestException("لا يوجد مبلغ للدفع");

    const requestId = this.qi.newRequestId();
    let payment: QiPayment;
    try {
      payment = await this.qi.createPayment({
        requestId,
        amount: fresh.total,
        customer: {
          firstName: order.user?.name ?? undefined,
          phone: order.user?.phone ?? undefined,
          email: order.user?.email ?? undefined,
          accountId: userId,
        },
        additionalInfo: { orderNumber: fresh.orderNumber, orderId: fresh.id },
      });
    } catch (e) {
      throw this.asHttp(e);
    }

    const tx = await this.prisma.paymentTransaction.create({
      data: {
        orderId: fresh.id,
        requestId,
        paymentId: payment.paymentId,
        amount: fresh.total,
        currency: payment.currency ?? "IQD",
        status: payment.status ?? "CREATED",
        canceled: payment.canceled ?? false,
        raw: payment as unknown as Prisma.InputJsonValue,
      },
    });
    if (fresh.paymentStatus === PaymentStatus.FAILED) {
      await this.prisma.order.update({
        where: { id: fresh.id },
        data: { paymentStatus: PaymentStatus.PENDING },
      });
    }

    return {
      alreadyPaid: false,
      orderId: fresh.id,
      orderNumber: fresh.orderNumber,
      transactionId: tx.id,
      paymentId: payment.paymentId,
      requestId,
      amount: fresh.total,
      currency: tx.currency,
      accountId: userId,
    };
  }

  /** بعد إغلاق واجهة الدفع: نسأل البوابة مباشرة عن النتيجة (لا نثق بالتطبيق). */
  async confirmForOrder(userId: string, orderId: string) {
    const order = await this.ownedOrder(userId, orderId);
    await this.syncOpen(order.id, "SYNC");
    return this.publicSummary(order.id);
  }

  /** الزبونة أغلقت واجهة الدفع دون إتمام: نلغي المحاولة المعلّقة لدى البوابة. */
  async abandon(userId: string, orderId: string, transactionId?: string) {
    const order = await this.ownedOrder(userId, orderId);
    const open = await this.prisma.paymentTransaction.findMany({
      where: {
        orderId: order.id,
        status: "CREATED",
        canceled: false,
        ...(transactionId ? { id: transactionId } : {}),
      },
    });
    for (const tx of open) {
      await this.sync(tx, "SYNC");
      const latest = await this.prisma.paymentTransaction.findUniqueOrThrow({ where: { id: tx.id } });
      if (latest.status === "CREATED" && !latest.canceled) {
        await this.cancelAtGateway(latest, undefined, "ABANDONED");
      }
    }
    return this.publicSummary(order.id);
  }

  // ---------------------------------------------------------------- البوابة

  /**
   * إشعار البوابة: نتحقق من التوقيع للسجل، لكن الحالة نأخذها دائماً من
   * واجهة الاستعلام الموثّقة — فلا يمكن لطلب مزوّر أن يغيّر شيئاً.
   */
  async handleWebhook(payload: Record<string, unknown>, signature?: string) {
    const paymentId = typeof payload?.paymentId === "string" ? payload.paymentId : null;
    const signed = this.qi.verifyWebhookSignature(payload ?? {}, signature);
    if (!paymentId) return { received: true };
    const tx = await this.prisma.paymentTransaction.findUnique({ where: { paymentId } });
    if (!tx) {
      this.log.warn(`Webhook for unknown paymentId ${paymentId} (signed=${signed})`);
      return { received: true };
    }
    await this.sync(tx, "WEBHOOK", { signed, status: payload.status ?? null });
    return { received: true };
  }

  // ---------------------------------------------------------------- الإدارة

  async adminDetails(orderId: string) {
    await this.ensureOrder(orderId);
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      include: { operations: { orderBy: { createdAt: "desc" } } },
    });
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { paymentMethod: true, paymentStatus: true, total: true },
    });
    return {
      ...order,
      gatewayConfigured: this.qi.isConfigured,
      sandbox: this.qi.isSandbox,
      transactions: transactions.map(({ raw: _raw, ...t }) => ({
        ...t,
        refundable: t.status === "SUCCESS" && !t.canceled ? t.amount - t.refundedAmount : 0,
      })),
    };
  }

  async adminSync(orderId: string) {
    await this.ensureOrder(orderId);
    const txs = await this.prisma.paymentTransaction.findMany({ where: { orderId } });
    for (const tx of txs) await this.sync(tx, "SYNC");
    return this.adminDetails(orderId);
  }

  async adminRefund(orderId: string, actorId: string, amount?: number, reason?: string) {
    const tx = await this.paidTransaction(orderId);
    const remaining = tx.amount - tx.refundedAmount;
    const value = amount == null ? remaining : Math.round(amount);
    if (value <= 0 || value > remaining) {
      throw new BadRequestException(`المبلغ القابل للاسترجاع: ${remaining}`);
    }
    await this.refundAtGateway(tx, value, actorId, reason);
    return this.adminDetails(orderId);
  }

  /** إلغاء لدى البوابة: الدفعة المكتملة (قبل التسوية) أو — إن لم توجد — محاولة مفتوحة لم تُدفع. */
  async adminCancel(orderId: string, actorId: string) {
    await this.ensureOrder(orderId);
    await this.syncOpen(orderId, "SYNC");
    const paid = await this.prisma.paymentTransaction.findFirst({
      where: { orderId, status: "SUCCESS", canceled: false },
      orderBy: { createdAt: "desc" },
    });
    const tx =
      paid ??
      (await this.prisma.paymentTransaction.findFirst({
        where: { orderId, status: "CREATED", canceled: false },
        orderBy: { createdAt: "desc" },
      }));
    if (!tx) throw new BadRequestException("لا توجد عملية قابلة للإلغاء لهذا الطلب");
    await this.cancelAtGateway(tx, actorId, "ADMIN");
    return this.adminDetails(orderId);
  }

  // ---------------------------------------------------------------- داخلي

  /** طلب ملغى ومدفوع بالبطاقة: إلغاء العملية لدى البوابة، وإن تعذّر فاسترجاع كامل. */
  private async reverseForCancelledOrder(orderId: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== PaymentMethod.CARD) return;
    await this.syncOpen(orderId, "SYNC");
    const txs = await this.prisma.paymentTransaction.findMany({ where: { orderId } });
    for (const tx of txs) {
      if (tx.canceled) continue;
      if (tx.status === "CREATED") {
        await this.cancelAtGateway(tx, actorId, "ORDER_CANCELLED").catch(() => undefined);
        continue;
      }
      if (tx.status !== "SUCCESS" || tx.refundedAmount >= tx.amount) continue;
      try {
        await this.cancelAtGateway(tx, actorId, "ORDER_CANCELLED");
      } catch {
        await this.refundAtGateway(
          tx,
          tx.amount - tx.refundedAmount,
          actorId,
          "إلغاء الطلب",
        ).catch((e) => this.log.error(`Refund after cancel failed for ${tx.id}: ${e.message}`));
      }
    }
  }

  private async refundAtGateway(
    tx: PaymentTransaction,
    amount: number,
    actorId?: string,
    reason?: string,
  ) {
    if (!tx.paymentId) throw new BadRequestException("لا يوجد رقم عملية لدى البوابة");
    const requestId = this.qi.newRequestId();
    try {
      const res = await this.qi.refund(tx.paymentId, requestId, amount, reason);
      const ok = (res.status ?? "SUCCESS") === "SUCCESS";
      await this.prisma.$transaction([
        this.prisma.paymentOperation.create({
          data: {
            transactionId: tx.id,
            type: "REFUND",
            requestId,
            amount,
            success: ok,
            message: reason ?? res.details?.resultDescription ?? null,
            actorId: actorId ?? null,
            data: res as unknown as Prisma.InputJsonValue,
          },
        }),
        ...(ok
          ? [
              this.prisma.paymentTransaction.update({
                where: { id: tx.id },
                data: { refundedAmount: { increment: amount } },
              }),
            ]
          : []),
      ]);
      if (!ok) throw new BadRequestException(res.details?.resultDescription || "رفضت البوابة الاسترجاع");
      await this.audit(actorId, "PAYMENT_REFUND", tx, { amount, reason });
      await this.applyToOrder(tx.orderId);
    } catch (e) {
      if (!(e instanceof BadRequestException)) {
        await this.logFailure(tx.id, "REFUND", requestId, amount, actorId, e);
      }
      throw this.asHttp(e);
    }
  }

  private async cancelAtGateway(tx: PaymentTransaction, actorId: string | undefined, why: string) {
    if (!tx.paymentId) throw new BadRequestException("لا يوجد رقم عملية لدى البوابة");
    const requestId = this.qi.newRequestId();
    try {
      const res = await this.qi.cancel(tx.paymentId, requestId);
      const ok = res.canceled === true;
      await this.prisma.paymentOperation.create({
        data: {
          transactionId: tx.id,
          type: "CANCEL",
          requestId,
          amount: tx.amount,
          success: ok,
          message: why,
          actorId: actorId ?? null,
          data: res as unknown as Prisma.InputJsonValue,
        },
      });
      if (!ok) throw new BadRequestException("رفضت البوابة الإلغاء");
      await this.updateFromGateway(tx.id, res);
      await this.audit(actorId, "PAYMENT_CANCEL", tx, { why });
      await this.applyToOrder(tx.orderId);
    } catch (e) {
      if (!(e instanceof BadRequestException)) {
        await this.logFailure(tx.id, "CANCEL", requestId, tx.amount, actorId, e);
      }
      throw this.asHttp(e);
    }
  }

  /** مزامنة كل المحاولات غير النهائية للطلب. */
  private async syncOpen(orderId: string, source: "SYNC" | "WEBHOOK") {
    const open = await this.prisma.paymentTransaction.findMany({
      where: { orderId, status: "CREATED", canceled: false },
    });
    for (const tx of open) await this.sync(tx, source);
  }

  private async sync(tx: PaymentTransaction, source: "SYNC" | "WEBHOOK", extra?: object) {
    if (!tx.paymentId || !this.qi.isConfigured) return;
    try {
      const status = await this.qi.getStatus(tx.paymentId);
      const changed = status.status !== tx.status || (status.canceled ?? false) !== tx.canceled;
      await this.updateFromGateway(tx.id, status);
      if (changed || source === "WEBHOOK") {
        await this.prisma.paymentOperation.create({
          data: {
            transactionId: tx.id,
            type: source,
            success: true,
            message: `${tx.status} → ${status.status}${status.canceled ? " (canceled)" : ""}`,
            data: { ...(extra ?? {}), status: status.status, canceled: status.canceled ?? false },
          },
        });
      }
      await this.applyToOrder(tx.orderId);
    } catch (e) {
      this.log.warn(`Sync ${tx.paymentId} failed: ${(e as Error).message}`);
    }
  }

  private async updateFromGateway(txId: string, p: QiPayment) {
    const d = p.details ?? {};
    await this.prisma.paymentTransaction.update({
      where: { id: txId },
      data: {
        status: p.status ?? undefined,
        canceled: p.canceled ?? undefined,
        paymentType: p.paymentType ?? undefined,
        maskedPan: d.maskedPan ?? undefined,
        paymentSystem: d.paymentSystem ?? undefined,
        rrn: d.rrn ?? undefined,
        authId: d.authId ?? undefined,
        resultCode: d.resultCode ?? undefined,
        raw: p as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /** يشتق حالة دفع الطلب من محاولاته، ويبلّغ الزبونة عند تأكيد الدفع. */
  private async applyToOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== PaymentMethod.CARD) return;
    const txs = await this.prisma.paymentTransaction.findMany({ where: { orderId } });

    const paid = txs.filter((t) => t.status === "SUCCESS");
    let next: PaymentStatus = PaymentStatus.PENDING;
    if (paid.length) {
      const reversed = paid.every((t) => t.canceled || t.refundedAmount >= t.amount);
      next = reversed ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    } else if (txs.length && txs.every((t) => FINAL_FAILED.has(t.status) || t.canceled)) {
      next = PaymentStatus.FAILED;
    }
    if (next === order.paymentStatus) return;

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: next,
        // دفعة مؤكدة لطلب جديد = طلب مؤكد.
        ...(next === PaymentStatus.PAID && order.status === OrderStatus.PENDING
          ? { status: OrderStatus.CONFIRMED }
          : {}),
      },
    });

    // دفعة وصلت بعد إلغاء الطلب (مثلاً بعد انتهاء المهلة): تُعاد فوراً.
    if (next === PaymentStatus.PAID && order.status === OrderStatus.CANCELLED) {
      this.reverseForCancelledOrder(orderId).catch((e) =>
        this.log.error(`Late payment reverse failed for ${orderId}: ${e.message}`),
      );
      return;
    }

    // دُفع الطلب: المحاولات الأخرى المفتوحة عليه لم تعد لازمة — نلغيها لدى البوابة.
    if (next === PaymentStatus.PAID) {
      for (const t of txs) {
        if (t.status === "CREATED" && !t.canceled) {
          this.cancelAtGateway(t, undefined, "SUPERSEDED").catch(() => undefined);
        }
      }
    }

    if (next === PaymentStatus.PAID || next === PaymentStatus.REFUNDED) {
      const title = next === PaymentStatus.PAID ? "تم استلام دفعتك" : "تم استرجاع المبلغ";
      const body =
        next === PaymentStatus.PAID
          ? `دفعتك للطلب ${order.orderNumber} تمت بنجاح — شكراً لثقتك بديما الحياة`
          : `أُعيد مبلغ الطلب ${order.orderNumber} إلى بطاقتك`;
      await this.notifications
        .create({
          userId: order.userId,
          type: NotificationType.ORDER,
          title,
          body,
          data: { orderId: order.id },
        })
        .catch((e) => this.log.warn(`Payment notification failed: ${e.message}`));
    }
  }

  /** طلبات بطاقة لم تُدفع خلال المهلة: نتأكد من البوابة ثم نلغيها ونعيد المخزون. */
  private async expireUnpaidCardOrders() {
    if (!this.qi.isConfigured) return;
    await this.closeOrphanAttempts();
    const stale = await this.prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
        status: OrderStatus.PENDING,
        createdAt: { lt: new Date(Date.now() - UNPAID_CARD_ORDER_TTL_MS) },
      },
      select: { id: true, orderNumber: true },
      take: 50,
    });
    for (const o of stale) {
      await this.syncOpen(o.id, "SYNC");
      const fresh = await this.prisma.order.findUnique({ where: { id: o.id } });
      if (!fresh || fresh.paymentStatus === PaymentStatus.PAID) continue;
      const open = await this.prisma.paymentTransaction.findFirst({
        where: {
          orderId: o.id,
          status: "CREATED",
          canceled: false,
          createdAt: { gt: new Date(Date.now() - 20 * 60_000) },
        },
      });
      if (open) continue; // محاولة جارية الآن — ننتظر الجولة القادمة.
      this.log.log(`Cancelling unpaid card order ${o.orderNumber}`);
      await this.orders.cancel(o.id).catch((e) =>
        this.log.warn(`Cancel unpaid ${o.orderNumber} failed: ${e.message}`),
      );
    }
  }

  /** محاولات مفتوحة على طلبات دُفعت بمحاولة أخرى: نزامنها، ونلغي ما بقي مفتوحاً لدى البوابة. */
  private async closeOrphanAttempts() {
    const orphans = await this.prisma.paymentTransaction.findMany({
      where: {
        status: "CREATED",
        canceled: false,
        order: { paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] } },
      },
      take: 50,
    });
    for (const tx of orphans) {
      await this.sync(tx, "SYNC");
      const latest = await this.prisma.paymentTransaction.findUnique({ where: { id: tx.id } });
      if (latest && latest.status === "CREATED" && !latest.canceled) {
        await this.cancelAtGateway(latest, undefined, "SUPERSEDED").catch(() => undefined);
      }
    }
  }

  private async publicSummary(orderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true },
    });
    const last = await this.prisma.paymentTransaction.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      select: { status: true, canceled: true, maskedPan: true, paymentSystem: true },
    });
    return { ...order, lastAttempt: last };
  }

  private async ownedOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, phone: true, email: true } } },
    });
    if (!order || order.userId !== userId) throw new NotFoundException("Order not found");
    return order;
  }

  private async ensureOrder(orderId: string) {
    const exists = await this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!exists) throw new NotFoundException("Order not found");
  }

  private async paidTransaction(orderId: string) {
    await this.ensureOrder(orderId);
    await this.syncOpen(orderId, "SYNC");
    const tx = await this.prisma.paymentTransaction.findFirst({
      where: { orderId, status: "SUCCESS", canceled: false },
      orderBy: { createdAt: "desc" },
    });
    if (!tx || tx.refundedAmount >= tx.amount) {
      throw new BadRequestException("لا توجد دفعة إلكترونية قابلة للاسترجاع لهذا الطلب");
    }
    return tx;
  }

  private async logFailure(
    transactionId: string,
    type: string,
    requestId: string,
    amount: number,
    actorId: string | undefined,
    e: unknown,
  ) {
    await this.prisma.paymentOperation
      .create({
        data: {
          transactionId,
          type,
          requestId,
          amount,
          success: false,
          message: (e as Error).message?.slice(0, 500) ?? "error",
          actorId: actorId ?? null,
        },
      })
      .catch(() => undefined);
  }

  private async audit(actorId: string | undefined, action: string, tx: PaymentTransaction, meta: object) {
    if (!actorId) return;
    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          action,
          entity: "Order",
          entityId: tx.orderId,
          meta: { ...meta, paymentId: tx.paymentId } as Prisma.InputJsonValue,
        },
      })
      .catch(() => undefined);
  }

  private asHttp(e: unknown) {
    if (e instanceof QiGatewayError) {
      return new BadRequestException(`بوابة الدفع: ${e.message}`);
    }
    return e as Error;
  }
}

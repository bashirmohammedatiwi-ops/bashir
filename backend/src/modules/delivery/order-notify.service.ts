import { Injectable, Logger } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const money = (n: number) => `${n.toLocaleString("en-US")} د.ع`;

export type OrderNotice =
  | { kind: "PICKING" }
  | { kind: "ADJUSTED"; missing: string[]; extras: string[]; oldTotal: number; newTotal: number }
  | { kind: "REFUNDED"; amount: number }
  | { kind: "SHIPPED"; tracking: string; cod: number }
  | { kind: "OUT_FOR_DELIVERY"; driver?: string | null }
  | { kind: "DELIVERY_ISSUE"; note?: string | null }
  | { kind: "DELIVERED"; points?: number }
  | { kind: "RETURNED" }
  | { kind: "READY_FOR_PICKUP" };

/**
 * إشعارات العميل لكل مرحلة (في التطبيق + Push). تفشل بصمت: الإشعار لا يوقف تجهيز الطلب ولا شحنه.
 * النصوص تؤخذ من الإعدادات إن عُدّلت (orderNoticeTexts) وإلا الافتراضية هنا.
 */
@Injectable()
export class OrderNotifyService {
  private readonly logger = new Logger(OrderNotifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  text(orderNumber: string, n: OrderNotice): { title: string; body: string } {
    switch (n.kind) {
      case "PICKING":
        return { title: "طلبك قيد التجهيز", body: `بدأنا تجهيز طلبك ${orderNumber}` };
      case "ADJUSTED": {
        const parts: string[] = [];
        if (n.missing.length) parts.push(`عذراً، نفد من طلبك: ${n.missing.slice(0, 3).join("، ")}${n.missing.length > 3 ? "…" : ""}`);
        if (n.extras.length) parts.push(`أضفنا: ${n.extras.slice(0, 3).join("، ")}`);
        parts.push(`أصبح المبلغ ${money(n.newTotal)} بدل ${money(n.oldTotal)}`);
        return { title: "تعديل على طلبك", body: parts.join(". ") };
      }
      case "REFUNDED":
        return { title: "استرجاع مبلغ", body: `أعدنا ${money(n.amount)} إلى بطاقتك عن الأصناف الناقصة في الطلب ${orderNumber}` };
      case "SHIPPED":
        return {
          title: "تم شحن طلبك",
          body: `شُحن طلبك ${orderNumber} مع هاي إكسبريس — رقم التتبع ${n.tracking}${n.cod > 0 ? ` — المبلغ عند الاستلام ${money(n.cod)}` : ""}`,
        };
      case "OUT_FOR_DELIVERY":
        return {
          title: "طلبك مع المندوب",
          body: `طلبك ${orderNumber} مع المندوب${n.driver ? ` ${n.driver}` : ""} وفي الطريق إليكِ — يرجى إبقاء هاتفك متاحاً`,
        };
      case "DELIVERY_ISSUE":
        return {
          title: "لم نتمكن من التوصيل",
          body: `حاول المندوب توصيل طلبك ${orderNumber}${n.note ? ` (${n.note})` : ""} — تواصلي معنا لإعادة التوصيل`,
        };
      case "DELIVERED":
        return {
          title: "تم تسليم طلبك",
          body: `شكراً لثقتك بديما الحياة 💜${n.points ? ` أضفنا ${n.points} نقطة إلى رصيدك.` : ""} قيّمي منتجاتك من صفحة الطلب`,
        };
      case "RETURNED":
        return { title: "تعذّر تسليم طلبك", body: `تعذّر تسليم طلبك ${orderNumber} وأُلغي. أعدنا النقاط والكوبون إلى حسابك` };
      case "READY_FOR_PICKUP":
        return { title: "طلبك جاهز للاستلام", body: `طلبك ${orderNumber} جاهز للاستلام من المحل` };
    }
  }

  async send(orderId: string, notice: OrderNotice) {
    try {
      const o = await this.prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, orderNumber: true } });
      if (!o) return;
      const { title, body } = this.text(o.orderNumber, notice);
      await this.notifications.create({ userId: o.userId, type: NotificationType.ORDER, title, body, data: { orderId } });
      await this.prisma.orderEvent.create({
        data: { orderId, type: "CUSTOMER_NOTIFIED", actorType: "SYSTEM", data: { kind: notice.kind, title } },
      });
    } catch (e) {
      this.logger.warn(`order notice ${notice.kind} failed for ${orderId}: ${(e as Error).message}`);
    }
  }
}

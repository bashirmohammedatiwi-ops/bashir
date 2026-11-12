import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";

export type TimelineActorType = "STAFF" | "CASHIER" | "SYSTEM" | "COURIER" | "CUSTOMER";

export interface TimelineEntry {
  orderId: string;
  type: string;
  actorType: TimelineActorType;
  actorId?: string | null;
  actorName?: string | null;
  data?: Prisma.InputJsonValue;
}

type Tx = Prisma.TransactionClient | PrismaService;

/** ما يظهر في الخط الزمني بالعربي (يُترجم في التطبيقات أيضاً، وهذه الافتراضية). */
export const TIMELINE_LABEL_AR: Record<string, string> = {
  PICK_STARTED: "بدأ التجهيز",
  PICK_TAKEOVER: "نُقل التجهيز لموظف آخر",
  PICK_EXTRA_ADDED: "أُضيف صنف إضافي",
  PICK_LINE_EDITED: "عُدّل سطر يدوياً",
  PICK_FINISHED: "انتهى التجهيز",
  PICK_REOPENED: "أُعيد فتح التجهيز",
  STATUS_CHANGED: "تغيّرت الحالة",
  POS_EDIT: "عدّل كاشير الطلبات الطلب",
  INVOICED: "فُوتر في كاشير الطلبات",
  PICKUP_HANDED: "سُلّم للزبونة في المحل",
  POS_RETURN: "إيصال إرجاع في المحل",
  SHIPMENT_CREATED: "أُنشئت شحنة هاي إكسبريس",
  SHIPMENT_RETRYING: "إعادة محاولة إنشاء الشحنة",
  SHIPMENT_FAILED: "تعذر إنشاء الشحنة",
  SHIPMENT_RETRY: "أُعيدت محاولة الشحنة يدوياً",
  SHIPMENT_CANCELLED: "أُلغيت الشحنة",
  SHIPMENT_DECISION: "قرار على الشحنة",
  SHIPMENT_UPDATED: "عُدّل الطلب عند هاي إكسبريس",
  COURIER_OPTIONS: "عُدّلت خيارات التوصيل",
  SHIPMENT_UPDATE_FAILED: "تعذر تعديل الطلب عند هاي إكسبريس",
  COURIER_STATUS: "تحديث من شركة التوصيل",
  COURIER_STATUS_UNKNOWN: "حالة غير معروفة من شركة التوصيل",
  CUSTOMER_NOTIFIED: "أُبلغت الزبونة",
  REFUND_FAILED: "تعذر الاسترجاع بالبطاقة",
};

/**
 * الخط الزمني للطلب. الكتابة لا تُفشل العملية الأصلية خارج المعاملة،
 * وداخل المعاملة تُكتب معها فلا يُسجَّل ما لم يحدث.
 */
@Injectable()
export class OrderTimelineService {
  private readonly logger = new Logger(OrderTimelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: TimelineEntry, tx?: Tx) {
    const data = {
      orderId: entry.orderId,
      type: entry.type,
      actorType: entry.actorType,
      actorId: entry.actorId ?? null,
      actorName: entry.actorName ?? null,
      data: entry.data ?? Prisma.JsonNull,
    };
    if (tx) {
      await tx.orderEvent.create({ data });
      return;
    }
    await this.prisma.orderEvent.create({ data }).catch((e) => {
      this.logger.warn(`timeline write failed for ${entry.orderId}: ${(e as Error).message}`);
    });
  }

  /** الأحداث الجديدة + سجل تغيير الحالة القديم (AuditLog) في خط واحد مرتب. */
  async list(orderId: string) {
    const [events, audits] = await Promise.all([
      this.prisma.orderEvent.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } }),
      this.prisma.auditLog.findMany({
        where: { entity: "Order", entityId: orderId },
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);
    const rows = [
      ...events.map((e) => ({
        id: e.id,
        type: e.type,
        label: TIMELINE_LABEL_AR[e.type] ?? e.type,
        actorType: e.actorType,
        actorName: e.actorName,
        data: e.data,
        at: e.createdAt,
      })),
      ...audits.map((a) => {
        const meta = (a.meta ?? {}) as Record<string, unknown>;
        return {
          id: a.id,
          type: a.action === "ORDER_STATUS_UPDATE" ? "STATUS_CHANGED" : a.action,
          label: TIMELINE_LABEL_AR.STATUS_CHANGED,
          actorType: meta.by === "customer" ? "CUSTOMER" : a.actorId ? "STAFF" : "SYSTEM",
          actorName: a.actor?.name || a.actor?.email || null,
          data: meta as Prisma.JsonValue,
          at: a.createdAt,
        };
      }),
    ];
    return rows.sort((x, y) => x.at.getTime() - y.at.getTime());
  }
}

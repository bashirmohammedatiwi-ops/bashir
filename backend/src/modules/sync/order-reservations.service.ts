import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { applyReservations, reservationMap, ReservedRow } from "./order-reservations";

/**
 * بعد الفوترة ينزل مخزون الكاشير نفسه؛ نبقي الحجز هذه المدة حتى تصل رفعة المخزون التي تشمل الإيصال
 * (الرفعة كل ~30 ثانية). الأمان في اتجاه واحد: خلالها قد يظهر المخزون أقل بقليل، لا أكثر.
 */
const INVOICE_GRACE_MINUTES = 3;
/** طلب مفتوح أقدم من هذا لا يُحجز له (منسي في حالة قديمة). */
const MAX_AGE_DAYS = 30;

/**
 * حجز كميات طلبات التطبيق المفتوحة من مخزون الموقع عند كل رفعة من الكاشير —
 * حتى لا تُباع القطعة المحجوزة لطلب آخر قبل أن يُفوتر الطلب في كاشير الطلبات.
 * يعمل فقط عند تفعيل «orderStockReservation» في الإعدادات.
 */
@Injectable()
export class OrderReservationsService {
  private readonly logger = new Logger(OrderReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async enabled() {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    return s.orderStockReservation === true;
  }

  async reservedRows(): Promise<ReservedRow[]> {
    return this.prisma.$queryRaw<ReservedRow[]>`
      SELECT COALESCE(NULLIF(oi."barcode", ''), s."barcode", CASE WHEN oi."shadeId" IS NULL THEN p."barcode" END) AS barcode,
             SUM(oi."quantity")::int AS qty
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      JOIN "Product" p ON p.id = oi."productId"
      LEFT JOIN "ProductShade" s ON s.id = oi."shadeId"
      WHERE o."status"::text IN ('PENDING', 'CONFIRMED', 'PROCESSING')
        AND o."fulfillmentStage"::text NOT IN ('CANCELLED')
        AND (o."posInvoicedAt" IS NULL OR o."posInvoicedAt" > now() - make_interval(mins => ${INVOICE_GRACE_MINUTES}::int))
        AND o."createdAt" > now() - make_interval(days => ${MAX_AGE_DAYS}::int)
      GROUP BY 1`;
  }

  /** يطرح الحجز من أصناف رفعة الكاشير (للتطبيق على الكتالوج فقط؛ لقطة الكاشير تبقى كما أرسلها). */
  async apply<T extends { barcode: string; productNum?: string | null; stock: number }>(items: T[]): Promise<T[]> {
    try {
      if (!(await this.enabled())) return items;
      const map = reservationMap(await this.reservedRows());
      const { items: out, adjusted } = applyReservations(items, map);
      if (adjusted) this.logger.log(`POS sync: reserved stock applied to ${adjusted} item(s)`);
      return out;
    } catch (err) {
      // الحجز تحسين: فشله لا يوقف رفع الأسعار والمخزون.
      this.logger.warn(`Order reservations skipped: ${(err as Error).message}`);
      return items;
    }
  }
}

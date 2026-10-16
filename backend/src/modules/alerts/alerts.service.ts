import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { NotificationLinkType, NotificationType } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

export const ALERT_RESTOCK = "RESTOCK";
export const ALERT_PRICE_DROP = "PRICE_DROP";

const SWEEP_EVERY_MS = 10 * 60_000;
const BATCH = 400;
/** لا نزعج الزبونة: حد أقصى للتنبيهات في الجولة الواحدة لكل مستخدمة. */
const MAX_PER_USER_PER_SWEEP = 3;

/**
 * تنبيهات المنتجات للزبائن:
 * - «أعلميني عند التوفر»: اشتراك يدوي على منتج نافد، يُرسل مرة واحدة عند عودته ثم يُحذف.
 * - انخفاض السعر: تلقائي لكل منتج في المفضلة، يُقارن بالسعر المرجعي.
 * الفحص دوري (بدل ربطه بكل مسار يغيّر المخزون/السعر: نقطة البيع، لوحة التحكم، الاستيراد…).
 */
@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("ProductAlerts");
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    const run = () =>
      this.sweep().catch((e) => this.log.warn(`Alert sweep failed: ${(e as Error).message}`));
    setTimeout(run, 90_000).unref?.();
    this.timer = setInterval(run, SWEEP_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------------------------------------------------------------- الزبونة

  async mine(userId: string) {
    const rows = await this.prisma.productAlert.findMany({
      where: { userId, type: ALERT_RESTOCK },
      select: { productId: true },
    });
    return { restock: rows.map((r) => r.productId) };
  }

  async watchRestock(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    await this.prisma.productAlert.upsert({
      where: { userId_productId_type: { userId, productId, type: ALERT_RESTOCK } },
      create: { userId, productId, type: ALERT_RESTOCK },
      update: { notifiedAt: null },
    });
    return { watching: true };
  }

  async unwatchRestock(userId: string, productId: string) {
    await this.prisma.productAlert.deleteMany({ where: { userId, productId, type: ALERT_RESTOCK } });
    return { watching: false };
  }

  /** يُستدعى عند إضافة منتج للمفضلة: يبدأ مراقبة السعر من سعره الحالي. */
  async trackPrice(userId: string, productId: string, price: number) {
    await this.prisma.productAlert.upsert({
      where: { userId_productId_type: { userId, productId, type: ALERT_PRICE_DROP } },
      create: { userId, productId, type: ALERT_PRICE_DROP, basePrice: price },
      update: {},
    });
  }

  async untrackPrice(userId: string, productId: string) {
    await this.prisma.productAlert.deleteMany({ where: { userId, productId, type: ALERT_PRICE_DROP } });
  }

  // ---------------------------------------------------------------- الفحص الدوري

  async sweep() {
    if (this.running) return;
    this.running = true;
    try {
      await this.backfillWishlistPriceAlerts();
      const sentPerUser = new Map<string, number>();
      const restock = await this.sweepRestock(sentPerUser);
      const drops = await this.sweepPriceDrops(sentPerUser);
      if (restock || drops) this.log.log(`Sent ${restock} restock and ${drops} price-drop alerts`);
    } finally {
      this.running = false;
    }
  }

  /** عناصر مفضلة قديمة (قبل هذه الميزة) تبدأ مراقبتها بسعرها الحالي — بلا تنبيه. */
  private async backfillWishlistPriceAlerts() {
    const rows = await this.prisma.$queryRaw<{ userId: string; productId: string; price: number }[]>`
      SELECT w."userId", w."productId", p.price
      FROM "Wishlist" w
      JOIN "Product" p ON p.id = w."productId"
      LEFT JOIN "ProductAlert" a
        ON a."userId" = w."userId" AND a."productId" = w."productId" AND a.type = ${ALERT_PRICE_DROP}
      WHERE a.id IS NULL
      LIMIT ${BATCH}`;
    if (!rows.length) return;
    await this.prisma.productAlert.createMany({
      data: rows.map((r) => ({
        userId: r.userId,
        productId: r.productId,
        type: ALERT_PRICE_DROP,
        basePrice: Number(r.price),
      })),
      skipDuplicates: true,
    });
  }

  private async sweepRestock(sentPerUser: Map<string, number>) {
    const due = await this.prisma.productAlert.findMany({
      where: { type: ALERT_RESTOCK, product: { stock: { gt: 0 }, isActive: true } },
      include: { product: { select: { id: true, name: true, nameAr: true } } },
      take: BATCH,
    });
    let sent = 0;
    for (const a of due) {
      if (!this.allow(sentPerUser, a.userId)) continue;
      const name = a.product.nameAr || a.product.name;
      await this.notify(a.userId, a.productId, {
        title: "عاد متوفراً من جديد",
        body: `${name} — الذي طلبتِ التنبيه عنه متوفر الآن. اطلبيه قبل أن ينفد.`,
      });
      // تنبيه لمرة واحدة: يُحذف بعد الإرسال.
      await this.prisma.productAlert.delete({ where: { id: a.id } }).catch(() => undefined);
      sent++;
    }
    return sent;
  }

  private async sweepPriceDrops(sentPerUser: Map<string, number>) {
    let sent = 0;
    // ارتفع السعر منذ آخر مرجع: نرفع المرجع بصمت كي يُقاس الانخفاض القادم من السعر الحالي.
    await this.prisma.$executeRaw`
      UPDATE "ProductAlert" a SET "basePrice" = p.price
      FROM "Product" p
      WHERE a."productId" = p.id AND a.type = ${ALERT_PRICE_DROP}
        AND (a."basePrice" IS NULL OR p.price > a."basePrice")`;

    const drops = await this.prisma.$queryRaw<
      { id: string; userId: string; productId: string; basePrice: number; price: number; name: string; nameAr: string | null }[]
    >`
      SELECT a.id, a."userId", a."productId", a."basePrice", p.price, p.name, p."nameAr"
      FROM "ProductAlert" a
      JOIN "Product" p ON p.id = a."productId"
      WHERE a.type = ${ALERT_PRICE_DROP} AND p."isActive" = true AND p.stock > 0
        AND a."basePrice" IS NOT NULL AND p.price < a."basePrice"
      LIMIT ${BATCH}`;

    for (const d of drops) {
      const base = Number(d.basePrice);
      const price = Number(d.price);
      // تجاهل التذبذب البسيط (أقل من 3%) حتى لا يكون التنبيه مزعجاً.
      if (base <= 0 || (base - price) / base < 0.03) continue;
      if (!this.allow(sentPerUser, d.userId)) continue;
      const pct = Math.round(((base - price) / base) * 100);
      await this.notify(d.userId, d.productId, {
        title: "انخفض سعر منتج في مفضلتك",
        body: `${d.nameAr || d.name} صار بـ ${fmt(price)} د.ع بدل ${fmt(base)} (خصم ${pct}%)`,
      });
      await this.prisma.productAlert.update({
        where: { id: d.id },
        data: { basePrice: price, notifiedAt: new Date() },
      });
      sent++;
    }
    return sent;
  }

  private allow(sentPerUser: Map<string, number>, userId: string) {
    const n = sentPerUser.get(userId) ?? 0;
    if (n >= MAX_PER_USER_PER_SWEEP) return false;
    sentPerUser.set(userId, n + 1);
    return true;
  }

  private notify(userId: string, productId: string, msg: { title: string; body: string }) {
    return this.notifications
      .create({
        userId,
        type: NotificationType.REMINDER,
        title: msg.title,
        body: msg.body,
        linkType: NotificationLinkType.PRODUCT,
        linkId: productId,
        data: { productId },
        sendPush: true,
      })
      .catch((e) => this.log.warn(`Alert push failed: ${(e as Error).message}`));
  }
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

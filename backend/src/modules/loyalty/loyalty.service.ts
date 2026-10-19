import { Injectable } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { LOYALTY_BONUS_TITLE, LOYALTY_EARN_TITLE, LOYALTY_REDEEM_TITLE, loyaltyRules } from "./loyalty.rules";

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async summary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });
    const points = user?.loyaltyPoints ?? 0;
    const history = await this.prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const r = loyaltyRules((await this.settings.getAll()) as Record<string, unknown>);
    return {
      points,
      /** الحقلان القديمان للإصدارات السابقة من التطبيق. */
      redeemBlockSize: r.redeemStep,
      redeemBlockValue: Math.floor(r.redeemStep * r.pointValue),
      pointValue: r.pointValue,
      earnPercent: r.earnPercent,
      redeemStep: r.redeemStep,
      firstOrderBonus: r.firstOrderBonus,
      history: history.map((h) => ({
        id: h.id,
        title: h.title,
        points: h.points,
        date: h.createdAt,
        isEarned: h.isEarned,
      })),
    };
  }

  async addPoints(userId: string, points: number, title: string, orderId?: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { increment: points } },
      }),
      this.prisma.loyaltyHistory.create({
        data: { userId, title, points, isEarned: true, orderId },
      }),
    ]);
  }

  async deductPoints(userId: string, points: number, title: string, orderId?: string) {
    if (points <= 0) return 0;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const available = user?.loyaltyPoints ?? 0;
    const deducted = Math.min(points, Math.max(0, available));
    if (deducted <= 0) return 0;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: deducted } },
      }),
      this.prisma.loyaltyHistory.create({
        data: { userId, title, points: -deducted, isEarned: false, orderId },
      }),
    ]);
    return deducted;
  }

  /**
   * نقاط طلب سُلّم: المكتسبة منه، ومكافأة أول طلب إن لم تنلها الزبونة على طلب آخر قائم.
   * تُستدعى داخل معاملة تغيير الحالة إلى «سُلّم» — ولا تتكرر للطلب نفسه
   * (الطلبات الأقدم أُضيفت نقاطها عند إنشائها فلها سجل مسبق).
   */
  async creditDeliveredOrder(
    tx: Prisma.TransactionClient,
    order: { id: string; userId: string; loyaltyEarned: number },
  ) {
    const credit = async (points: number, title: string) => {
      await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: points } } });
      await tx.loyaltyHistory.create({
        data: { userId: order.userId, title, points, isEarned: true, orderId: order.id },
      });
    };

    if (order.loyaltyEarned > 0) {
      const earned = await tx.loyaltyHistory.findFirst({
        where: { orderId: order.id, title: LOYALTY_EARN_TITLE, isEarned: true },
        select: { id: true },
      });
      if (!earned) await credit(order.loyaltyEarned, LOYALTY_EARN_TITLE);
    }

    const bonus = loyaltyRules((await this.settings.getAll()) as Record<string, unknown>).firstOrderBonus;
    if (bonus <= 0) return;
    // مكافأة سابقة تبقى لها ما دام طلبها غير ملغى (إلغاؤه يخصمها فتعود مستحقة على طلب لاحق).
    const prior = await tx.loyaltyHistory.findMany({
      where: { userId: order.userId, title: LOYALTY_BONUS_TITLE, isEarned: true },
      select: { orderId: true },
    });
    if (prior.some((b) => b.orderId === order.id)) return;
    const priorOrderIds = prior.map((b) => b.orderId).filter((id): id is string => !!id);
    const kept = priorOrderIds.length
      ? await tx.order.count({ where: { id: { in: priorOrderIds }, status: { not: OrderStatus.CANCELLED } } })
      : 0;
    if (kept === 0 && prior.every((b) => b.orderId)) await credit(bonus, LOYALTY_BONUS_TITLE);
  }

  /**
   * عكس نقاط الطلب عند الإلغاء — مرة واحدة فقط لكل طلب، وبما سُجّل فعلاً لا بما حُفظ على الطلب:
   * تُعاد النقاط المخصومة فعلاً، وتُخصم المكتسبة والمكافأة فقط إن أضيفتا (تُضافان عند التسليم).
   */
  async reverseForCancelledOrder(userId: string, orderId: string) {
    const already = await this.prisma.loyaltyHistory.findFirst({
      where: { orderId, title: { contains: "إلغاء الطلب" } },
    });
    if (already) return;

    const rows = await this.prisma.loyaltyHistory.findMany({
      where: { orderId, title: { in: [LOYALTY_REDEEM_TITLE, LOYALTY_EARN_TITLE, LOYALTY_BONUS_TITLE] } },
      select: { title: true, points: true },
    });
    const sum = (title: string) =>
      rows.filter((r) => r.title === title).reduce((s, r) => s + Math.abs(r.points), 0);

    const spent = sum(LOYALTY_REDEEM_TITLE);
    if (spent > 0) {
      await this.addPoints(userId, spent, "استرجاع نقاط - إلغاء الطلب", orderId);
    }
    const earned = sum(LOYALTY_EARN_TITLE);
    if (earned > 0) {
      await this.deductPoints(userId, earned, "خصم نقاط مكتسبة - إلغاء الطلب", orderId);
    }
    const bonus = sum(LOYALTY_BONUS_TITLE);
    if (bonus > 0) {
      await this.deductPoints(userId, bonus, "خصم مكافأة أول طلب - إلغاء الطلب", orderId);
    }
  }

  adminHistory(userId: string) {
    return this.prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

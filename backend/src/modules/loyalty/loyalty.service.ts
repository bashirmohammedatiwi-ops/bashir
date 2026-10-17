import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { loyaltyRules } from "./loyalty.rules";

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

  async redeemPoints(userId: string, points: number, title: string, orderId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const available = user?.loyaltyPoints ?? 0;
    const spent = Math.min(points, available);
    if (spent <= 0) return 0;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: spent } },
      }),
      this.prisma.loyaltyHistory.create({
        data: { userId, title, points: -spent, isEarned: false, orderId },
      }),
    ]);
    return spent;
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

  /** عكس نقاط الطلب عند الإلغاء — مرة واحدة فقط لكل طلب. */
  async reverseForCancelledOrder(
    userId: string,
    orderId: string,
    loyaltySpent: number,
    loyaltyEarned: number,
  ) {
    const already = await this.prisma.loyaltyHistory.findFirst({
      where: { orderId, title: { contains: "إلغاء الطلب" } },
    });
    if (already) return;

    if (loyaltySpent > 0) {
      await this.addPoints(userId, loyaltySpent, "استرجاع نقاط - إلغاء الطلب", orderId);
    }
    if (loyaltyEarned > 0) {
      await this.deductPoints(userId, loyaltyEarned, "خصم نقاط مكتسبة - إلغاء الطلب", orderId);
    }

    const bonus = await this.prisma.loyaltyHistory.findFirst({
      where: { userId, orderId, title: "مكافأة أول طلب", isEarned: true },
    });
    if (bonus && bonus.points > 0) {
      await this.deductPoints(userId, bonus.points, "خصم مكافأة أول طلب - إلغاء الطلب", orderId);
    }
  }

  adminHistory(userId: string) {
    return this.prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

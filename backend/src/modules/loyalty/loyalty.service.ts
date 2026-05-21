import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

export type LoyaltyTier = "normal" | "silver" | "gold" | "platinum";

function tierFromPoints(points: number): LoyaltyTier {
  if (points >= 3000) return "platinum";
  if (points >= 1500) return "gold";
  if (points >= 500) return "silver";
  return "normal";
}

const TIER_LABELS: Record<LoyaltyTier, string> = {
  normal: "عادي",
  silver: "فضي",
  gold: "ذهبي",
  platinum: "بلاتيني",
};

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });
    const points = user?.loyaltyPoints ?? 0;
    const tier = tierFromPoints(points);
    const history = await this.prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const nextTier = tier === "platinum" ? null : tier === "gold" ? "platinum" : tier === "silver" ? "gold" : "silver";
    const nextThreshold = nextTier === "platinum" ? 3000 : nextTier === "gold" ? 1500 : 500;
    return {
      points,
      tier,
      tierLabel: TIER_LABELS[tier],
      nextTier,
      nextThreshold,
      pointsToNext: nextTier ? Math.max(0, nextThreshold - points) : 0,
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

  adminHistory(userId: string) {
    return this.prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

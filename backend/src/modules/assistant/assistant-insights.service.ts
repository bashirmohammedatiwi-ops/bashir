import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

export type TurnOutcome = "products" | "clarify" | "empty" | "reply";

export type TurnRecord = {
  userId: string;
  message: string;
  reply: string;
  outcome: TurnOutcome;
  kind?: string;
  concern?: string;
  productIds: string[];
  latencyMs: number;
};

/** مستخدمو التقييم الآلي ما ينحسبون بأرقام المتجر. */
export const EVAL_USER_PREFIX = "eval:";

@Injectable()
export class AssistantInsightsService {
  private readonly logger = new Logger(AssistantInsightsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(turn: TurnRecord): Promise<string | undefined> {
    if (turn.userId.startsWith(EVAL_USER_PREFIX)) return undefined;
    try {
      const row = await this.prisma.assistantTurn.create({
        data: {
          userId: turn.userId,
          message: turn.message.slice(0, 400),
          reply: turn.reply.slice(0, 2000),
          outcome: turn.outcome,
          kind: turn.kind && turn.kind !== "other" ? turn.kind : null,
          concern: turn.concern ?? null,
          productIds: turn.productIds.slice(0, 6),
          latencyMs: Math.max(0, Math.round(turn.latencyMs)),
        },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      this.logger.warn(`turn log skipped: ${error instanceof Error ? error.message : error}`);
      return undefined;
    }
  }

  async feedback(userId: string, turnId: string, rating: number, note?: string) {
    const turn = await this.prisma.assistantTurn.findFirst({ where: { id: turnId, userId }, select: { id: true } });
    if (!turn) throw new NotFoundException();
    await this.prisma.assistantTurn.update({
      where: { id: turnId },
      data: { rating: rating > 0 ? 1 : -1, feedbackNote: note?.trim().slice(0, 300) || null },
    });
    return { ok: true };
  }

  async tap(userId: string, turnId: string, productId: string) {
    const turn = await this.prisma.assistantTurn.findFirst({
      where: { id: turnId, userId },
      select: { productIds: true, tappedIds: true },
    });
    if (!turn || !turn.productIds.includes(productId) || turn.tappedIds.includes(productId)) return { ok: true };
    await this.prisma.assistantTurn.update({ where: { id: turnId }, data: { tappedIds: { push: productId } } });
    return { ok: true };
  }

  async cart(userId: string, turnId: string, productId: string) {
    const turn = await this.prisma.assistantTurn.findFirst({
      where: { id: turnId, userId },
      select: { productIds: true, cartIds: true },
    });
    if (!turn || !turn.productIds.includes(productId) || turn.cartIds.includes(productId)) return { ok: true };
    await this.prisma.assistantTurn.update({ where: { id: turnId }, data: { cartIds: { push: productId } } });
    return { ok: true };
  }

  async overview(days: number) {
    const since = new Date(Date.now() - Math.min(Math.max(days, 1), 180) * 86_400_000);
    const where = { createdAt: { gte: since } };
    const [carted, tagged, activeProducts] = await Promise.all([
      this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(*)::bigint AS n FROM "AssistantTurn"
        WHERE "createdAt" >= ${since} AND cardinality("cartIds") > 0`,
      this.prisma.assistantProductTag.count(),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);
    const [total, byOutcome, liked, disliked, withProducts, tapped, users, latency] = await Promise.all([
      this.prisma.assistantTurn.count({ where }),
      this.prisma.assistantTurn.groupBy({ by: ["outcome"], where, _count: { _all: true } }),
      this.prisma.assistantTurn.count({ where: { ...where, rating: 1 } }),
      this.prisma.assistantTurn.count({ where: { ...where, rating: -1 } }),
      this.prisma.assistantTurn.count({ where: { ...where, outcome: "products" } }),
      this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(*)::bigint AS n FROM "AssistantTurn"
        WHERE "createdAt" >= ${since} AND cardinality("tappedIds") > 0`,
      this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(DISTINCT "userId")::bigint AS n FROM "AssistantTurn" WHERE "createdAt" >= ${since}`,
      this.prisma.assistantTurn.aggregate({ where, _avg: { latencyMs: true } }),
    ]);

    const sold = await this.prisma.$queryRaw<Array<{ itemId: string; turnId: string; total: number }>>`
      SELECT DISTINCT ON (i.id) i.id AS "itemId", t.id AS "turnId", i."totalPrice" AS total
      FROM "AssistantTurn" t
      JOIN "Order" o ON o."userId" = t."userId"
        AND o."createdAt" >= t."createdAt"
        AND o."createdAt" <= t."createdAt" + interval '7 days'
        AND o.status NOT IN ('CANCELLED', 'REFUNDED')
      JOIN "OrderItem" i ON i."orderId" = o.id AND i."productId" = ANY(t."productIds")
      WHERE t."createdAt" >= ${since}
      ORDER BY i.id, t."createdAt" DESC`;

    const [disappointing, emptyAsks, topAsks, topConcerns] = await Promise.all([
      this.prisma.assistantTurn.findMany({
        where: { ...where, rating: -1 },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, message: true, reply: true, feedbackNote: true, createdAt: true },
      }),
      this.prisma.$queryRaw<Array<{ message: string; n: bigint }>>`
        SELECT lower(trim(message)) AS message, count(*)::bigint AS n FROM "AssistantTurn"
        WHERE "createdAt" >= ${since} AND outcome = 'empty'
        GROUP BY 1 ORDER BY n DESC LIMIT 20`,
      this.prisma.$queryRaw<Array<{ message: string; n: bigint }>>`
        SELECT lower(trim(message)) AS message, count(*)::bigint AS n FROM "AssistantTurn"
        WHERE "createdAt" >= ${since}
        GROUP BY 1 ORDER BY n DESC LIMIT 20`,
      this.prisma.assistantTurn.groupBy({
        by: ["concern"],
        where: { ...where, concern: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { concern: "desc" } },
        take: 10,
      }),
    ]);

    const outcomes = Object.fromEntries(byOutcome.map((row) => [row.outcome, row._count._all]));
    const rated = liked + disliked;
    return {
      days,
      turns: total,
      customers: Number(users[0]?.n ?? 0),
      outcomes,
      avgLatencyMs: Math.round(latency._avg.latencyMs ?? 0),
      likeRate: rated ? liked / rated : null,
      liked,
      disliked,
      tapRate: withProducts ? Number(tapped[0]?.n ?? 0) / withProducts : null,
      cartRate: withProducts ? Number(carted[0]?.n ?? 0) / withProducts : null,
      catalogTagged: tagged,
      catalogTotal: activeProducts,
      emptyRate: total ? (outcomes.empty ?? 0) / total : null,
      purchaseTurns: new Set(sold.map((row) => row.turnId)).size,
      purchaseRate: withProducts ? new Set(sold.map((row) => row.turnId)).size / withProducts : null,
      attributedRevenue: sold.reduce((sum, row) => sum + Number(row.total ?? 0), 0),
      disappointing,
      emptyAsks: emptyAsks.map((row) => ({ message: row.message, count: Number(row.n) })),
      topAsks: topAsks.map((row) => ({ message: row.message, count: Number(row.n) })),
      topConcerns: topConcerns.map((row) => ({ concern: row.concern, count: row._count._all })),
    };
  }
}

/**
 * AI observability (task rules #57, #58, #72, #75): one row per assistant
 * turn in AiUsageLog + admin aggregate queries (foundation for a future
 * analytics page — no UI built here).
 */

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import { estimateCostUsd } from "../ai/ai.config";

export interface AiUsageEntry {
  requestId: string;
  conversationId?: string;
  userId?: string | null;
  model?: string;
  promptVersion?: string;
  intent?: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  toolCalls?: Array<{ name: string; ms: number; ok: boolean }>;
  retrievalMs?: number;
  candidateCount?: number;
  selectedProductIds?: string[];
  fallbackUsed?: boolean;
  errorCode?: string;
  status?: "ok" | "error";
  estCostUsd?: number;
}

/** Rough $/1M-token estimate lives in ai.config.estimateCostUsd (per model class). */

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AiUsageEntry): Promise<void> {
    try {
      const tokensIn = entry.tokensIn ?? 0;
      const tokensOut = entry.tokensOut ?? 0;
      await this.prisma.aiUsageLog.create({
        data: {
          requestId: entry.requestId,
          conversationId: entry.conversationId,
          userId: entry.userId ?? null,
          model: entry.model,
          promptVersion: entry.promptVersion,
          intent: entry.intent,
          latencyMs: entry.latencyMs,
          tokensIn,
          tokensOut,
          toolCalls: entry.toolCalls as unknown as import("@prisma/client").Prisma.InputJsonValue,
          retrievalMs: entry.retrievalMs,
          candidateCount: entry.candidateCount,
          selectedProductIds: entry.selectedProductIds as unknown as import("@prisma/client").Prisma.InputJsonValue,
          fallbackUsed: entry.fallbackUsed ?? false,
          errorCode: entry.errorCode,
          status: entry.status ?? "ok",
          estCostUsd: estimateCostUsd(entry.model, tokensIn, tokensOut),
        },
      });
    } catch (err) {
      this.logger.warn(`usage log failed: ${(err as Error).message}`);
    }
  }

  /** Admin analytics aggregates — JSON foundation for the future page. */
  async overview(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [messages, conversations, tokens, byIntent, feedback, noResult, errors] = await Promise.all([
      this.prisma.aiMessage.count({ where: { createdAt: { gte: since }, role: "USER" } }),
      this.prisma.aiConversation.count({ where: { lastMessageAt: { gte: since } } }),
      this.prisma.aiUsageLog.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { tokensIn: true, tokensOut: true, estCostUsd: true },
        _avg: { latencyMs: true },
      }),
      this.prisma.aiUsageLog.groupBy({
        by: ["intent"],
        where: { createdAt: { gte: since } },
        _count: { intent: true },
        orderBy: { _count: { intent: "desc" } },
        take: 10,
      }),
      this.prisma.aiMessage.groupBy({
        by: ["feedback"],
        where: { createdAt: { gte: since }, feedback: { not: null } },
        _count: { feedback: true },
      }),
      this.prisma.aiUsageLog.count({ where: { createdAt: { gte: since }, candidateCount: 0, status: "ok" } }),
      this.prisma.aiUsageLog.count({ where: { createdAt: { gte: since }, status: "error" } }),
    ]);

    return {
      windowDays: days,
      userMessages: messages,
      activeConversations: conversations,
      tokens: {
        in: tokens._sum.tokensIn ?? 0,
        out: tokens._sum.tokensOut ?? 0,
      },
      estCostUsd: tokens._sum.estCostUsd ?? 0,
      avgLatencyMs: Math.round(tokens._avg.latencyMs ?? 0),
      byIntent: byIntent.map((row) => ({ intent: row.intent, count: row._count.intent })),
      feedback: feedback.map((row) => ({ value: row.feedback, count: row._count.feedback })),
      noResultSearches: noResult,
      errors,
    };
  }
}

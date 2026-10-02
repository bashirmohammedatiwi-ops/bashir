/**
 * Continuous improvement (assistant self-evolution): mines concise
 * behavioral lessons from 👎 feedback and keeps them injected into the
 * composer prompt. Lessons are short, factual, and Arabic — each one
 * changes ONE behavior. Admins can deactivate or add lessons manually.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import { AI_PROVIDER, ASSISTANT_AI_CONFIG, type AIProvider } from "../ai/ai-provider.interface";

const MAX_ACTIVE_LESSONS = 8;
const MAX_LESSONS_PER_MINE = 5;

interface AiConfigLike {
  fastModel: string;
}

@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    @Inject(ASSISTANT_AI_CONFIG) private readonly config: AiConfigLike,
  ) {}

  /** Active lessons, strongest first — injected into the composer prompt. */
  async activeLessons(limit = MAX_ACTIVE_LESSONS): Promise<string[]> {
    try {
      const rows = await this.prisma.aiLesson.findMany({
        where: { isActive: true },
        orderBy: [{ evidence: "desc" }, { updatedAt: "desc" }],
        take: limit,
        select: { content: true },
      });
      return rows.map((r) => r.content).filter((c) => c.trim().length > 0);
    } catch (err) {
      this.logger.warn(`lessons load failed: ${(err as Error).message}`);
      return [];
    }
  }

  /** Rendered block for prompt injection (empty string when nothing learned). */
  async lessonsBlock(): Promise<string> {
    const lessons = await this.activeLessons();
    if (!lessons.length) return "";
    return lessons.map((l, i) => `${i + 1}. ${l}`).join("\n");
  }

  /**
   * Mine lessons from recent 👎 feedback: pulls the rated message plus its
   * conversation window, asks the light model for ≤5 one-line behavioral
   * corrections, upserts them (recurring lessons gain evidence).
   */
  async mineFromFeedback(days = 30): Promise<{ scanned: number; learned: number }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const negatives = await this.prisma.aiMessage.findMany({
      where: { feedback: -1, createdAt: { gte: since }, role: "ASSISTANT" },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, content: true, conversationId: true, feedbackNote: true },
    });
    if (!negatives.length) return { scanned: 0, learned: 0 };

    const excerpts: string[] = [];
    for (const [i, msg] of negatives.entries()) {
      const turn = await this.prisma.aiMessage.findFirst({
        where: { conversationId: msg.conversationId, createdAt: { lt: new Date() }, role: "USER" },
        orderBy: { createdAt: "desc" },
        select: { content: true },
      }).catch(() => null);
      excerpts.push(
        `#${i + 1}\nUSER: ${(turn?.content ?? "").slice(0, 220)}\nASSISTANT (rated 👎${msg.feedbackNote ? `, note: ${msg.feedbackNote.slice(0, 140)}` : ""}): ${msg.content.slice(0, 320)}`,
      );
    }

    let learned = 0;
    try {
      const result = await this.provider.chat({
        model: this.config.fastModel,
        temperature: 0,
        maxOutputTokens: 500,
        messages: [
          {
            role: "system",
            content:
              "أنت محلل جودة لمساعد تسوق. من ردود قيّمها المستخدمون بسلبية (👎)، استخرج حتى " +
              `${MAX_LESSONS_PER_MINE} دروساً سلوكية قصيرة بالعربية، كل درس سطر واحد يبدأ بفعل الأمر ` +
              "يصحح سلوكاً واحداً محدداً (مثال: «اذكر العملة د.ع مع كل سعر»، «لا تقترح أكثر من 5 منتجات»). " +
              "تجنّب الدروس العامة أو التكرارية. أخرج كل درس في سطر منفصل بلا ترقيم.",
          },
          { role: "user", content: `DATA_START\n${excerpts.join("\n\n")}\nDATA_END` },
        ],
      });
      const lines = result.text
        .split("\n")
        .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
        .filter((l) => l.length >= 8 && l.length <= 160)
        .slice(0, MAX_LESSONS_PER_MINE);
      for (const line of lines) {
        await this.upsertLesson(line, "feedback");
        learned += 1;
      }
    } catch (err) {
      this.logger.warn(`lessons mining failed: ${(err as Error).message}`);
    }
    return { scanned: negatives.length, learned };
  }

  /** Add a manual lesson (admin-authored). */
  async addManualLesson(content: string): Promise<void> {
    await this.upsertLesson(content.trim().slice(0, 200), "manual");
  }

  async setActive(id: string, isActive: boolean): Promise<boolean> {
    const row = await this.prisma.aiLesson.update({
      where: { id },
      data: { isActive },
    }).catch(() => null);
    return Boolean(row);
  }

  async list(includeInactive = true) {
    return this.prisma.aiLesson.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isActive: "desc" }, { evidence: "desc" }, { updatedAt: "desc" }],
      take: 60,
    });
  }

  private async upsertLesson(content: string, source: string): Promise<void> {
    const key = normalizeLessonKey(content);
    const existing = await this.prisma.aiLesson.findMany({
      where: { isActive: true },
      select: { id: true, content: true },
    });
    const match = existing.find((row) => normalizeLessonKey(row.content) === key);
    if (match) {
      await this.prisma.aiLesson.update({
        where: { id: match.id },
        data: { evidence: { increment: 1 }, updatedAt: new Date() },
      });
      return;
    }
    // Keep the active set small — retire the weakest when full.
    const activeCount = existing.length;
    if (activeCount >= MAX_ACTIVE_LESSONS * 2) {
      const weakest = await this.prisma.aiLesson.findFirst({
        where: { isActive: true, source: "feedback" },
        orderBy: [{ evidence: "asc" }, { updatedAt: "asc" }],
      });
      if (weakest) {
        await this.prisma.aiLesson.update({ where: { id: weakest.id }, data: { isActive: false } }).catch(() => undefined);
      }
    }
    await this.prisma.aiLesson.create({ data: { content, source } });
  }
}

/** Loose similarity key: words sorted, so paraphrases collide. */
function normalizeLessonKey(content: string): string {
  return content
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .sort()
    .join(" ")
    .toLowerCase()
    .slice(0, 160);
}

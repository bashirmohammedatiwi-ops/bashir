import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AssistantGuideRule } from "./intelligence/guides";

@Injectable()
export class AssistantGuidesService {
  private readonly logger = new Logger(AssistantGuidesService.name);
  private cache: { at: number; rows: AssistantGuideRule[] } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async active(): Promise<AssistantGuideRule[]> {
    if (this.cache && Date.now() - this.cache.at < 30_000) return this.cache.rows;
    try {
      const rows = await this.prisma.assistantGuide.findMany({
        where: { isActive: true },
        orderBy: { priority: "desc" },
      });
      const mapped = rows.map((row) => ({
        type: row.type as AssistantGuideRule["type"],
        concern: row.concern,
        productId: row.productId,
        note: row.note,
        priority: row.priority,
      }));
      this.cache = { at: Date.now(), rows: mapped };
      return mapped;
    } catch (error) {
      this.logger.warn(`assistant guides skipped: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  invalidate() {
    this.cache = null;
  }

  list() {
    return this.prisma.assistantGuide.findMany({ orderBy: { updatedAt: "desc" } });
  }

  create(data: { type: string; concern?: string; productId?: string; note?: string; priority?: number; isActive?: boolean }) {
    this.invalidate();
    return this.prisma.assistantGuide.create({
      data: {
        type: data.type,
        concern: data.concern || null,
        productId: data.productId || null,
        note: data.note?.trim() ?? "",
        priority: data.priority ?? 5,
        isActive: data.isActive !== false,
      },
    });
  }

  update(id: string, data: { type?: string; concern?: string | null; productId?: string | null; note?: string; priority?: number; isActive?: boolean }) {
    this.invalidate();
    return this.prisma.assistantGuide.update({
      where: { id },
      data: {
        type: data.type,
        concern: data.concern,
        productId: data.productId,
        note: data.note?.trim(),
        priority: data.priority,
        isActive: data.isActive,
      },
    });
  }

  remove(id: string) {
    this.invalidate();
    return this.prisma.assistantGuide.delete({ where: { id } });
  }
}

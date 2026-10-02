/**
 * Long-term user memory (task rule #20 continuation): mines durable
 * preferences from conversation state into AiUserMemory rows and loads
 * them back as background personalization context. Memory is permissive
 * background info — never a hard constraint — and always user-clearable.
 */

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import type { MemoryFact } from "../assistant.types";
import type { ConversationOwner } from "../conversation/conversation.service";

const MAX_LOADED_FACTS = 12;
const MAX_AGE_DAYS = 180;
/** A preference must be seen in at least this many conversations/turns before it sticks. */
const MIN_EVIDENCE_TO_LOAD = 2;

const KIND_LABELS: Record<MemoryFact["kind"], string> = {
  brand_like: "براندات يفضلها",
  brand_dislike: "براندات يتجنبها",
  preference: "تفضيلات",
  budget: "ميزانية معتادة",
  note: "ملاحظات",
};

@Injectable()
export class AssistantMemoryService {
  private readonly logger = new Logger(AssistantMemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  private ownerKey(owner: ConversationOwner): string | null {
    if (owner.userId) return owner.userId;
    if (owner.guestKey) return `guest:${owner.guestKey}`;
    return null;
  }

  /** Top durable facts for the owner, freshest and strongest first. */
  async load(owner: ConversationOwner): Promise<MemoryFact[]> {
    const ownerKey = this.ownerKey(owner);
    if (!ownerKey) return [];
    try {
      const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
      const rows = await this.prisma.aiUserMemory.findMany({
        where: { ownerKey, updatedAt: { gte: since }, evidence: { gte: MIN_EVIDENCE_TO_LOAD } },
        orderBy: [{ evidence: "desc" }, { updatedAt: "desc" }],
        take: MAX_LOADED_FACTS,
      });
      return rows.map((row) => ({
        kind: row.kind as MemoryFact["kind"],
        key: row.key,
        value: row.value,
        evidence: row.evidence,
      }));
    } catch (err) {
      this.logger.warn(`memory load failed: ${(err as Error).message}`);
      return [];
    }
  }

  /** Upsert facts, incrementing evidence when the same key/value recurs. */
  async remember(owner: ConversationOwner, facts: MemoryFact[], source = "conversation"): Promise<void> {
    const ownerKey = this.ownerKey(owner);
    if (!ownerKey || !facts.length) return;
    try {
      for (const fact of facts.slice(0, 20)) {
        const existing = await this.prisma.aiUserMemory.findUnique({
          where: { ownerKey_kind_key: { ownerKey, kind: fact.kind, key: fact.key } },
        });
        if (existing && existing.value === fact.value) {
          await this.prisma.aiUserMemory.update({
            where: { id: existing.id },
            data: { evidence: { increment: 1 }, updatedAt: new Date() },
          });
        } else if (existing) {
          // Changed their mind — replace the value, reset the counter.
          await this.prisma.aiUserMemory.update({
            where: { id: existing.id },
            data: { value: fact.value, evidence: 1, source, updatedAt: new Date() },
          });
        } else {
          await this.prisma.aiUserMemory.create({
            data: {
              ownerKey,
              userId: owner.userId ?? null,
              guestKey: owner.guestKey ?? null,
              kind: fact.kind,
              key: fact.key,
              value: fact.value,
              evidence: 1,
              source,
            },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`memory write failed: ${(err as Error).message}`);
    }
  }

  /** Delete everything remembered about the owner. Returns removed count. */
  async clear(owner: ConversationOwner): Promise<number> {
    const ownerKey = this.ownerKey(owner);
    if (!ownerKey) return 0;
    const removed = await this.prisma.aiUserMemory.deleteMany({ where: { ownerKey } });
    return removed.count;
  }

  /**
   * Mine durable facts from the merged conversation state after a turn:
   * repeated preferences, accumulated brand likes/dislikes, typical budget.
   */
  async extractFromState(owner: ConversationOwner, state: {
    preferences?: Array<{ key: string; value: string; hard: boolean }>;
    preferenceEvidence?: Record<string, number>;
    excludedBrandIds?: string[];
    preferredBrandIds?: string[];
    budget?: { max?: number; min?: number; scope: "per_item" | "total" };
  }): Promise<void> {
    const facts: MemoryFact[] = [];

    for (const pref of state.preferences ?? []) {
      const evidence = state.preferenceEvidence?.[`${pref.key}:${pref.value}`] ?? 0;
      if (evidence >= 2 && !isNoisePreference(pref.key, pref.value)) {
        facts.push({ kind: "preference", key: pref.key.slice(0, 60), value: pref.value.slice(0, 120), evidence });
      }
    }

    const brandIds = [...new Set([...(state.preferredBrandIds ?? []), ...(state.excludedBrandIds ?? [])])];
    if (brandIds.length) {
      const rows = await this.prisma.brand
        .findMany({
          where: { id: { in: brandIds.slice(0, 20) } },
          select: { id: true, name: true },
        })
        .catch(() => [] as Array<{ id: string; name: string }>);
      const byId = new Map<string, string>(rows.map((r) => [r.id, r.name] as [string, string]));
      for (const id of state.preferredBrandIds ?? []) {
        const name = byId.get(id);
        if (name) facts.push({ kind: "brand_like", key: `brand:${id}`, value: name, evidence: 1 });
      }
      for (const id of state.excludedBrandIds ?? []) {
        const name = byId.get(id);
        if (name) facts.push({ kind: "brand_dislike", key: `brand:${id}`, value: name, evidence: 1 });
      }
    }

    if (state.budget?.max && state.budget.max >= 1000) {
      facts.push({ kind: "budget", key: "typical_max", value: String(Math.round(state.budget.max)), evidence: 1 });
    }

    await this.remember(owner, facts);
  }

  /** Render loaded facts as a short Arabic block for prompt injection. */
  describe(facts: MemoryFact[]): string {
    if (!facts.length) return "";
    const lines: string[] = [];
    for (const fact of facts) {
      if (fact.kind === "budget") lines.push(`- ميزانية معتادة تقريبية: ${Number(fact.value).toLocaleString("en-US")} د.ع`);
      else if (fact.kind === "brand_like") lines.push(`- يفضّل براند: ${fact.value}`);
      else if (fact.kind === "brand_dislike") lines.push(`- يتجنب براند: ${fact.value}`);
      else if (fact.kind === "note") lines.push(`- ${fact.value}`);
      else lines.push(`- ${fact.key}: ${fact.value}`);
    }
    return lines.slice(0, MAX_LOADED_FACTS).join("\n");
  }

  /** Grouped summary for the "what do you remember about me" question. */
  groupedSummary(facts: MemoryFact[]): string {
    if (!facts.length) return "";
    const groups = new Map<MemoryFact["kind"], string[]>();
    for (const fact of facts) {
      const text =
        fact.kind === "budget"
          ? `${Number(fact.value).toLocaleString("en-US")} د.ع`
          : fact.kind === "brand_like" || fact.kind === "brand_dislike"
            ? fact.value
            : `${fact.key}: ${fact.value}`;
      groups.set(fact.kind, [...(groups.get(fact.kind) ?? []), text]);
    }
    return [...groups.entries()]
      .filter(([kind]) => kind !== "note" || (groups.get("note")?.length ?? 0) > 0)
      .map(([kind, values]) => `${KIND_LABELS[kind]}: ${values.slice(0, 6).join("، ")}`)
      .join("\n");
  }
}

/** Drop vague/one-off keys that should never become durable memory. */
function isNoisePreference(key: string, value: string): boolean {
  const noiseKeys = new Set(["style", "vibe", "mood", "intensity"]);
  if (noiseKeys.has(key.toLowerCase())) return true;
  return value.trim().length < 2 || value.length > 120;
}

/**
 * Turn planner (task rules #4, #5, #6, #17, #96): one fast-model call with
 * strict JSON output converts message + conversation state into a typed
 * understanding. Deterministic post-processing then:
 *  - parses IQD budgets (fallback when the model missed a number),
 *  - resolves brand mentions to ids via the data-driven alias index,
 *  - resolves category hints to ids via the cached category tree,
 *  - resolves references ("الثاني", "هذا") against durable state.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { AI_PROVIDER, ASSISTANT_AI_CONFIG, type AIProvider } from "../ai/ai-provider.interface";
import {
  TURN_PLANNER_INSTRUCTIONS,
  TURN_PLANNER_SCHEMA,
} from "../prompts/prompts";
import { parseMoneyIQD } from "../text/money.util";
import { BrandAliasService } from "../text/brand-alias.service";
import { ToolRegistryService } from "../tools/tool-registry.service";
import { ordinalFromArabicWord, resolveReferences } from "../conversation/state.service";
import type {
  AssistantIntent,
  ConversationState,
  ReferenceMention,
  TurnPlan,
  TurnUnderstanding,
} from "../assistant.types";

interface AssistantAiConfigLike {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  primaryModel: string;
  fastModel: string;
  embeddingModel: string;
  maxToolIterations: number;
  requestTimeoutMs: number;
  retrievalLimit: number;
  throttlePerMinute: number;
  dailyUserMessageCap: number;
  debug: boolean;
}

interface RawUnderstanding {
  intent?: string;
  replyLanguage?: string;
  categoryHints?: string[];
  gender?: string | null;
  occasion?: string | null;
  budget?: { min?: number | null; max?: number | null; scope?: string } | null;
  preferences?: Array<{ key?: string; value?: string; hard?: boolean }>;
  brandMentions?: string[];
  excludedBrandMentions?: string[];
  references?: Array<{ mention?: string; ordinal?: number | null; strategy?: string }>;
  searchQueries?: string[];
  basketRoles?: string[];
  asksProductDetails?: boolean;
  confidence?: number;
}

const VALID_INTENTS = new Set<AssistantIntent>([
  "CASUAL_CHAT",
  "PRODUCT_SEARCH",
  "PRODUCT_RECOMMENDATION",
  "PRODUCT_DETAILS",
  "PRODUCT_COMPARISON",
  "PRODUCT_AVAILABILITY",
  "PRICE_QUERY",
  "CART_ACTION",
  "FAVORITES_ACTION",
  "ORDER_STATUS",
  "REORDER",
  "LOYALTY_QUERY",
  "FOLLOW_UP",
  "GENERAL_BEAUTY_GUIDANCE",
  "OUT_OF_SCOPE",
]);

@Injectable()
export class TurnPlannerService {
  private readonly logger = new Logger(TurnPlannerService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    @Inject(ASSISTANT_AI_CONFIG) private readonly config: AssistantAiConfigLike,
    private readonly brandAliases: BrandAliasService,
    private readonly tools: ToolRegistryService,
  ) {}

  async plan(input: {
    message: string;
    state: ConversationState;
    summary: string | null;
    recentTurns: Array<{ role: string; content: string }>;
    memoryBlock?: string;
    catalogBlock?: string;
  }): Promise<TurnPlan> {
    const stateBlock = JSON.stringify(
      {
        currentIntent: input.state.currentIntent ?? null,
        activeCategoryIds: input.state.activeCategoryIds ?? [],
        budget: input.state.budget ?? null,
        preferences: input.state.preferences ?? [],
        excludedBrandIds: input.state.excludedBrandIds ?? [],
        preferredBrandIds: input.state.preferredBrandIds ?? [],
        lastRecommendations: (input.state.lastRecommendationIds ?? []).map((id, i) => `${i + 1}:${id}`),
        basket: input.state.basket ?? null,
        currentProductId: input.state.currentProductId ?? null,
      },
      null,
      0,
    );

    const transcript = input.recentTurns
      .slice(-8)
      .map((t) => `${t.role === "USER" ? "USER" : "ASSISTANT"}: ${t.content.slice(0, 220)}`)
      .join("\n");

    const raw = await this.provider.chat({
      model: this.config.fastModel,
      temperature: 0,
      maxOutputTokens: 700,
      structured: { name: "turn_understanding", schema: TURN_PLANNER_SCHEMA as unknown as Record<string, unknown> },
      messages: [
        { role: "system", content: TURN_PLANNER_INSTRUCTIONS },
        {
          role: "user",
          content: [
            `CONVERSATION_STATE: ${stateBlock}`,
            input.summary ? `SUMMARY: ${input.summary}` : "",
            input.catalogBlock ? `DATA_CATALOG_START\n${input.catalogBlock}\nDATA_CATALOG_END` : "",
            input.memoryBlock ? `DATA_MEMORY_START\n${input.memoryBlock}\nDATA_MEMORY_END` : "",
            transcript ? `RECENT_TURNS:\n${transcript}` : "",
            `DATA_USER_MESSAGE_START\n${input.message}\nDATA_USER_MESSAGE_END`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
    });

    const understanding = this.parseUnderstanding(raw.text, input.message);
    return this.postProcess(understanding, input.state);
  }

  private parseUnderstanding(text: string, fallbackMessage: string): TurnUnderstanding {
    let raw: RawUnderstanding = {};
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      raw = JSON.parse(text.slice(start, end + 1)) as RawUnderstanding;
    } catch {
      this.logger.warn("planner JSON parse failed — using heuristic fallback");
    }

    const intent = VALID_INTENTS.has(raw.intent as AssistantIntent) ? (raw.intent as AssistantIntent) : this.heuristicIntent(fallbackMessage);

    // Deterministic IQD fallback: if the model missed a budget but the raw
    // message contains an explicit scaled amount ("50 الف", "20k"), use it.
    let budget = raw.budget?.max || raw.budget?.min
      ? {
          min: raw.budget.min ?? undefined,
          max: raw.budget.max ?? undefined,
          scope: raw.budget.scope === "total" ? ("total" as const) : ("per_item" as const),
        }
      : undefined;
    if (!budget) {
      const money = parseMoneyIQD(fallbackMessage);
      if (money?.scaled && intent !== "CASUAL_CHAT") {
        budget = { min: undefined, max: money.value, scope: "per_item" };
      }
    }

    const references: ReferenceMention[] = (raw.references ?? [])
      .map((r) => ({
        mention: String(r.mention ?? ""),
        ordinal: r.ordinal ?? ordinalFromArabicWord(String(r.mention ?? "")) ?? undefined,
        strategy: (r.strategy as ReferenceMention["strategy"]) ?? "last_shown",
      }))
      .filter((r) => r.mention)
      .slice(0, 4);

    return {
      intent,
      replyLanguage: raw.replyLanguage === "en" ? "en" : raw.replyLanguage === "ar" ? "ar" : "ar_iraqi",
      categoryHints: (raw.categoryHints ?? []).map(String).slice(0, 4),
      gender: raw.gender === "male" || raw.gender === "female" || raw.gender === "unisex" ? raw.gender : undefined,
      occasion: raw.occasion ?? undefined,
      budget,
      preferences: (raw.preferences ?? [])
        .filter((p) => p.key && p.value)
        .map((p) => ({ key: String(p.key).slice(0, 40), value: String(p.value).slice(0, 60), hard: Boolean(p.hard) }))
        .slice(0, 6),
      brandMentions: (raw.brandMentions ?? []).map(String).slice(0, 4),
      excludedBrandMentions: (raw.excludedBrandMentions ?? []).map(String).slice(0, 4),
      references,
      searchQueries: (raw.searchQueries ?? []).map(String).map((q) => q.slice(0, 120)).slice(0, 3),
      basketRoles: (raw.basketRoles ?? []).map(String).map((r) => r.slice(0, 40)).filter(Boolean).slice(0, 4),
      asksProductDetails: Boolean(raw.asksProductDetails),
      confidence: Math.min(1, Math.max(0, Number(raw.confidence ?? 0.7))),
    };
  }

  private async postProcess(understanding: TurnUnderstanding, state: ConversationState): Promise<TurnPlan> {
    const [brandHits, excludedHits, categoryIds] = await Promise.all([
      this.brandAliases.resolveMany(understanding.brandMentions),
      this.brandAliases.resolveMany(understanding.excludedBrandMentions),
      this.tools.resolveCategoryIds(understanding.categoryHints),
    ]);

    const references = resolveReferences(understanding.references, state);
    const resolvedProductIds = references.map((r) => r.productId).filter((id): id is string => Boolean(id));

    const preferredBrandIds = [...brandHits.values()].map((b) => b.brandId);
    const statePatch: Partial<ConversationState> = {
      currentIntent: understanding.intent,
      ...(categoryIds.length ? { activeCategoryIds: categoryIds } : {}),
      ...(understanding.budget ? { budget: understanding.budget } : {}),
      ...(understanding.preferences.length ? { preferences: understanding.preferences } : {}),
      ...(preferredBrandIds.length
        ? { preferredBrandIds: [...new Set([...(state.preferredBrandIds ?? []), ...preferredBrandIds])] }
        : {}),
      ...(excludedHits.size
        ? { excludedBrandIds: [...new Set([...(state.excludedBrandIds ?? []), ...[...excludedHits.values()].map((b) => b.brandId)])] }
        : {}),
      ...(understanding.basketRoles?.length && understanding.budget?.scope === "total"
        ? {
            basket: {
              items: state.basket?.items ?? [],
              totalBudget: understanding.budget.max ?? state.basket?.totalBudget,
            },
          }
        : {}),
      ...(state.currentProductId ? { currentProductId: state.currentProductId } : {}),
    };

    return {
      understanding,
      statePatch,
      resolvedProductIds,
    };
  }

  private heuristicIntent(message: string): AssistantIntent {
    const normalized = message.trim().toLowerCase();
    if (/^(شكرا|شكراً|تسلم|thanks|thank you|هلا|هاي|hi|hello|مرحبا)/.test(normalized)) return "CASUAL_CHAT";
    if (/(وين طلبي|طلبي|طلب رقم|order status|track my order|تتبع)/.test(normalized)) return "ORDER_STATUS";
    if (/(نقاطي|نقاط الولاء|point|loyalty|رصيدي)/.test(normalized)) return "LOYALTY_QUERY";
    if (/(عيد لي|اعيد|نفس الطلب|reorder|كرر طلب)/.test(normalized)) return "REORDER";
    if (/(قارن|الفرق بين|compare)/.test(normalized)) return "PRODUCT_COMPARISON";
    if (/(سعر|شكد|كم|price)/.test(normalized)) return "PRICE_QUERY";
    if (/(متوفر|موجود|stock|available)/.test(normalized)) return "PRODUCT_AVAILABILITY";
    if (/(اريد|ابي|اعدني|اقترح|عندكم|عدكم|ابحث|recommend|اريد شي)/.test(normalized)) return "PRODUCT_RECOMMENDATION";
    return "PRODUCT_SEARCH";
  }
}

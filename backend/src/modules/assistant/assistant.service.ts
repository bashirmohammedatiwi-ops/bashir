/**
 * Assistant orchestrator (task rules #13, #14, #15, #31, #33, #46, #97):
 * fast path for trivial turns, planner → tool loop → streaming composer,
 * grounding enforcement, structured responses, state + persistence.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { AI_PROVIDER, ASSISTANT_AI_CONFIG, type AIProvider, type ChatMessage } from "./ai/ai-provider.interface";
import { ConversationService } from "./conversation/conversation.service";
import { SummarizerService } from "./conversation/summarizer.service";
import { applyStatePatch, EMPTY_STATE } from "./conversation/state.service";
import { GroundingService } from "./agent/grounding.service";
import { ResponseBuilderService } from "./agent/response-builder.service";
import { TurnPlannerService } from "./agent/turn-planner.service";
import { ToolRegistryService, type ToolExecutionContext } from "./tools/tool-registry.service";
import { CatalogSearchService } from "./retrieval/catalog-search.service";
import { AiUsageService } from "./observability/ai-usage.service";
import { AssistantMemoryService } from "./memory/memory.service";
import { LessonsService } from "./learning/lessons.service";
import { CatalogKnowledgeService } from "./retrieval/catalog-knowledge.service";
import { PROMPT_VERSION, composerSystem } from "./prompts/prompts";
import type {
  AgentStep,
  AssistantResponse,
  CartSummaryItem,
  ConversationState,
  MemoryFact,
  ProductComparison,
  TurnPlan,
} from "./assistant.types";

interface AssistantAiConfigShape {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  primaryModel: string;
  lightModel: string;
  fastModel: string;
  embeddingModel: string;
  maxToolIterations: number;
  requestTimeoutMs: number;
  retrievalLimit: number;
  throttlePerMinute: number;
  dailyUserMessageCap: number;
  debug: boolean;
}

/**
 * Cost routing: simple, tool-light intents run end-to-end on the cheap
 * light model; discovery/comparison/guidance keep the flagship model.
 */
const LIGHT_INTENTS = new Set([
  "CASUAL_CHAT",
  "PRICE_QUERY",
  "PRODUCT_AVAILABILITY",
  "ORDER_STATUS",
  "LOYALTY_QUERY",
  "REORDER",
  "FAVORITES_ACTION",
  "FOLLOW_UP",
]);

export function modelForIntent(config: { primaryModel: string; lightModel: string }, intent: string): string {
  return LIGHT_INTENTS.has(intent) ? config.lightModel : config.primaryModel;
}

export interface TurnInput {
  message: string;
  conversationId?: string;
  userId?: string | null;
  guestKey?: string | null;
  screen?: { productId?: string; categoryId?: string; brandId?: string };
  /** Client-side cart snapshot — context only, never mutated server-side. */
  cart?: CartSummaryItem[];
  /** Admin-only debug flag — validated by the controller. */
  debug?: boolean;
}

export interface TurnStreamHandlers {
  onDelta?: (delta: string) => void;
  /** Progress label while tools run (rendered by the client as a typing hint). */
  onStatus?: (label: string) => void;
}

const CASUAL_REPLIES: Record<string, string[]> = {
  thanks: ["العفو، بأي وقت! تحت أمرك بأي شيء ثاني 🌿", "سلمات! أنا موجود إذا احتجت شي ثاني."],
  greet: ["هلا بيك! شتحب تدور اليوم؟ عطور، عناية بالبشرة، شنو؟", "أهلاً! خبرني شنو تحتاج وأدور لك أفضل الخيارات."],
};

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    @Inject(ASSISTANT_AI_CONFIG) private readonly config: AssistantAiConfigShape,
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    private readonly conversations: ConversationService,
    private readonly summarizer: SummarizerService,
    private readonly planner: TurnPlannerService,
    private readonly tools: ToolRegistryService,
    private readonly grounding: GroundingService,
    private readonly responses: ResponseBuilderService,
    private readonly search: CatalogSearchService,
    private readonly usage: AiUsageService,
    private readonly memory: AssistantMemoryService,
    private readonly lessons: LessonsService,
    private readonly catalogKnowledge: CatalogKnowledgeService,
  ) {}

  async handleTurn(input: TurnInput, stream?: TurnStreamHandlers): Promise<AssistantResponse> {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const steps: AgentStep[] = [];
    const modelCalls: Array<{ purpose: string; model: string; ms: number }> = [];
    let usageTokens = { inputTokens: 0, outputTokens: 0 };
    let retrievalMs = 0;
    let candidateCount = 0;
    const warnings: string[] = [];

    try {
      const message = input.message.trim().slice(0, 2000);
      if (!message) {
        return this.emptyMessageResponse();
      }

      // Degraded mode without a key: lexical-only template response.
      if (!this.config.enabled) {
        return await this.degradedSearch(message, input);
      }

      const conversation = await this.conversations.getOrCreate(input.conversationId, {
        userId: input.userId ?? null,
        guestKey: input.guestKey ?? null,
      });

      if (await this.conversations.isOverDailyCap({ userId: input.userId, guestKey: input.guestKey }, this.config.dailyUserMessageCap)) {
        return this.cappedResponse(conversation.id);
      }

      const { state: rawState, summary } = await this.conversations.loadState(conversation.id);
      let state: ConversationState = { ...EMPTY_STATE, ...(rawState as ConversationState), ...(input.screen?.productId ? { currentProductId: input.screen.productId } : {}), ...(input.screen?.categoryId ? { currentCategoryId: input.screen.categoryId } : {}), ...(input.screen?.brandId ? { currentBrandId: input.screen.brandId } : {}) };
      const recentTurns = await this.conversations.recentMessages(conversation.id);
      await this.conversations.appendUserMessage(conversation.id, message);

      // Long-term memory: background personalization, never hard constraints.
      const memoryFacts: MemoryFact[] = this.memory ? await this.memory.load({ userId: input.userId, guestKey: input.guestKey }) : [];
      const memoryBlock = this.memory?.describe(memoryFacts) ?? "";
      // Catalog map + learned lessons: shared cached context (10-min TTL).
      const [catalogBlock, lessonsText] = await Promise.all([
        this.catalogKnowledge.catalogBlock(),
        this.lessons.lessonsBlock(),
      ]);
      stream?.onStatus?.("أفهم طلبك…");

      // 1) Understanding.
      const plan: TurnPlan = await this.withModelCall("planner", this.config.fastModel, modelCalls, () =>
        this.planner.plan({ message, state, summary, recentTurns, memoryBlock, catalogBlock }),
      );
      // Cost routing: simple intents on the light model, complex on the flagship.
      const turnModel = modelForIntent(this.config, plan.understanding.intent);

      // 2) Fast path: casual chat needs no tools, no retrieval.
      if (plan.understanding.intent === "CASUAL_CHAT" || plan.understanding.intent === "OUT_OF_SCOPE") {
        return await this.casualResponse(conversation.id, plan, message, startedAt, usageTokens, modelCalls, steps, input.debug && this.config.debug);
      }

      // Unresolvable short references → single high-value clarification (rules #31/#33).
      const unresolved = plan.resolvedProductIds.length === 0 && plan.understanding.references.some((r) => r.ordinal || r.strategy === "current_screen");
      const noHistory = !state.lastRecommendationIds?.length && !state.currentProductId;
      if (unresolved && noHistory && !plan.understanding.searchQueries.length) {
        const response = await this.responses.build({
          type: "CLARIFICATION",
          message: "مليت أي منتج تقصد — من آخر الخيارات اللي عرضتها لك، ولا منتج معيّن بالمتجر؟",
          conversationId: conversation.id,
          productIds: [],
          intent: plan.understanding.intent,
          actions: [],
        });
        await this.finalizeTurn(conversation.id, response, plan, { startedAt, usageTokens, modelCalls, steps, retrievalMs, candidateCount, warnings, requestId, userId: input.userId, guestKey: input.guestKey, stopReason: "complete", firstUserMessage: message });
        return response;
      }

      // 3) Merge planner state patch; screen context wins for "current product".
      state = applyStatePatch(state, plan.statePatch);

      const ctx: ToolExecutionContext = {
        userId: input.userId ?? null,
        groundingProducts: new Map(),
        collectedActions: [],
        collectedOrders: [],
        softPreferences: [
          ...plan.understanding.preferences.filter((p) => !p.hard),
          ...memoryFacts.filter((f) => f.kind === "preference").map((f) => ({ key: f.key, value: f.value })),
        ].slice(0, 6),
      };
      if (plan.understanding.searchQueries.length || plan.understanding.intent.startsWith("ORDER") || plan.understanding.intent === "REORDER" || plan.understanding.intent === "LOYALTY_QUERY") {
        stream?.onStatus?.(plan.understanding.intent === "ORDER_STATUS" || plan.understanding.intent === "REORDER" || plan.understanding.intent === "LOYALTY_QUERY" ? "أشوف طلباتك…" : "أدور بالكتالوج…");
      }

      // 4) Agent loop with tools (rules #13, #14) on the routed model.
      const loopMessages: ChatMessage[] = this.buildLoopMessages(message, plan, state, summary, recentTurns, memoryBlock, input.cart, catalogBlock, lessonsText);
      let finalText = "";
      let iterations = 0;
      let stopReason: "complete" | "max_iterations" | "error" = "complete";

      while (iterations < this.config.maxToolIterations) {
        iterations += 1;
        const callStarted = Date.now();
        const result = await this.provider.chat({
          model: turnModel,
          temperature: 0.4,
          messages: loopMessages,
          tools: this.tools.definitions(),
        });
        modelCalls.push({ purpose: `agent-loop-${iterations}`, model: turnModel, ms: Date.now() - callStarted });
        usageTokens.inputTokens += result.usage.inputTokens;
        usageTokens.outputTokens += result.usage.outputTokens;

        if (!result.toolCalls.length) {
          finalText = result.text;
          break;
        }

        loopMessages.push({ role: "assistant", content: result.text || null, toolCalls: result.toolCalls });
        for (const call of result.toolCalls) {
          const toolStarted = Date.now();
          const toolResult = await this.tools.execute(call, ctx);
          steps.push({ toolName: call.name, args: safeParse(call.arguments), ok: toolResult.ok, ms: Date.now() - toolStarted, resultCount: toolResult.productIds.length });
          retrievalMs += Date.now() - toolStarted;
          candidateCount += toolResult.productIds.length;
          loopMessages.push({ role: "tool", content: toolResult.digest, toolCallId: call.id });
        }
      }
      if (iterations >= this.config.maxToolIterations && !finalText) stopReason = "max_iterations";

      // 5) Streaming final composition over the gathered tool results (rule #46).
      if (!finalText) {
        const composerStarted = Date.now();
        const composer = await this.provider.chat(
          {
            model: turnModel,
            temperature: 0.5,
            messages: [
              ...loopMessages,
              {
                role: "user",
                content:
                  "صِغ الآن الرد النهائي للمستخدم من النتائج أعلاه. لا تستدعي أدوات إضافية.",
              },
            ],
          },
          { onDelta: stream?.onDelta },
        );
        modelCalls.push({ purpose: "composer", model: turnModel, ms: Date.now() - composerStarted });
        usageTokens.inputTokens += composer.usage.inputTokens;
        usageTokens.outputTokens += composer.usage.outputTokens;
        finalText = composer.text;
      }

      // 6) Grounding enforcement (rules #28, #29).
      let check = this.grounding.validate(finalText, ctx.groundingProducts);
      if (!check.clean) {
        warnings.push(...check.violations);
        const retryStarted = Date.now();
        const retry = await this.provider.chat({
          model: turnModel,
          temperature: 0.3,
          messages: [
            { role: "system", content: composerSystem(styleFor(plan.understanding.replyLanguage)) },
            ...loopMessages,
            { role: "user", content: this.grounding.retryWarning(check.violations) },
          ],
        });
        modelCalls.push({ purpose: "grounding-retry", model: turnModel, ms: Date.now() - retryStarted });
        usageTokens.inputTokens += retry.usage.inputTokens;
        usageTokens.outputTokens += retry.usage.outputTokens;
        const retryCheck = this.grounding.validate(retry.text, ctx.groundingProducts);
        if (retryCheck.clean) {
          finalText = retry.text;
          check = retryCheck;
        } else {
          finalText = this.grounding.stripViolations(retry.text, ctx.groundingProducts);
          warnings.push("stripped ungrounded sentences after retry");
        }
      }
      if (!finalText.trim()) {
        finalText = "ما لقيت نتيجة واضحة الحين — جرّب تصفّح لي الطلب أكثر (نوع المنتج، الميزانية) وأعيد البحث.";
        warnings.push("empty composer output — fallback text used");
      }

      // 7) Select products + response type (grounded, in tool-result order).
      const selectedIds = this.selectProductIds(ctx, plan, check.mentionedProductIds);
      const comparison = this.maybeComparison(plan, ctx, selectedIds);
      const type = this.responseType(plan.understanding.intent, ctx.collectedActions.length > 0, selectedIds.length > 0, ctx.collectedOrders.length > 0);

      const response = await this.responses.build({
        type,
        message: finalText.trim(),
        conversationId: conversation.id,
        productIds: selectedIds,
        intent: plan.understanding.intent,
        actions: ctx.collectedActions,
        orders: ctx.collectedOrders.slice(0, 5),
        comparison,
        debug: input.debug && this.config.debug
          ? {
              intent: plan.understanding.intent,
              understanding: plan.understanding,
              toolCalls: steps.map((s) => ({ name: s.toolName, args: s.args, ms: s.ms, resultCount: s.resultCount })),
              candidateIds: [...ctx.groundingProducts.keys()],
              selectedIds,
              retrievalMs,
              modelCalls,
              warnings,
            }
          : undefined,
      });

      // 8) Persist + state + summary + usage.
      state = applyStatePatch(state, selectedIds.length ? { lastRecommendationIds: selectedIds } : {});
      if (comparison) state = applyStatePatch(state, { comparisonProductIds: comparison.products.map((p) => p.productId) });
      await this.finalizeTurn(conversation.id, response, plan, {
        startedAt,
        usageTokens,
        modelCalls,
        steps,
        retrievalMs,
        candidateCount,
        warnings,
        requestId,
        userId: input.userId,
        guestKey: input.guestKey,
      stopReason,
      state,
      firstUserMessage: message,
      model: turnModel,
    });
      return response;
    } catch (err) {
      const errorCode = (err as Error).name === "AiProviderError" ? "AI_PROVIDER_ERROR" : "INTERNAL_ERROR";
      this.logger.error(`turn failed: ${(err as Error).message}`);
      const fallback = await this.responses.build({
        type: "ERROR_RECOVERY",
        message: "صار خلل بسيط بالاتصال — جرّب مرة ثانية بسرعة.",
        conversationId: input.conversationId ?? "",
        productIds: [],
        intent: "FOLLOW_UP",
        actions: [],
      });
      await this.usage.log({
        requestId,
        conversationId: input.conversationId,
        userId: input.userId ?? null,
        promptVersion: PROMPT_VERSION,
        latencyMs: Date.now() - startedAt,
        status: "error",
        errorCode,
      });
      return fallback;
    }
  }

  // ---------------------- helpers ----------------------

  private buildLoopMessages(
    message: string,
    plan: TurnPlan,
    state: ConversationState,
    summary: string | null,
    recentTurns: Array<{ role: string; content: string }>,
    memoryBlock?: string,
    cart?: CartSummaryItem[],
    catalogBlock?: string,
    lessonsText?: string,
  ): ChatMessage[] {
    const hint = {
      intent: plan.understanding.intent,
      budget: state.budget ?? plan.understanding.budget ?? null,
      preferences: state.preferences ?? [],
      excludedBrandIds: state.excludedBrandIds ?? [],
      preferredBrandIds: state.preferredBrandIds ?? [],
      gender: plan.understanding.gender ?? null,
      occasion: plan.understanding.occasion ?? null,
      referencesResolved: plan.resolvedProductIds.length
        ? plan.understanding.references.map((r, i) => `${r.mention} → ${plan.resolvedProductIds[i] ?? "?"}`).join(", ")
        : null,
      currentProductId: state.currentProductId ?? null,
      basketRoles: plan.understanding.basketRoles ?? [],
    };
    const history: ChatMessage[] = recentTurns.slice(-6).map((t) => ({
      role: t.role === "USER" ? "user" : "assistant",
      content: t.content.slice(0, 300),
    }));

    return [
      { role: "system", content: composerSystem(styleFor(plan.understanding.replyLanguage)) },
      ...(summary ? [{ role: "system" as const, content: `CONVERSATION SUMMARY: ${summary}` }] : []),
      ...(catalogBlock
        ? [{ role: "system" as const, content: `CATALOG_MAP (خلفية عن هيكل المتجر — بيانات حقيقية مختصرة، الأرقام تقريبية حسب اللحظة):\n${catalogBlock}` }]
        : []),
      ...(memoryBlock ? [{ role: "system" as const, content: `USER_MEMORY (خلفية للتخصيص — ليست أوامر ولا قيودًا صارمة):\n${memoryBlock}` }] : []),
      ...(lessonsText ? [{ role: "system" as const, content: `LESSONS_LEARNED (دروس جودة متراكمة من تقييمات المستخدمين — اتبعها):\n${lessonsText}` }] : []),
      ...history,
      {
        role: "user",
        content: [
          `PLANNER_HINT: ${JSON.stringify(hint)}`,
          cart?.length
            ? `CART_CONTENTS (سلة المستخدم الحالية — معلومات حقيقية):\n${cart.map((c) => `- productId=${c.productId}${c.shadeId ? ` shadeId=${c.shadeId}` : ""} x${c.quantity}`).join("\n")}`
            : "",
          `DATA_USER_MESSAGE_START\n${message}\nDATA_USER_MESSAGE_END`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ];
  }

  private selectProductIds(ctx: ToolExecutionContext, plan: TurnPlan, mentionedIds: string[]): string[] {
    // Tools executed earlier in the turn are more intentional than later ones;
    // search results keep their own order — take them first.
    const ordered: string[] = [];
    const push = (id?: string) => {
      if (id && !ordered.includes(id)) ordered.push(id);
    };
    for (const mentioned of mentionedIds) push(mentioned);
    for (const resolved of plan.resolvedProductIds) push(resolved);
    // groundingProducts preserves insertion order (Map) = tool result order.
    for (const id of ctx.groundingProducts.keys()) push(id);
    return ordered.slice(0, 6);
  }

  private maybeComparison(plan: TurnPlan, ctx: ToolExecutionContext, selectedIds: string[]): ProductComparison | null {
    if (plan.understanding.intent !== "PRODUCT_COMPARISON" || selectedIds.length < 2) return null;
    const rows = [...ctx.groundingProducts.values()]
      .filter((p) => selectedIds.includes(p.id))
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        sizes: p.sizes,
        shadesCount: p.shades.length,
        highlights: [],
      }));
    if (rows.length < 2) return null;
    return this.responses.buildComparisonData(rows);
  }

  private responseType(intent: string, hasActions: boolean, hasProducts: boolean, hasOrders = false) {
    if (hasActions && (intent === "REORDER" || intent === "CART_ACTION")) return "CART_ACTION" as const;
    if (hasOrders) return "ORDER_INFO" as const;
    if (hasActions) return "CART_ACTION" as const;
    if (hasProducts) {
      if (intent === "PRODUCT_COMPARISON") return "PRODUCT_COMPARISON" as const;
      return "PRODUCT_RECOMMENDATIONS" as const;
    }
    if (intent === "ORDER_STATUS" || intent === "REORDER" || intent === "LOYALTY_QUERY") return "ORDER_INFO" as const;
    if (intent === "CASUAL_CHAT") return "TEXT" as const;
    return "EMPTY_RESULT" as const;
  }

  private async casualResponse(
    conversationId: string,
    plan: TurnPlan,
    message: string,
    startedAt: number,
    usageTokens: { inputTokens: number; outputTokens: number },
    modelCalls: Array<{ purpose: string; model: string; ms: number }>,
    steps: AgentStep[],
    debug?: boolean,
  ): Promise<AssistantResponse> {
    const normalized = message.toLowerCase();
    const preset = /شكر|تسلم|thanks/i.test(normalized) ? CASUAL_REPLIES.thanks : CASUAL_REPLIES.greet;
    const response = await this.responses.build({
      type: "TEXT",
      message: preset[Math.floor(Math.random() * preset.length)],
      conversationId,
      productIds: [],
      intent: plan.understanding.intent,
      actions: [],
      debug: debug
        ? { intent: plan.understanding.intent, toolCalls: [], candidateIds: [], selectedIds: [], retrievalMs: 0, modelCalls, warnings: ["fast-path"] }
        : undefined,
    });
    const assistantMessage = await this.conversations.appendAssistantMessage(conversationId, response, {
      intent: plan.understanding.intent,
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - startedAt,
      tokensIn: usageTokens.inputTokens,
      tokensOut: usageTokens.outputTokens,
    });
    response.metadata.messageId = assistantMessage.id;
    return response;
  }

  private async finalizeTurn(
    conversationId: string,
    response: AssistantResponse,
    plan: TurnPlan,
    meta: {
      startedAt: number;
      usageTokens: { inputTokens: number; outputTokens: number };
      modelCalls: Array<{ purpose: string; model: string; ms: number }>;
      steps: AgentStep[];
      retrievalMs: number;
      candidateCount: number;
      warnings: string[];
      requestId: string;
      userId?: string | null;
      guestKey?: string | null;
      stopReason: string;
      state?: ConversationState;
      firstUserMessage?: string;
      model?: string;
    },
  ): Promise<void> {
    const assistantMessage = await this.conversations.appendAssistantMessage(conversationId, response, {
      intent: plan.understanding.intent,
      model: meta.model ?? this.config.primaryModel,
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - meta.startedAt,
      tokensIn: meta.usageTokens.inputTokens,
      tokensOut: meta.usageTokens.outputTokens,
    });
    response.metadata.messageId = assistantMessage.id;

    if (meta.state) {
      await this.conversations.saveState(conversationId, meta.state as Record<string, unknown>, plan.understanding.intent);
    }

    const { summary, messageCount } = await this.conversations.loadState(conversationId);

    // Title the conversation on its first exchange so the history list is readable.
    if (messageCount <= 2 && meta.firstUserMessage) {
      void this.generateTitle(conversationId, meta.firstUserMessage, response.message).catch(() => undefined);
    }

    // Mine durable preferences into long-term memory (non-fatal, fire-and-forget).
    if (this.memory && meta.state) {
      void this.memory
        .extractFromState({ userId: meta.userId ?? null, guestKey: meta.guestKey ?? null }, meta.state)
        .catch(() => undefined);
    }

    if (this.summarizer.shouldSummarize(messageCount)) {
      void (async () => {
        const older = (await this.conversations.recentMessages(conversationId, 40)).slice(0, -14);
        const folded = await this.summarizer.summarize(summary, older, this.config.fastModel);
        if (folded) await this.conversations.saveSummary(conversationId, folded);
      })().catch(() => undefined);
    }

    await this.usage.log({
      requestId: meta.requestId,
      conversationId,
      userId: meta.userId ?? null,
      model: meta.model ?? this.config.primaryModel,
      promptVersion: PROMPT_VERSION,
      intent: plan.understanding.intent,
      latencyMs: Date.now() - meta.startedAt,
      tokensIn: meta.usageTokens.inputTokens,
      tokensOut: meta.usageTokens.outputTokens,
      toolCalls: meta.steps.map((s) => ({ name: s.toolName, ms: s.ms, ok: s.ok })),
      retrievalMs: meta.retrievalMs,
      candidateCount: meta.candidateCount,
      selectedProductIds: response.products.map((p) => p.id),
      fallbackUsed: meta.stopReason === "max_iterations",
      status: "ok",
    });
  }

  /** Short Arabic conversation title from the first exchange (fast model, non-fatal). */
  private async generateTitle(conversationId: string, firstUserMessage: string, firstReply: string): Promise<void> {
    const result = await this.provider.chat({
      model: this.config.fastModel,
      temperature: 0,
      maxOutputTokens: 60,
      messages: [
        {
          role: "system",
          content: "ولّد عنوان محادثة قصير جداً (2–5 كلمات) بالعربية يلخص طلب المستخدم. بلا علامات ترقيم أو اقتباسات أو أي شرح.",
        },
        {
          role: "user",
          content: `DATA_START\nطلب المستخدم: ${firstUserMessage.slice(0, 300)}\nرد المساعد: ${firstReply.slice(0, 300)}\nDATA_END`,
        },
      ],
    });
    const title = result.text.trim().replace(/^["'«]|["'»]$/g, "").slice(0, 60);
    if (title) await this.conversations.saveTitle(conversationId, title);
  }

  /** No-LLM degradation (rule #86): plain lexical search + honest template. */
  private async degradedSearch(message: string, input: TurnInput): Promise<AssistantResponse> {
    const cards = await this.search.search({ queries: [message], limit: 5 });
    const response = await this.responses.build({
      type: cards.length ? "PRODUCT_RECOMMENDATIONS" : "EMPTY_RESULT",
      message: cards.length
        ? "هذه أقرب النتائج من الكتالوج:"
        : "ما لقيت شي مطابق حالياً — جرّب كلمة ثانية أو تصفّح الأقسام.",
      conversationId: input.conversationId ?? "",
      productIds: cards.map((c) => c.id),
      intent: "PRODUCT_SEARCH",
      actions: [],
    });
    return response;
  }

  private emptyMessageResponse(): AssistantResponse {
    return {
      type: "TEXT",
      message: "اكتب لي شنو تحتاج وأنا أدور لك.",
      products: [],
      orders: [],
      comparison: null,
      quickReplies: [{ label: "عطور", action: "اقترحلي عطور" }, { label: "عروض اليوم", action: "شو العروض؟" }],
      actions: [],
      metadata: { conversationId: "" },
    };
  }

  private cappedResponse(conversationId: string): AssistantResponse {
    return {
      type: "ERROR_RECOVERY",
      message: "وصلت لحد الرسائل اليومية — عيّد بكرة وأنا بالخدمة 🌿",
      products: [],
      orders: [],
      comparison: null,
      quickReplies: [],
      actions: [],
      metadata: { conversationId },
    };
  }

  private async withModelCall<T>(purpose: string, model: string, modelCalls: Array<{ purpose: string; model: string; ms: number }>, fn: () => Promise<T>): Promise<T> {
    const started = Date.now();
    try {
      return await fn();
    } finally {
      modelCalls.push({ purpose, model, ms: Date.now() - started });
    }
  }
}

function styleFor(language: "ar" | "en" | "ar_iraqi"): string {
  if (language === "en") return "الرد هذه المرة بالإنجليزية لأن المستخدم كتب بالإنجليزية.";
  if (language === "ar") return "الرد هذه المرة بالفصحى المبسطة لأن المستخدم كتب بالفصحى.";
  return "الرد هذه المرة بعربية عراقية خفيفة طبيعية لأن المستخدم كتب باللهجة العراقية.";
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return raw;
  }
}

/**
 * Shared contracts for the assistant module: structured response envelope,
 * product cards, conversation state, and turn understanding (task rules
 * #16, #36, #37, #38). Nothing here is exposed verbatim to the model —
 * these are the backend-owned shapes.
 */

import type { ToolCallRequest } from "./ai/ai-provider.interface";

// ---------------------- RESPONSE ENVELOPE ----------------------

export type AssistantResponseType =
  | "TEXT"
  | "PRODUCT_RECOMMENDATIONS"
  | "PRODUCT_COMPARISON"
  | "ORDER_INFO"
  | "CLARIFICATION"
  | "CART_ACTION"
  | "EMPTY_RESULT"
  | "ERROR_RECOVERY";

export interface AssistantProductCard {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  price: number;
  oldPrice: number;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  shadeName: string | null;
  deepLink: string;
}

export interface ComparisonRow {
  productId: string;
  name: string;
  price: number;
  size: string | null;
  highlights: string[];
}

export interface ProductComparison {
  products: ComparisonRow[];
  sharedTraits: string[];
  differences: string[];
}

export interface AssistantOrderCard {
  id: string;
  orderNumber: string;
  /** OrderStatus enum value (PENDING/CONFIRMED/.../DELIVERED). */
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
  deepLink: string;
}

export interface AssistantQuickReply {
  label: string;
  /** Message the client sends when tapped. */
  action: string;
}

export interface AssistantClientAction {
  type: "ADD_TO_CART";
  productId: string;
  shadeId?: string | null;
  shadeName?: string | null;
  quantity: number;
  /** Echoed back so the assistant can confirm in the next turn. */
  actionId: string;
}

export interface AssistantResponse {
  type: AssistantResponseType;
  message: string;
  products: AssistantProductCard[];
  orders: AssistantOrderCard[];
  comparison?: ProductComparison | null;
  quickReplies: AssistantQuickReply[];
  actions: AssistantClientAction[];
  metadata: {
    conversationId: string;
    messageId?: string;
    /** Present only for admin debug requests. */
    debug?: AssistantDebugTrace;
  };
}

export interface AssistantDebugTrace {
  intent: string;
  understanding?: unknown;
  searchPlan?: unknown;
  toolCalls: Array<{ name: string; args: unknown; ms: number; resultCount?: number }>;
  candidateIds: string[];
  selectedIds: string[];
  retrievalMs: number;
  modelCalls: Array<{ purpose: string; model: string; ms: number }>;
  warnings: string[];
}

// ---------------------- CONVERSATION STATE ----------------------

export interface ConversationBudget {
  min?: number;
  max?: number;
  /** "per_item" | "total" — total = whole basket/gift budget. */
  scope: "per_item" | "total";
}

export interface ConversationPreference {
  key: string; // e.g. "intensity", "style", "skinType", "size"
  value: string;
  hard: boolean; // HARD CONSTRAINT vs SOFT PREFERENCE (rules #22/#23)
}

export interface ReferenceSlot {
  slot: string; // "1" | "2" | "3" | "هذا" | "المنتج الحالي"
  productId: string;
  setAtMessage: number;
}

export interface BasketItemIntent {
  productId: string;
  role: string; // "shampoo" | "mask" | "gift" ...
}

export interface ConversationState {
  currentIntent?: string;
  activeCategoryIds?: string[];
  budget?: ConversationBudget;
  preferences?: ConversationPreference[];
  excludedBrandIds?: string[];
  /** Brands the user positively asked for across turns (memory mining). */
  preferredBrandIds?: string[];
  /** Products most recently shown, ordered — powers "الأول/الثاني" resolution. */
  lastRecommendationIds?: string[];
  comparisonProductIds?: string[];
  /** Multi-item basket under a shared budget (rule #99/#116). */
  basket?: { items: BasketItemIntent[]; totalBudget?: number };
  /** Screen context provided by the client app. */
  currentProductId?: string;
  currentCategoryId?: string;
  currentBrandId?: string;
  /** Bumped when a soft preference is confirmed repeatedly (rule #20). */
  preferenceEvidence?: Record<string, number>;
}

/** One durable memory row loaded into the turn context. */
export interface MemoryFact {
  kind: "brand_like" | "brand_dislike" | "preference" | "budget" | "note";
  key: string;
  value: string;
  evidence: number;
}

/** Client-side cart snapshot sent with each message (cart lives on the app). */
export interface CartSummaryItem {
  productId: string;
  shadeId?: string | null;
  quantity: number;
}

// ---------------------- TURN UNDERSTANDING ----------------------

export type AssistantIntent =
  | "CASUAL_CHAT"
  | "PRODUCT_SEARCH"
  | "PRODUCT_RECOMMENDATION"
  | "PRODUCT_DETAILS"
  | "PRODUCT_COMPARISON"
  | "PRODUCT_AVAILABILITY"
  | "PRICE_QUERY"
  | "CART_ACTION"
  | "FAVORITES_ACTION"
  | "ORDER_STATUS"
  | "REORDER"
  | "LOYALTY_QUERY"
  | "FOLLOW_UP"
  | "GENERAL_BEAUTY_GUIDANCE"
  | "OUT_OF_SCOPE";

export interface ReferenceMention {
  /** What the user said: "الثاني", "هذا", "الأول". */
  mention: string;
  /** Ordinal (1-based) when the mention is positional. */
  ordinal?: number;
  /** "last_shown" | "current_screen" | "conversation_product". */
  strategy: "last_shown" | "current_screen" | "conversation_product";
}

export interface TurnUnderstanding {
  intent: AssistantIntent;
  replyLanguage: "ar" | "en" | "ar_iraqi";
  /** Normalized constraints derived from the message + prior state. */
  categoryHints: string[];
  gender?: "male" | "female" | "unisex";
  occasion?: string;
  budget?: { min?: number; max?: number; scope: "per_item" | "total" };
  preferences: Array<{ key: string; value: string; hard: boolean }>;
  brandMentions: string[];
  excludedBrandMentions: string[];
  references: ReferenceMention[];
  /** Rewritten search concepts — never adding constraints the user did not state (rule #6). */
  searchQueries: string[];
  /** Roles to fill when the user wants a routine/gift basket under one total budget ("روتين كامل بـ 100 الف"). */
  basketRoles?: string[];
  /** Direct answer for price/details questions grounded in known products. */
  asksProductDetails?: boolean;
  confidence: number;
}

export interface TurnPlan {
  understanding: TurnUnderstanding;
  statePatch: Partial<ConversationState>;
  /** Products the agent already resolved for this turn (grounding source). */
  resolvedProductIds: string[];
}

// ---------------------- AGENT ----------------------

export interface AgentStep {
  toolName: string;
  args: unknown;
  ok: boolean;
  ms: number;
  resultCount?: number;
  error?: string;
}

export interface AgentOutcome {
  response: AssistantResponse;
  steps: AgentStep[];
  intent: AssistantIntent;
  usage: { inputTokens: number; outputTokens: number };
  modelCalls: Array<{ purpose: string; model: string; ms: number }>;
  candidateIds: string[];
  retrievalMs: number;
  stopReason: "complete" | "max_iterations" | "error" | "fast_path";
  errorCode?: string;
}

export type { ToolCallRequest };

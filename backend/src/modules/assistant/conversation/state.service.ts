/**
 * Conversation state: structured, persisted, and testable (task rules
 * #16, #18, #17). Pure functions so unit tests cover the merge/reference
 * logic without a database.
 */

import type {
  ConversationPreference,
  ConversationState,
  ReferenceMention,
} from "../assistant.types";

export const EMPTY_STATE: ConversationState = {};

/** Deep-merge a planner-produced patch into the durable state (rule #18). */
export function applyStatePatch(state: ConversationState, patch: Partial<ConversationState>): ConversationState {
  const next: ConversationState = { ...state };

  if (patch.currentIntent !== undefined) next.currentIntent = patch.currentIntent;
  if (patch.activeCategoryIds) {
    // Category switch replaces; same-category refinement keeps prior ids.
    next.activeCategoryIds = dedupe([...(patch.activeCategoryIds)]);
  }
  if (patch.budget) {
    next.budget = {
      ...(next.budget ?? { scope: "per_item" }),
      ...patch.budget,
      scope: patch.budget.scope ?? next.budget?.scope ?? "per_item",
    };
  }
  if (patch.preferences?.length) {
    next.preferences = mergePreferences(next.preferences ?? [], patch.preferences);
  }
  if (patch.excludedBrandIds?.length) {
    next.excludedBrandIds = dedupe([...(next.excludedBrandIds ?? []), ...patch.excludedBrandIds]);
  }
  if (patch.preferredBrandIds?.length) {
    next.preferredBrandIds = dedupe([...(next.preferredBrandIds ?? []), ...patch.preferredBrandIds]).slice(0, 12);
  }
  if (patch.lastRecommendationIds) {
    next.lastRecommendationIds = dedupe(patch.lastRecommendationIds).slice(0, 12);
  }
  if (patch.comparisonProductIds) {
    next.comparisonProductIds = dedupe(patch.comparisonProductIds).slice(0, 4);
  }
  if (patch.basket) {
    next.basket = {
      items: dedupeById(patch.basket.items.length ? patch.basket.items : next.basket?.items ?? []),
      totalBudget: patch.basket.totalBudget ?? next.basket?.totalBudget,
    };
  }
  if (patch.currentProductId !== undefined) next.currentProductId = patch.currentProductId;
  if (patch.currentCategoryId !== undefined) next.currentCategoryId = patch.currentCategoryId;
  if (patch.currentBrandId !== undefined) next.currentBrandId = patch.currentBrandId;

  // Evidence counter for long-term preference mining (rule #20).
  next.preferenceEvidence = { ...(next.preferenceEvidence ?? {}) };
  for (const pref of patch.preferences ?? []) {
    const key = `${pref.key}:${pref.value}`;
    next.preferenceEvidence[key] = (next.preferenceEvidence[key] ?? 0) + 1;
  }

  return next;
}

/**
 * Resolve user references ("الثاني", "هذا") against the durable state.
 * Returns product ids; [] when unresolvable (caller decides clarification).
 */
export function resolveReferences(mentions: ReferenceMention[], state: ConversationState): Array<{ mention: string; productId: string | null }> {
  const out: Array<{ mention: string; productId: string | null }> = [];
  for (const mention of mentions) {
    let productId: string | null = null;
    if (mention.ordinal && state.lastRecommendationIds?.length) {
      productId = state.lastRecommendationIds[mention.ordinal - 1] ?? null;
    } else if (mention.strategy === "current_screen") {
      productId = state.currentProductId ?? state.lastRecommendationIds?.[0] ?? null;
    } else if (mention.strategy === "last_shown") {
      productId = state.lastRecommendationIds?.[0] ?? null;
    }
    out.push({ mention: mention.mention, productId });
  }
  return out;
}

/**
 * A mention only counts as ordinal when it maps to the recommendation list
 * the user actually saw (rule #17: "الثاني" → second shown product).
 */
export function ordinalFromArabicWord(word: string): number | null {
  const normalized = word.trim();
  const map: Array<[RegExp, number]> = [
    [/^(ال)?أول$|^(ال)اول$|^first$/i, 1],
    [/^(ال)?ثاني(?:ة|ه)?$|^second$/i, 2],
    [/^(ال)?ثالث(?:ة|ه)?$|^third$/i, 3],
    [/^(ال)?رابع(?:ة|ه)?$|^fourth$/i, 4],
    [/^(ال)?خامس(?:ة|ه)?$|^fifth$/i, 5],
  ];
  for (const [re, ordinal] of map) {
    if (re.test(normalized)) return ordinal;
  }
  const digit = /^(\d+)$/.exec(normalized);
  return digit ? Number(digit[1]) : null;
}

export function mergePreferences(existing: ConversationPreference[], incoming: ConversationPreference[]): ConversationPreference[] {
  const byKey = new Map<string, ConversationPreference>();
  for (const pref of existing) byKey.set(pref.key, { ...pref });
  for (const pref of incoming) {
    const current = byKey.get(pref.key);
    if (!current) {
      byKey.set(pref.key, { ...pref });
    } else if (current.value === pref.value) {
      // Same value restated: hard constraint wins over soft.
      byKey.set(pref.key, { ...pref, hard: pref.hard || current.hard });
    } else {
      // Changed their mind — new value replaces, hardness as restated.
      byKey.set(pref.key, { ...pref });
    }
  }
  return [...byKey.values()];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function dedupeById<T extends { productId: string; role: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = `${item.productId}:${item.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

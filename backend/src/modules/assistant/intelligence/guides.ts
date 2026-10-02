import { productRole, scoredMatches } from "./agent";
import { Concern, ShoppingState } from "./types";

export type AssistantGuideRule = {
  type: "promote" | "hide" | "note";
  concern?: string | null;
  productId?: string | null;
  note?: string | null;
  priority?: number;
};

type GuidedRow = { id: string; nameAr: string; nameEn: string; description?: string; price: number };

function relevant(guides: AssistantGuideRule[], state: ShoppingState) {
  const concerns = new Set([state.concern, ...(state.also ?? [])].filter(Boolean));
  return guides.filter((guide) => !guide.concern || concerns.has(guide.concern as Concern));
}

export function hiddenProductIds(state: ShoppingState, guides: AssistantGuideRule[]) {
  return new Set(
    relevant(guides, state)
      .filter((guide) => guide.type === "hide" && guide.productId)
      .map((guide) => guide.productId as string),
  );
}

export function promotedProductIds(state: ShoppingState, guides: AssistantGuideRule[]) {
  return relevant(guides, state)
    .filter((guide) => guide.type === "promote" && guide.productId)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .map((guide) => guide.productId as string);
}

export function guideNotes(state: ShoppingState, guides: AssistantGuideRule[]) {
  return relevant(guides, state)
    .map((guide) => guide.note?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");
}

/** يقدّم المنتج المروَّج إذا هو علاج حقيقي لنفس الخطوة، مو أي منتج. */
export function steerPicks<T extends GuidedRow>(picks: T[], pool: T[], state: ShoppingState, guides: AssistantGuideRule[]): T[] {
  const promoted = new Set(promotedProductIds(state, guides));
  if (!promoted.size) return picks;
  return picks.map((pick) => {
    const role = productRole(pick);
    const alternatives = pool.filter((row) => row.id !== pick.id && productRole(row) === role && promoted.has(row.id));
    if (!alternatives.length) return pick;
    const scored = scoredMatches([pick, ...alternatives], state);
    const pickScore = scored.find((item) => item.row.id === pick.id)?.score ?? 0;
    const best = alternatives
      .map((row) => ({ row, score: scored.find((item) => item.row.id === row.id)?.score ?? 0 }))
      .sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 6 && best.score + 5 >= pickScore) return best.row;
    return pick;
  });
}

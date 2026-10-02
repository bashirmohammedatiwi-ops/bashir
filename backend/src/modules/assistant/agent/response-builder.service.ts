/**
 * Response assembly (task rules #36, #37, #39, #92, #93): contextual quick
 * replies per intent, deterministic comparison extraction, response-type
 * mapping. Cards are always built from DB rows, never model text.
 */

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import { ProductCardService, CardProductInclude } from "../retrieval/product-card.service";
import type {
  AssistantClientAction,
  AssistantIntent,
  AssistantOrderCard,
  AssistantProductCard,
  AssistantQuickReply,
  AssistantResponse,
  AssistantResponseType,
  ProductComparison,
} from "../assistant.types";

@Injectable()
export class ResponseBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: ProductCardService,
  ) {}

  async build(input: {
    type: AssistantResponseType;
    message: string;
    conversationId: string;
    productIds: string[];
    intent: AssistantIntent;
    actions: AssistantClientAction[];
    comparison?: ProductComparison | null;
    orders?: AssistantOrderCard[];
    messageId?: string;
    debug?: AssistantResponse["metadata"]["debug"];
  }): Promise<AssistantResponse> {
    const products = input.productIds.length ? await this.fetchCards(input.productIds.slice(0, 6)) : [];
    return {
      type: input.type,
      message: input.message,
      products,
      orders: input.orders ?? [],
      comparison: input.comparison ?? null,
      quickReplies: this.quickReplies(input.intent, input.type, products, input.actions),
      actions: input.actions,
      metadata: {
        conversationId: input.conversationId,
        ...(input.messageId ? { messageId: input.messageId } : {}),
        ...(input.debug ? { debug: input.debug } : {}),
      },
    };
  }

  async fetchCards(ids: string[]): Promise<AssistantProductCard[]> {
    if (!ids.length) return [];
    const rows = await this.prisma.product.findMany({ where: { id: { in: ids } }, include: CardProductInclude });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter(Boolean).map((r) => this.cards.toCard(r!));
  }

  private quickReplies(intent: AssistantIntent, type: AssistantResponseType, products: AssistantProductCard[], actions: AssistantClientAction[]): AssistantQuickReply[] {
    if (type === "CLARIFICATION") return [];
    if (actions.length) return [{ label: "شوف السلة", action: "افتح السلة" }];

    if (type === "ORDER_INFO" || intent === "ORDER_STATUS" || intent === "LOYALTY_QUERY") {
      return [{ label: "اقترحلي منتجات", action: "اقترحلي منتجات حسب ذوقي" }];
    }
    if (intent === "REORDER") {
      return [{ label: "شوف السلة", action: "افتح السلة" }, { label: "منتجات مشابهة", action: "اقترحلي منتجات مشابهة" }];
    }

    if (type === "PRODUCT_RECOMMENDATIONS" && products.length >= 2) {
      const replies: AssistantQuickReply[] = [
        { label: "أرخص", action: "ارخص" },
        { label: "خيارات ثانية", action: "خيارات ثانية" },
      ];
      if (products.length >= 2) replies.push({ label: "قارن بينهم", action: "قارن بين الأول والثاني" });
      const first = products[0];
      if (first.inStock) replies.push({ label: "أضف للسلة", action: `ضيف ${first.name}` });
      return replies;
    }
    if (type === "EMPTY_RESULT") {
      return [
        { label: "ارفع الميزانية شوي", action: "ارفع الميزانية قليلا" },
        { label: "بدون قيد البراند", action: "خيارات بدون قيد البراند" },
      ];
    }
    if (intent === "PRICE_QUERY" && products.length) {
      return [
        { label: "أضف للسلة", action: `ضيف ${products[0].name}` },
        { label: "مشابه أرخص", action: "ابحث عن بديل أرخص" },
      ];
    }
    if (intent === "CASUAL_CHAT") {
      return [
        { label: "عطور", action: "اقترحلي عطور" },
        { label: "عناية بالبشرة", action: "اقترحلي روتين بشرة" },
        { label: "العروض", action: "شو العروض الحالية؟" },
      ];
    }
    return [];
  }

  /** Deterministic comparison skeleton from real rows (rule #27). */
  buildComparisonData(rows: Array<{ id: string; name: string; brand: string; price: number; sizes: string[]; shadesCount: number; highlights: string[] }>): ProductComparison {
    const sorted = [...rows].sort((a, b) => a.price - b.price);
    const sharedTraits: string[] = [];
    const brands = new Set(rows.map((r) => r.brand));
    if (brands.size === 1) sharedTraits.push(`نفس البراند (${[...brands][0]})`);
    const priceSpread = sorted[sorted.length - 1].price - sorted[0].price;
    if (priceSpread <= Math.max(2000, sorted[0].price * 0.1)) sharedTraits.push("الأسعار متقاربة");

    const differences: string[] = [];
    if (priceSpread > 0) {
      differences.push(`السعر: ${sorted[0].name} أرخص (${sorted[0].price.toLocaleString("en-US")} د.ع) — الفرق ${(priceSpread).toLocaleString("en-US")} د.ع`);
    }
    for (const row of rows) {
      if (row.sizes.length > 1) differences.push(`${row.name}: متوفر بأحجام ${row.sizes.join(" / ")}`);
      if (row.shadesCount > 3) differences.push(`${row.name}: ${row.shadesCount} درجة لون`);
    }
    return {
      products: rows.map((r) => ({ productId: r.id, name: r.name, price: r.price, size: r.sizes[0] ?? null, highlights: r.highlights })),
      sharedTraits,
      differences,
    };
  }
}

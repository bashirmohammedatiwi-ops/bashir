/**
 * Personalized welcome (deterministic, zero-LLM): builds a warm greeting
 * from time of day + long-term memory + live catalog signals (offers,
 * bestsellers) with contextual starter chips. Called when the chat opens.
 */

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import { AssistantMemoryService } from "../memory/memory.service";
import type { ConversationOwner } from "../conversation/conversation.service";

export interface WelcomeChip {
  label: string;
  action: string;
}

export interface WelcomePayload {
  greeting: string;
  memorySummary: string | null;
  chips: WelcomeChip[];
}

@Injectable()
export class WelcomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memory: AssistantMemoryService,
  ) {}

  async build(owner: ConversationOwner): Promise<WelcomePayload> {
    const [facts, offersCount] = await Promise.all([
      this.memory.load(owner).catch(() => []),
      this.prisma.product
        .count({
          where: { isActive: true, stock: { gt: 0 }, OR: [{ isPromo: true }, { isBogo: true }, { discountPercent: { gt: 0 } }] },
        })
        .catch(() => 0),
    ]);

    const hour = new Date().getHours();
    const opener = hour < 12 ? "صباح الخير 🌿" : hour < 18 ? "هلا بيك" : "مساء الخير ✨";

    const likedBrands = facts.filter((f) => f.kind === "brand_like").map((f) => f.value).slice(0, 3);
    const skin = facts.find((f) => f.key === "skinType")?.value;
    const memorySummary = this.memory.groupedSummary(facts) || null;

    let greeting: string;
    if (likedBrands.length || skin) {
      const bits: string[] = [];
      if (skin) bits.push(`بشرتك ${skin}`);
      if (likedBrands.length) bits.push(`تحب ${likedBrands.join(" و")}`);
      greeting = `${opener}! أتذكر منّك إن ${bits.join(" و")} — نكمل من وين؟`;
    } else if (offersCount > 0) {
      greeting = `${opener}! عندنا ${offersCount} منتج بعرض حالياً — شتحب تدور اليوم؟`;
    } else {
      greeting = `${opener}! أنا ديمة — مساعدتك بالتسوق. خبرني شنو تحتاج وأنا أدور لك بالكتالوج الحقيقي.`;
    }

    const chips: WelcomeChip[] = [
      ...(likedBrands.length ? [{ label: `اقترحلي من ${likedBrands[0]}`, action: `اقترحلي منتجات من ${likedBrands[0]}` }] : []),
      ...(skin ? [{ label: `روتين للبشرة ${skin}`, action: `روتين كامل للبشرة ${skin}` }] : []),
      ...(offersCount > 0 ? [{ label: "شو العروض؟", action: "شو العروض الحالية؟" }] : []),
      { label: "الأكثر مبيعاً", action: "شنو المنتجات الأكثر مبيعاً؟" },
      { label: "وين طلبي؟", action: "وين طلبي وصل؟" },
    ].slice(0, 5);

    return { greeting, memorySummary, chips };
  }
}

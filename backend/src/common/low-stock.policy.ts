import type { PrismaService } from "./prisma.service";

/**
 * «المخزون القليل يظهر نافذاً» لكل قسم رئيسي يفعّله المدير:
 * الجرد غير دقيق، فالمنتج أو التدرج الذي مخزونه ≤ الحد يُعرض للزبون بمخزون 0
 * ولا يُقبل طلبه. المخزون الحقيقي في قاعدة البيانات لا يتغيّر، ولوحة التحكم تراه كما هو.
 */
export class LowStockPolicy {
  /** categoryId (القسم الرئيسي) ← الحد. */
  private static rules: Map<string, number> | null = null;
  private static loadedAt = 0;
  private static loading: Promise<Map<string, number>> | null = null;
  private static readonly TTL = 30_000;

  /** بعد أي تعديل على قسم حتى يظهر الأثر فوراً. */
  static invalidate() {
    LowStockPolicy.loadedAt = 0;
  }

  static async load(prisma: PrismaService): Promise<Map<string, number>> {
    if (LowStockPolicy.rules && Date.now() - LowStockPolicy.loadedAt < LowStockPolicy.TTL) return LowStockPolicy.rules;
    if (LowStockPolicy.loading) return LowStockPolicy.loading;
    LowStockPolicy.loading = (async () => {
      try {
        const rows = await prisma.category.findMany({
          where: { hideLowStock: true, parentId: null },
          select: { id: true, lowStockThreshold: true },
        });
        LowStockPolicy.rules = new Map(rows.map((r) => [r.id, Math.max(0, r.lowStockThreshold ?? 2)]));
      } catch {
        LowStockPolicy.rules ??= new Map();
      }
      LowStockPolicy.loadedAt = Date.now();
      LowStockPolicy.loading = null;
      return LowStockPolicy.rules!;
    })();
    return LowStockPolicy.loading;
  }

  /** المخزون كما يراه الزبون. */
  static effective(rules: Map<string, number>, categoryId: string | null | undefined, stock: number): number {
    if (!categoryId || !rules.size) return stock;
    const t = rules.get(categoryId);
    if (t === undefined) return stock;
    return stock <= t ? 0 : stock;
  }
}

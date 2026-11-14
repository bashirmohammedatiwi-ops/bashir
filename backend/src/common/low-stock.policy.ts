import type { PrismaService } from "./prisma.service";

/**
 * «المخزون القليل يظهر نافذاً» لكل قسم رئيسي يفعّله المدير:
 * الجرد غير دقيق، فالمنتج أو التدرج الذي مخزونه ≤ الحد يُعرض للزبون بمخزون 0
 * ولا يُقبل طلبه. المخزون الحقيقي في قاعدة البيانات لا يتغيّر، ولوحة التحكم تراه كما هو.
 * المنتجات ذات «العدد المحلي» (manualStock) مستثناة: عددها يُدخله المدير بنفسه فهو دقيق.
 */
export class LowStockPolicy {
  /** categoryId (القسم الرئيسي) ← الحد. */
  private static rules: Map<string, number> | null = null;
  /** منتجات العدد المحلي — لا تُطبَّق عليها القاعدة. */
  private static manual: Set<string> = new Set();
  private static loadedAt = 0;
  private static loading: Promise<Map<string, number>> | null = null;
  private static readonly TTL = 30_000;

  /** بعد أي تعديل على قسم أو على «العدد المحلي» لمنتج حتى يظهر الأثر فوراً. */
  static invalidate() {
    LowStockPolicy.loadedAt = 0;
  }

  static async load(prisma: PrismaService): Promise<Map<string, number>> {
    if (LowStockPolicy.rules && Date.now() - LowStockPolicy.loadedAt < LowStockPolicy.TTL) return LowStockPolicy.rules;
    if (LowStockPolicy.loading) return LowStockPolicy.loading;
    LowStockPolicy.loading = (async () => {
      try {
        const [rows, manual] = await Promise.all([
          prisma.category.findMany({
            where: { hideLowStock: true, parentId: null },
            select: { id: true, lowStockThreshold: true },
          }),
          prisma.product.findMany({ where: { manualStock: true }, select: { id: true } }),
        ]);
        LowStockPolicy.rules = new Map(rows.map((r) => [r.id, Math.max(0, r.lowStockThreshold ?? 2)]));
        LowStockPolicy.manual = new Set(manual.map((m) => m.id));
      } catch {
        LowStockPolicy.rules ??= new Map();
      }
      LowStockPolicy.loadedAt = Date.now();
      LowStockPolicy.loading = null;
      return LowStockPolicy.rules!;
    })();
    return LowStockPolicy.loading;
  }

  /** منتج بعدد محلي (بعد load). */
  static isManual(productId: string | null | undefined): boolean {
    return !!productId && LowStockPolicy.manual.has(productId);
  }

  /** المخزون كما يراه الزبون. */
  static effective(
    rules: Map<string, number>,
    categoryId: string | null | undefined,
    stock: number,
    productId?: string | null,
  ): number {
    if (!categoryId || !rules.size) return stock;
    const t = rules.get(categoryId);
    if (t === undefined) return stock;
    if (LowStockPolicy.isManual(productId)) return stock;
    return stock <= t ? 0 : stock;
  }

  /** للاختبارات فقط. */
  static _setForTest(rules: Map<string, number>, manual: string[]) {
    LowStockPolicy.rules = rules;
    LowStockPolicy.manual = new Set(manual);
    LowStockPolicy.loadedAt = Date.now();
  }
}

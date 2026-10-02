/**
 * Tool registry (task rules #10, #11, #12): the model never touches the
 * database. Every tool has a strict JSON-schema contract; arguments are
 * validated server-side before execution; results are compact digests that
 * double as the grounding source for the final reply.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma.service";
import type { ToolDefinition, ToolCallRequest } from "../ai/ai-provider.interface";
import { normalizeArabicText } from "../text/arabic.util";
import { formatIQD } from "../text/money.util";
import { CatalogSearchService } from "../retrieval/catalog-search.service";
import { CardProductInclude, ProductCardService } from "../retrieval/product-card.service";
import { BrandAliasService } from "../text/brand-alias.service";
import type { AssistantClientAction, AssistantOrderCard, AssistantProductCard } from "../assistant.types";

export interface ToolExecutionContext {
  userId?: string | null;
  /** Accumulates every product row tools returned this turn (grounding set). */
  groundingProducts: Map<string, GroundingProduct>;
  collectedActions: AssistantClientAction[];
  /** Order cards gathered by order tools this turn (rendered by the client). */
  collectedOrders: AssistantOrderCard[];
  /** Planner soft preferences — used as ranking hints by catalog search. */
  softPreferences?: Array<{ key: string; value: string }>;
}

export interface GroundingProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  shades: Array<{ id: string; name: string; price: number | null; stock: number }>;
  sizes: string[];
}

export interface ToolResult {
  ok: boolean;
  digest: string; // compact text for the model
  productIds: string[];
}

const CATEGORY_CACHE_TTL = 10 * 60 * 1000;

/** Arabic labels for order statuses used inside tool digests. */
const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "بالطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترجع",
};

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private categoriesCache: { at: number; text: string; byHint: Map<string, string[]> } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly search: CatalogSearchService,
    private readonly cards: ProductCardService,
    private readonly brandAliases: BrandAliasService,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        type: "function",
        function: {
          name: "searchProducts",
          description:
            "Search the real store catalog. Use for any product discovery. Filters are hard constraints: only set what the user actually required.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["queries"],
            properties: {
              queries: { type: "array", items: { type: "string" }, maxItems: 3, description: "1-3 search concepts (Arabic and/or English)" },
              brandIds: { type: "array", items: { type: "string" } },
              excludedBrandIds: { type: "array", items: { type: "string" } },
              categoryIds: { type: "array", items: { type: "string" } },
              gender: { type: "string", enum: ["male", "female", "unisex"] },
              minPrice: { type: "number", description: "IQD" },
              maxPrice: { type: "number", description: "IQD" },
              inStockOnly: { type: "boolean", default: true },
              limit: { type: "number", maximum: 8 },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getProductById",
          description: "Full real details for one product: description, shades with price/stock, sizes. Use for details/price/availability questions.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["productId"],
            properties: { productId: { type: "string" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "findAlternatives",
          description: "Find alternatives to a known product: cheaper, similar, or a step up. Keeps the same category/brand family unless direction says otherwise.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["productId", "direction"],
            properties: {
              productId: { type: "string" },
              direction: { type: "string", enum: ["cheaper", "similar", "upgrade"] },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "compareProducts",
          description: "Compare 2-3 known products on real attributes: price, size, shades, description highlights.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["productIds"],
            properties: { productIds: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getCatalog",
          description: "List active categories and brands with their ids — use to resolve a category/brand before searching when unsure.",
          parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "getCurrentOffers",
          description: "Current discounted/promo products.",
          parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "getBestsellers",
          description: "Store bestsellers overall or within a category — use for 'most popular / شنو الأكثر مبيعاً' questions.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: [],
            properties: {
              categoryId: { type: "string", description: "Optional: restrict to one category id" },
              limit: { type: "number", maximum: 8 },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getSkinGuidance",
          description: "Store's skin-concern guide: matching concerns (حبوب، جفاف، تصبغات...) with short descriptions and example products. Use for skincare advice questions.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: [],
            properties: { concern: { type: "string", description: "Optional concern name (Arabic or English) to focus on" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getFavorites",
          description: "The signed-in user's wishlist products.",
          parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "getMyOrders",
          description: "The signed-in user's recent orders: order number, status, total, item count, date. Use for 'where is my order' style questions.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: [],
            properties: { limit: { type: "number", maximum: 5, description: "How many recent orders (default 3)" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getOrderDetails",
          description: "Full details for one order by order number or id: items with quantities/prices, status, payment, delivery. Use after getMyOrders or when the user gives an order number.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["orderRef"],
            properties: { orderRef: { type: "string", description: "Order number (e.g. ORD-1234) or order id" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getLoyaltyStatus",
          description: "The signed-in user's loyalty points balance and recent point movements.",
          parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "getProductReviews",
          description: "Real customer reviews for one product: average rating, review count, and recent approved comments.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["productId"],
            properties: { productId: { type: "string" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "prepareReorder",
          description: "Re-order a previous order: validates every item against the live catalog and prepares add-to-cart actions for the available ones. Reports unavailable items honestly.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["orderId"],
            properties: { orderId: { type: "string" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "toggleFavorite",
          description: "Add/remove a product from the signed-in user's wishlist.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["productId"],
            properties: { productId: { type: "string" } },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "prepareCartAction",
          description:
            "Validate and prepare an add-to-cart for the client app (cart is client-side). Returns the action payload to include in the reply.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["productId"],
            properties: {
              productId: { type: "string" },
              shadeId: { type: ["string", "null"] },
              quantity: { type: "number", minimum: 1, maximum: 10 },
            },
          },
        },
      },
    ];
  }

  /** Validate + execute one call. Never throws — errors become tool results. */
  async execute(call: ToolCallRequest, ctx: ToolExecutionContext): Promise<ToolResult> {
    let args: Record<string, unknown> = {};
    try {
      args = call.arguments ? (JSON.parse(call.arguments) as Record<string, unknown>) : {};
    } catch {
      return { ok: false, digest: `ERROR INVALID_TOOL_ARGS: ${call.name} arguments are not valid JSON`, productIds: [] };
    }

    try {
      switch (call.name) {
        case "searchProducts":
          return await this.searchProducts(args, ctx);
        case "getProductById":
          return await this.getProductById(str(args.productId), ctx);
        case "findAlternatives": {
          const rawDirection = str(args.direction);
          const direction = rawDirection === "cheaper" || rawDirection === "upgrade" ? rawDirection : "similar";
          return await this.findAlternatives(str(args.productId), direction, ctx);
        }
        case "compareProducts":
          return await this.compareProducts(arr(args.productIds).slice(0, 3), ctx);
        case "getCatalog":
          return await this.getCatalog();
        case "getCurrentOffers":
          return await this.getCurrentOffers(ctx);
        case "getBestsellers":
          return await this.getBestsellers(str(args.categoryId) || null, Math.min(num(args.limit) || 5, 8), ctx);
        case "getSkinGuidance":
          return await this.getSkinGuidance(str(args.concern), ctx);
        case "getFavorites":
          return await this.getFavorites(ctx);
        case "getMyOrders":
          return await this.getMyOrders(Math.min(num(args.limit) || 3, 5), ctx);
        case "getOrderDetails":
          return await this.getOrderDetails(str(args.orderRef), ctx);
        case "getLoyaltyStatus":
          return await this.getLoyaltyStatus(ctx);
        case "getProductReviews":
          return await this.getProductReviews(str(args.productId), ctx);
        case "prepareReorder":
          return await this.prepareReorder(str(args.orderId), ctx);
        case "toggleFavorite":
          return await this.toggleFavorite(str(args.productId), ctx);
        case "prepareCartAction":
          return await this.prepareCartAction(str(args.productId), str(args.shadeId) || null, num(args.quantity) || 1, ctx);
        default:
          return { ok: false, digest: `ERROR INVALID_TOOL_ARGS: unknown tool ${call.name}`, productIds: [] };
      }
    } catch (err) {
      this.logger.warn(`tool ${call.name} failed: ${(err as Error).message}`);
      return { ok: false, digest: `ERROR SEARCH_FAILED: ${(err as Error).message}`, productIds: [] };
    }
  }

  // ---------------------- implementations ----------------------

  private async searchProducts(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolResult> {
    const queries = arr(args.queries);
    if (!queries.length) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: queries required", productIds: [] };

    const results = await this.search.search({
      queries,
      brandIds: arr(args.brandIds).length ? arr(args.brandIds) : undefined,
      excludedBrandIds: arr(args.excludedBrandIds).length ? arr(args.excludedBrandIds) : undefined,
      categoryIds: arr(args.categoryIds).length ? arr(args.categoryIds) : undefined,
      gender: (str(args.gender) as "male" | "female" | "unisex") || undefined,
      minPrice: num(args.minPrice),
      maxPrice: num(args.maxPrice),
      inStockOnly: args.inStockOnly === undefined ? true : Boolean(args.inStockOnly),
      limit: Math.min(num(args.limit) || 6, 8),
      softPreferences: ctx.softPreferences,
    });

    for (const card of results) await this.rememberGrounding(card, ctx);
    if (!results.length) return { ok: true, digest: "NO RESULTS — no active product matched these exact filters.", productIds: [] };

    const lines = results.map((card, i) => {
      const full = ctx.groundingProducts.get(card.id);
      const sizes = full?.sizes.join("/") ?? "";
      return `${i + 1}. id=${card.id} | ${card.brandName} ${card.name} | ${card.price} IQD | stock=${card.inStock ? card.stock : 0}${sizes ? ` | sizes: ${sizes}` : ""}${card.shadeName ? ` | shade: ${card.shadeName}` : ""}`;
    });
    return { ok: true, digest: lines.join("\n"), productIds: results.map((r) => r.id) };
  }

  private async getProductById(productId: string, ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!productId) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: productId required", productIds: [] };
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { ...CardProductInclude, variants: true },
    });
    if (!product) return { ok: true, digest: "PRODUCT NOT FOUND — tell the user it is not available.", productIds: [] };

    const card = this.cards.toCard(product);
    await this.rememberGrounding(card, ctx, product);
    const description = (product.descriptionAr || product.description || "").slice(0, 300);
    const shades = (product.shades ?? [])
      .slice(0, 8)
      .map((s) => `${s.name}(${s.stock > 0 ? `${s.price ?? product.price} IQD, stock ${s.stock}` : "غير متوفر"})`)
      .join(", ");
    const sizes = (product.variants ?? []).map((v) => v.sizeLabel ?? v.label).filter(Boolean).join("/");
    return {
      ok: true,
      digest: `id=${product.id} | ${product.brand?.name} ${card.name}\nprice: ${card.price} IQD${card.oldPrice > card.price ? ` (بدلاً من ${card.oldPrice})` : ""}\nstock: ${product.stock}\n${description ? `وصف: ${description}\n` : ""}${shades ? `درجات: ${shades}\n` : ""}${sizes ? `أحجام: ${sizes}` : ""}`,
      productIds: [product.id],
    };
  }

  private async findAlternatives(productId: string, direction: "cheaper" | "similar" | "upgrade", ctx: ToolExecutionContext): Promise<ToolResult> {
    const reference = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { ...CardProductInclude, category: { select: { id: true, name: true, nameAr: true } } },
    });
    if (!reference) return { ok: true, digest: "PRODUCT NOT FOUND", productIds: [] };

    const price = reference.price;
    const results = await this.search.search({
      queries: [`${reference.brand?.name ?? ""} ${reference.nameAr || reference.name}`.trim(), reference.category?.nameAr ?? reference.category?.name ?? ""].filter(Boolean),
      categoryIds: reference.categoryId ? [reference.categoryId] : undefined,
      maxPrice: direction === "cheaper" ? Math.max(1000, Math.round(price * 0.85)) : undefined,
      minPrice: direction === "upgrade" ? Math.round(price * 1.1) : undefined,
      inStockOnly: true,
      limit: 6,
    });
    const filtered = results.filter((r) => r.id !== productId).slice(0, 5);
    for (const card of filtered) await this.rememberGrounding(card, ctx);
    if (!filtered.length) return { ok: true, digest: "NO RESULTS — no suitable alternative found.", productIds: [] };
    const lines = filtered.map((c, i) => `${i + 1}. id=${c.id} | ${c.brandName} ${c.name} | ${c.price} IQD | stock=${c.inStock ? c.stock : 0}`);
    return { ok: true, digest: lines.join("\n"), productIds: filtered.map((c) => c.id) };
  }

  private async compareProducts(productIds: string[], ctx: ToolExecutionContext): Promise<ToolResult> {
    if (productIds.length < 2) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: need 2-3 productIds", productIds: [] };
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { ...CardProductInclude, variants: true },
    });
    if (products.length < 2) return { ok: true, digest: "PRODUCT NOT FOUND — one or more ids are unavailable.", productIds: [] };

    const blocks: string[] = [];
    for (const product of products) {
      const card = this.cards.toCard(product);
      await this.rememberGrounding(card, ctx, product);
      const sizes = (product.variants ?? []).map((v) => v.sizeLabel ?? v.label).filter(Boolean).join("/") || "-";
      const description = (product.descriptionAr || product.description || "").slice(0, 160);
      blocks.push(`id=${product.id} | ${product.brand?.name} ${card.name}\n  price: ${card.price} IQD | sizes: ${sizes} | stock: ${product.stock}\n  ${description}`);
    }
    return { ok: true, digest: blocks.join("\n---\n"), productIds: products.map((p) => p.id) };
  }

  private async getCatalog(): Promise<ToolResult> {
    const cache = await this.getCatalogCache();
    return { ok: true, digest: cache.text, productIds: [] };
  }

  private async getCatalogCache() {
    const now = Date.now();
    if (this.categoriesCache && now - this.categoriesCache.at < CATEGORY_CACHE_TTL) return this.categoriesCache;

    const [categories, brands] = await Promise.all([
      this.prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, nameAr: true }, orderBy: { position: "asc" } }),
      this.prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

    const byHint = new Map<string, string[]>();
    const categoryLines = categories.slice(0, 80).map((c) => `${c.id} ${c.nameAr || c.name}`);
    const brandLines = brands.slice(0, 120).map((b) => `${b.id} ${b.name}`);
    for (const c of categories) {
      for (const source of [c.nameAr, c.name]) {
        const key = normalizeArabicText(source);
        if (key.length >= 2) byHint.set(key, [...(byHint.get(key) ?? []), c.id]);
      }
    }
    const text = `CATEGORIES (id name):\n${categoryLines.join("\n")}\nBRANDS (id name):\n${brandLines.join("\n")}`;
    this.categoriesCache = { at: now, text, byHint };
    return this.categoriesCache;
  }

  /** Resolve Arabic/English category hints to ids using the cached tree. */
  async resolveCategoryIds(hints: string[]): Promise<string[]> {
    if (!hints.length) return [];
    const cache = await this.getCatalogCache();
    const ids = new Set<string>();
    for (const hint of hints) {
      const key = normalizeArabicText(hint);
      for (const [catKey, catIds] of cache.byHint) {
        if (catKey.includes(key) || key.includes(catKey)) {
          for (const id of catIds) ids.add(id);
        }
      }
    }
    return [...ids].slice(0, 8);
  }

  private async getCurrentOffers(ctx: ToolExecutionContext): Promise<ToolResult> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 }, OR: [{ isPromo: true }, { isBogo: true }, { discountPercent: { gt: 0 } }] },
      include: CardProductInclude,
      orderBy: { soldCount: "desc" },
      take: 8,
    });
    for (const product of products) await this.rememberGrounding(this.cards.toCard(product), ctx, product);
    if (!products.length) return { ok: true, digest: "NO ACTIVE OFFERS right now.", productIds: [] };
    const lines = products.map((p, i) => {
      const card = this.cards.toCard(p);
      return `${i + 1}. id=${p.id} | ${p.brand?.name} ${card.name} | ${card.price} IQD${card.discountPercent ? ` | -${card.discountPercent}%` : ""}`;
    });
    return { ok: true, digest: lines.join("\n"), productIds: products.map((p) => p.id) };
  }

  private async getBestsellers(categoryId: string | null, limit: number, ctx: ToolExecutionContext): Promise<ToolResult> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        ...(categoryId ? { OR: [{ categoryId }, { subcategoryId: categoryId }, { tertiaryCategoryId: categoryId }] } : {}),
      },
      include: CardProductInclude,
      orderBy: [{ soldCount: "desc" }, { rating: "desc" }],
      take: limit,
    });
    for (const product of products) await this.rememberGrounding(this.cards.toCard(product), ctx, product);
    if (!products.length) return { ok: true, digest: "NO BESTSELLERS found for this filter.", productIds: [] };
    const lines = products.map((p, i) => {
      const card = this.cards.toCard(p);
      return `${i + 1}. id=${p.id} | ${p.brand?.name} ${card.name} | ${card.price} IQD | sold=${p.soldCount}${p.rating ? ` | rating ${p.rating.toFixed(1)}/5 (${p.reviewCount})` : ""}`;
    });
    return { ok: true, digest: `BESTSELLERS:\n${lines.join("\n")}`, productIds: products.map((p) => p.id) };
  }

  private async getSkinGuidance(concern: string | null, ctx: ToolExecutionContext): Promise<ToolResult> {
    const concerns = await this.prisma.skinConcern.findMany({
      where: { isActive: true },
      include: { products: { take: 3, include: { product: { include: CardProductInclude } } } },
      orderBy: { position: "asc" },
      take: 12,
    });
    if (!concerns.length) return { ok: true, digest: "NO SKIN GUIDE data available.", productIds: [] };

    const key = concern ? normalizeArabicText(concern) : "";
    const focused = key ? concerns.filter((c) => normalizeArabicText(c.name).includes(key) || key.includes(normalizeArabicText(c.name))) : [];
    const selected = focused.length ? focused : concerns.slice(0, 5);

    const blocks = selected.map((c) => {
      const productLines = c.products
        .filter((link) => link.product?.isActive)
        .map((link) => {
          void this.rememberGrounding(this.cards.toCard(link.product), ctx, link.product);
          const card = this.cards.toCard(link.product);
          return `  - id=${card.id} | ${card.brandName} ${card.name} | ${card.price} IQD`;
        });
      return `${c.name}: ${c.description.slice(0, 180)}\n${productLines.join("\n") || "  (بدون منتجات مرتبطة)"}`;
    });
    return {
      ok: true,
      digest: `SKIN GUIDE:\n${blocks.join("\n\n")}\n(لا تشخيص طبي — معلومات عامة من دليل المتجر فقط.)`,
      productIds: selected.flatMap((c) => c.products.filter((l) => l.product?.isActive).map((l) => l.product.id)),
    };
  }

  private async getFavorites(ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx.userId) return { ok: true, digest: "USER NOT SIGNED IN — favorites need an account.", productIds: [] };
    const rows = await this.prisma.wishlist.findMany({
      where: { userId: ctx.userId },
      select: { productId: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    const products = rows.length
      ? await this.prisma.product.findMany({
          where: { id: { in: rows.map((r) => r.productId) }, isActive: true },
          include: CardProductInclude,
        })
      : [];
    for (const product of products) await this.rememberGrounding(this.cards.toCard(product), ctx, product);
    if (!products.length) return { ok: true, digest: "WISHLIST IS EMPTY.", productIds: [] };
    const lines = products.map((p, i) => `${i + 1}. id=${p.id} | ${p.brand?.name} ${this.cards.toCard(p).name} | ${p.price} IQD`);
    return { ok: true, digest: lines.join("\n"), productIds: products.map((p) => p.id) };
  }

  private async toggleFavorite(productId: string, ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx.userId) return { ok: true, digest: "USER NOT SIGNED IN — favorites need an account.", productIds: [] };
    if (!productId) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: productId required", productIds: [] };
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId: ctx.userId, productId } },
    });
    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { ok: true, digest: "FAVORITE REMOVED — confirm to the user.", productIds: [productId] };
    }
    const product = await this.prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
    if (!product) return { ok: true, digest: "PRODUCT NOT FOUND", productIds: [] };
    await this.prisma.wishlist.create({ data: { userId: ctx.userId, productId } });
    return { ok: true, digest: "FAVORITE ADDED — confirm to the user.", productIds: [productId] };
  }

  private async getMyOrders(limit: number, ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx.userId) return { ok: true, digest: "USER NOT SIGNED IN — tell the user orders need signing in inside the app.", productIds: [] };
    const orders = await this.prisma.order.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { _count: { select: { items: true } } },
    });
    if (!orders.length) return { ok: true, digest: "NO ORDERS YET for this account.", productIds: [] };

    const lines = orders.map((order, i) => {
      this.rememberOrder(order.id, order.orderNumber, order.status, order.total, order._count.items, order.createdAt, ctx);
      return `${i + 1}. orderNumber=${order.orderNumber} | status=${order.status} (${ORDER_STATUS_LABELS[order.status] ?? order.status}) | total=${formatIQD(order.total)} | items=${order._count.items} | date=${order.createdAt.toISOString().slice(0, 10)} | orderId=${order.id}`;
    });
    return { ok: true, digest: `RECENT ORDERS:\n${lines.join("\n")}\nUse getOrderDetails for a specific order when the user asks about its contents.`, productIds: [] };
  }

  private async getOrderDetails(orderRef: string, ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx.userId) return { ok: true, digest: "USER NOT SIGNED IN — tell the user orders need signing in inside the app.", productIds: [] };
    if (!orderRef) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: orderRef required", productIds: [] };
    const order = await this.prisma.order.findFirst({
      where: { userId: ctx.userId, OR: [{ orderNumber: orderRef }, { id: orderRef }] },
      include: { items: { include: { product: { include: CardProductInclude } } } },
    });
    if (!order) return { ok: true, digest: `ORDER NOT FOUND for ref ${orderRef} under this account — say it honestly.`, productIds: [] };

    this.rememberOrder(order.id, order.orderNumber, order.status, order.total, order.items.length, order.createdAt, ctx);
    const itemLines = order.items.map((item) => {
      if (item.product?.isActive) void this.rememberGrounding(this.cards.toCard(item.product), ctx, item.product);
      const shade = item.shadeId ? (item.product?.shades ?? []).find((s) => s.id === item.shadeId) : undefined;
      return `- ${item.productName} x${item.quantity} @ ${formatIQD(item.unitPrice)}${shade ? ` (درجة: ${shade.name})` : ""} = ${formatIQD(item.totalPrice)}${item.product?.isActive ? "" : " [المنتج غير متوفر حالياً]"}`;
    });
    return {
      ok: true,
      digest: [
        `ORDER ${order.orderNumber} (id=${order.id})`,
        `status: ${order.status} (${ORDER_STATUS_LABELS[order.status] ?? order.status}) | payment: ${order.paymentMethod}/${order.paymentStatus} | delivery: ${order.deliveryOption}`,
        `date: ${order.createdAt.toISOString().slice(0, 10)}${order.deliveryDate ? ` | delivery expected: ${order.deliveryDate.toISOString().slice(0, 10)}` : ""}`,
        `items:\n${itemLines.join("\n")}`,
        `subtotal=${formatIQD(order.subtotal)} discount=${formatIQD(order.discountTotal)} shipping=${formatIQD(order.shippingTotal)} TOTAL=${formatIQD(order.total)}`,
        order.loyaltyEarned || order.loyaltySpent ? `loyalty: earned=${order.loyaltyEarned} spent=${order.loyaltySpent}` : "",
        "To re-order use prepareReorder with this orderId.",
      ]
        .filter(Boolean)
        .join("\n"),
      productIds: order.items.filter((i) => i.product?.isActive).map((i) => i.productId),
    };
  }

  private async getLoyaltyStatus(ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx.userId) return { ok: true, digest: "USER NOT SIGNED IN — tell the user loyalty points need signing in inside the app.", productIds: [] };
    const [user, history] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: ctx.userId }, select: { loyaltyPoints: true } }),
      this.prisma.loyaltyHistory.findMany({ where: { userId: ctx.userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    const balance = user?.loyaltyPoints ?? 0;
    if (!history.length && balance === 0) {
      return { ok: true, digest: "NO LOYALTY ACTIVITY yet — points are earned on every completed order.", productIds: [] };
    }
    const lines = history.map((h) => `- ${h.createdAt.toISOString().slice(0, 10)} ${h.title}: ${h.isEarned ? "+" : "-"}${Math.abs(h.points)}`);
    return {
      ok: true,
      digest: `LOYALTY BALANCE: ${balance} نقطة\nRECENT MOVEMENTS:\n${lines.join("\n") || "(none)"}`,
      productIds: [],
    };
  }

  private async getProductReviews(productId: string, ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!productId) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: productId required", productIds: [] };
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { ...CardProductInclude, reviews: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 3 } },
    });
    if (!product) return { ok: true, digest: "PRODUCT NOT FOUND", productIds: [] };
    await this.rememberGrounding(this.cards.toCard(product), ctx, product);

    if (!product.reviewCount && !product.reviews.length) {
      return { ok: true, digest: `NO REVIEWS yet for ${product.nameAr || product.name}.`, productIds: [product.id] };
    }
    const comments = product.reviews.map((r) => `- ${r.userName} (${r.rating}/5): "${r.comment.slice(0, 180)}"`);
    return {
      ok: true,
      digest: `REVIEWS for ${product.brand?.name} ${product.nameAr || product.name}:\naverage rating: ${product.rating.toFixed(1)}/5 from ${product.reviewCount} reviews\n${comments.join("\n") || "(no written comments — ratings only)"}`,
      productIds: [product.id],
    };
  }

  private async prepareReorder(orderId: string, ctx: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx.userId) return { ok: true, digest: "USER NOT SIGNED IN — tell the user reordering needs signing in inside the app.", productIds: [] };
    if (!orderId) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: orderId required", productIds: [] };
    const order = await this.prisma.order.findFirst({
      where: { userId: ctx.userId, OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { items: { include: { product: { include: CardProductInclude } } } },
    });
    if (!order) return { ok: true, digest: `ORDER NOT FOUND for ref ${orderId} under this account.`, productIds: [] };

    this.rememberOrder(order.id, order.orderNumber, order.status, order.total, order.items.length, order.createdAt, ctx);

    const added: string[] = [];
    const unavailable: string[] = [];
    for (const item of order.items) {
      const product = item.product;
      if (!product?.isActive) {
        unavailable.push(`${item.productName} (متوقف)`);
        continue;
      }
      const shade = item.shadeId ? (product.shades ?? []).find((s) => s.id === item.shadeId) : undefined;
      const stock = shade ? shade.stock : product.stock;
      if (stock <= 0) {
        unavailable.push(`${item.productName}${shade ? ` درجة ${shade.name}` : ""} (غير متوفر حالياً)`);
        await this.rememberGrounding(this.cards.toCard(product), ctx, product);
        continue;
      }
      const card = this.cards.toCard(product, shade ?? undefined);
      const action: AssistantClientAction = {
        type: "ADD_TO_CART",
        productId: product.id,
        shadeId: shade?.id ?? null,
        shadeName: shade?.name ?? null,
        quantity: Math.max(1, Math.min(item.quantity, Math.min(10, stock))),
        actionId: `reorder-${order.id}-${product.id}-${shade?.id ?? "base"}-${Date.now()}`,
      };
      ctx.collectedActions.push(action);
      await this.rememberGrounding(card, ctx, product);
      added.push(`${item.productName} x${action.quantity}`);
    }

    const parts = [`REORDER of ${order.orderNumber}:`];
    parts.push(added.length ? `ADDED TO CART (the app adds them automatically): ${added.join(", ")}` : "NOTHING COULD BE ADDED.");
    if (unavailable.length) parts.push(`UNAVAILABLE (mention honestly, offer alternatives): ${unavailable.join(", ")}`);
    return { ok: true, digest: parts.join("\n"), productIds: order.items.filter((i) => i.product?.isActive).map((i) => i.productId) };
  }

  private rememberOrder(
    id: string,
    orderNumber: string,
    status: string,
    total: number,
    itemCount: number,
    createdAt: Date,
    ctx: ToolExecutionContext,
  ): void {
    if (ctx.collectedOrders.some((o) => o.id === id)) return;
    ctx.collectedOrders.push({
      id,
      orderNumber,
      status,
      total,
      itemCount,
      createdAt: createdAt.toISOString(),
      deepLink: `/orders/${id}`,
    });
  }

  private async prepareCartAction(
    productId: string,
    shadeId: string | null,
    quantity: number,
    ctx: ToolExecutionContext,
  ): Promise<ToolResult> {
    if (!productId) return { ok: false, digest: "ERROR INVALID_TOOL_ARGS: productId required", productIds: [] };
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: CardProductInclude,
    });
    if (!product) return { ok: true, digest: "PRODUCT NOT FOUND", productIds: [] };

    const shade = shadeId ? (product.shades ?? []).find((s) => s.id === shadeId) ?? null : null;
    if (shadeId && !shade) return { ok: true, digest: `SHADE NOT FOUND — available: ${(product.shades ?? []).map((s) => s.id).join(", ") || "none"}`, productIds: [product.id] };

    const stock = shade ? shade.stock : product.stock;
    if (stock <= 0) return { ok: true, digest: "OUT OF STOCK — offer an alternative instead of adding.", productIds: [product.id] };

    const card = this.cards.toCard(product, shade);
    const action: AssistantClientAction = {
      type: "ADD_TO_CART",
      productId: product.id,
      shadeId: shade?.id ?? null,
      shadeName: shade?.name ?? null,
      quantity: Math.max(1, Math.min(quantity, Math.min(10, stock))),
      actionId: `cart-${product.id}-${shade?.id ?? "base"}-${Date.now()}`,
    };
    ctx.collectedActions.push(action);
    await this.rememberGrounding(card, ctx, product);
    return {
      ok: true,
      digest: `CART ACTION PREPARED: ${card.brandName} ${card.name} (${action.quantity}x, ${card.price} IQD${shade ? `, shade ${shade.name}` : ""}). Confirm naturally to the user — the app adds it automatically.`,
      productIds: [product.id],
    };
  }

  private async rememberGrounding(
    card: AssistantProductCard,
    ctx: ToolExecutionContext,
    full?: { shades?: Array<{ id: string; name: string; price: number | null; stock: number }>; variants?: Array<{ label?: string | null; sizeLabel?: string | null }> } | null,
  ): Promise<void> {
    if (ctx.groundingProducts.has(card.id)) return;
    let sizes: string[] = [];
    if (full) {
      sizes = (full.variants ?? []).map((v) => v.sizeLabel ?? v.label).filter((s): s is string => Boolean(s));
    } else {
      const row = await this.prisma.product.findUnique({ where: { id: card.id }, select: { variants: { select: { label: true, sizeLabel: true } } } });
      sizes = (row?.variants ?? []).map((v) => v.sizeLabel ?? v.label).filter((s): s is string => Boolean(s));
    }
    ctx.groundingProducts.set(card.id, {
      id: card.id,
      name: card.name,
      brand: card.brandName,
      price: card.price,
      stock: card.inStock ? card.stock : 0,
      shades: (full?.shades ?? []).map((s) => ({ id: s.id, name: s.name, price: s.price ?? null, stock: s.stock ?? 0 })),
      sizes,
    });
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function num(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
}

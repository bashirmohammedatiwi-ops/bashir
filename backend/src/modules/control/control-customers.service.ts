import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { PRODUCT_PLACEHOLDER_HASH } from "../../common/product-placeholder.util";
import { PrismaService } from "../../common/prisma.service";
import { ControlService } from "./control.service";

const COUNTED: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

/** الزبونات (مع إجمالي مشترياتهن) + فحص صحة المتجر لتطبيق المدير. */
@Injectable()
export class ControlCustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly control: ControlService,
  ) {}

  async list(q: { q?: string; sort?: string; page?: number; limit?: number }) {
    const limit = Math.min(Math.max(q.limit ?? 30, 1), 60);
    const page = Math.max(q.page ?? 1, 1);
    const text = q.q?.trim();
    const where: Prisma.UserWhereInput = { role: Role.CUSTOMER, deletedAt: null };
    if (text) {
      const digits = text.replace(/\D/g, "").replace(/^0+/, "");
      where.OR = [
        { name: { contains: text, mode: "insensitive" } },
        { email: { contains: text, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
      ];
    }
    const total = await this.prisma.user.count({ where });
    let ids: string[];
    if (q.sort === "spent" || q.sort === "orders") {
      // ترتيب بالمشتريات يحتاج تجميع الطلبات
      const where2 = text ? Prisma.sql`AND u.id IN (SELECT id FROM "User" WHERE ${Prisma.join(
        [Prisma.sql`name ILIKE ${`%${text}%`}`, Prisma.sql`email ILIKE ${`%${text}%`}`, Prisma.sql`phone LIKE ${`%${text.replace(/\D/g, "").replace(/^0+/, "") || "§"}%`}`],
        " OR ",
      )})` : Prisma.empty;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT u.id FROM "User" u
        LEFT JOIN "Order" o ON o."userId" = u.id AND o.status::text IN (${Prisma.join(COUNTED)})
        WHERE u.role = 'CUSTOMER' AND u."deletedAt" IS NULL ${where2}
        GROUP BY u.id
        ORDER BY ${q.sort === "spent" ? Prisma.sql`COALESCE(SUM(o.total), 0)` : Prisma.sql`COUNT(o.id)`} DESC, u."createdAt" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
      ids = rows.map((r) => r.id);
    } else {
      ids = (
        await this.prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, select: { id: true } })
      ).map((u) => u.id);
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, phone: true, email: true, isActive: true, loyaltyPoints: true, createdAt: true, lastLoginAt: true },
    });
    const stats = await this.orderStats(ids);
    const byId = new Map(users.map((u) => [u.id, u]));
    return {
      data: ids
        .map((id) => byId.get(id))
        .filter((u): u is NonNullable<typeof u> => !!u)
        .map((u) => ({ ...u, ...(stats.get(u.id) ?? { orders: 0, spent: 0, lastOrderAt: null }) })),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page * limit < total },
    };
  }

  private async orderStats(ids: string[]) {
    if (!ids.length) return new Map<string, { orders: number; spent: number; lastOrderAt: Date | null }>();
    const rows = await this.prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: { in: COUNTED } },
      _count: { _all: true },
      _sum: { total: true },
      _max: { createdAt: true },
    });
    return new Map(rows.map((r) => [r.userId, { orders: r._count._all, spent: r._sum.total ?? 0, lastOrderAt: r._max.createdAt }]));
  }

  async detail(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
        birthday: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: { orderBy: { isDefault: "desc" }, select: { id: true, fullName: true, phone: true, governorate: true, city: true, area: true, street: true, isDefault: true } },
        _count: { select: { reviews: true, wishlist: true } },
      },
    });
    if (!u || u.role !== Role.CUSTOMER) throw new NotFoundException("الزبونة غير موجودة");
    const [stats, orders, loyalty, cancelled] = await Promise.all([
      this.orderStats([id]),
      this.prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } },
      }),
      this.prisma.loyaltyHistory.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.order.count({ where: { userId: id, status: OrderStatus.CANCELLED } }),
    ]);
    const s = stats.get(id) ?? { orders: 0, spent: 0, lastOrderAt: null };
    return {
      ...u,
      orders: s.orders,
      spent: s.spent,
      lastOrderAt: s.lastOrderAt,
      averageOrder: s.orders ? Math.round(s.spent / s.orders) : 0,
      cancelled,
      reviewsCount: u._count.reviews,
      wishlistCount: u._count.wishlist,
      recentOrders: orders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, total: o.total, createdAt: o.createdAt, items: o._count.items })),
      loyalty: loyalty.map((l) => ({ id: l.id, title: l.title, points: l.points, isEarned: l.isEarned, createdAt: l.createdAt })),
    };
  }

  /** حظر/فك حظر (الحساب الموقوف لا يستطيع الدخول ولا الطلب). */
  async setActive(id: string, isActive: boolean, actorId?: string) {
    await this.ensureCustomer(id);
    await this.prisma.user.update({ where: { id }, data: { isActive } });
    if (!isActive) await this.prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.control.audit(actorId, isActive ? "customer.unblock" : "customer.block", "User", id);
    return this.detail(id);
  }

  /** إضافة أو خصم نقاط مع سبب يظهر في سجل نقاطها. */
  async adjustPoints(id: string, points: number, reason: string, actorId?: string) {
    if (!Number.isInteger(points) || points === 0) throw new BadRequestException("اكتب عدد النقاط");
    const title = reason.trim() || (points > 0 ? "نقاط هدية من المتجر" : "تعديل نقاط");
    const user = await this.ensureCustomer(id);
    if (points < 0 && user.loyaltyPoints + points < 0) throw new BadRequestException(`رصيدها ${user.loyaltyPoints} نقطة فقط`);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { loyaltyPoints: { increment: points } } }),
      this.prisma.loyaltyHistory.create({ data: { userId: id, title, points: Math.abs(points), isEarned: points > 0 } }),
    ]);
    await this.control.audit(actorId, "customer.points", "User", id, { points, reason: title });
    return this.detail(id);
  }

  private async ensureCustomer(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, loyaltyPoints: true } });
    if (!u || u.role !== Role.CUSTOMER) throw new NotFoundException("الزبونة غير موجودة");
    return u;
  }

  // ------------------------------------------------------------ store health

  /** قائمة فحص المتجر: كل بند عدد + الفلتر الذي يفتحه في البحث. */
  async health() {
    const realImage = Prisma.sql`EXISTS (
      SELECT 1 FROM "ProductImage" pi JOIN "Media" m ON m.id = pi."mediaId"
      WHERE pi."productId" = p.id AND m.hash <> ${PRODUCT_PLACEHOLDER_HASH} AND m."storagePath" <> 'placeholder')`;
    const settings = await this.prisma.setting.findUnique({ where: { key: "store" } });
    const threshold = Number((settings?.value as Record<string, unknown> | null)?.lowStockThreshold ?? 5) || 5;
    const [row] = await this.prisma.$queryRaw<
      [{ no_images: bigint; no_category: bigint; no_description: bigint; out_of_stock: bigint; low_stock: bigint; no_barcode: bigint; off_with_stock: bigint; shades_off_with_stock: bigint }]
    >`
      SELECT
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND NOT ${realImage})::bigint AS no_images,
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND p."categoryId" IS NULL)::bigint AS no_category,
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND btrim(coalesce(p."descriptionAr", p.description, '')) = '')::bigint AS no_description,
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND p.stock <= 0)::bigint AS out_of_stock,
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND p.stock > 0 AND p.stock <= ${threshold})::bigint AS low_stock,
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND (p.barcode IS NULL OR btrim(p.barcode) = '')
           AND NOT EXISTS (SELECT 1 FROM "ProductShade" s WHERE s."productId" = p.id AND s.barcode IS NOT NULL AND btrim(s.barcode) <> ''))::bigint AS no_barcode,
        (SELECT COUNT(*) FROM "Product" p WHERE NOT p."isActive" AND p.stock > 0 AND ${realImage})::bigint AS off_with_stock,
        (SELECT COUNT(*) FROM "ProductShade" s WHERE NOT s."isActive" AND s.stock > 0)::bigint AS shades_off_with_stock`;
    const [pendingReviews, lastRun, failedRuns, lastSnapshot, pendingOrdersOld] = await Promise.all([
      this.prisma.review.count({ where: { approved: false } }),
      this.prisma.posSyncRun.findFirst({ orderBy: { createdAt: "desc" }, select: { ok: true, createdAt: true, changedItems: true, errorMessage: true } }),
      this.prisma.posSyncRun.count({ where: { ok: false, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
      this.prisma.inventorySyncSnapshot.aggregate({ _max: { syncedAt: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING, createdAt: { lt: new Date(Date.now() - 6 * 3_600_000) } } }),
    ]);
    const n = (v: bigint) => Number(v);
    return {
      threshold,
      pos: { lastRunAt: lastRun?.createdAt ?? null, lastRunOk: lastRun?.ok ?? null, lastError: lastRun?.errorMessage ?? null, failedLastDay: failedRuns, lastSyncedAt: lastSnapshot._max.syncedAt },
      items: [
        { key: "pendingOrdersOld", label: "طلبات جديدة لم تُراجع منذ 6 ساعات", count: pendingOrdersOld, severity: "high", target: "orders:PENDING" },
        { key: "noImages", label: "منتجات ظاهرة بلا صور", count: n(row.no_images), severity: "high", target: "search:active:noImages" },
        { key: "outOfStock", label: "منتجات ظاهرة ونافدة", count: n(row.out_of_stock), severity: "medium", target: "search:active:outOfStock" },
        { key: "lowStock", label: `مخزون قليل (${threshold} أو أقل)`, count: n(row.low_stock), severity: "medium", target: "search:active:lowStock" },
        { key: "offWithStock", label: "موقوفة ولها مخزون وصور (قد تُشغّل)", count: n(row.off_with_stock), severity: "medium", target: "search:inactive:ready" },
        { key: "shadesOffWithStock", label: "تدرجات موقوفة ولها مخزون", count: n(row.shades_off_with_stock), severity: "low", target: "search:all:shadesOff" },
        { key: "noCategory", label: "منتجات بلا قسم", count: n(row.no_category), severity: "medium", target: "search:active:noCategory" },
        { key: "noDescription", label: "منتجات بلا وصف", count: n(row.no_description), severity: "low", target: "search:active:noDescription" },
        { key: "noBarcode", label: "منتجات بلا باركود (لا تتزامن مع الكاشير)", count: n(row.no_barcode), severity: "low", target: "search:active:noBarcode" },
        { key: "pendingReviews", label: "تقييمات بانتظار الموافقة", count: pendingReviews, severity: "low", target: "reviews" },
      ],
    };
  }
}

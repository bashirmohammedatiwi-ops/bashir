import { Injectable } from "@nestjs/common";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { getCached, setCached } from "../../common/memory-cache.util";
import { PrismaService } from "../../common/prisma.service";

type SalesQuery = { from?: string; to?: string };

const VALID_SALES_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.REFUNDED,
] as const;

const DASHBOARD_CACHE_MS = 90_000;
const SALES_CACHE_MS = 5 * 60_000;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const cached = getCached<Awaited<ReturnType<ReportsService["buildDashboard"]>>>("reports:dashboard");
    if (cached) return cached;

    const result = await this.buildDashboard();
    setCached("reports:dashboard", result, DASHBOARD_CACHE_MS);
    return result;
  }

  private async buildDashboard() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const revenueSince = new Date();
    revenueSince.setDate(revenueSince.getDate() - 13);
    revenueSince.setHours(0, 0, 0, 0);

    const [productsCount, ordersCount, usersCount, salesAgg, statusBreakdown, topProducts, revenueRows] =
      await this.prisma.$transaction([
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.order.count(),
        this.prisma.user.count({ where: { role: "CUSTOMER" } }),
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            createdAt: { gte: since },
            status: { not: OrderStatus.CANCELLED },
          },
        }),
        this.prisma.order.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        this.prisma.product.findMany({
          orderBy: { soldCount: "desc" },
          take: 8,
          select: {
            id: true,
            name: true,
            soldCount: true,
            price: true,
            brand: { select: { id: true, name: true } },
          },
        }),
        this.prisma.$queryRaw<Array<{ day: string; amount: number }>>`
          SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
                 COALESCE(SUM(total), 0)::int AS amount
          FROM "Order"
          WHERE "createdAt" >= ${revenueSince}
            AND status <> ${OrderStatus.CANCELLED}::"OrderStatus"
          GROUP BY 1
          ORDER BY 1
        `,
      ]);

    const amountByDay = new Map(revenueRows.map((r) => [r.day, Number(r.amount) || 0]));
    const revenueByDay: { day: string; amount: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(revenueSince);
      d.setDate(revenueSince.getDate() + i);
      const day = d.toISOString().slice(0, 10);
      revenueByDay.push({ day, amount: amountByDay.get(day) ?? 0 });
    }

    return {
      kpi: {
        productsCount,
        ordersCount,
        usersCount,
        salesLast30Days: salesAgg._sum.total ?? 0,
      },
      ordersByStatus: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      revenueByDay,
      topProducts,
    };
  }

  async sales(q: SalesQuery) {
    const from = q.from ? new Date(q.from) : new Date(Date.now() - 30 * 86400000);
    const to = q.to ? new Date(q.to) : new Date();
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);

    const cacheKey = `reports:sales:${from.toISOString().slice(0, 10)}:${to.toISOString().slice(0, 10)}`;
    const cached = getCached<Awaited<ReturnType<ReportsService["buildSales"]>>>(cacheKey);
    if (cached) return cached;

    const result = await this.buildSales(from, to);
    setCached(cacheKey, result, SALES_CACHE_MS);
    return result;
  }

  private async buildSales(from: Date, to: Date) {
    const statusList = VALID_SALES_STATUSES;

    const [summaryRow, byBrand, byCategory, topSelling, topRefunded, byStaff] =
      await Promise.all([
        this.prisma.$queryRaw<Array<{ orderCount: bigint; revenue: bigint; itemsSold: bigint }>>`
          SELECT COUNT(DISTINCT o.id)::bigint AS "orderCount",
                 COALESCE(SUM(o.total), 0)::bigint AS revenue,
                 COALESCE(SUM(oi.quantity), 0)::bigint AS "itemsSold"
          FROM "Order" o
          LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o.status IN (${Prisma.join(statusList)})
        `,
        this.prisma.$queryRaw<
          Array<{ brandId: string; brandName: string; revenue: number; quantity: number }>
        >`
          SELECT b.id AS "brandId",
                 b.name AS "brandName",
                 COALESCE(SUM(oi."totalPrice"), 0)::int AS revenue,
                 COALESCE(SUM(oi.quantity), 0)::int AS quantity
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o.id
          INNER JOIN "Product" p ON oi."productId" = p.id
          INNER JOIN "Brand" b ON p."brandId" = b.id
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o.status IN (${Prisma.join(statusList)})
          GROUP BY b.id, b.name
          ORDER BY revenue DESC
        `,
        this.prisma.$queryRaw<
          Array<{ categoryId: string; categoryName: string; revenue: number; quantity: number }>
        >`
          SELECT c.id AS "categoryId",
                 c.name AS "categoryName",
                 COALESCE(SUM(oi."totalPrice"), 0)::int AS revenue,
                 COALESCE(SUM(oi.quantity), 0)::int AS quantity
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o.id
          INNER JOIN "Product" p ON oi."productId" = p.id
          INNER JOIN "Category" c ON p."categoryId" = c.id
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o.status IN (${Prisma.join(statusList)})
          GROUP BY c.id, c.name
          ORDER BY revenue DESC
        `,
        this.prisma.$queryRaw<
          Array<{ productId: string; name: string; sku: string; quantity: number; revenue: number }>
        >`
          SELECT oi."productId",
                 MAX(oi."productName") AS name,
                 MAX(oi."productSku") AS sku,
                 COALESCE(SUM(oi.quantity), 0)::int AS quantity,
                 COALESCE(SUM(oi."totalPrice"), 0)::int AS revenue
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o.status IN (${Prisma.join(statusList)})
          GROUP BY oi."productId"
          ORDER BY quantity DESC
          LIMIT 20
        `,
        this.prisma.$queryRaw<
          Array<{ productId: string; name: string; sku: string; quantity: number; revenue: number }>
        >`
          SELECT oi."productId",
                 MAX(oi."productName") AS name,
                 MAX(oi."productSku") AS sku,
                 COALESCE(SUM(oi.quantity), 0)::int AS quantity,
                 COALESCE(SUM(oi."totalPrice"), 0)::int AS revenue
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."createdAt" >= ${from}
            AND o."createdAt" <= ${to}
            AND o.status = ${OrderStatus.REFUNDED}::"OrderStatus"
          GROUP BY oi."productId"
          ORDER BY quantity DESC
          LIMIT 20
        `,
        this.prisma.$queryRaw<
          Array<{
            staffId: string;
            name: string;
            email: string | null;
            updates: number;
            orderTotal: number;
          }>
        >`
          SELECT u.id AS "staffId",
                 COALESCE(u.name, u.email, '—') AS name,
                 u.email,
                 COUNT(*)::int AS updates,
                 COALESCE(SUM((al.meta->>'orderTotal')::int), 0)::int AS "orderTotal"
          FROM "AuditLog" al
          INNER JOIN "User" u ON al."actorId" = u.id
          WHERE al.action = 'ORDER_STATUS_UPDATE'
            AND al.entity = 'Order'
            AND al."createdAt" >= ${from}
            AND al."createdAt" <= ${to}
            AND u.role IN (${Prisma.join([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF])})
          GROUP BY u.id, u.name, u.email
          ORDER BY "orderTotal" DESC
        `,
      ]);

    const summaryData = summaryRow[0];
    const summary = {
      orderCount: Number(summaryData?.orderCount ?? 0),
      revenue: Number(summaryData?.revenue ?? 0),
      itemsSold: Number(summaryData?.itemsSold ?? 0),
    };

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      summary,
      byBrand,
      byCategory,
      byStaff,
      topSelling,
      topRefunded,
    };
  }
}

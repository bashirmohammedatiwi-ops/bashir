import { Injectable } from "@nestjs/common";
import { OrderStatus, Role } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";

type SalesQuery = { from?: string; to?: string };

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const revenueSince = new Date();
    revenueSince.setDate(revenueSince.getDate() - 13);
    revenueSince.setHours(0, 0, 0, 0);

    const [productsCount, ordersCount, usersCount, salesAgg, statusBreakdown, topProducts, recentOrders] =
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
        this.prisma.order.findMany({
          where: {
            createdAt: { gte: revenueSince },
            status: { not: OrderStatus.CANCELLED },
          },
          select: { createdAt: true, total: true },
        }),
      ]);

    const ordersByStatus = statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    const revenueByDay: { day: string; amount: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(revenueSince);
      d.setDate(revenueSince.getDate() + i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const amount = recentOrders
        .filter((o) => o.createdAt >= d && o.createdAt < next)
        .reduce((sum, o) => sum + o.total, 0);
      revenueByDay.push({
        day: d.toISOString().slice(0, 10),
        amount,
      });
    }

    return {
      kpi: {
        productsCount,
        ordersCount,
        usersCount,
        salesLast30Days: salesAgg._sum.total ?? 0,
      },
      ordersByStatus,
      revenueByDay,
      topProducts,
    };
  }

  async sales(q: SalesQuery) {
    const from = q.from ? new Date(q.from) : new Date(Date.now() - 30 * 86400000);
    const to = q.to ? new Date(q.to) : new Date();
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);

    const validStatuses = [
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.REFUNDED,
    ];

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: validStatuses },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                brand: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const summary = {
      orderCount: orders.length,
      revenue: orders.reduce((s, o) => s + o.total, 0),
      itemsSold: orders.reduce((s, o) => s + o.items.reduce((n, it) => n + it.quantity, 0), 0),
    };

    const brandMap = new Map<string, { brandId: string; brandName: string; revenue: number; quantity: number }>();
    const categoryMap = new Map<string, { categoryId: string; categoryName: string; revenue: number; quantity: number }>();
    const productMap = new Map<string, { productId: string; name: string; sku: string; quantity: number; revenue: number }>();

    for (const order of orders) {
      for (const item of order.items) {
        const brand = item.product.brand;
        if (brand) {
          const cur = brandMap.get(brand.id) ?? {
            brandId: brand.id,
            brandName: brand.name,
            revenue: 0,
            quantity: 0,
          };
          cur.revenue += item.totalPrice;
          cur.quantity += item.quantity;
          brandMap.set(brand.id, cur);
        }

        const category = item.product.category;
        if (category) {
          const cur = categoryMap.get(category.id) ?? {
            categoryId: category.id,
            categoryName: category.name,
            revenue: 0,
            quantity: 0,
          };
          cur.revenue += item.totalPrice;
          cur.quantity += item.quantity;
          categoryMap.set(category.id, cur);
        }

        const cur = productMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.productName,
          sku: item.productSku,
          quantity: 0,
          revenue: 0,
        };
        cur.quantity += item.quantity;
        cur.revenue += item.totalPrice;
        productMap.set(item.productId, cur);
      }
    }

    const refundedOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: OrderStatus.REFUNDED,
      },
      include: { items: true },
    });

    const refundMap = new Map<string, { productId: string; name: string; sku: string; quantity: number; revenue: number }>();
    for (const order of refundedOrders) {
      for (const item of order.items) {
        const cur = refundMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.productName,
          sku: item.productSku,
          quantity: 0,
          revenue: 0,
        };
        cur.quantity += item.quantity;
        cur.revenue += item.totalPrice;
        refundMap.set(item.productId, cur);
      }
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        action: "ORDER_STATUS_UPDATE",
        entity: "Order",
        createdAt: { gte: from, lte: to },
        actor: { role: { in: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] } },
      },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    });

    const staffMap = new Map<
      string,
      { staffId: string; name: string; email: string | null; updates: number; orderTotal: number }
    >();
    for (const log of auditLogs) {
      if (!log.actorId || !log.actor) continue;
      const meta = (log.meta ?? {}) as { orderTotal?: number };
      const cur = staffMap.get(log.actorId) ?? {
        staffId: log.actorId,
        name: log.actor.name ?? log.actor.email ?? "—",
        email: log.actor.email,
        updates: 0,
        orderTotal: 0,
      };
      cur.updates += 1;
      cur.orderTotal += Number(meta.orderTotal ?? 0);
      staffMap.set(log.actorId, cur);
    }

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      summary,
      byBrand: [...brandMap.values()].sort((a, b) => b.revenue - a.revenue),
      byCategory: [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue),
      byStaff: [...staffMap.values()].sort((a, b) => b.orderTotal - a.orderTotal),
      topSelling: [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 20),
      topRefunded: [...refundMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 20),
    };
  }
}

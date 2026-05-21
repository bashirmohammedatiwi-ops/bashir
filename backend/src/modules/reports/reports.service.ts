import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";

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
}

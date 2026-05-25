import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { SettingsService } from "../settings/settings.service";
import { RecordPosSyncRunDto } from "./dto/inventory-admin.dto";
import { StockAlertService } from "./stock-alert.service";

@Injectable()
export class InventoryAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly stockAlerts: StockAlertService,
  ) {}

  async getOverview() {
    const stockCfg = await this.stockAlerts.getStockSettings();
    const threshold = stockCfg.lowStockThreshold;

    const [
      snapshotCount,
      lastSnapshotAgg,
      lastRun,
      outOfStockSnapshots,
      lowStockSnapshots,
      catalogOutOfStock,
      catalogLowStock,
      matchedSnapshots,
      recentFailedRuns,
    ] = await Promise.all([
      this.prisma.inventorySyncSnapshot.count(),
      this.prisma.inventorySyncSnapshot.aggregate({ _max: { syncedAt: true } }),
      this.prisma.posSyncRun.findFirst({ orderBy: { createdAt: "desc" } }),
      this.prisma.inventorySyncSnapshot.count({ where: { stock: { lte: 0 } } }),
      this.prisma.inventorySyncSnapshot.count({
        where: { stock: { gt: 0, lte: threshold } },
      }),
      this.prisma.product.count({ where: { isActive: true, stock: { lte: 0 } } }),
      this.prisma.product.count({
        where: { isActive: true, stock: { gt: 0, lte: threshold } },
      }),
      this.countMatchedSnapshots(),
      this.prisma.posSyncRun.count({
        where: { ok: false, createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
      }),
    ]);

    return {
      threshold,
      stockAlertPushEnabled: stockCfg.stockAlertPushEnabled,
      snapshots: {
        total: snapshotCount,
        lastSyncedAt: lastSnapshotAgg._max.syncedAt,
        outOfStock: outOfStockSnapshots,
        lowStock: lowStockSnapshots,
        matchedToCatalog: matchedSnapshots,
      },
      catalog: {
        outOfStock: catalogOutOfStock,
        lowStock: catalogLowStock,
      },
      posSync: lastRun
        ? {
            id: lastRun.id,
            ok: lastRun.ok,
            manual: lastRun.manual,
            totalItems: lastRun.totalItems,
            changedItems: lastRun.changedItems,
            syncedItems: lastRun.syncedItems,
            failedItems: lastRun.failedItems,
            skippedItems: lastRun.skippedItems,
            durationMs: lastRun.durationMs,
            errorMessage: lastRun.errorMessage,
            finishedAt: lastRun.finishedAt,
          }
        : null,
      recentFailedRuns,
    };
  }

  async listStockAlerts(params: {
    page?: number;
    limit?: number;
    status?: "low" | "out" | "all";
    search?: string;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 200);
    const skip = (page - 1) * limit;
    const cfg = await this.stockAlerts.getStockSettings();
    const threshold = cfg.lowStockThreshold;

    const where: Prisma.InventorySyncSnapshotWhereInput = {};
    if (params.status === "out") where.stock = { lte: 0 };
    else if (params.status === "low") where.stock = { gt: 0, lte: threshold };
    else where.OR = [{ stock: { lte: 0 } }, { stock: { gt: 0, lte: threshold } }];

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { barcode: { contains: q, mode: "insensitive" } },
            { productNum: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.inventorySyncSnapshot.count({ where }),
      this.prisma.inventorySyncSnapshot.findMany({
        where,
        orderBy: [{ stock: "asc" }, { syncedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const barcodes = rows.map((r) => r.barcode);
    const productMap = await this.buildProductMap(barcodes);

    const items = rows.map((row) => {
      const linked = productMap.get(row.barcode);
      return {
        ...row,
        status: row.stock <= 0 ? "out" : row.stock <= threshold ? "low" : "ok",
        productId: linked?.id ?? null,
        productName: linked?.name ?? null,
        inCatalog: !!linked,
      };
    });

    return paginate(items, total, page, limit);
  }

  async listRuns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.posSyncRun.count(),
      this.prisma.posSyncRun.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);
    return paginate(items, total, page, limit);
  }

  recordRun(dto: RecordPosSyncRunDto) {
    return this.prisma.posSyncRun.create({
      data: {
        manual: dto.manual ?? false,
        ok: dto.ok ?? true,
        totalItems: dto.totalItems ?? 0,
        changedItems: dto.changedItems ?? 0,
        syncedItems: dto.syncedItems ?? 0,
        failedItems: dto.failedItems ?? 0,
        skippedItems: dto.skippedItems ?? 0,
        durationMs: dto.durationMs ?? 0,
        errorMessage: dto.errorMessage?.slice(0, 500) || null,
        sourceHost: dto.sourceHost?.slice(0, 120) || null,
      },
    });
  }

  private async countMatchedSnapshots() {
    const [productBarcodes, shadeBarcodes] = await Promise.all([
      this.prisma.product.findMany({
        where: { barcode: { not: null } },
        select: { barcode: true },
      }),
      this.prisma.productShade.findMany({
        where: { barcode: { not: null } },
        select: { barcode: true },
      }),
    ]);

    const codes = [
      ...productBarcodes.map((p) => p.barcode!),
      ...shadeBarcodes.map((s) => s.barcode!),
    ].filter(Boolean);

    if (!codes.length) return 0;

    return this.prisma.inventorySyncSnapshot.count({
      where: { barcode: { in: codes } },
    });
  }

  private async buildProductMap(barcodes: string[]) {
    const map = new Map<string, { id: string; name: string }>();
    if (!barcodes.length) return map;

    const [products, shades] = await Promise.all([
      this.prisma.product.findMany({
        where: { barcode: { in: barcodes } },
        select: { id: true, name: true, barcode: true },
      }),
      this.prisma.productShade.findMany({
        where: { barcode: { in: barcodes } },
        select: { barcode: true, product: { select: { id: true, name: true } } },
      }),
    ]);

    for (const p of products) {
      if (p.barcode) map.set(p.barcode, { id: p.id, name: p.name });
    }
    for (const s of shades) {
      if (s.barcode && !map.has(s.barcode)) {
        map.set(s.barcode, { id: s.product.id, name: s.product.name });
      }
    }
    return map;
  }
}

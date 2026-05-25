import { Injectable } from "@nestjs/common";
import {
  NotificationLinkType,
  NotificationTargetType,
  NotificationType,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SettingsService } from "../settings/settings.service";

type StockSettings = {
  lowStockThreshold: number;
  stockAlertPushEnabled: boolean;
  stockAlertCooldownHours: number;
};

const DEFAULT_STOCK_SETTINGS: StockSettings = {
  lowStockThreshold: 5,
  stockAlertPushEnabled: true,
  stockAlertCooldownHours: 24,
};

@Injectable()
export class StockAlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  async getStockSettings(): Promise<StockSettings> {
    const all = await this.settings.getAll();
    return {
      lowStockThreshold: Number(all.lowStockThreshold ?? DEFAULT_STOCK_SETTINGS.lowStockThreshold),
      stockAlertPushEnabled:
        all.stockAlertPushEnabled ?? DEFAULT_STOCK_SETTINGS.stockAlertPushEnabled,
      stockAlertCooldownHours: Number(
        all.stockAlertCooldownHours ?? DEFAULT_STOCK_SETTINGS.stockAlertCooldownHours,
      ),
    };
  }

  async processStockChanges(
    items: Array<{
      barcode: string;
      name: string | null;
      stock: number;
      previousStock: number | null;
      productId: string | null;
      productName: string | null;
    }>,
  ) {
    const cfg = await this.getStockSettings();
    if (!cfg.stockAlertPushEnabled) return { restock: 0, lowStock: 0 };

    let restock = 0;
    let lowStock = 0;
    const threshold = cfg.lowStockThreshold;

    for (const item of items) {
      if (!item.productId) continue;

      const prev = item.previousStock ?? item.stock;
      const next = item.stock;
      const label = item.productName || item.name || item.barcode;

      if (prev <= 0 && next > 0) {
        const sent = await this.emitAlert({
          type: NotificationType.RESTOCK,
          barcode: item.barcode,
          productId: item.productId,
          label,
          title: "عاد بالمخزون",
          body: `${label} — متوفر الآن (${next} قطعة)`,
          cfg,
        });
        if (sent) restock += 1;
        continue;
      }

      const wasAbove = prev > threshold;
      const nowLow = next > 0 && next <= threshold;
      const nowOut = next <= 0 && prev > 0;

      if ((wasAbove && nowLow) || nowOut) {
        const sent = await this.emitAlert({
          type: NotificationType.LOW_STOCK,
          barcode: item.barcode,
          productId: item.productId,
          label,
          title: nowOut ? "نفدت الكمية" : "ينفد قريباً",
          body: nowOut
            ? `${label} — نفدت من المخزون`
            : `${label} — متبقي ${next} قطعة فقط`,
          cfg,
        });
        if (sent) lowStock += 1;
      }
    }

    return { restock, lowStock };
  }

  async sendManualAlert(barcode: string, alertType: "RESTOCK" | "LOW_STOCK") {
    const snapshot = await this.prisma.inventorySyncSnapshot.findUnique({ where: { barcode } });
    if (!snapshot) return { ok: false, reason: "not_found" };

    const product = await this.findProductByBarcode(barcode);
    if (!product) return { ok: false, reason: "no_product" };

    const cfg = await this.getStockSettings();
    const label = product.name || snapshot.name || barcode;
    const isRestock = alertType === "RESTOCK";

    await this.emitAlert({
      type: isRestock ? NotificationType.RESTOCK : NotificationType.LOW_STOCK,
      barcode,
      productId: product.id,
      label,
      title: isRestock ? "عاد بالمخزون" : snapshot.stock <= 0 ? "نفدت الكمية" : "ينفد قريباً",
      body: isRestock
        ? `${label} — متوفر الآن (${snapshot.stock} قطعة)`
        : snapshot.stock <= 0
          ? `${label} — نفدت من المخزون`
          : `${label} — متبقي ${snapshot.stock} قطعة فقط`,
      cfg,
      skipCooldown: true,
    });

    return { ok: true };
  }

  private async emitAlert(input: {
    type: NotificationType;
    barcode: string;
    productId: string;
    label: string;
    title: string;
    body: string;
    cfg: StockSettings;
    skipCooldown?: boolean;
  }) {
    if (!input.skipCooldown) {
      const since = new Date(Date.now() - input.cfg.stockAlertCooldownHours * 3600_000);
      const recent = await this.prisma.notification.findMany({
        where: { type: input.type, createdAt: { gte: since } },
        select: { data: true },
        take: 200,
        orderBy: { createdAt: "desc" },
      });
      const duplicate = recent.some(
        (row) => (row.data as { barcode?: string } | null)?.barcode === input.barcode,
      );
      if (duplicate) return false;
    }

    await this.notifications.send({
      type: input.type,
      title: input.title,
      body: input.body,
      targetType: NotificationTargetType.ALL,
      linkType: NotificationLinkType.PRODUCT,
      linkId: input.productId,
      sendPush: input.cfg.stockAlertPushEnabled,
      data: {
        barcode: input.barcode,
        stockAlert: input.type,
      },
    });

    return true;
  }

  private async findProductByBarcode(barcode: string) {
    const byProduct = await this.prisma.product.findFirst({
      where: { barcode },
      select: { id: true, name: true },
    });
    if (byProduct) return byProduct;

    const shade = await this.prisma.productShade.findFirst({
      where: { barcode },
      select: { product: { select: { id: true, name: true } } },
    });
    return shade?.product ?? null;
  }
}

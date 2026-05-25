import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode } from "../../common/barcode.util";
import { fixPosArabicText } from "../../common/pos-text-encoding.util";
import { PrismaService } from "../../common/prisma.service";
import { InventorySyncItemDto } from "./dto/inventory-sync.dto";
import { StockAlertService } from "./stock-alert.service";

type SanitizedItem = {
  barcode: string;
  productCode: string | null;
  productNum: string | null;
  name: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  offerName: string | null;
};

function sanitizeItem(item: InventorySyncItemDto): SanitizedItem | null {
  const barcode =
    normalizeBarcode(item.barcode) ||
    normalizeBarcode(item.productNum) ||
    normalizeBarcode(item.productCode);
  if (!barcode) return null;

  const productNum = normalizeBarcode(item.productNum) || barcode;

  return {
    barcode,
    productCode: item.productCode?.trim() || null,
    productNum,
    name: fixPosArabicText(item.name?.trim()?.slice(0, 500)) || null,
    price: Math.max(0, Math.round(Number(item.price) || 0)),
    originalPrice: Math.max(0, Math.round(Number(item.originalPrice) || 0)),
    discountPercent: Math.min(100, Math.max(0, Math.round(Number(item.discountPercent) || 0))),
    stock: Math.max(0, Math.round(Number(item.stock) || 0)),
    offerName: fixPosArabicText(item.offerName?.trim()?.slice(0, 200)) || null,
  };
}

function fixSnapshotText<T extends { name?: string | null; offerName?: string | null }>(snapshot: T): T {
  return {
    ...snapshot,
    name: fixPosArabicText(snapshot.name) ?? snapshot.name ?? null,
    offerName: fixPosArabicText(snapshot.offerName) ?? snapshot.offerName ?? null,
  };
}

export type InventorySnapshotPricing = {
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  isPromo: boolean;
};

const SNAPSHOT_CHUNK = 300;
const PRODUCT_UPDATE_CHUNK = 150;

@Injectable()
export class InventorySyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockAlerts: StockAlertService,
  ) {}

  async findByBarcode(barcode: string) {
    const candidates = barcodeLookupCandidates(barcode);
    if (!candidates.length) throw new NotFoundException("Barcode is required");

    let snapshot: Awaited<
      ReturnType<typeof this.prisma.inventorySyncSnapshot.findUnique>
    > = null;

    for (const code of candidates) {
      snapshot = await this.prisma.inventorySyncSnapshot.findUnique({
        where: { barcode: code },
      });
      if (snapshot) break;

      snapshot = await this.prisma.inventorySyncSnapshot.findFirst({
        where: { productNum: code },
      });
      if (snapshot) break;
    }

    if (!snapshot) throw new NotFoundException("No synced inventory for this barcode");

    const fixed = fixSnapshotText(snapshot);
    const product = await this.findProductByBarcode(fixed.barcode);

    return {
      ...fixed,
      productId: product?.id ?? null,
      productName: product?.name ?? null,
    };
  }

  async getSnapshotForBarcodes(barcodes: string[]) {
    const candidates = [
      ...new Set(barcodes.flatMap((b) => barcodeLookupCandidates(b))),
    ];
    if (!candidates.length) return null;

    const snapshot = await this.prisma.inventorySyncSnapshot.findFirst({
      where: {
        OR: [{ barcode: { in: candidates } }, { productNum: { in: candidates } }],
      },
    });

    return snapshot ? fixSnapshotText(snapshot) : null;
  }

  pricingFromSnapshot(snapshot: {
    price: number;
    originalPrice: number;
    discountPercent: number;
    stock: number;
  }): InventorySnapshotPricing {
    return {
      price: snapshot.price,
      originalPrice: snapshot.originalPrice,
      discountPercent: snapshot.discountPercent,
      stock: snapshot.stock,
      isPromo: snapshot.discountPercent > 0,
    };
  }

  async syncOne(dto: InventorySyncItemDto) {
    return this.syncMany([dto]);
  }

  async syncMany(items: InventorySyncItemDto[]) {
    const syncedAt = new Date();
    const results: Array<{
      barcode: string;
      updatedProduct: boolean;
      productId: string | null;
      error?: string;
    }> = [];

    const byBarcode = new Map<string, SanitizedItem>();
    for (const raw of items) {
      const item = sanitizeItem(raw);
      if (item) byBarcode.set(item.barcode, item);
    }

    const sanitized = [...byBarcode.values()];
    if (!sanitized.length) {
      return { synced: 0, failed: 0, items: [], syncedAt };
    }

    const barcodes = sanitized.map((item) => item.barcode);
    const previousSnapshots = await this.prisma.inventorySyncSnapshot.findMany({
      where: { barcode: { in: barcodes } },
      select: { barcode: true, stock: true },
    });
    const previousStockMap = new Map(previousSnapshots.map((s) => [s.barcode, s.stock]));

    const productMap = await this.buildProductBarcodeMap(barcodes);
    const snapshotErrors = await this.bulkUpsertSnapshots(sanitized, syncedAt);
    const updatedBarcodes = await this.bulkUpdateProducts(sanitized, productMap);

    const alertItems = sanitized.map((item) => {
      const product = productMap.get(item.barcode);
      return {
        barcode: item.barcode,
        name: item.name,
        stock: item.stock,
        previousStock: previousStockMap.get(item.barcode) ?? null,
        productId: product?.id ?? null,
        productName: product?.name ?? null,
      };
    });

    let alerts = { restock: 0, lowStock: 0 };
    try {
      alerts = await this.stockAlerts.processStockChanges(alertItems);
    } catch {
      /* stock alerts must not block inventory sync */
    }

    for (const item of sanitized) {
      const error = snapshotErrors.get(item.barcode);
      const product = productMap.get(item.barcode);
      results.push({
        barcode: item.barcode,
        updatedProduct: !error && updatedBarcodes.has(item.barcode),
        productId: product?.id ?? null,
        error,
      });
    }

    const failed = results.filter((r) => r.error).length;

    return {
      synced: results.length - failed,
      failed,
      items: results,
      syncedAt,
      alerts,
    };
  }

  private async buildProductBarcodeMap(barcodes: string[]) {
    const map = new Map<string, { id: string; name: string | null }>();
    if (!barcodes.length) return map;

    const [products, shades] = await Promise.all([
      this.prisma.product.findMany({
        where: { barcode: { in: barcodes } },
        select: { id: true, name: true, barcode: true },
      }),
      this.prisma.productShade.findMany({
        where: { barcode: { in: barcodes } },
        select: {
          barcode: true,
          product: { select: { id: true, name: true } },
        },
      }),
    ]);

    for (const product of products) {
      if (product.barcode) {
        map.set(product.barcode, { id: product.id, name: product.name });
      }
    }

    for (const shade of shades) {
      if (shade.barcode && !map.has(shade.barcode)) {
        map.set(shade.barcode, { id: shade.product.id, name: shade.product.name });
      }
    }

    return map;
  }

  private async bulkUpsertSnapshots(items: SanitizedItem[], syncedAt: Date) {
    const errors = new Map<string, string>();

    for (let i = 0; i < items.length; i += SNAPSHOT_CHUNK) {
      const chunk = items.slice(i, i + SNAPSHOT_CHUNK);
      try {
        await this.upsertSnapshotChunk(chunk, syncedAt);
      } catch {
        const chunkErrors = await this.upsertSnapshotsFallback(chunk, syncedAt);
        for (const [barcode, message] of chunkErrors) {
          errors.set(barcode, message);
        }
      }
    }

    return errors;
  }

  private async upsertSnapshotChunk(chunk: SanitizedItem[], syncedAt: Date) {
    const rows = chunk.map(
      (item) => Prisma.sql`(
        gen_random_uuid(),
        ${item.barcode},
        ${item.productCode},
        ${item.productNum},
        ${item.name},
        ${item.price},
        ${item.originalPrice},
        ${item.discountPercent},
        ${item.stock},
        ${item.offerName},
        ${syncedAt},
        ${syncedAt}
      )`,
    );

    await this.prisma.$executeRaw`
      INSERT INTO "InventorySyncSnapshot" (
        "id",
        "barcode",
        "productCode",
        "productNum",
        "name",
        "price",
        "originalPrice",
        "discountPercent",
        "stock",
        "offerName",
        "syncedAt",
        "createdAt"
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("barcode") DO UPDATE SET
        "productCode" = EXCLUDED."productCode",
        "productNum" = EXCLUDED."productNum",
        "name" = EXCLUDED."name",
        "price" = EXCLUDED."price",
        "originalPrice" = EXCLUDED."originalPrice",
        "discountPercent" = EXCLUDED."discountPercent",
        "stock" = EXCLUDED."stock",
        "offerName" = EXCLUDED."offerName",
        "syncedAt" = EXCLUDED."syncedAt"
    `;
  }

  private async upsertSnapshotsFallback(chunk: SanitizedItem[], syncedAt: Date) {
    const errors = new Map<string, string>();

    for (const item of chunk) {
      try {
        await this.prisma.inventorySyncSnapshot.upsert({
          where: { barcode: item.barcode },
          create: { ...item, syncedAt },
          update: { ...item, syncedAt },
        });
      } catch (err) {
        errors.set(item.barcode, this.formatError(err));
      }
    }

    return errors;
  }

  private async bulkUpdateProducts(
    items: SanitizedItem[],
    productMap: Map<string, { id: string; name: string | null }>,
  ) {
    const updated = new Set<string>();
    const byProductId = new Map<
      string,
      { productId: string; item: SanitizedItem; barcode: string }
    >();

    for (const item of items) {
      const product = productMap.get(item.barcode);
      if (product) {
        byProductId.set(product.id, {
          productId: product.id,
          item,
          barcode: item.barcode,
        });
      }
    }

    const updates = [...byProductId.values()];
    if (!updates.length) return updated;

    for (let i = 0; i < updates.length; i += PRODUCT_UPDATE_CHUNK) {
      const chunk = updates.slice(i, i + PRODUCT_UPDATE_CHUNK);
      try {
        await this.updateProductChunk(chunk);
        for (const entry of chunk) updated.add(entry.barcode);
      } catch {
        await this.updateProductsFallback(chunk, updated);
      }
    }

    return updated;
  }

  private async updateProductChunk(
    chunk: Array<{ productId: string; item: SanitizedItem; barcode: string }>,
  ) {
    const rows = chunk.map(
      ({ productId, item }) => Prisma.sql`(
        ${productId}::uuid,
        ${item.price},
        ${item.originalPrice},
        ${item.discountPercent},
        ${item.stock},
        ${item.discountPercent > 0}
      )`,
    );

    await this.prisma.$executeRaw`
      UPDATE "Product" AS p SET
        "price" = v.price,
        "originalPrice" = v."originalPrice",
        "discountPercent" = v."discountPercent",
        "stock" = v.stock,
        "isPromo" = v."isPromo",
        "updatedAt" = NOW()
      FROM (VALUES ${Prisma.join(rows)}) AS v(
        id,
        price,
        "originalPrice",
        "discountPercent",
        stock,
        "isPromo"
      )
      WHERE p.id = v.id
    `;
  }

  private async updateProductsFallback(
    chunk: Array<{ productId: string; item: SanitizedItem; barcode: string }>,
    updated: Set<string>,
  ) {
    for (const entry of chunk) {
      try {
        await this.prisma.product.update({
          where: { id: entry.productId },
          data: {
            price: entry.item.price,
            originalPrice: entry.item.originalPrice,
            discountPercent: entry.item.discountPercent,
            stock: entry.item.stock,
            isPromo: entry.item.discountPercent > 0,
          },
        });
        updated.add(entry.barcode);
      } catch {
        /* skip failed product update */
      }
    }
  }

  private formatError(err: unknown) {
    return err instanceof Prisma.PrismaClientKnownRequestError
      ? `${err.code}: ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);
  }

  private async findProductByBarcode(barcode: string) {
    const code = normalizeBarcode(barcode);
    if (!code) return null;

    const byProduct = await this.prisma.product.findFirst({
      where: { barcode: code },
      select: { id: true, name: true, barcode: true },
    });
    if (byProduct) return byProduct;

    const bySku = await this.prisma.product.findFirst({
      where: { sku: code },
      select: { id: true, name: true, barcode: true },
    });
    if (bySku) return bySku;

    const shade = await this.prisma.productShade.findFirst({
      where: { barcode: code },
      select: { product: { select: { id: true, name: true, barcode: true } } },
    });
    return shade?.product ?? null;
  }
}

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode, resolveBarcodeMapKey } from "../../common/barcode.util";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
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

const SNAPSHOT_CHUNK = 500;
const PRODUCT_UPDATE_CHUNK = 150;
const LOOKUP_BATCH = 200;

type ProductPricingUpdate = {
  productId: string;
  barcode: string;
  item: SanitizedItem;
};

function pickLeadShade<
  T extends { stock: number; price: number | null; originalPrice: number; discountPercent: number },
>(shades: T[]): T {
  const inStock = shades.filter((s) => s.stock > 0);
  const pool = inStock.length ? inStock : shades;
  return [...pool].sort((a, b) => {
    const disc = (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
    if (disc !== 0) return disc;
    const priceA = a.price ?? Number.MAX_SAFE_INTEGER;
    const priceB = b.price ?? Number.MAX_SAFE_INTEGER;
    return priceA - priceB;
  })[0]!;
}

@Injectable()
export class InventorySyncService {
  private readonly logger = new Logger(InventorySyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockAlerts: StockAlertService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  async findByBarcode(barcode: string) {
    const hit = await this.lookupBarcode(barcode);
    if (!hit.pos && !hit.inApp) {
      throw new NotFoundException("No synced inventory for this barcode");
    }
    return {
      ...(hit.pos || {
        barcode: hit.barcode,
        price: 0,
        originalPrice: 0,
        discountPercent: 0,
        stock: 0,
        name: null,
        productCode: null,
        productNum: null,
        offerName: null,
      }),
      productId: hit.inApp?.id ?? null,
      productName: hit.inApp?.name ?? null,
    };
  }

  async lookupBarcodes(rawBarcodes: string[]) {
    const keys = [
      ...new Set(
        rawBarcodes
          .flatMap((b) => barcodeLookupCandidates(b))
          .filter(Boolean),
      ),
    ];

    if (!keys.length) return { items: {} };

    const snapshotByCode = new Map<string, Awaited<
      ReturnType<typeof this.prisma.inventorySyncSnapshot.findMany>
    >[number]>();

    for (let i = 0; i < keys.length; i += LOOKUP_BATCH) {
      const chunk = keys.slice(i, i + LOOKUP_BATCH);
      const snapshots = await this.prisma.inventorySyncSnapshot.findMany({
        where: {
          OR: [{ barcode: { in: chunk } }, { productNum: { in: chunk } }],
        },
      });

      for (const row of snapshots) {
        for (const key of barcodeLookupCandidates(row.barcode)) {
          snapshotByCode.set(key, row);
        }
        if (row.productNum) {
          for (const key of barcodeLookupCandidates(row.productNum)) {
            snapshotByCode.set(key, row);
          }
        }
      }
    }

    const productMap = await this.buildProductBarcodeMap(keys);

    const items: Record<string, {
      barcode: string;
      pos: {
        price: number;
        originalPrice: number;
        discountPercent: number;
        stock: number;
        name: string | null;
        offerName: string | null;
        syncedAt: Date;
      } | null;
      inApp: { id: string; name: string | null } | null;
    }> = {};

    for (const code of keys) {
      const snapshot = snapshotByCode.get(code);
      const fixed = snapshot ? fixSnapshotText(snapshot) : null;
      const inApp = resolveBarcodeMapKey(productMap, code);
      items[code] = {
        barcode: fixed?.barcode || code,
        pos: fixed
          ? {
              price: fixed.price,
              originalPrice: fixed.originalPrice,
              discountPercent: fixed.discountPercent,
              stock: fixed.stock,
              name: fixed.name ?? null,
              offerName: fixed.offerName ?? null,
              syncedAt: fixed.syncedAt,
            }
          : null,
        inApp: inApp ? { id: inApp.id, name: inApp.name } : null,
      };
    }

    return { items };
  }

  async lookupBarcode(barcode: string) {
    const candidates = barcodeLookupCandidates(barcode);
    const primary = candidates[0] || normalizeBarcode(barcode);
    if (!primary) {
      return { barcode: "", pos: null, inApp: null };
    }

    const bulk = await this.lookupBarcodes(candidates.length ? candidates : [primary]);
    for (const code of candidates) {
      const hit = bulk.items[code];
      if (hit?.pos || hit?.inApp) return { ...hit, barcode: hit.barcode || code };
    }

    return bulk.items[primary] || { barcode: primary, pos: null, inApp: null };
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

    const snapshotErrors = await this.bulkUpsertSnapshots(sanitized, syncedAt);

    for (const item of sanitized) {
      const error = snapshotErrors.get(item.barcode);
      results.push({
        barcode: item.barcode,
        updatedProduct: !error,
        productId: null,
        error,
      });
    }

    const failed = results.filter((r) => r.error).length;

    // طبّق الأسعار/التخفيض/المخزون على المنتجات مباشرة قبل الرد — حتى تظهر التخفيضات فوراً
    let catalogUpdated = 0;
    let productMap = new Map<string, { id: string; name: string | null }>();
    try {
      const catalog = await this.applyCatalogUpdates(sanitized);
      catalogUpdated = catalog.productsUpdated;
      productMap = catalog.productMap;
    } catch (err) {
      this.logger.error(`Catalog apply failed after snapshot sync: ${this.formatError(err)}`);
    }

    // تنبيهات المخزون في الخلفية (لا تؤخر الاستجابة بعد تحديث الكتالوج)
    void this.processStockAlertsInBackground(sanitized, previousStockMap, productMap);

    for (const row of results) {
      if (row.error) continue;
      const product = resolveBarcodeMapKey(productMap, row.barcode);
      if (product) {
        row.updatedProduct = true;
        row.productId = product.id;
      } else {
        row.updatedProduct = false;
      }
    }

    return {
      synced: results.length - failed,
      failed,
      catalogUpdated,
      items: results,
      syncedAt,
      alerts: { restock: 0, lowStock: 0 },
    };
  }

  /** تحديث التدرجات ثم تجميع السعر/التخفيض/المخزون على المنتج الأب + إبطال الكاش */
  private async applyCatalogUpdates(sanitized: SanitizedItem[]) {
    const barcodes = sanitized.map((item) => item.barcode);
    const productMap = await this.buildProductBarcodeMap(barcodes);

    const shadesUpdated = await this.bulkUpdateShades(sanitized);
    const productsUpdated = await this.bulkUpdateProducts(sanitized, productMap);

    if (shadesUpdated.size > 0 || productsUpdated.size > 0) {
      try {
        await this.homeFeedCache.invalidateAll();
      } catch (err) {
        this.logger.warn(`Home feed cache invalidate failed: ${this.formatError(err)}`);
      }
    }

    return {
      productMap,
      shadesUpdated: shadesUpdated.size,
      productsUpdated: productsUpdated.size,
    };
  }

  private processStockAlertsInBackground(
    sanitized: SanitizedItem[],
    previousStockMap: Map<string, number>,
    productMap: Map<string, { id: string; name: string | null }>,
  ) {
    if (sanitized.length > 200) return;

    void (async () => {
      try {
        const alertItems = sanitized.map((item) => {
          const product = resolveBarcodeMapKey(productMap, item.barcode);
          return {
            barcode: item.barcode,
            name: item.name,
            stock: item.stock,
            previousStock: previousStockMap.get(item.barcode) ?? null,
            productId: product?.id ?? null,
            productName: product?.name ?? null,
          };
        });
        await this.stockAlerts.processStockChanges(alertItems);
      } catch (err) {
        this.logger.warn(`Stock alerts failed: ${this.formatError(err)}`);
      }
    })();
  }

  private async buildProductBarcodeMap(barcodes: string[]) {
    const map = new Map<string, { id: string; name: string | null }>();
    if (!barcodes.length) return map;

    const expanded = [
      ...new Set(barcodes.flatMap((code) => barcodeLookupCandidates(code))),
    ];

    const [products, shades, bySku] = await Promise.all([
      this.prisma.product.findMany({
        where: { barcode: { in: expanded } },
        select: { id: true, name: true, barcode: true, sku: true },
      }),
      this.prisma.productShade.findMany({
        where: { barcode: { in: expanded } },
        select: {
          barcode: true,
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.findMany({
        where: { sku: { in: expanded } },
        select: { id: true, name: true, barcode: true, sku: true },
      }),
    ]);

    const register = (
      code: string | null | undefined,
      entry: { id: string; name: string | null },
    ) => {
      if (!code) return;
      for (const key of barcodeLookupCandidates(code)) {
        if (!map.has(key)) map.set(key, entry);
      }
    };

    for (const product of [...products, ...bySku]) {
      register(product.barcode, { id: product.id, name: product.name });
      register(product.sku, { id: product.id, name: product.name });
    }

    for (const shade of shades) {
      if (shade.barcode) {
        register(shade.barcode, { id: shade.product.id, name: shade.product.name });
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

  private async bulkUpdateShades(items: SanitizedItem[]) {
    const updated = new Set<string>();
    if (!items.length) return updated;

    const shades = await this.prisma.productShade.findMany({
      where: {
        barcode: {
          in: [...new Set(items.flatMap((item) => barcodeLookupCandidates(item.barcode)))],
        },
      },
      select: { id: true, barcode: true },
    });
    if (!shades.length) return updated;

    const shadeByBarcode = new Map<string, string>();
    for (const shade of shades) {
      if (!shade.barcode) continue;
      for (const key of barcodeLookupCandidates(shade.barcode)) {
        shadeByBarcode.set(key, shade.id);
      }
    }

    const updateRows: Array<{ shadeId: string; item: SanitizedItem; barcode: string }> = [];
    for (const item of items) {
      const shadeId = resolveBarcodeMapKey(shadeByBarcode, item.barcode);
      if (!shadeId) continue;
      updateRows.push({ shadeId, item, barcode: item.barcode });
    }
    if (!updateRows.length) return updated;

    for (let i = 0; i < updateRows.length; i += PRODUCT_UPDATE_CHUNK) {
      const chunk = updateRows.slice(i, i + PRODUCT_UPDATE_CHUNK);
      try {
        await this.updateShadeChunk(chunk);
        for (const row of chunk) updated.add(row.barcode);
      } catch {
        await this.updateShadesFallback(chunk, updated);
      }
    }

    return updated;
  }

  private async updateShadeChunk(
    chunk: Array<{ shadeId: string; item: SanitizedItem }>,
  ) {
    const rows = chunk.map(
      ({ shadeId, item }) => Prisma.sql`(
        ${shadeId}::uuid,
        ${item.stock},
        ${item.price},
        ${item.originalPrice},
        ${item.discountPercent}
      )`,
    );

    await this.prisma.$executeRaw`
      UPDATE "ProductShade" AS ps SET
        "stock" = v.stock,
        "price" = v.price,
        "originalPrice" = v."originalPrice",
        "discountPercent" = v."discountPercent",
        "updatedAt" = NOW()
      FROM (VALUES ${Prisma.join(rows)}) AS v(
        id,
        stock,
        price,
        "originalPrice",
        "discountPercent"
      )
      WHERE ps.id = v.id
    `;
  }

  private async updateShadesFallback(
    chunk: Array<{ shadeId: string; item: SanitizedItem; barcode: string }>,
    updated: Set<string>,
  ) {
    for (const row of chunk) {
      try {
        await this.prisma.productShade.update({
          where: { id: row.shadeId },
          data: {
            stock: row.item.stock,
            price: row.item.price,
            originalPrice: row.item.originalPrice,
            discountPercent: row.item.discountPercent,
          },
        });
        updated.add(row.barcode);
      } catch {
        /* skip */
      }
    }
  }

  /**
   * يحدّث منتج الأب بعد تحديث التدرجات:
   * - مخزون = مجموع تدرجات المنتج
   * - السعر/التخفيض = تدرج العرض (أعلى خصم بين المتوفر، وإلا أقل سعر)
   * - منتجات بلا تدرجات: تُحدَّث مباشرة من عنصر الباركود
   */
  private async bulkUpdateProducts(
    items: SanitizedItem[],
    productMap: Map<string, { id: string; name: string | null }>,
  ) {
    const updated = new Set<string>();
    const productIds = new Set<string>();
    const directByProductId = new Map<string, { productId: string; item: SanitizedItem; barcode: string }>();

    for (const item of items) {
      const product = resolveBarcodeMapKey(productMap, item.barcode);
      if (!product) continue;
      productIds.add(product.id);
      directByProductId.set(product.id, {
        productId: product.id,
        item,
        barcode: item.barcode,
      });
    }

    if (!productIds.size) return updated;

    const idList = [...productIds];
    const [products, allShades] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: idList } },
        select: { id: true, barcode: true },
      }),
      this.prisma.productShade.findMany({
        where: { productId: { in: idList } },
        select: {
          productId: true,
          barcode: true,
          stock: true,
          price: true,
          originalPrice: true,
          discountPercent: true,
        },
      }),
    ]);

    const shadesByProduct = new Map<string, typeof allShades>();
    for (const shade of allShades) {
      const list = shadesByProduct.get(shade.productId) ?? [];
      list.push(shade);
      shadesByProduct.set(shade.productId, list);
    }

    const itemByBarcode = new Map<string, SanitizedItem>();
    for (const item of items) {
      for (const key of barcodeLookupCandidates(item.barcode)) {
        itemByBarcode.set(key, item);
      }
    }

    const updates: ProductPricingUpdate[] = [];

    for (const product of products) {
      const shades = shadesByProduct.get(product.id) ?? [];
      const fallback = directByProductId.get(product.id);
      if (!fallback && !shades.length) continue;

      if (shades.length > 0) {
        const totalStock = shades.reduce((sum, s) => sum + (s.stock ?? 0), 0);
        const lead = pickLeadShade(shades);
        const productBarcodeItem = product.barcode
          ? resolveBarcodeMapKey(itemByBarcode, product.barcode)
          : null;

        // إن وُجد باركود للمنتج نفسه في الدفعة وليس له تدرج مطابق، نفضّل سعره مع مجموع المخزون
        const shadeBarcodes = new Set(
          shades.flatMap((s) => (s.barcode ? barcodeLookupCandidates(s.barcode) : [])),
        );
        const useProductBarcodePricing =
          !!productBarcodeItem &&
          !!product.barcode &&
          !barcodeLookupCandidates(product.barcode).some((k) => shadeBarcodes.has(k));

        const pricingSource = useProductBarcodePricing
          ? productBarcodeItem!
          : {
              price: lead.price ?? fallback?.item.price ?? 0,
              originalPrice: lead.originalPrice ?? fallback?.item.originalPrice ?? 0,
              discountPercent: lead.discountPercent ?? fallback?.item.discountPercent ?? 0,
              stock: totalStock,
              barcode: fallback?.barcode ?? product.barcode ?? product.id,
              productCode: null,
              productNum: null,
              name: null,
              offerName: null,
            };

        const anyPromo = shades.some((s) => (s.discountPercent ?? 0) > 0);
        updates.push({
          productId: product.id,
          barcode: fallback?.barcode ?? product.barcode ?? product.id,
          item: {
            barcode: pricingSource.barcode ?? fallback?.barcode ?? product.id,
            productCode: null,
            productNum: null,
            name: null,
            price: pricingSource.price,
            originalPrice: pricingSource.originalPrice,
            discountPercent: anyPromo
              ? Math.max(
                  pricingSource.discountPercent,
                  ...shades.map((s) => s.discountPercent ?? 0),
                )
              : 0,
            stock: totalStock,
            offerName: null,
          },
        });
      } else if (fallback) {
        updates.push(fallback);
      }
    }

    if (!updates.length) return updated;

    for (let i = 0; i < updates.length; i += PRODUCT_UPDATE_CHUNK) {
      const chunk = updates.slice(i, i + PRODUCT_UPDATE_CHUNK);
      try {
        await this.updateProductChunk(chunk);
        for (const entry of chunk) updated.add(entry.barcode);
      } catch (err) {
        this.logger.warn(`Product chunk update failed, falling back: ${this.formatError(err)}`);
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
    for (const code of barcodeLookupCandidates(barcode)) {
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
      if (shade?.product) return shade.product;
    }

    return null;
  }
}

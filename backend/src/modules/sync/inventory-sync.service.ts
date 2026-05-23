import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { InventorySyncItemDto } from "./dto/inventory-sync.dto";

function sanitizeItem(item: InventorySyncItemDto) {
  return {
    barcode: item.barcode.trim(),
    productCode: item.productCode?.trim() || null,
    productNum: item.productNum?.trim() || null,
    name: item.name?.trim()?.slice(0, 500) || null,
    price: Math.max(0, Math.round(Number(item.price) || 0)),
    originalPrice: Math.max(0, Math.round(Number(item.originalPrice) || 0)),
    discountPercent: Math.min(100, Math.max(0, Math.round(Number(item.discountPercent) || 0))),
    stock: Math.max(0, Math.round(Number(item.stock) || 0)),
    offerName: item.offerName?.trim()?.slice(0, 200) || null,
  };
}

export type InventorySnapshotPricing = {
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  isPromo: boolean;
};

@Injectable()
export class InventorySyncService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarcode(barcode: string) {
    const normalized = barcode.trim();
    if (!normalized) throw new NotFoundException("Barcode is required");

    const snapshot = await this.prisma.inventorySyncSnapshot.findUnique({
      where: { barcode: normalized },
    });
    if (!snapshot) throw new NotFoundException("No synced inventory for this barcode");

    const product = await this.findProductByBarcode(normalized);

    return {
      ...snapshot,
      productId: product?.id ?? null,
      productName: product?.name ?? null,
    };
  }

  async getSnapshotForBarcodes(barcodes: string[]) {
    const normalized = [...new Set(barcodes.map((b) => b?.trim()).filter(Boolean))];
    for (const barcode of normalized) {
      const snapshot = await this.prisma.inventorySyncSnapshot.findUnique({
        where: { barcode },
      });
      if (snapshot) return snapshot;
    }
    return null;
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

    for (const raw of items) {
      const item = sanitizeItem(raw);
      if (!item.barcode) continue;

      try {
        await this.prisma.inventorySyncSnapshot.upsert({
          where: { barcode: item.barcode },
          create: { ...item, syncedAt },
          update: { ...item, syncedAt },
        });

        let updatedProduct = false;
        let productId: string | null = null;

        const product = await this.findProductByBarcode(item.barcode);
        if (product) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              price: item.price,
              originalPrice: item.originalPrice,
              discountPercent: item.discountPercent,
              stock: item.stock,
              isPromo: item.discountPercent > 0,
            },
          });
          updatedProduct = true;
          productId = product.id;
        }

        results.push({ barcode: item.barcode, updatedProduct, productId });
      } catch (err) {
        const message =
          err instanceof Prisma.PrismaClientKnownRequestError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : String(err);
        results.push({
          barcode: item.barcode,
          updatedProduct: false,
          productId: null,
          error: message,
        });
      }
    }

    const failed = results.filter((r) => r.error).length;

    return {
      synced: results.length - failed,
      failed,
      items: results,
      syncedAt,
    };
  }

  private async findProductByBarcode(barcode: string) {
    const byProduct = await this.prisma.product.findFirst({
      where: { barcode },
      select: { id: true, name: true, barcode: true },
    });
    if (byProduct) return byProduct;

    const shade = await this.prisma.productShade.findFirst({
      where: { barcode },
      select: { product: { select: { id: true, name: true, barcode: true } } },
    });
    return shade?.product ?? null;
  }
}

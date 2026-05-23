import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { InventorySyncItemDto } from "./dto/inventory-sync.dto";

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

  async syncOne(dto: InventorySyncItemDto) {
    const result = await this.syncMany([dto]);
    return result.items[0];
  }

  async syncMany(items: InventorySyncItemDto[]) {
    const syncedAt = new Date();
    const results: Array<{
      barcode: string;
      updatedProduct: boolean;
      productId: string | null;
    }> = [];

    for (const item of items) {
      const barcode = item.barcode.trim();
      if (!barcode) continue;

      const price = Math.round(item.price);
      const originalPrice = Math.round(item.originalPrice);
      const discountPercent = Math.round(item.discountPercent ?? 0);
      const stock = Math.round(item.stock);

      await this.prisma.inventorySyncSnapshot.upsert({
        where: { barcode },
        create: {
          barcode,
          productCode: item.productCode ?? null,
          productNum: item.productNum ?? null,
          name: item.name ?? null,
          price,
          originalPrice,
          discountPercent,
          stock,
          offerName: item.offerName ?? null,
          syncedAt,
        },
        update: {
          productCode: item.productCode ?? null,
          productNum: item.productNum ?? null,
          name: item.name ?? null,
          price,
          originalPrice,
          discountPercent,
          stock,
          offerName: item.offerName ?? null,
          syncedAt,
        },
      });

      const product = await this.findProductByBarcode(barcode);
      if (product) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            price,
            originalPrice,
            discountPercent,
            stock,
            isPromo: discountPercent > 0,
            barcode: product.barcode ?? barcode,
          },
        });
      }

      results.push({
        barcode,
        updatedProduct: Boolean(product),
        productId: product?.id ?? null,
      });
    }

    return {
      synced: results.length,
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

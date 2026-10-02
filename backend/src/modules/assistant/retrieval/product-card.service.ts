/**
 * Projects real catalog rows into assistant product cards — data comes only
 * from the database, never from the model (task rules #28, #38).
 */

import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { mediaRecordToUrl } from "../../../common/media-url.util";
import type { AssistantProductCard } from "../assistant.types";

export const CardProductInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  images: { take: 1, orderBy: [{ isPrimary: "desc" as const }, { position: "asc" as const }], include: { media: true } },
  shades: {
    orderBy: { position: "asc" as const },
    select: { id: true, name: true, price: true, stock: true, barcode: true },
  },
} satisfies Prisma.ProductInclude;

export type CardProduct = Prisma.ProductGetPayload<{ include: typeof CardProductInclude }>;

export interface DisplayShade {
  id: string;
  name: string;
  price?: number | null;
  stock?: number;
}

@Injectable()
export class ProductCardService {
  toCard(product: CardProduct, displayShade?: DisplayShade | null): AssistantProductCard {
    const shade = displayShade ?? product.shades?.[0] ?? null;
    const price = shade?.price ?? product.price;
    const oldPrice = shade
      ? shade.price && product.originalPrice
        ? product.originalPrice
        : 0
      : product.originalPrice;
    const stock = shade?.stock ?? product.stock;
    const imageUrl = product.images?.[0]?.media ? mediaRecordToUrl(product.images[0].media as Record<string, unknown>) : null;

    return {
      id: product.id,
      slug: product.slug,
      name: product.nameAr || product.nameEn || product.name,
      brandName: product.brand?.name ?? "",
      imageUrl,
      price: Math.max(0, price),
      oldPrice: Math.max(0, oldPrice),
      discountPercent: oldPrice > price && oldPrice > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : product.discountPercent,
      stock,
      inStock: stock > 0,
      shadeName: shade?.name ?? null,
      deepLink: `/product/${product.slug}`,
    };
  }

  toCards(products: CardProduct[]): AssistantProductCard[] {
    return products.map((p) => this.toCard(p));
  }
}

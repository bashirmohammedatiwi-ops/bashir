import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            brand: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            images: { orderBy: { position: "asc" }, include: { media: true } },
            shades: true,
            variants: true,
          },
        },
      },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");
    return this.prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
      include: { product: true },
    });
  }

  async remove(userId: string, productId: string) {
    await this.prisma.wishlist.deleteMany({ where: { userId, productId } });
    return { success: true };
  }

  async toggle(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { added: false };
    }
    await this.add(userId, productId);
    return { added: true };
  }
}

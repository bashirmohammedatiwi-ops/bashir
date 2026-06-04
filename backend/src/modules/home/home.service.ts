import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";

const productInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, include: { media: true } },
  shades: true,
  variants: true,
};

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async feed() {
    const settings = await this.settings.getAll();
    const flashEndsAt = (settings as any).flashSaleEndsAt ?? null;

    const [
      banners,
      categories,
      brands,
      packages,
      skinConcerns,
      homeBlocks,
      newArrivals,
      bestSellers,
      featuredProducts,
      promoProducts,
    ] = await Promise.all([
      this.prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { position: "asc" },
        include: {
          image: true,
          children: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: { image: true },
          },
        },
      }),
      this.prisma.brand.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { position: "asc" },
        include: { logo: true },
      }),
      this.prisma.package.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { coverImage: true, items: { include: { product: true } } },
      }),
      this.prisma.skinConcern.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
      }),
      this.prisma.homeBlock.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isNew: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: productInclude,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isBestSeller: true },
        orderBy: { soldCount: "desc" },
        take: 10,
        include: productInclude,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: productInclude,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isPromo: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: productInclude,
      }),
    ]);

    return {
      banners,
      categories,
      brands,
      packages,
      skinConcerns,
      homeBlocks,
      flashSale: {
        endsAt: flashEndsAt,
        products: promoProducts,
      },
      newArrivals,
      bestSellers,
      featuredProducts,
      settings: {
        storeName: (settings as any).storeName,
        whatsapp: (settings as any).whatsapp,
        supportPhone: (settings as any).supportPhone ?? (settings as any).whatsapp,
        pickupEnabled: (settings as any).pickupEnabled ?? true,
        pickupAddress: (settings as any).pickupAddress ?? "",
        pickupHours: (settings as any).pickupHours ?? "",
      },
    };
  }
}

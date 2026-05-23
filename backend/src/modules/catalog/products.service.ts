import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { CategoriesService } from "./categories.service";
import { CreateProductDto, QueryProductsDto, UpdateProductDto } from "./dto/product.dto";
import { InventorySyncService } from "../sync/inventory-sync.service";

const productRelationsFull = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
  images: {
    orderBy: { position: "asc" as const },
    include: { media: true },
  },
  shades: { orderBy: { position: "asc" as const }, include: { image: true } },
  variants: true,
};

const productRelationsLite = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
  images: {
    take: 1,
    orderBy: { position: "asc" as const },
    include: { media: true },
  },
  _count: { select: { shades: true, variants: true, images: true } },
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly inventorySync: InventorySyncService,
  ) {}

  async list(q: QueryProductsDto) {
    const where: Prisma.ProductWhereInput = {
      isActive: q.status === "all" ? undefined : true,
      categoryId: q.categoryId,
      subcategoryId: q.subcategoryId,
      brandId: q.brandId,
      isFeatured: q.isFeatured,
      isNew: q.isNew,
      isBestSeller: q.isBestSeller,
      isPromo: q.isPromo,
      tags: q.tag ? { contains: q.tag } : undefined,
      price:
        q.minPrice !== undefined || q.maxPrice !== undefined
          ? {
              gte: q.minPrice ?? undefined,
              lte: q.maxPrice ?? undefined,
            }
          : undefined,
      OR: q.search
        ? [
            { name: { contains: q.search } },
            { sku: { contains: q.search } },
            { tags: { contains: q.search } },
          ]
        : undefined,
      rating: q.minRating !== undefined ? { gte: q.minRating } : undefined,
      stock: q.inStock ? { gt: 0 } : undefined,
    };

    const orderBy = this.buildOrderBy(q.sort);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: q.skip,
        take: q.limit,
        include: q.lite ? productRelationsLite : productRelationsFull,
      }),
    ]);

    return paginate(items, total, q.page, q.limit);
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        brand: true,
        category: true,
        subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
        images: { orderBy: { position: "asc" }, include: { media: true } },
        shades: { orderBy: { position: "asc" }, include: { image: true } },
        variants: { orderBy: { position: "asc" } },
        reviews: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: CreateProductDto) {
    dto = await this.applySyncedPricing(dto);
    const subcategoryId = await this.categories.validateSubcategoryForCategory(
      dto.subcategoryId,
      dto.categoryId,
    );

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        barcode: dto.barcode?.trim() || undefined,
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? "",
        ingredients: dto.ingredients ?? "",
        howToUse: dto.howToUse ?? "",
        price: dto.price,
        originalPrice: dto.originalPrice ?? dto.price,
        discountPercent: dto.discountPercent ?? 0,
        stock: dto.stock ?? 0,
        rating: dto.rating ?? 0,
        pointsEarned: dto.pointsEarned ?? Math.floor(dto.price / 1000),
        isNew: dto.isNew ?? false,
        isBestSeller: dto.isBestSeller ?? false,
        isFeatured: dto.isFeatured ?? false,
        isPromo: dto.isPromo ?? false,
        isBogo: dto.isBogo ?? false,
        isActive: dto.isActive ?? true,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        subcategoryId,
        tags: JSON.stringify(dto.tags ?? []),
        skinType: JSON.stringify(dto.skinType ?? []),
        images: dto.imageIds && dto.imageIds.length
          ? {
              create: dto.imageIds.map((mediaId, i) => ({
                mediaId,
                position: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
        shades: dto.shades?.length
          ? { create: dto.shades.map((s, i) => ({ ...s, position: s.position ?? i })) }
          : undefined,
        variants: dto.variants?.length
          ? { create: dto.variants.map((v, i) => ({ ...v, position: v.position ?? i })) }
          : undefined,
      },
      include: {
        images: { include: { media: true } },
        brand: true,
        category: true,
        subcategory: true,
        shades: true,
        variants: true,
      },
    });
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    dto = await this.applySyncedPricing(dto);
    await this.ensureExists(id);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found");

    const categoryId = dto.categoryId ?? existing.categoryId;
    let subcategoryId: string | null | undefined = dto.subcategoryId;
    if (dto.subcategoryId !== undefined || dto.categoryId !== undefined) {
      subcategoryId = await this.categories.validateSubcategoryForCategory(
        dto.subcategoryId ?? null,
        categoryId,
      );
    }
    if (dto.imageIds) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
    }
    if (dto.shades) {
      await this.prisma.productShade.deleteMany({ where: { productId: id } });
    }
    if (dto.variants) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        barcode: dto.barcode !== undefined ? dto.barcode?.trim() || null : undefined,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        ingredients: dto.ingredients,
        howToUse: dto.howToUse,
        price: dto.price,
        originalPrice: dto.originalPrice,
        discountPercent: dto.discountPercent,
        stock: dto.stock,
        rating: dto.rating,
        pointsEarned: dto.pointsEarned,
        isNew: dto.isNew,
        isBestSeller: dto.isBestSeller,
        isFeatured: dto.isFeatured,
        isPromo: dto.isPromo,
        isBogo: dto.isBogo,
        isActive: dto.isActive,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        subcategoryId: subcategoryId !== undefined ? subcategoryId : undefined,
        tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
        skinType: dto.skinType ? JSON.stringify(dto.skinType) : undefined,
        images: dto.imageIds && dto.imageIds.length
          ? {
              create: dto.imageIds.map((mediaId, i) => ({
                mediaId,
                position: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
        shades: dto.shades?.length
          ? { create: dto.shades.map((s, i) => ({ ...s, position: s.position ?? i })) }
          : undefined,
        variants: dto.variants?.length
          ? { create: dto.variants.map((v, i) => ({ ...v, position: v.position ?? i })) }
          : undefined,
      },
      include: {
        images: { include: { media: true } },
        shades: true,
        variants: true,
        category: true,
        subcategory: true,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Product not found");
  }

  private collectBarcodes(dto: CreateProductDto): string[] {
    const codes: string[] = [];
    if (dto.barcode?.trim()) codes.push(dto.barcode.trim());
    for (const shade of dto.shades ?? []) {
      if (shade.barcode?.trim()) codes.push(shade.barcode.trim());
    }
    return codes;
  }

  private async applySyncedPricing<T extends CreateProductDto>(dto: T): Promise<T> {
    const snapshot = await this.inventorySync.getSnapshotForBarcodes(this.collectBarcodes(dto));
    if (!snapshot) return dto;

    const pricing = this.inventorySync.pricingFromSnapshot(snapshot);
    return {
      ...dto,
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      discountPercent: pricing.discountPercent,
      stock: pricing.stock,
      isPromo: pricing.isPromo,
    };
  }

  private buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "rating":
        return { rating: "desc" };
      case "popular":
        return { soldCount: "desc" };
      case "oldest":
        return { createdAt: "asc" };
      default:
        return { createdAt: "desc" };
    }
  }
}

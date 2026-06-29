import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { resolveProductNames } from "../../common/product-names.util";
import { resolveProductDescriptions } from "../../common/product-descriptions.util";
import { paginate } from "../../common/dto/pagination.dto";
import { CategoriesService } from "./categories.service";
import { CreateProductDto, QueryProductsDto, UpdateProductDto } from "./dto/product.dto";
import { InventorySyncService } from "../sync/inventory-sync.service";

const productRelationsFull = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
  tertiaryCategory: { select: { id: true, name: true, slug: true, parentId: true } },
  images: {
    orderBy: { position: "asc" as const },
    include: { media: true },
  },
  shades: { orderBy: { position: "asc" as const }, include: { image: true } },
  variants: true,
  skinConcerns: { include: { concern: { select: { id: true, slug: true, name: true } } } },
};

const productRelationsLite = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
  tertiaryCategory: { select: { id: true, name: true, slug: true, parentId: true } },
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
      tertiaryCategoryId: q.tertiaryCategoryId,
      brandId: q.brandId,
      isFeatured: q.isFeatured,
      isNew: q.isNew,
      isBestSeller: q.isBestSeller,
      isPromo: q.isPromo,
      tags: q.tag ? { contains: q.tag } : undefined,
      skinType: q.skinType ? { contains: q.skinType } : undefined,
      skinConcerns: q.concernSlug
        ? { some: { concern: { slug: q.concernSlug } } }
        : q.concernId
          ? { some: { concernId: q.concernId } }
          : undefined,
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
            { nameAr: { contains: q.search } },
            { nameEn: { contains: q.search } },
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
        tertiaryCategory: { select: { id: true, name: true, slug: true, parentId: true } },
        images: { orderBy: { position: "asc" }, include: { media: true } },
        shades: { orderBy: { position: "asc" }, include: { image: true } },
        variants: { orderBy: { position: "asc" } },
        reviews: { take: 10, orderBy: { createdAt: "desc" } },
        skinConcerns: { include: { concern: true } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.formatProduct(product);
  }

  private formatProduct(product: any) {
    let skinType: string[] = [];
    let tags: string[] = [];
    try {
      skinType = JSON.parse(product.skinType || "[]");
    } catch {
      skinType = [];
    }
    try {
      tags = JSON.parse(product.tags || "[]");
    } catch {
      tags = [];
    }
    return {
      ...product,
      skinType,
      tags,
      concernIds: product.skinConcerns?.map((sc: any) => sc.concernId) ?? [],
      skinConcerns: product.skinConcerns?.map((sc: any) => sc.concern) ?? [],
    };
  }

  async create(dto: CreateProductDto) {
    dto = await this.applySyncedPricing(dto);
    dto = this.applyShadeAggregates(dto);
    const names = resolveProductNames(dto);
    const descriptions = resolveProductDescriptions(dto);
    const subcategoryId = await this.categories.validateSubcategoryForCategory(
      dto.subcategoryId,
      dto.categoryId,
    );
    const tertiaryCategoryId = await this.categories.validateTertiaryForProduct(
      dto.tertiaryCategoryId,
      subcategoryId,
      dto.categoryId,
    );

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        barcode: dto.barcode?.trim() || undefined,
        name: names.name,
        nameAr: names.nameAr,
        nameEn: names.nameEn,
        slug: dto.slug,
        description: descriptions.description,
        descriptionAr: descriptions.descriptionAr,
        descriptionEn: descriptions.descriptionEn,
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
        tertiaryCategoryId,
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
          ? { create: this.shadeCreateData(dto.shades) }
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
        skinConcerns: { include: { concern: true } },
      },
    });
    if (dto.concernIds?.length) {
      await this.syncSkinConcerns(product.id, dto.concernIds);
    }
    return this.findOne(product.id);
  }

  async update(id: string, dto: UpdateProductDto) {
    dto = await this.applySyncedPricing(dto);
    dto = this.applyShadeAggregates(dto);
    await this.ensureExists(id);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found");

    const names = resolveProductNames(dto);
    const descriptions = resolveProductDescriptions(dto);
    const categoryId = dto.categoryId ?? existing.categoryId;
    let subcategoryId: string | null | undefined = dto.subcategoryId;
    let tertiaryCategoryId: string | null | undefined = dto.tertiaryCategoryId;
    if (dto.subcategoryId !== undefined || dto.categoryId !== undefined || dto.tertiaryCategoryId !== undefined) {
      subcategoryId = await this.categories.validateSubcategoryForCategory(
        dto.subcategoryId ?? null,
        categoryId,
      );
      tertiaryCategoryId = await this.categories.validateTertiaryForProduct(
        dto.tertiaryCategoryId ?? null,
        subcategoryId,
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
    await this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        barcode: dto.barcode !== undefined ? dto.barcode?.trim() || null : undefined,
        name: names.name,
        nameAr: names.nameAr,
        nameEn: names.nameEn,
        slug: dto.slug,
        description: descriptions.description,
        descriptionAr: descriptions.descriptionAr,
        descriptionEn: descriptions.descriptionEn,
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
        tertiaryCategoryId: tertiaryCategoryId !== undefined ? tertiaryCategoryId : undefined,
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
          ? { create: this.shadeCreateData(dto.shades) }
          : undefined,
        variants: dto.variants?.length
          ? { create: dto.variants.map((v, i) => ({ ...v, position: v.position ?? i })) }
          : undefined,
      },
    });
    if (dto.concernIds) {
      await this.syncSkinConcerns(id, dto.concernIds);
    }
    return this.findOne(id);
  }

  private async syncSkinConcerns(productId: string, concernIds: string[]) {
    await this.prisma.productSkinConcern.deleteMany({ where: { productId } });
    if (!concernIds.length) return;
    await this.prisma.productSkinConcern.createMany({
      data: concernIds.map((concernId) => ({ productId, concernId })),
      skipDuplicates: true,
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
    if (dto.barcode?.trim()) return [dto.barcode.trim()];
    return [];
  }

  private shadeCreateData(shades: CreateProductDto["shades"]) {
    return (shades ?? []).map((s, i) => ({
      name: s.name,
      colorHex: s.colorHex,
      colorHexEnd: s.colorHexEnd,
      barcode: s.barcode?.trim() || undefined,
      imageId: s.imageId,
      price: s.price ?? null,
      originalPrice: s.originalPrice ?? 0,
      discountPercent: s.discountPercent ?? 0,
      stock: s.stock ?? 0,
      position: s.position ?? i,
    }));
  }

  private applyShadeAggregates<T extends CreateProductDto>(dto: T): T {
    if (!dto.shades?.length) return dto;

    const totalStock = dto.shades.reduce((sum, shade) => sum + (shade.stock ?? 0), 0);
    const priced = dto.shades.find((shade) => shade.price != null) ?? dto.shades[0];
    if (!priced) return dto;

    return {
      ...dto,
      stock: totalStock,
      price: priced.price ?? dto.price,
      originalPrice: priced.originalPrice ?? dto.originalPrice ?? dto.price,
      discountPercent: priced.discountPercent ?? dto.discountPercent ?? 0,
      isPromo: (priced.discountPercent ?? dto.discountPercent ?? 0) > 0,
    };
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

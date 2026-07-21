import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { resolveProductNames } from "../../common/product-names.util";
import { resolveProductDescriptions } from "../../common/product-descriptions.util";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { paginate } from "../../common/dto/pagination.dto";
import { CategoriesService } from "./categories.service";
import { CreateProductDto, QueryProductsDto, UpdateProductDto } from "./dto/product.dto";
import { InventorySyncService } from "../sync/inventory-sync.service";
import { SettingsService } from "../settings/settings.service";
import { withPlaceholderImages } from "../../common/product-placeholder.util";

const productRelationsFull = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
  tertiaryCategory: { select: { id: true, name: true, slug: true, parentId: true } },
  subcategories: { select: { id: true, name: true, slug: true, parentId: true } },
  tertiaryCategories: { select: { id: true, name: true, slug: true, parentId: true } },
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
    private readonly settings: SettingsService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  async list(q: QueryProductsDto, storefront = false) {
    const andFilters: Prisma.ProductWhereInput[] = [
      {
        isActive: q.status === "all" ? undefined : true,
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
        rating: q.minRating !== undefined ? { gte: q.minRating } : undefined,
        stock: q.inStock ? { gt: 0 } : undefined,
      },
    ];

    const categoryFilter = this.buildCategoryFilter(q);
    if (categoryFilter) andFilters.push(categoryFilter);

    // فلاتر ظهور واجهة المتجر (لا تُطبَّق على لوحة التحكم)
    if (storefront) {
      const s = (await this.settings.getAll()) as Record<string, unknown>;
      if (s.hideOutOfStock) {
        andFilters.push({ stock: { gt: 0 } });
      }
      if (s.hideProductsWithoutImages) {
        andFilters.push({ images: { some: {} } });
      }
    }

    if (q.search) {
      andFilters.push({
        OR: [
          { name: { contains: q.search, mode: "insensitive" } },
          { nameAr: { contains: q.search, mode: "insensitive" } },
          { nameEn: { contains: q.search, mode: "insensitive" } },
          { sku: { contains: q.search, mode: "insensitive" } },
          { barcode: { contains: q.search, mode: "insensitive" } },
          { tags: { contains: q.search, mode: "insensitive" } },
          { slug: { contains: q.search, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = { AND: andFilters };

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

    return paginate(
      items.map((p) => withPlaceholderImages(p)),
      total,
      q.page,
      q.limit,
    );
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        brand: true,
        category: true,
        subcategory: { select: { id: true, name: true, slug: true, parentId: true } },
        tertiaryCategory: { select: { id: true, name: true, slug: true, parentId: true } },
        subcategories: { select: { id: true, name: true, slug: true, parentId: true } },
        tertiaryCategories: { select: { id: true, name: true, slug: true, parentId: true } },
        images: { orderBy: { position: "asc" }, include: { media: true } },
        shades: { orderBy: { position: "asc" }, include: { image: true } },
        variants: { orderBy: { position: "asc" } },
        reviews: { take: 10, orderBy: { createdAt: "desc" } },
        skinConcerns: { include: { concern: true } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return withPlaceholderImages(this.formatProduct(product));
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
      subcategoryIds:
        product.subcategories?.map((s: any) => s.id) ??
        (product.subcategoryId ? [product.subcategoryId] : []),
      tertiaryCategoryIds:
        product.tertiaryCategories?.map((t: any) => t.id) ??
        (product.tertiaryCategoryId ? [product.tertiaryCategoryId] : []),
    };
  }

  async create(dto: CreateProductDto) {
    dto = await this.applySyncedPricing(dto);
    dto = this.applyShadeAggregates(dto);
    const names = resolveProductNames(dto);
    const descriptions = resolveProductDescriptions(dto);
    const subcategoryIds = await this.categories.validateSubcategoriesForCategory(
      this.mergeCategoryIds(dto.subcategoryIds, dto.subcategoryId),
      dto.categoryId,
    );
    const tertiaryCategoryIds = await this.categories.validateTertiariesForProduct(
      this.mergeCategoryIds(dto.tertiaryCategoryIds, dto.tertiaryCategoryId),
      subcategoryIds,
      dto.categoryId,
    );
    // الحقلان المفردان يبقيان للتوافق (أول عنصر من كل قائمة)
    const subcategoryId = subcategoryIds[0] ?? null;
    const tertiaryCategoryId = tertiaryCategoryIds[0] ?? null;
    const imageIds = this.uniqueImageIds(dto.imageIds);

    try {
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
          categoryId: dto.categoryId || null,
          subcategoryId,
          tertiaryCategoryId,
          subcategories: subcategoryIds.length
            ? { connect: subcategoryIds.map((cid) => ({ id: cid })) }
            : undefined,
          tertiaryCategories: tertiaryCategoryIds.length
            ? { connect: tertiaryCategoryIds.map((cid) => ({ id: cid })) }
            : undefined,
          tags: JSON.stringify(dto.tags ?? []),
          skinType: JSON.stringify(dto.skinType ?? []),
          images: imageIds.length
            ? {
                create: imageIds.map((mediaId, i) => ({
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
      await this.homeFeedCache.invalidateAll();
      return this.findOne(product.id);
    } catch (error) {
      throw this.mapProductWriteError(error);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    dto = await this.applySyncedPricing(dto);
    dto = this.applyShadeAggregates(dto);
    await this.ensureExists(id);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found");

    const hasNamePatch =
      dto.name !== undefined || dto.nameAr !== undefined || dto.nameEn !== undefined;
    const hasDescPatch =
      dto.description !== undefined ||
      dto.descriptionAr !== undefined ||
      dto.descriptionEn !== undefined;
    const names = hasNamePatch ? resolveProductNames(dto) : null;
    const descriptions = hasDescPatch ? resolveProductDescriptions(dto) : null;
    const categoryId = dto.categoryId ?? existing.categoryId;
    const touchesCategories =
      dto.categoryId !== undefined ||
      dto.subcategoryId !== undefined ||
      dto.tertiaryCategoryId !== undefined ||
      dto.subcategoryIds !== undefined ||
      dto.tertiaryCategoryIds !== undefined;

    let subcategoryId: string | null | undefined;
    let tertiaryCategoryId: string | null | undefined;
    let subcategoryIds: string[] | undefined;
    let tertiaryCategoryIds: string[] | undefined;
    if (touchesCategories) {
      subcategoryIds = await this.categories.validateSubcategoriesForCategory(
        this.mergeCategoryIds(dto.subcategoryIds, dto.subcategoryId),
        categoryId,
      );
      tertiaryCategoryIds = await this.categories.validateTertiariesForProduct(
        this.mergeCategoryIds(dto.tertiaryCategoryIds, dto.tertiaryCategoryId),
        subcategoryIds,
        categoryId,
      );
      subcategoryId = subcategoryIds[0] ?? null;
      tertiaryCategoryId = tertiaryCategoryIds[0] ?? null;
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
    const imageIds = dto.imageIds ? this.uniqueImageIds(dto.imageIds) : undefined;
    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          sku: dto.sku,
          barcode: dto.barcode !== undefined ? dto.barcode?.trim() || null : undefined,
          name: names?.name,
          nameAr: names ? names.nameAr : undefined,
          nameEn: names ? names.nameEn : undefined,
          slug: dto.slug,
          description: descriptions?.description,
          descriptionAr: descriptions ? descriptions.descriptionAr : undefined,
          descriptionEn: descriptions ? descriptions.descriptionEn : undefined,
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
          subcategories: subcategoryIds
            ? { set: subcategoryIds.map((cid) => ({ id: cid })) }
            : undefined,
          tertiaryCategories: tertiaryCategoryIds
            ? { set: tertiaryCategoryIds.map((cid) => ({ id: cid })) }
            : undefined,
          tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
          skinType: dto.skinType ? JSON.stringify(dto.skinType) : undefined,
          images: imageIds?.length
            ? {
                create: imageIds.map((mediaId, i) => ({
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
    } catch (error) {
      throw this.mapProductWriteError(error);
    }
    if (dto.concernIds) {
      await this.syncSkinConcerns(id, dto.concernIds);
    }
    await this.homeFeedCache.invalidateAll();
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

  /// فحص وجود منتج بنفس الباركود (المنتج نفسه أو أحد درجاته).
  async checkBarcode(barcode?: string) {
    const code = barcode?.trim();
    if (!code) return { exists: false, product: null, matchedShadeName: null };

    const productSelect = {
      id: true,
      name: true,
      nameAr: true,
      sku: true,
      barcode: true,
      isActive: true,
    } as const;

    const byProduct = await this.prisma.product.findUnique({
      where: { barcode: code },
      select: productSelect,
    });
    if (byProduct) {
      return { exists: true, product: byProduct, matchedShadeName: null };
    }

    const byShade = await this.prisma.productShade.findFirst({
      where: { barcode: code },
      select: { name: true, product: { select: productSelect } },
    });
    if (byShade?.product) {
      return { exists: true, product: byShade.product, matchedShadeName: byShade.name };
    }

    return { exists: false, product: null, matchedShadeName: null };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
    await this.homeFeedCache.invalidateAll();
    return { success: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Product not found");
  }

  private uniqueImageIds(imageIds?: string[]) {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const id of imageIds ?? []) {
      const mediaId = id?.trim();
      if (!mediaId || seen.has(mediaId)) continue;
      seen.add(mediaId);
      unique.push(mediaId);
    }
    return unique;
  }

  private mapProductWriteError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(",")
          : String(error.meta?.target ?? "");
        if (target.includes("sku")) {
          return new ConflictException("رمز SKU مستخدم مسبقاً");
        }
        if (target.includes("slug")) {
          return new ConflictException("الرابط الدائم (slug) مستخدم مسبقاً");
        }
        if (target.includes("barcode")) {
          return new ConflictException("الباركود مستخدم في منتج آخر");
        }
        return new ConflictException("قيمة مكررة — تحقق من الصور أو الباركود");
      }
    }
    return error;
  }

  private collectBarcodes(dto: { barcode?: string; shades?: CreateProductDto["shades"] }): string[] {
    const codes = new Set<string>();
    if (dto.barcode?.trim()) codes.add(dto.barcode.trim());
    for (const shade of dto.shades ?? []) {
      if (shade.barcode?.trim()) codes.add(shade.barcode.trim());
    }
    return [...codes];
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

  private applyShadeAggregates<T extends { shades?: CreateProductDto["shades"]; stock?: number; price?: number; originalPrice?: number; discountPercent?: number; isPromo?: boolean }>(dto: T): T {
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

  private async applySyncedPricing<T extends { barcode?: string; shades?: CreateProductDto["shades"]; price?: number; originalPrice?: number; discountPercent?: number; stock?: number; isPromo?: boolean }>(dto: T): Promise<T> {
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

  /// دمج القائمة الجديدة مع الحقل المفرد القديم (توافق مع الواجهات القديمة).
  private mergeCategoryIds(ids?: string[] | null, single?: string | null): string[] {
    const merged = [...(ids ?? [])];
    if (single && !merged.includes(single)) merged.unshift(single);
    return merged.filter(Boolean);
  }

  private buildCategoryFilter(q: QueryProductsDto): Prisma.ProductWhereInput | null {
    if (q.tertiaryCategoryId) {
      return {
        OR: [
          { tertiaryCategoryId: q.tertiaryCategoryId },
          { tertiaryCategories: { some: { id: q.tertiaryCategoryId } } },
        ],
      };
    }
    if (q.subcategoryId) {
      return {
        OR: [
          { subcategoryId: q.subcategoryId },
          { subcategories: { some: { id: q.subcategoryId } } },
          { tertiaryCategory: { parentId: q.subcategoryId } },
          { tertiaryCategories: { some: { parentId: q.subcategoryId } } },
        ],
      };
    }
    if (q.categoryId) {
      return {
        OR: [
          { categoryId: q.categoryId },
          { subcategory: { parentId: q.categoryId } },
          { subcategories: { some: { parentId: q.categoryId } } },
          { tertiaryCategory: { parent: { parentId: q.categoryId } } },
          { tertiaryCategories: { some: { parent: { parentId: q.categoryId } } } },
        ],
      };
    }
    return null;
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

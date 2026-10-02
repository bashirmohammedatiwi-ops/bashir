import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { MediaPurpose } from "@prisma/client";
import { normalizeBarcode } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { MediaService } from "../media/media.service";
import { ProductsService } from "../catalog/products.service";
import type { CreateProductDto } from "../catalog/dto/product.dto";
import { AiQuickImportDto, AiQuickImportShadeDto } from "./dto/ai-quick-import.dto";

function slugify(input: string, fallback = "product"): string {
  const base = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80);
  return base || `${fallback}-${Date.now()}`;
}

function splitLabels(raw?: string): string[] {
  return String(raw ?? "")
    .split(/[،,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeHex(raw?: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "#CCCCCC";
  return t.startsWith("#") ? t : `#${t}`;
}

@Injectable()
export class AiQuickImportService {
  private readonly logger = new Logger(AiQuickImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly products: ProductsService,
  ) {}

  async importOne(dto: AiQuickImportDto) {
    const barcode = normalizeBarcode(dto.barcode);
    if (barcode.length < 6) throw new BadRequestException("باركود غير صالح");

    const nameAr = String(dto.nameAr ?? "").trim();
    const nameEn = String(dto.nameEn ?? "").trim();
    const name = nameAr || nameEn;
    if (!name) throw new BadRequestException("الاسم العربي أو الإنكليزي مطلوب");

    const imageUrls = (dto.imageUrls ?? []).map((u) => String(u).trim()).filter(Boolean);
    if (!imageUrls.length) throw new BadRequestException("imageUrls مطلوب (صورة منتج واحدة على الأقل)");

    const brandId = await this.resolveBrandId(dto.brandId, dto.brand);
    if (!brandId) throw new BadRequestException("brandId أو brand مطلوب ومطابق لبراند موجود");

    const categoryId = await this.resolveCategoryId(dto.categoryId, dto.category);
    if (!categoryId) throw new BadRequestException("categoryId أو category مطلوب");

    const subcategoryIds = await this.resolveSubcategoryIds(
      categoryId,
      dto.subcategoryIds,
      dto.subcategory,
    );
    const tertiaryCategoryIds = await this.resolveTertiaryIds(
      subcategoryIds,
      dto.tertiaryCategoryIds,
      dto.tertiary,
    );

    const shadeRows = dto.shades ?? [];
    const shadeImageUrls = shadeRows
      .map((s) => String(s.imageUrl ?? "").trim())
      .filter(Boolean);

    const urlToMediaId = await this.uploadAllUrls([...imageUrls, ...shadeImageUrls]);

    const imageIds = imageUrls
      .map((u) => urlToMediaId.get(u))
      .filter((id): id is string => !!id);
    if (!imageIds.length) {
      throw new BadRequestException("تعذّر رفع صور المنتج من الروابط المعطاة");
    }

    const shades = shadeRows.map((s, i) => this.mapShade(s, i, urlToMediaId));

    const createDto: CreateProductDto = {
      sku: String(dto.sku ?? "").trim() || `AI-${barcode}`,
      barcode,
      name,
      nameAr: nameAr || undefined,
      nameEn: nameEn || undefined,
      slug: slugify(nameEn || nameAr || barcode, "ai"),
      brandId,
      categoryId,
      subcategoryIds,
      tertiaryCategoryIds,
      description: String(dto.descriptionAr ?? dto.descriptionEn ?? "").trim(),
      descriptionAr: String(dto.descriptionAr ?? "").trim() || undefined,
      descriptionEn: String(dto.descriptionEn ?? "").trim() || undefined,
      ingredients: "",
      howToUse: "",
      price: Number(dto.price ?? 0),
      originalPrice: Number(dto.originalPrice ?? 0),
      discountPercent: Number(dto.discountPercent ?? 0),
      stock: Number(dto.stock ?? 0),
      pointsEarned: 0,
      rating: 0,
      isNew: false,
      isBestSeller: false,
      isFeatured: false,
      isPromo: false,
      isBogo: false,
      isActive: dto.isActive === true,
      tags: ["quick-import"],
      skinType: [],
      concernIds: [],
      imageIds,
      shades,
      variants: [],
    };

    const product = await this.products.create(createDto);
    return {
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      isActive: product.isActive,
      imageCount: imageIds.length,
      shadeCount: shades.length,
    };
  }

  private mapShade(
    s: AiQuickImportShadeDto,
    index: number,
    urlToMediaId: Map<string, string>,
  ) {
    const name = String(s.nameAr || s.nameEn || s.name || "").trim();
    const imageUrl = String(s.imageUrl ?? "").trim();
    return {
      name,
      colorHex: normalizeHex(s.colorHex),
      barcode: s.barcode ? normalizeBarcode(s.barcode) : undefined,
      imageId: imageUrl ? urlToMediaId.get(imageUrl) : undefined,
      price: s.price,
      originalPrice: s.originalPrice,
      discountPercent: s.discountPercent,
      stock: s.stock ?? 0,
      position: s.position ?? index,
    };
  }

  private async uploadAllUrls(urls: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(urls.filter(Boolean))];
    const out = new Map<string, string>();
    for (const url of unique) {
      try {
        const media = await this.media.uploadFromUrl(url, MediaPurpose.PRODUCT);
        if (media?.id) out.set(url, String(media.id));
      } catch (err) {
        this.logger.warn(
          `quick-import image failed: ${url} — ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return out;
  }

  private async resolveBrandId(brandId?: string, brandName?: string): Promise<string | null> {
    if (brandId?.trim()) {
      const hit = await this.prisma.brand.findFirst({
        where: { id: brandId.trim() },
        select: { id: true },
      });
      return hit?.id ?? null;
    }
    const q = String(brandName ?? "").trim();
    if (!q) return null;
    const rows = await this.prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      take: 800,
    });
    const norm = q.toLowerCase();
    const exact = rows.find((b) => b.name?.toLowerCase() === norm);
    if (exact) return exact.id;
    const soft = rows.find(
      (b) => b.name?.toLowerCase().includes(norm) || norm.includes((b.name || "").toLowerCase()),
    );
    return soft?.id ?? null;
  }

  private async resolveCategoryId(categoryId?: string, categoryName?: string): Promise<string | null> {
    if (categoryId?.trim()) {
      const hit = await this.prisma.category.findFirst({
        where: { id: categoryId.trim(), parentId: null },
        select: { id: true },
      });
      return hit?.id ?? null;
    }
    const q = String(categoryName ?? "").trim().toLowerCase();
    if (!q) return null;
    const rows = await this.prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, nameAr: true, nameEn: true },
      take: 300,
    });
    const hit = rows.find(
      (c) =>
        c.name?.toLowerCase() === q ||
        c.nameAr?.toLowerCase() === q ||
        c.nameEn?.toLowerCase() === q ||
        (categoryName && c.nameAr?.includes(categoryName)) ||
        c.name?.toLowerCase().includes(q),
    );
    return hit?.id ?? null;
  }

  private matchCategoryLabel(
    rows: Array<{ id: string; name: string; nameAr?: string | null; nameEn?: string | null }>,
    name: string,
  ): string | undefined {
    const n = name.toLowerCase();
    return rows.find(
      (r) =>
        r.nameAr?.toLowerCase() === n ||
        r.nameEn?.toLowerCase() === n ||
        r.name?.toLowerCase() === n ||
        r.nameAr?.includes(name) ||
        r.name?.toLowerCase().includes(n),
    )?.id;
  }

  private async resolveSubcategoryIds(
    categoryId: string,
    ids?: string[],
    labels?: string,
  ): Promise<string[]> {
    if (ids?.length) return [...new Set(ids.filter(Boolean))];
    const names = splitLabels(labels);
    if (!names.length) return [];
    const rows = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true, name: true, nameAr: true, nameEn: true },
    });
    const out: string[] = [];
    for (const name of names) {
      const id = this.matchCategoryLabel(rows, name);
      if (id) out.push(id);
    }
    return [...new Set(out)];
  }

  private async resolveTertiaryIds(
    subcategoryIds: string[],
    ids?: string[],
    labels?: string,
  ): Promise<string[]> {
    if (ids?.length) return [...new Set(ids.filter(Boolean))];
    const names = splitLabels(labels);
    if (!names.length || !subcategoryIds.length) return [];
    const rows = await this.prisma.category.findMany({
      where: { parentId: { in: subcategoryIds } },
      select: { id: true, name: true, nameAr: true, nameEn: true },
    });
    const out: string[] = [];
    for (const name of names) {
      const id = this.matchCategoryLabel(rows, name);
      if (id) out.push(id);
    }
    return [...new Set(out)];
  }
}

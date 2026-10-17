import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MediaPurpose, Prisma } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode } from "../../common/barcode.util";
import { fixPosArabicText } from "../../common/pos-text-encoding.util";
import { PrismaService } from "../../common/prisma.service";
import { ProductsService } from "../catalog/products.service";
import { MediaService } from "../media/media.service";
import { InventorySyncService } from "../sync/inventory-sync.service";
import { BarcodeDraftsService } from "./barcode-drafts.service";
import { ControlService } from "./control.service";
import { ControlAddShadeDto, ControlCreateProductDto, PosMissingQueryDto } from "./dto/control.dto";

export type CategoryNode = { id: string; name: string; isActive: boolean; children: CategoryNode[] };

function slugPart(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** إضافة المنتجات من الهاتف، التدرجات الجديدة، ونواقص الكاشير. */
@Injectable()
export class ControlCatalogService {
  private readonly logger = new Logger(ControlCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly media: MediaService,
    private readonly inventory: InventorySyncService,
    private readonly drafts: BarcodeDraftsService,
    private readonly control: ControlService,
  ) {}

  // ------------------------------------------------------------ create product

  /**
   * منتج جديد من باركود: الاسم، البراند (أو براند جديد بالاسم)، القسم، والصور
   * (مرفوعة من الهاتف أو روابط من المتاجر يرفعها السيرفر). السعر والمخزون من الكاشير تلقائياً.
   */
  async createProduct(dto: ControlCreateProductDto, actorId?: string) {
    const barcode = normalizeBarcode(dto.barcode) || undefined;
    const nameAr = dto.nameAr?.trim();
    const nameEn = dto.nameEn?.trim();
    if (!nameAr && !nameEn) throw new BadRequestException("اكتب اسم المنتج");

    if (barcode) {
      const codes = barcodeLookupCandidates(barcode);
      const clash =
        (await this.prisma.product.findFirst({ where: { OR: [{ barcode: { in: codes } }, { sku: { in: codes } }] }, select: { id: true, name: true } })) ??
        (await this.prisma.productShade.findFirst({ where: { barcode: { in: codes } }, select: { product: { select: { id: true, name: true } } } }))?.product;
      if (clash) throw new ConflictException(`الباركود موجود مسبقاً في «${clash.name}»`);
    }

    const brandId = await this.resolveBrand(dto.brandId, dto.brandName);
    if (dto.categoryId && !(await this.prisma.category.findUnique({ where: { id: dto.categoryId }, select: { id: true } }))) {
      throw new BadRequestException("القسم غير موجود — اختره من جديد");
    }

    const imageIds = [...(dto.imageIds ?? [])];
    let failedUrls = 0;
    for (const url of dto.imageUrls ?? []) {
      try {
        const m = await this.media.uploadFromUrl(url, MediaPurpose.PRODUCT);
        imageIds.push(m.id);
      } catch (e) {
        failedUrls += 1;
        this.logger.warn(`image url failed: ${url} — ${e instanceof Error ? e.message : e}`);
      }
    }

    const base = slugPart(nameEn || "") || "product";
    const suffix = barcode ? barcode.toLowerCase() : Date.now().toString(36);
    const slug = await this.uniqueSlug(`${base}-${suffix}`);
    const sku = await this.uniqueSku(barcode ? `MG-${barcode}` : `MG-${Date.now().toString(36).toUpperCase()}`);

    const created = await this.products.create({
      sku,
      slug,
      barcode,
      nameAr,
      nameEn,
      descriptionAr: dto.descriptionAr?.trim() || undefined,
      descriptionEn: dto.descriptionEn?.trim() || undefined,
      brandId,
      categoryId: dto.categoryId || undefined,
      subcategoryIds: dto.subcategoryIds,
      tertiaryCategoryIds: dto.tertiaryCategoryIds,
      price: dto.price ?? 0,
      imageIds,
      // بلا صورة لا يظهر للزبونة حتى لو طلب التشغيل
      isActive: (dto.isActive ?? true) && imageIds.length > 0,
      tags: ["manager-app"],
    } as never);
    const productId = (created as { id: string }).id;

    if (dto.draftId) {
      await this.prisma.barcodeDraft
        .update({ where: { id: dto.draftId }, data: { productId, addedAt: new Date() } })
        .catch(() => undefined);
    }
    await this.drafts.resolveAdded(true);
    await this.control.touched(productId);
    await this.control.audit(actorId, "product.create", "Product", productId, { barcode, draftId: dto.draftId });
    return { product: await this.control.detail(productId), failedImages: failedUrls };
  }

  private async resolveBrand(brandId?: string, brandName?: string) {
    if (brandId) {
      const b = await this.prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
      if (b) return b.id;
    }
    const name = brandName?.trim();
    if (!name) throw new BadRequestException("اختر البراند");
    const existing = await this.prisma.brand.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } });
    if (existing) return existing.id;
    let slug = slugPart(name) || `brand-${Date.now().toString(36)}`;
    if (await this.prisma.brand.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const count = await this.prisma.brand.count();
    const b = await this.prisma.brand.create({ data: { name, slug, position: count, initial: name.slice(0, 1).toUpperCase() } });
    return b.id;
  }

  private async uniqueSlug(base: string) {
    let slug = base.slice(0, 90);
    for (let i = 2; await this.prisma.product.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
    return slug;
  }

  private async uniqueSku(base: string) {
    let sku = base;
    for (let i = 2; await this.prisma.product.findUnique({ where: { sku }, select: { id: true } }); i++) sku = `${base}-${i}`;
    return sku;
  }

  // ------------------------------------------------------------ shades

  /** تدرج جديد لمنتج موجود (غالباً بعد مسح باركود لون غير مضاف) — السعر والمخزون من الكاشير. */
  async addShade(productId: string, dto: ControlAddShadeDto, actorId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true, price: true, originalPrice: true } });
    if (!product) throw new NotFoundException("المنتج غير موجود");
    const name = dto.name.trim();
    if (!name) throw new BadRequestException("اكتب اسم التدرج");
    const barcode = normalizeBarcode(dto.barcode) || null;
    if (barcode) {
      const codes = barcodeLookupCandidates(barcode);
      const shadeClash = await this.prisma.productShade.findFirst({
        where: { barcode: { in: codes } },
        select: { name: true, product: { select: { name: true } } },
      });
      if (shadeClash) throw new ConflictException(`الباركود مستخدم مسبقاً (${shadeClash.product.name} — ${shadeClash.name})`);
      const productClash = await this.prisma.product.findFirst({ where: { barcode: { in: codes } }, select: { name: true } });
      if (productClash) throw new ConflictException(`الباركود مستخدم مسبقاً (${productClash.name})`);
    }
    if (dto.colorHex && !/^#[0-9a-fA-F]{6}$/.test(dto.colorHex)) throw new BadRequestException("لون غير صالح (#RRGGBB)");

    let imageId = dto.imageMediaId || null;
    if (!imageId && dto.imageUrl) {
      imageId = (await this.media.uploadFromUrl(dto.imageUrl, MediaPurpose.PRODUCT)).id;
    }

    const snap = barcode ? await this.inventory.getSnapshotForBarcodes([barcode]).catch(() => null) : null;
    const last = await this.prisma.productShade.aggregate({ where: { productId }, _max: { position: true } });
    const shade = await this.prisma.productShade.create({
      data: {
        productId,
        name,
        colorHex: (dto.colorHex ?? "#C9A2A2").toUpperCase(),
        barcode,
        imageId,
        isActive: dto.isActive ?? true,
        price: snap?.price ?? null,
        originalPrice: snap?.originalPrice ?? 0,
        discountPercent: snap?.discountPercent ?? 0,
        stock: snap?.stock ?? 0,
        position: (last._max.position ?? -1) + 1,
      },
    });
    await this.control.recompute(productId);
    await this.drafts.resolveAdded(true);
    await this.control.touched(productId);
    await this.control.audit(actorId, "shade.add", "ProductShade", shade.id, { productId, name, barcode });
    return this.control.detail(productId);
  }

  async deleteShade(shadeId: string, actorId?: string) {
    const shade = await this.prisma.productShade.findUnique({ where: { id: shadeId }, select: { id: true, productId: true, name: true, barcode: true } });
    if (!shade) throw new NotFoundException("التدرج غير موجود");
    await this.prisma.productShade.delete({ where: { id: shadeId } });
    await this.control.recompute(shade.productId);
    await this.control.touched(shade.productId);
    await this.control.audit(actorId, "shade.delete", "Product", shade.productId, { name: shade.name, barcode: shade.barcode });
    return this.control.detail(shade.productId);
  }

  // ------------------------------------------------------------ POS gaps

  /**
   * أصناف موجودة في الكاشير ولها مخزون لكنها غير موجودة في التطبيق (لا كمنتج ولا كتدرج) —
   * أكثرها مخزوناً أولاً، مع علامة إن كانت محفوظة في مسودة.
   */
  async posMissing(q: PosMissingQueryDto) {
    const limit = q.limit ?? 40;
    const page = q.page ?? 1;
    const conds: Prisma.Sql[] = [
      Prisma.sql`s.stock > 0`,
      Prisma.sql`NOT EXISTS (SELECT 1 FROM "Product" p WHERE p.barcode IN (s.barcode, ltrim(s.barcode, '0'), '0' || s.barcode) OR p.sku = s.barcode
                   OR (s."productNum" IS NOT NULL AND p.barcode = s."productNum"))`,
      Prisma.sql`NOT EXISTS (SELECT 1 FROM "ProductShade" sh WHERE sh.barcode IN (s.barcode, ltrim(s.barcode, '0'), '0' || s.barcode)
                   OR (s."productNum" IS NOT NULL AND sh.barcode = s."productNum"))`,
    ];
    if (q.saved === "unsaved") conds.push(Prisma.sql`NOT EXISTS (SELECT 1 FROM "BarcodeDraft" d WHERE d.barcode = s.barcode)`);
    const text = q.q?.trim();
    if (text) conds.push(Prisma.sql`(s.barcode ILIKE ${`%${text}%`} OR s.name ILIKE ${`%${text}%`})`);
    const where = Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`;
    const [countRow] = await this.prisma.$queryRaw<{ n: bigint; units: bigint }[]>`
      SELECT COUNT(*)::bigint AS n, COALESCE(SUM(s.stock), 0)::bigint AS units FROM "InventorySyncSnapshot" s ${where}`;
    const rows = await this.prisma.$queryRaw<
      Array<{ barcode: string; name: string | null; price: number; originalPrice: number; discountPercent: number; stock: number; syncedAt: Date; productNum: string | null }>
    >`
      SELECT s.barcode, s.name, s.price, s."originalPrice", s."discountPercent", s.stock, s."syncedAt", s."productNum"
      FROM "InventorySyncSnapshot" s ${where}
      ORDER BY s.stock DESC, s."syncedAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    const drafts = rows.length
      ? await this.prisma.barcodeDraft.findMany({
          where: { barcode: { in: rows.map((r) => r.barcode) } },
          select: { barcode: true, id: true, group: { select: { id: true, name: true, color: true } } },
        })
      : [];
    const draftBy = new Map<string, typeof drafts>();
    for (const d of drafts) draftBy.set(d.barcode, [...(draftBy.get(d.barcode) ?? []), d]);
    const total = Number(countRow?.n ?? 0);
    return {
      data: rows.map((r) => ({
        barcode: r.barcode,
        name: fixPosArabicText(r.name) ?? r.name,
        price: r.price,
        originalPrice: r.originalPrice,
        discountPercent: r.discountPercent,
        stock: r.stock,
        syncedAt: r.syncedAt,
        drafts: (draftBy.get(r.barcode) ?? []).map((d) => ({ id: d.id, group: d.group })),
      })),
      meta: { total, units: Number(countRow?.units ?? 0), page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page * limit < total },
    };
  }

  // ------------------------------------------------------------ categories & bulk

  /** شجرة الأقسام (رئيسي ← فرعي ← ثانوي) لاختيار قسم المنتج من الهاتف. */
  async categories(): Promise<CategoryNode[]> {
    const rows = await this.prisma.category.findMany({
      select: { id: true, name: true, nameAr: true, parentId: true, isActive: true, position: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    const nodes = new Map<string, CategoryNode>(rows.map((r) => [r.id, { id: r.id, name: r.nameAr || r.name, isActive: r.isActive, children: [] }]));
    const roots: CategoryNode[] = [];
    for (const r of rows) {
      const n = nodes.get(r.id)!;
      const parent = r.parentId ? nodes.get(r.parentId) : undefined;
      if (parent) parent.children.push(n);
      else roots.push(n);
    }
    return roots;
  }

  async bulkProducts(ids: string[], isActive: boolean, actorId?: string) {
    const res = await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive } });
    await this.control.touched();
    await this.control.audit(actorId, "product.bulk", "Product", ids[0] ?? "", { isActive, count: res.count });
    return { updated: res.count };
  }
}

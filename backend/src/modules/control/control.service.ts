import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode } from "../../common/barcode.util";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { StorefrontShadesInterceptor } from "../../common/interceptors/storefront-shades.interceptor";
import { invalidateCache } from "../../common/memory-cache.util";
import { PRODUCT_PLACEHOLDER_HASH, isPlaceholderMedia } from "../../common/product-placeholder.util";
import { normalizeSearchText } from "../../common/smart-search";
import { PrismaService } from "../../common/prisma.service";
import { AdvisorService } from "../advisor/advisor.service";
import { ProductsService } from "../catalog/products.service";
import { InventorySyncService, liveShades } from "../sync/inventory-sync.service";
import { controlMediaUrls } from "./control-media.util";
import {
  ControlProductPatchDto,
  ControlSearchDto,
  ControlShadePatchDto,
  ControlShadesBulkDto,
} from "./dto/control.dto";

/** نفس تطبيع normalizeSearchText لكن داخل SQL (همزات، ة/ه، ى/ي، تشكيل). */
function sqlNorm(expr: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`regexp_replace(translate(lower(${expr}), 'أإآٱؤئىة', 'ااااوييه'), '[ً-ْٰـ]', '', 'g')`;
}

const summarySelect = {
  id: true,
  slug: true,
  sku: true,
  barcode: true,
  name: true,
  nameAr: true,
  nameEn: true,
  isActive: true,
  price: true,
  originalPrice: true,
  discountPercent: true,
  stock: true,
  updatedAt: true,
  brand: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, nameAr: true } },
  images: { orderBy: { position: "asc" as const }, take: 3, include: { media: true } },
  shades: {
    orderBy: { position: "asc" as const },
    select: { id: true, name: true, barcode: true, isActive: true, colorHex: true, colorHexEnd: true, stock: true },
  },
  _count: { select: { images: true } },
} satisfies Prisma.ProductSelect;

type SummaryRow = Prisma.ProductGetPayload<{ select: typeof summarySelect }>;

const detailInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, nameAr: true } },
  subcategory: { select: { id: true, name: true, nameAr: true } },
  images: { orderBy: { position: "asc" as const }, include: { media: true } },
  shades: { orderBy: { position: "asc" as const }, include: { image: true } },
} satisfies Prisma.ProductInclude;

type DetailRow = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

@Injectable()
export class ControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly inventory: InventorySyncService,
    private readonly homeFeedCache: HomeFeedCacheService,
    private readonly advisor: AdvisorService,
  ) {}

  // ------------------------------------------------------------------ search

  /**
   * بحث شامل للمدير: الاسم (عربي/إنجليزي)، البراند، SKU، باركود المنتج، واسم أو باركود أي تدرج.
   * يشمل الموقوف — على عكس بحث المتجر. التطابق التام للباركود يأتي أولاً.
   */
  async search(q: ControlSearchDto) {
    const raw = (q.q ?? "").trim();
    const limit = q.limit ?? 30;
    const page = q.page ?? 1;
    const conds: Prisma.Sql[] = [];
    if (q.status === "active") conds.push(Prisma.sql`p."isActive" = true`);
    if (q.status === "inactive") conds.push(Prisma.sql`p."isActive" = false`);
    if (q.brandId) conds.push(Prisma.sql`p."brandId" = ${q.brandId}`);
    switch (q.filter) {
      case "noImages":
        conds.push(Prisma.sql`NOT EXISTS (
          SELECT 1 FROM "ProductImage" pi JOIN "Media" m ON m.id = pi."mediaId"
          WHERE pi."productId" = p.id AND m.hash <> ${PRODUCT_PLACEHOLDER_HASH} AND m."storagePath" <> 'placeholder')`);
        break;
      case "shadesOff":
        conds.push(Prisma.sql`EXISTS (SELECT 1 FROM "ProductShade" s WHERE s."productId" = p.id AND s."isActive" = false)`);
        break;
      case "outOfStock":
        conds.push(Prisma.sql`p.stock <= 0`);
        break;
      case "noBarcode":
        conds.push(Prisma.sql`(p.barcode IS NULL OR btrim(p.barcode) = '')
          AND NOT EXISTS (SELECT 1 FROM "ProductShade" s WHERE s."productId" = p.id AND s.barcode IS NOT NULL AND btrim(s.barcode) <> '')`);
        break;
    }

    // 1) تطابق باركود/SKU تام (المنتج أو أي تدرج)
    const candidates = raw && !/\s/.test(raw) ? barcodeLookupCandidates(raw) : [];
    let exactIds: string[] = [];
    if (candidates.length) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT p.id FROM "Product" p
        LEFT JOIN "ProductShade" s ON s."productId" = p.id
        WHERE (p.barcode IN (${Prisma.join(candidates)}) OR p.sku IN (${Prisma.join(candidates)}) OR s.barcode IN (${Prisma.join(candidates)}))
        ${conds.length ? Prisma.sql`AND ${Prisma.join(conds, " AND ")}` : Prisma.empty}`;
      exactIds = rows.map((r) => r.id);
    }

    // 2) نص — كل كلمة يجب أن تظهر في المنتج أو في أحد تدرجاته
    const tokens = normalizeSearchText(raw).split(" ").filter(Boolean).slice(0, 8);
    const productText = sqlNorm(
      Prisma.sql`coalesce(p.name,'') || ' ' || coalesce(p."nameAr",'') || ' ' || coalesce(p."nameEn",'') || ' ' || coalesce(b.name,'') || ' ' || p.sku || ' ' || coalesce(p.barcode,'')`,
    );
    const shadeText = sqlNorm(Prisma.sql`s.name || ' ' || coalesce(s.barcode,'')`);
    const tokenConds = tokens.map((t) => {
      const like = `%${t}%`;
      return Prisma.sql`(${productText} LIKE ${like} OR EXISTS (SELECT 1 FROM "ProductShade" s WHERE s."productId" = p.id AND ${shadeText} LIKE ${like}))`;
    });
    const all = [...conds, ...tokenConds];
    if (exactIds.length) all.push(Prisma.sql`p.id NOT IN (${Prisma.join(exactIds)})`);
    // بحث برقم لم يطابق نصاً ولا باركوداً تاماً → لا نتائج (لا نعرض كل الكتالوج)
    const textSearch = tokens.length > 0 || !raw;
    const where = all.length ? Prisma.sql`WHERE ${Prisma.join(all, " AND ")}` : Prisma.empty;
    const first = tokens[0] ? `${tokens.join(" ")}%` : "";
    const phrase = tokens.length > 1 ? `%${tokens.join(" ")}%` : "";
    // الترتيب: يبدأ الاسم/البراند بالعبارة ← العبارة متصلة داخل الاسم ← الشغّال ← الأحدث تعديلاً
    const orderBy = tokens.length
      ? Prisma.sql`ORDER BY (${sqlNorm(Prisma.sql`coalesce(p."nameAr",'')`)} LIKE ${first} OR ${sqlNorm(Prisma.sql`coalesce(p."nameEn",'')`)} LIKE ${first} OR ${sqlNorm(Prisma.sql`coalesce(b.name,'')`)} LIKE ${first}) DESC,
          ${phrase ? Prisma.sql`(${productText} LIKE ${phrase}) DESC,` : Prisma.empty}
          p."isActive" DESC, p."updatedAt" DESC`
      : Prisma.sql`ORDER BY p."updatedAt" DESC`;

    let textTotal = 0;
    if (textSearch) {
      const [countRow] = await this.prisma.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(*)::bigint AS n FROM "Product" p JOIN "Brand" b ON b.id = p."brandId" ${where}`;
      textTotal = Number(countRow?.n ?? 0);
    }

    // مطابقات الباركود التامة أولاً ثم النصية
    const offset = (page - 1) * limit;
    const exactPage = exactIds.slice(offset, offset + limit);
    const textNeed = limit - exactPage.length;
    let textIds: string[] = [];
    if (textSearch && textNeed > 0) {
      const textOffset = Math.max(0, offset - exactIds.length);
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM "Product" p JOIN "Brand" b ON b.id = p."brandId" ${where}
        ${orderBy} LIMIT ${textNeed} OFFSET ${textOffset}`;
      textIds = rows.map((r) => r.id);
    }
    const ids = [...exactPage, ...textIds];
    const rows = ids.length
      ? await this.prisma.product.findMany({ where: { id: { in: ids } }, select: summarySelect })
      : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((r): r is SummaryRow => !!r)
      .map((r) => this.summary(r, { tokens, candidates }));
    const total = textTotal + exactIds.length;
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNext: offset + items.length < total,
      },
    };
  }

  private summary(r: SummaryRow, match?: { tokens: string[]; candidates: string[] }) {
    const realImages = r.images.filter((img) => !isPlaceholderMedia(img.media));
    const cover = realImages[0]?.media ?? null;
    const productText = normalizeSearchText(`${r.name} ${r.nameAr ?? ""} ${r.nameEn ?? ""} ${r.brand?.name ?? ""} ${r.sku} ${r.barcode ?? ""}`);
    const matched = match
      ? r.shades.filter((s) => {
          if (s.barcode && match.candidates.includes(normalizeBarcode(s.barcode))) return true;
          const st = normalizeSearchText(`${s.name} ${s.barcode ?? ""}`);
          return match.tokens.some((t) => !productText.includes(t) && st.includes(t));
        })
      : [];
    const exactBarcode = match?.candidates.length
      ? !!(r.barcode && match.candidates.includes(normalizeBarcode(r.barcode))) || match.candidates.includes(r.sku)
      : false;
    return {
      id: r.id,
      slug: r.slug,
      sku: r.sku,
      barcode: r.barcode,
      name: r.nameAr || r.name,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      isActive: r.isActive,
      price: r.price,
      originalPrice: r.originalPrice,
      discountPercent: r.discountPercent,
      stock: r.stock,
      updatedAt: r.updatedAt,
      brand: r.brand,
      category: r.category ? { id: r.category.id, name: r.category.nameAr || r.category.name } : null,
      thumb: cover ? controlMediaUrls(cover).thumb : null,
      imageCount: realImages.length < r.images.length ? realImages.length : r._count.images,
      shadeCount: r.shades.length,
      shadesOff: r.shades.filter((s) => !s.isActive).length,
      shadePreview: r.shades.slice(0, 8).map((s) => ({ colorHex: s.colorHex, colorHexEnd: s.colorHexEnd, isActive: s.isActive })),
      exactBarcode,
      matchedShades: matched.slice(0, 12).map((s) => ({
        id: s.id,
        name: s.name,
        barcode: s.barcode,
        isActive: s.isActive,
        colorHex: s.colorHex,
        colorHexEnd: s.colorHexEnd,
        stock: s.stock,
      })),
    };
  }

  // ------------------------------------------------------------------ lookup

  /** مسح باركود: المنتج (مع التدرج المطابق) أو — إن لم يوجد — بيانات الكاشير والمسودات المحفوظة. */
  async lookup(rawCode: string) {
    const code = normalizeBarcode(rawCode);
    if (!code) throw new BadRequestException("أدخل الباركود");
    const candidates = barcodeLookupCandidates(code);
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ barcode: { in: candidates } }, { sku: { in: candidates } }] },
      select: { id: true },
    });
    let productId = product?.id ?? null;
    let matchedShadeId: string | null = null;
    if (!productId) {
      const shade = await this.prisma.productShade.findFirst({
        where: { barcode: { in: candidates } },
        select: { id: true, productId: true },
      });
      if (shade) {
        productId = shade.productId;
        matchedShadeId = shade.id;
      }
    }
    if (productId) {
      return { code, found: true, matchedShadeId, product: await this.detail(productId) };
    }
    const [pos, drafts] = await Promise.all([
      this.inventory.getSnapshotForBarcodes([code]).catch(() => null),
      this.prisma.barcodeDraft.findMany({
        where: { barcode: { in: candidates } },
        include: { group: { select: { id: true, name: true, color: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      code,
      found: false,
      matchedShadeId: null,
      product: null,
      pos: pos
        ? {
            name: pos.name,
            price: pos.price,
            originalPrice: pos.originalPrice,
            discountPercent: pos.discountPercent,
            stock: pos.stock,
            syncedAt: pos.syncedAt,
          }
        : null,
      drafts: drafts.map((d) => ({ id: d.id, name: d.name, note: d.note, group: d.group, createdAt: d.createdAt })),
    };
  }

  // ------------------------------------------------------------------ product

  async detail(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id }, include: detailInclude });
    if (!p) throw new NotFoundException("المنتج غير موجود");
    return this.formatDetail(p);
  }

  private async formatDetail(p: DetailRow) {
    const codes = [p.barcode, ...p.shades.map((s) => s.barcode)].filter((c): c is string => !!c?.trim());
    const snaps = codes.length ? await this.inventory.getSnapshotsMapForBarcodes(codes).catch(() => new Map()) : new Map();
    const snapFor = (code?: string | null) => {
      if (!code) return null;
      for (const k of barcodeLookupCandidates(code)) {
        const s = snaps.get(k);
        if (s) return { price: s.price, stock: s.stock, name: s.name, syncedAt: s.syncedAt };
      }
      return null;
    };
    const images = p.images.filter((img) => !isPlaceholderMedia(img.media));
    return {
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      barcode: p.barcode,
      name: p.nameAr || p.name,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      description: p.description,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      howToUse: p.howToUse,
      ingredients: p.ingredients,
      isActive: p.isActive,
      isNew: p.isNew,
      isBestSeller: p.isBestSeller,
      isFeatured: p.isFeatured,
      isPromo: p.isPromo,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercent: p.discountPercent,
      stock: p.stock,
      soldCount: p.soldCount,
      rating: p.rating,
      reviewCount: p.reviewCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      brand: p.brand,
      category: p.category ? { id: p.category.id, name: p.category.nameAr || p.category.name } : null,
      subcategory: p.subcategory ? { id: p.subcategory.id, name: p.subcategory.nameAr || p.subcategory.name } : null,
      pos: snapFor(p.barcode),
      images: images.map((img, i) => ({
        position: i,
        isPrimary: i === 0,
        width: img.media.width,
        height: img.media.height,
        bytes: img.media.bytes,
        ...controlMediaUrls(img.media),
      })),
      shades: p.shades.map((s) => ({
        id: s.id,
        name: s.name,
        colorHex: s.colorHex,
        colorHexEnd: s.colorHexEnd,
        barcode: s.barcode,
        isActive: s.isActive,
        stock: s.stock,
        price: s.price,
        originalPrice: s.originalPrice,
        discountPercent: s.discountPercent,
        position: s.position,
        pos: snapFor(s.barcode),
        image: s.image ? { width: s.image.width, height: s.image.height, ...controlMediaUrls(s.image) } : null,
      })),
    };
  }

  async patchProduct(id: string, dto: ControlProductPatchDto, actorId?: string) {
    const existing = await this.prisma.product.findUnique({ where: { id }, select: { id: true, isActive: true, nameAr: true, nameEn: true } });
    if (!existing) throw new NotFoundException("المنتج غير موجود");
    const keys = Object.keys(dto).filter((k) => (dto as Record<string, unknown>)[k] !== undefined);
    if (!keys.length) return this.detail(id);

    if (keys.length === 1 && keys[0] === "isActive") {
      await this.prisma.product.update({ where: { id }, data: { isActive: dto.isActive } });
    } else {
      // باقي الحقول تمر بخدمة المنتجات (الأسماء، الباركود ومزامنة السعر، الأقسام...)
      const patch: Record<string, unknown> = { ...dto };
      if (dto.nameAr !== undefined || dto.nameEn !== undefined) {
        patch.nameAr = dto.nameAr ?? existing.nameAr ?? undefined;
        patch.nameEn = dto.nameEn ?? existing.nameEn ?? undefined;
      }
      if (dto.barcode !== undefined) patch.barcode = normalizeBarcode(dto.barcode);
      await this.products.update(id, patch as never);
    }
    await this.touched();
    await this.audit(actorId, "product.patch", "Product", id, { keys, isActive: dto.isActive });
    return this.detail(id);
  }

  async patchShade(shadeId: string, dto: ControlShadePatchDto, actorId?: string) {
    const shade = await this.prisma.productShade.findUnique({ where: { id: shadeId }, select: { id: true, productId: true } });
    if (!shade) throw new NotFoundException("التدرج غير موجود");
    const data: Prisma.ProductShadeUpdateInput = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException("اسم التدرج فارغ");
      data.name = name;
    }
    if (dto.colorHex !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(dto.colorHex)) throw new BadRequestException("لون غير صالح (#RRGGBB)");
      data.colorHex = dto.colorHex.toUpperCase();
    }
    if (dto.barcode !== undefined) data.barcode = normalizeBarcode(dto.barcode) || null;
    if (dto.imageMediaId !== undefined) {
      if (dto.imageMediaId) {
        const media = await this.prisma.media.findUnique({ where: { id: dto.imageMediaId }, select: { id: true } });
        if (!media) throw new BadRequestException("الصورة غير موجودة");
        data.image = { connect: { id: dto.imageMediaId } };
      } else {
        data.image = { disconnect: true };
      }
    }
    await this.prisma.productShade.update({ where: { id: shadeId }, data });
    if (dto.isActive !== undefined) await this.recomputeFromShades(shade.productId);
    await this.touched(shade.productId);
    await this.audit(actorId, "shade.patch", "ProductShade", shadeId, { productId: shade.productId, ...dto });
    return this.detail(shade.productId);
  }

  async bulkShades(productId: string, dto: ControlShadesBulkDto, actorId?: string) {
    const exists = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new NotFoundException("المنتج غير موجود");
    const res = await this.prisma.productShade.updateMany({
      where: { productId, ...(dto.ids?.length ? { id: { in: dto.ids } } : {}) },
      data: { isActive: dto.isActive },
    });
    await this.recomputeFromShades(productId);
    await this.touched(productId);
    await this.audit(actorId, "shade.bulk", "Product", productId, { isActive: dto.isActive, count: res.count });
    return this.detail(productId);
  }

  /**
   * مخزون المنتج = مجموع التدرجات الشغالة. السعر من التدرج القائد فقط إن كان للتدرجات أسعار من الكاشير
   * (لا نصفّر سعراً وضع يدوياً لمنتج تدرجاته بلا أسعار).
   */
  private async recomputeFromShades(productId: string) {
    const all = await this.prisma.productShade.findMany({
      where: { productId },
      select: { stock: true, price: true, originalPrice: true, discountPercent: true, isActive: true },
    });
    if (!all.length) return;
    const stock = all.reduce((sum, s) => sum + (s.isActive ? s.stock ?? 0 : 0), 0);
    const priced = liveShades(all).filter((s) => s.price != null && s.price > 0);
    const data: Prisma.ProductUpdateInput = { stock };
    if (priced.length) {
      const inStock = priced.filter((s) => s.stock > 0);
      const pool = inStock.length ? inStock : priced;
      const lead = [...pool].sort((a, b) => (b.discountPercent - a.discountPercent) || ((a.price ?? 0) - (b.price ?? 0)))[0]!;
      const maxDiscount = Math.max(0, ...priced.map((s) => s.discountPercent ?? 0));
      data.price = lead.price ?? undefined;
      data.originalPrice = lead.originalPrice || lead.price || undefined;
      data.discountPercent = maxDiscount;
      data.isPromo = maxDiscount > 0;
    }
    await this.prisma.product.update({ where: { id: productId }, data });
  }

  // ------------------------------------------------------------------ stats

  async stats() {
    const realImage = Prisma.sql`EXISTS (
      SELECT 1 FROM "ProductImage" pi JOIN "Media" m ON m.id = pi."mediaId"
      WHERE pi."productId" = p.id AND m.hash <> ${PRODUCT_PLACEHOLDER_HASH} AND m."storagePath" <> 'placeholder')`;
    const [row] = await this.prisma.$queryRaw<
      [{ total: bigint; active: bigint; no_images: bigint; out_of_stock: bigint; shades_off: bigint; products_shades_off: bigint }]
    >`
      SELECT
        (SELECT COUNT(*) FROM "Product")::bigint AS total,
        (SELECT COUNT(*) FROM "Product" WHERE "isActive")::bigint AS active,
        (SELECT COUNT(*) FROM "Product" p WHERE p."isActive" AND NOT ${realImage})::bigint AS no_images,
        (SELECT COUNT(*) FROM "Product" WHERE "isActive" AND stock <= 0)::bigint AS out_of_stock,
        (SELECT COUNT(*) FROM "ProductShade" WHERE NOT "isActive")::bigint AS shades_off,
        (SELECT COUNT(DISTINCT "productId") FROM "ProductShade" WHERE NOT "isActive")::bigint AS products_shades_off`;
    const [pending, added, groups] = await Promise.all([
      this.prisma.barcodeDraft.count({ where: { addedAt: null, group: { isArchived: false } } }),
      this.prisma.barcodeDraft.count({ where: { addedAt: { not: null } } }),
      this.prisma.barcodeDraftGroup.count({ where: { isArchived: false } }),
    ]);
    const total = Number(row.total);
    const active = Number(row.active);
    return {
      products: {
        total,
        active,
        inactive: total - active,
        noImages: Number(row.no_images),
        outOfStock: Number(row.out_of_stock),
        shadesOff: Number(row.shades_off),
        productsWithShadesOff: Number(row.products_shades_off),
      },
      drafts: { pending, added, groups },
    };
  }

  async brands() {
    return this.prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  }

  async activity(limit = 40) {
    const rows = await this.prisma.auditLog.findMany({
      where: { action: { startsWith: "control." } },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action.replace(/^control\./, ""),
      entity: r.entity,
      entityId: r.entityId,
      meta: r.meta,
      createdAt: r.createdAt,
      actor: r.actor ? r.actor.name || r.actor.email : null,
    }));
  }

  // ------------------------------------------------------------------ helpers

  /** بعد أي تعديل: المتجر يرى الأثر فوراً. */
  async touched(productId?: string) {
    if (productId) await this.prisma.product.update({ where: { id: productId }, data: { updatedAt: new Date() } }).catch(() => undefined);
    StorefrontShadesInterceptor.invalidate();
    invalidateCache("products:");
    invalidateCache("bought-together:");
    await this.homeFeedCache.invalidateAll().catch(() => undefined);
    this.advisor.markDirty();
  }

  async audit(actorId: string | undefined, action: string, entity: string, entityId: string, meta?: unknown) {
    await this.prisma.auditLog
      .create({
        data: {
          actorId: actorId ?? null,
          action: `control.${action}`,
          entity,
          entityId,
          meta: meta === undefined ? undefined : (JSON.parse(JSON.stringify(meta)) as Prisma.InputJsonValue),
        },
      })
      .catch(() => undefined);
  }
}

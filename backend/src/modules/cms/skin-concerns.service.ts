import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { paginate } from "../../common/dto/pagination.dto";
import { mediaRecordToUrl, rewriteMediaRecord } from "../../common/media-url.util";
import { PrismaService } from "../../common/prisma.service";
import { withPlaceholderImages } from "../../common/product-placeholder.util";
import { PackagesService, SKIN_TYPES, packageProductInclude, worldScope } from "./packages.service";

type ConcernRow = Prisma.SkinConcernGetPayload<{ include: { image: true } }>;

/** ما يراه التطبيق من مشكلة البشرة. */
export function publicConcern(c: ConcernRow, productCount?: number) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    description: c.description,
    icon: c.icon,
    color: c.color,
    image: rewriteMediaRecord(c.image as unknown as Record<string, unknown> | null),
    imageUrl: mediaRecordToUrl(c.image as never, true),
    causes: c.causes,
    tips: c.tips,
    ingredients: c.ingredients,
    avoid: c.avoid,
    skinTypes: c.skinTypes,
    worldSlugs: c.worldSlugs,
    position: c.position,
    ...(productCount != null ? { productCount } : {}),
  };
}

const lines = (v: unknown, max = 12) =>
  Array.isArray(v)
    ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max).map((x) => x.slice(0, 220))
    : typeof v === "string"
      ? v.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, max).map((x) => x.slice(0, 220))
      : [];

@Injectable()
export class SkinConcernsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packages: PackagesService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  /** عدد المنتجات الفعّالة لكل مشكلة. */
  private async counts() {
    const counts = await this.prisma.productSkinConcern.groupBy({
      by: ["concernId"],
      _count: { concernId: true },
      where: { product: { isActive: true } },
    });
    return new Map(counts.map((c) => [c.concernId, c._count.concernId]));
  }

  /** للوحة التحكم (all) أو للتطبيق (الفعّالة لعالم معيّن، مع عدد المنتجات). */
  async list(activeOnly = true, withCounts = false, world?: string) {
    const items = await this.prisma.skinConcern.findMany({
      where: { ...(activeOnly ? { isActive: true } : {}), ...(activeOnly ? worldScope(world) : {}) },
      orderBy: { position: "asc" },
      include: { image: true },
    });
    const countMap = await this.counts();
    if (!activeOnly) {
      return items.map((item) => ({ ...item, productCount: countMap.get(item.id) ?? 0 }));
    }
    void withCounts;
    return items.map((c) => publicConcern(c, countMap.get(c.id) ?? 0));
  }

  /** صفحة الدليل لمشكلة: المحتوى + أفضل المنتجات + الروتينات المناسبة + مشاكل أخرى. */
  async guide(slug: string, world?: string) {
    const concern = await this.prisma.skinConcern.findUnique({ where: { slug }, include: { image: true } });
    if (!concern || !concern.isActive) throw new NotFoundException("Skin concern not found");
    const productWhere: Prisma.ProductWhereInput = {
      isActive: true,
      skinConcerns: { some: { concernId: concern.id } },
    };
    const [total, products, routines, others, countMap] = await Promise.all([
      this.prisma.product.count({ where: productWhere }),
      this.prisma.product.findMany({
        where: productWhere,
        orderBy: [{ stock: "desc" }, { soldCount: "desc" }],
        take: 12,
        include: packageProductInclude,
      }),
      this.packages.listPublic({ world, concern: slug, limit: 12 }),
      this.prisma.skinConcern.findMany({
        where: { isActive: true, id: { not: concern.id }, ...worldScope(world) },
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.counts(),
    ]);
    return {
      concern: publicConcern(concern, total),
      products: products.map((p) => withPlaceholderImages(p)),
      productTotal: total,
      routines,
      others: others.map((c) => publicConcern(c, countMap.get(c.id) ?? 0)),
    };
  }

  /**
   * نتيجة «اختبار البشرة»: نوع البشرة + المشاكل المختارة →
   * روتين صباحي ومسائي مناسبان، باقات المشاكل، وأفضل منتجات كل مشكلة.
   */
  async match(opts: { skinType?: string; concerns?: string[]; world?: string }) {
    const skinType = opts.skinType && SKIN_TYPES.includes(opts.skinType) ? opts.skinType : undefined;
    const slugs = (opts.concerns ?? []).filter(Boolean).slice(0, 4);
    const routines = await this.packages.listPublic({ world: opts.world, kind: "routines", skinType });
    // الأنسب: يطابق المشكلة أولاً ثم نوع البشرة.
    const score = (p: { concernSlugs: string[]; skinTypes: string[] }) =>
      p.concernSlugs.filter((s) => slugs.includes(s)).length * 2 + (skinType && p.skinTypes.includes(skinType) ? 1 : 0);
    const sorted = [...routines].sort((a, b) => score(b) - score(a));
    const morning = sorted.find((p) => p.kind === "ROUTINE_MORNING") ?? null;
    const evening = sorted.find((p) => p.kind === "ROUTINE_EVENING") ?? null;
    const concerns = slugs.length
      ? await this.prisma.skinConcern.findMany({ where: { slug: { in: slugs }, isActive: true }, include: { image: true } })
      : [];
    const picks = await Promise.all(
      concerns.map(async (c) => ({
        concern: publicConcern(c),
        products: (
          await this.prisma.product.findMany({
            where: { isActive: true, stock: { gt: 0 }, skinConcerns: { some: { concernId: c.id } } },
            orderBy: { soldCount: "desc" },
            take: 6,
            include: packageProductInclude,
          })
        ).map((p) => withPlaceholderImages(p)),
      })),
    );
    return {
      skinType: skinType ?? null,
      morning,
      evening,
      routines: sorted.slice(0, 6),
      concerns: picks,
    };
  }

  async findBySlug(slug: string, page = 1, limit = 20) {
    const concern = await this.prisma.skinConcern.findUnique({ where: { slug } });
    if (!concern || !concern.isActive) throw new NotFoundException("Skin concern not found");
    const skip = (page - 1) * limit;
    const where = { isActive: true, skinConcerns: { some: { concernId: concern.id } } };
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { soldCount: "desc" },
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          images: { take: 1, include: { media: true }, orderBy: { position: "asc" } },
        },
      }),
    ]);
    return { concern, products: paginate(products, total, page, limit) };
  }

  /** للوحة التحكم: منتجات المشكلة (لمحرّر الباركود). */
  async adminProducts(id: string) {
    const rows = await this.prisma.productSkinConcern.findMany({
      where: { concernId: id },
      include: {
        product: {
          include: {
            brand: { select: { name: true } },
            images: { take: 1, orderBy: { position: "asc" }, include: { media: true } },
          },
        },
      },
    });
    return rows.map((r) => r.product);
  }

  async create(data: Record<string, unknown>) {
    const clean = this.clean(data, true);
    const created = await this.prisma.skinConcern.create({ data: clean as Prisma.SkinConcernCreateInput });
    await this.setProducts(created.id, data);
    await this.homeFeedCache.invalidateAll();
    return created;
  }

  async update(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.skinConcern.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Skin concern not found");
    const updated = await this.prisma.skinConcern.update({ where: { id }, data: this.clean(data, false) });
    await this.setProducts(id, data);
    await this.homeFeedCache.invalidateAll();
    return updated;
  }

  async remove(id: string) {
    await this.prisma.skinConcern.delete({ where: { id } });
    await this.homeFeedCache.invalidateAll();
    return { success: true };
  }

  /** productIds في الطلب = استبدال قائمة منتجات المشكلة. */
  private async setProducts(concernId: string, raw: Record<string, unknown>) {
    if (!Array.isArray(raw.productIds)) return;
    const ids = [...new Set((raw.productIds as unknown[]).map(String).filter(Boolean))];
    await this.prisma.$transaction([
      this.prisma.productSkinConcern.deleteMany({ where: { concernId, productId: { notIn: ids } } }),
      this.prisma.productSkinConcern.createMany({
        data: ids.map((productId) => ({ productId, concernId })),
        skipDuplicates: true,
      }),
    ]);
  }

  private clean(raw: Record<string, unknown>, creating: boolean): Prisma.SkinConcernUpdateInput {
    const out: Record<string, unknown> = {};
    if ("name" in raw) {
      const name = String(raw.name ?? "").trim();
      if (!name) throw new BadRequestException("الاسم مطلوب");
      out.name = name;
    } else if (creating) throw new BadRequestException("الاسم مطلوب");
    if ("slug" in raw || creating) {
      const slug = String(raw.slug ?? raw.name ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w؀-ۿ-]+/g, "");
      if (!slug) throw new BadRequestException("Slug مطلوب");
      out.slug = slug;
    }
    if ("description" in raw) out.description = String(raw.description ?? "").trim();
    for (const k of ["icon", "subtitle"]) if (k in raw) out[k] = String(raw[k] ?? "").trim() || null;
    if ("color" in raw) {
      const c = String(raw.color ?? "").trim();
      out.color = /^#[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : null;
    }
    if ("imageId" in raw) {
      out.image = raw.imageId ? { connect: { id: String(raw.imageId) } } : creating ? undefined : { disconnect: true };
    }
    if ("position" in raw) out.position = Math.max(0, Math.round(Number(raw.position) || 0));
    if ("isActive" in raw) out.isActive = Boolean(raw.isActive);
    for (const k of ["causes", "tips", "ingredients", "avoid"]) if (k in raw) out[k] = lines(raw[k]);
    if ("skinTypes" in raw) out.skinTypes = lines(raw.skinTypes).filter((t) => SKIN_TYPES.includes(t));
    if ("worldSlugs" in raw) out.worldSlugs = lines(raw.worldSlugs, 20);
    return out as Prisma.SkinConcernUpdateInput;
  }
}

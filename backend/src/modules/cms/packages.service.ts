import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PackageKind, Prisma } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { mediaRecordToUrl, rewriteMediaRecord } from "../../common/media-url.util";
import { PrismaService } from "../../common/prisma.service";
import { withPlaceholderImages } from "../../common/product-placeholder.util";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w؀-ۿ-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `package-${Date.now()}`;
}

export const SKIN_TYPES = ["dry", "oily", "combination", "normal", "sensitive"];
const ROUTINE_KINDS: PackageKind[] = [PackageKind.ROUTINE_MORNING, PackageKind.ROUTINE_EVENING];

/** منتج داخل باقة: نفس شكل قوائم المتجر (صور، براند، درجات) ليقرأه التطبيق كأي منتج. */
export const packageProductInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, include: { media: true } },
  shades: { where: { isActive: true }, orderBy: { position: "asc" as const } },
} satisfies Prisma.ProductInclude;

export const packageInclude = {
  coverImage: true,
  items: { orderBy: { position: "asc" as const }, include: { product: { include: packageProductInclude } } },
} satisfies Prisma.PackageInclude;

type PackageFull = Prisma.PackageGetPayload<{ include: typeof packageInclude }>;

/** صالحة الآن؟ مفعّلة ولم ينتهِ موعدها. */
export function isPackageLive(p: { isActive: boolean; endsAt: Date | null }, now = new Date()) {
  return p.isActive && (!p.endsAt || p.endsAt > now);
}

/** عالم معيّن: الباقات العامة (بلا عوالم) + المخصصة له. */
export function worldScope(world?: string | null) {
  if (!world) return {};
  return { OR: [{ worldSlugs: { isEmpty: true } }, { worldSlugs: { has: world } }] };
}

/**
 * ما يراه التطبيق: الأسعار محسوبة من أسعار المنتجات الحالية —
 * «السعر قبل الخصم» = مجموع المنتجات دائماً (لا رقم قديم مكتوب يدوياً)، والتوفير الفعلي.
 */
export function publicPackage(p: PackageFull) {
  const items = p.items.filter((i) => i.product && i.product.isActive);
  const itemsTotal = items.reduce((s, i) => s + i.product.price * Math.max(1, i.quantity), 0);
  const original = Math.max(itemsTotal, p.originalPrice || 0);
  const saving = Math.max(0, itemsTotal - p.price);
  const inStock = items.length > 0 && items.every((i) => i.product.stock >= Math.max(1, i.quantity));
  const thumbs = items
    .map((i) => mediaRecordToUrl(i.product.images.find((im) => im.media)?.media as never))
    .filter((u): u is string => !!u)
    .slice(0, 5);
  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    kind: p.kind,
    isRoutine: ROUTINE_KINDS.includes(p.kind),
    badge: p.badge,
    isFeatured: p.isFeatured,
    price: p.price,
    originalPrice: original,
    itemsTotal,
    saving,
    savingPercent: itemsTotal > 0 ? Math.round((saving / itemsTotal) * 100) : 0,
    endsAt: p.endsAt,
    inStock,
    coverImage: rewriteMediaRecord(p.coverImage as unknown as Record<string, unknown> | null),
    coverUrl: mediaRecordToUrl(p.coverImage as never, true),
    thumbs,
    stepCount: items.length,
    worldSlugs: p.worldSlugs,
    concernSlugs: p.concernSlugs,
    skinTypes: p.skinTypes,
    position: p.position,
    items: items.map((i) => ({
      id: i.id,
      position: i.position,
      stepTitle: i.stepTitle,
      note: i.note,
      quantity: Math.max(1, i.quantity),
      product: withPlaceholderImages(i.product),
    })),
  };
}

export type PublicPackage = ReturnType<typeof publicPackage>;

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  /** للوحة التحكم: كل الباقات (مع المنتجات عند الطلب). */
  list(activeOnly = true, kind?: PackageKind, lite = false) {
    const where: Prisma.PackageWhereInput = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(kind ? { kind } : {}),
    };
    if (lite) {
      return this.prisma.package.findMany({
        where,
        orderBy: { position: "asc" },
        include: {
          coverImage: true,
          _count: { select: { items: true } },
          items: { orderBy: { position: "asc" }, include: { product: { include: { images: { take: 1, orderBy: { position: "asc" }, include: { media: true } } } } } },
        },
      });
    }
    return this.prisma.package.findMany({ where, orderBy: { position: "asc" }, include: packageInclude });
  }

  /**
   * للتطبيق: الباقات الصالحة الآن لعالم معيّن، بأنواع محددة.
   * kind: ROUTINE_MORNING | ROUTINE_EVENING | routines | bundles | GENERAL | BRIDAL_KIT
   */
  async listPublic(opts: { world?: string; kind?: string; concern?: string; skinType?: string; limit?: number } = {}) {
    const where: Prisma.PackageWhereInput = { isActive: true, ...worldScope(opts.world) };
    const k = opts.kind;
    if (k === "routines") where.kind = { in: ROUTINE_KINDS };
    else if (k === "bundles") where.kind = { notIn: ROUTINE_KINDS };
    else if (k && (Object.values(PackageKind) as string[]).includes(k)) where.kind = k as PackageKind;
    if (opts.concern) where.concernSlugs = { has: opts.concern };
    const rows = await this.prisma.package.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { position: "asc" }],
      include: packageInclude,
      take: Math.min(60, opts.limit ?? 60),
    });
    const now = new Date();
    let list = rows.filter((p) => isPackageLive(p, now)).map(publicPackage).filter((p) => p.stepCount > 0);
    // نوع البشرة: المناسب لها أولاً، ثم العام — لا نُخفي الباقة العامة.
    if (opts.skinType) {
      const t = opts.skinType;
      list = list
        .filter((p) => !p.skinTypes.length || p.skinTypes.includes(t))
        .sort((a, b) => Number(b.skinTypes.includes(t)) - Number(a.skinTypes.includes(t)));
    }
    return list;
  }

  /** صفحة باقة في التطبيق: بالـ id أو الـ slug، الصالحة فقط. */
  async findPublic(idOrSlug: string) {
    const pack = await this.prisma.package.findFirst({
      where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }], isActive: true },
      include: packageInclude,
    });
    if (!pack || !isPackageLive(pack)) throw new NotFoundException("الباقة غير متوفرة حالياً");
    const out = publicPackage(pack);
    // باقات مشابهة (نفس النوع أو نفس المشكلة) لأسفل الصفحة.
    const related = await this.prisma.package.findMany({
      where: {
        isActive: true,
        id: { not: pack.id },
        OR: [{ kind: pack.kind }, ...(pack.concernSlugs.length ? [{ concernSlugs: { hasSome: pack.concernSlugs } }] : [])],
      },
      orderBy: { position: "asc" },
      include: packageInclude,
      take: 8,
    });
    return {
      ...out,
      related: related.filter((p) => isPackageLive(p)).map(publicPackage).filter((p) => p.stepCount > 0).slice(0, 6),
    };
  }

  async findOne(id: string) {
    const pack = await this.prisma.package.findUnique({ where: { id }, include: packageInclude });
    if (!pack) throw new NotFoundException("Package not found");
    return pack;
  }

  async create(data: Record<string, unknown>) {
    const clean = this.clean(data, true);
    const items = this.itemsFrom(data);
    const created = await this.prisma.package.create({
      data: {
        ...(clean as Prisma.PackageCreateInput),
        slug: (clean.slug as string) || slugify(String(clean.name)),
        items: { create: (items ?? []).map((it, i) => ({ ...it, position: i })) },
      },
      include: { items: true },
    });
    await this.homeFeedCache.invalidateAll();
    return created;
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.ensure(id);
    const clean = this.clean(data, false);
    const items = this.itemsFrom(data);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.packageItem.deleteMany({ where: { packageId: id } });
        if (items.length) {
          await tx.packageItem.createMany({ data: items.map((it, i) => ({ ...it, packageId: id, position: i })) });
        }
      }
      return tx.package.update({ where: { id }, data: clean, include: { items: true } });
    });
    await this.homeFeedCache.invalidateAll();
    return updated;
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.package.delete({ where: { id } });
    await this.homeFeedCache.invalidateAll();
    return { success: true };
  }

  /** خطوات/منتجات الباقة: items [{productId, stepTitle, note, quantity}] أو productIds القديمة. */
  private itemsFrom(raw: Record<string, unknown>) {
    const seen = new Set<string>();
    if (Array.isArray(raw.items)) {
      return (raw.items as Record<string, unknown>[])
        .map((it) => ({
          productId: String(it.productId ?? ""),
          stepTitle: typeof it.stepTitle === "string" && it.stepTitle.trim() ? it.stepTitle.trim().slice(0, 60) : null,
          note: typeof it.note === "string" && it.note.trim() ? it.note.trim().slice(0, 300) : null,
          quantity: Math.min(10, Math.max(1, Math.round(Number(it.quantity) || 1))),
        }))
        .filter((it) => it.productId && !seen.has(it.productId) && seen.add(it.productId));
    }
    if (Array.isArray(raw.productIds)) {
      return (raw.productIds as unknown[])
        .map(String)
        .filter((pid) => pid && !seen.has(pid) && seen.add(pid))
        .map((productId) => ({ productId, stepTitle: null, note: null, quantity: 1 }));
    }
    return null;
  }

  /** حقول مسموحة فقط، بأنواع صحيحة. */
  private clean(raw: Record<string, unknown>, creating: boolean): Prisma.PackageUpdateInput {
    const out: Record<string, unknown> = {};
    const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
    const strs = (v: unknown, allowed?: string[]) =>
      Array.isArray(v)
        ? [...new Set(v.map((x) => String(x).trim()).filter((x) => x && (!allowed || allowed.includes(x))))]
        : [];
    if ("name" in raw) {
      const name = String(raw.name ?? "").trim();
      if (!name) throw new BadRequestException("الاسم مطلوب");
      out.name = name;
    } else if (creating) throw new BadRequestException("الاسم مطلوب");
    if ("slug" in raw) out.slug = String(raw.slug ?? "").trim() || undefined;
    if ("kind" in raw && raw.kind) {
      if (!(Object.values(PackageKind) as string[]).includes(String(raw.kind))) throw new BadRequestException("نوع غير معروف");
      out.kind = raw.kind;
    }
    for (const k of ["subtitle", "description"]) if (k in raw) out[k] = String(raw[k] ?? "").trim();
    if ("badge" in raw) out.badge = String(raw.badge ?? "").trim() || null;
    if ("price" in raw) out.price = int(raw.price);
    else if (creating) throw new BadRequestException("السعر مطلوب");
    if ("originalPrice" in raw) out.originalPrice = int(raw.originalPrice);
    if ("position" in raw) out.position = int(raw.position);
    for (const k of ["isActive", "isFeatured"]) if (k in raw) out[k] = Boolean(raw[k]);
    if ("coverImageId" in raw) {
      out.coverImage = raw.coverImageId ? { connect: { id: String(raw.coverImageId) } } : creating ? undefined : { disconnect: true };
    }
    if ("worldSlugs" in raw) out.worldSlugs = strs(raw.worldSlugs);
    if ("concernSlugs" in raw) out.concernSlugs = strs(raw.concernSlugs);
    if ("skinTypes" in raw) out.skinTypes = strs(raw.skinTypes, SKIN_TYPES);
    if ("endsAt" in raw) out.endsAt = raw.endsAt ? new Date(String(raw.endsAt)) : null;
    return out as Prisma.PackageUpdateInput;
  }

  private async ensure(id: string) {
    const p = await this.prisma.package.findUnique({ where: { id } });
    if (!p) throw new NotFoundException("Package not found");
  }
}

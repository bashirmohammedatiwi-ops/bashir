import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MediaPurpose, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { MediaService } from "../media/media.service";

function mapBrand(b: any) {
  return {
    ...b,
    productCount: b._count?.products ?? 0,
    collections: b.collections,
  };
}

function normalizeBrandKey(name = "") {
  let key = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[''`´]/g, "")
    .replace(/[.&]/g, " ")
    .replace(/\b(the|and|co|company|ltd|inc|llc|gmbh|paris|london|uae|ae)\b/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!key) return "";

  const arAliases: Record<string, string> = {
    شانيل: "chanel",
    ديور: "dior",
    "إيف سان لوران": "yves saint laurent",
    "ايف سان لوران": "yves saint laurent",
    لانكوم: "lancome",
    ماك: "mac",
    نارس: "nars",
    كلينيك: "clinique",
    جيفنشي: "givenchy",
    غوتشي: "gucci",
    برادا: "prada",
    هيرميس: "hermes",
    فالنتينو: "valentino",
    بربري: "burberry",
    ارماني: "armani",
    أرماني: "armani",
    "توم فورد": "tom ford",
    "بوبي براون": "bobbi brown",
    "شارلوت تيلبري": "charlotte tilbury",
  };
  const enAliases: Record<string, string> = {
    "m a c": "mac",
    "m.a.c": "mac",
    "mac cosmetics": "mac",
    ysl: "yves saint laurent",
    "yves saint laurent beaute": "yves saint laurent",
    "estée lauder": "estee lauder",
    "makeup forever": "make up for ever",
    "l oreal": "loreal",
    "l'oreal": "loreal",
    "loreal paris": "loreal",
  };

  if (arAliases[key]) return arAliases[key];
  if (enAliases[key]) return enAliases[key];

  key = key
    .replace(/\b(beauty|cosmetics|makeup|skincare|fragrance|perfume|parfum)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return enAliases[key] || key;
}

function brandHintKeys(input: { name?: string; brandAr?: string; brandEn?: string }) {
  const keys = new Set<string>();
  for (const hint of [input.name, input.brandEn, input.brandAr]) {
    const key = normalizeBrandKey(String(hint || ""));
    if (key && key !== "no brand" && key !== "nobrand" && key !== "unknown") {
      keys.add(key);
    }
  }
  return [...keys];
}

function slugifyBrand(name = "") {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 80);
  return base || `brand-${Date.now()}`;
}

function scoreBrandMatch(hints: string[], brand: { name?: string | null; slug?: string | null }) {
  const candidates = [brand.name, brand.slug]
    .filter(Boolean)
    .map((x) => normalizeBrandKey(String(x)));
  let best = 0;
  for (const hint of hints) {
    const h = normalizeBrandKey(hint);
    if (!h) continue;
    for (const c of candidates) {
      if (!c) continue;
      if (h === c) best = Math.max(best, 100);
      else if (h.includes(c) || c.includes(h)) best = Math.max(best, 82);
      else {
        const hWords = h.split(" ").filter((w) => w.length > 1);
        const cWords = c.split(" ").filter((w) => w.length > 1);
        const overlap = hWords.filter((w) =>
          cWords.some((cw) => cw === w || cw.includes(w) || w.includes(cw)),
        ).length;
        if (overlap >= 2) best = Math.max(best, 88);
        else if (overlap === 1) best = Math.max(best, 55 + overlap * 15);
      }
    }
  }
  return best;
}

function pickBrandDisplayName(brandAr = "", brandEn = "") {
  const ar = String(brandAr || "").trim();
  const en = String(brandEn || "").trim();
  if (en && /[A-Za-z]/.test(en)) return en;
  if (ar && /[A-Za-z]/.test(ar)) return ar;
  return ar || en;
}

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list(opts?: { featuredOnly?: boolean; all?: boolean }) {
    const rows = await this.prisma.brand.findMany({
      where: {
        isActive: opts?.all ? undefined : true,
        isFeatured: opts?.featuredOnly ? true : undefined,
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: {
        logo: true,
        collections: {
          where: opts?.all ? undefined : { isActive: true },
          orderBy: { position: "asc" },
        },
        _count: { select: { products: true, collections: true } },
      },
    });
    return rows.map(mapBrand);
  }

  async findOne(idOrSlug: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        logo: true,
        collections: { orderBy: { position: "asc" } },
        _count: { select: { products: true } },
      },
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return mapBrand(brand);
  }

  /** مطابقة براند موجود أو إنشاؤه إن لم يوجد — بدون تكرار */
  async resolve(input: {
    brandAr?: string;
    brandEn?: string;
    name?: string;
    logoUrl?: string;
    logoIsProductImage?: boolean;
    createIfMissing?: boolean;
  }) {
    const hints = [input.name, input.brandEn, input.brandAr]
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    if (!hints.length) {
      throw new BadRequestException("اسم البراند مطلوب");
    }

    const brands = await this.prisma.brand.findMany({
      select: { id: true, name: true, slug: true, logoId: true },
    });

    let best: { id: string; score: number; logoId: string | null } | null = null;
    for (const b of brands) {
      const score = scoreBrandMatch(hints, b);
      if (score >= 75 && (!best || score > best.score)) {
        best = { id: b.id, score, logoId: b.logoId };
      }
    }

    if (best) {
      const attached = await this.attachLogoIfNeeded(
        best.id,
        input.logoUrl,
        Boolean(input.logoIsProductImage),
        Boolean(best.logoId),
      );
      const brand = await this.findOne(best.id);
      return { brand, created: false, matched: true, logoAttached: attached };
    }

    if (input.createIfMissing === false) {
      return { brand: null, created: false, matched: false, logoAttached: false };
    }

    const name = pickBrandDisplayName(input.brandAr || "", input.brandEn || "") || hints[0];
    const slug = await this.uniqueSlug(slugifyBrand(name));
    const initial = name.trim().charAt(0).toUpperCase() || null;
    const created = await this.prisma.brand.create({
      data: {
        name,
        slug,
        initial,
        isActive: true,
        isFeatured: false,
        position: 0,
      },
    });

    const attached = input.logoUrl
      ? await this.attachLogoIfNeeded(created.id, input.logoUrl, Boolean(input.logoIsProductImage), false)
      : false;

    const brand = await this.findOne(created.id);
    return { brand, created: true, matched: false, logoAttached: attached };
  }

  /** مزامنة براندات من catalog-hub مع إزالة التكرار */
  async syncFromCatalog(payload: {
    brands?: Array<{
      name?: string;
      nameAr?: string;
      nameEn?: string;
      logoUrl?: string;
      logoIsProductImage?: boolean;
    }>;
    attachLogos?: boolean;
  }) {
    const rows = Array.isArray(payload.brands) ? payload.brands : [];
    if (!rows.length) {
      throw new BadRequestException("لا توجد براندات للمزامنة");
    }

    const attachLogos = payload.attachLogos !== false;
    let created = 0;
    let matched = 0;
    let logosAttached = 0;
    const seen = new Set<string>();

    for (const row of rows) {
      const keys = brandHintKeys(row);
      if (!keys.length || keys.some((k) => seen.has(k))) continue;
      keys.forEach((k) => seen.add(k));

      const name = pickBrandDisplayName(row.nameAr || "", row.nameEn || "") || String(row.name || "").trim();
      const logoUrl = attachLogos ? row.logoUrl : undefined;

      const result = await this.resolve({
        name,
        brandAr: row.nameAr,
        brandEn: row.nameEn,
        logoUrl,
        logoIsProductImage: row.logoIsProductImage,
        createIfMissing: true,
      });

      if (result.created) created += 1;
      else if (result.matched) matched += 1;
      if (result.logoAttached) logosAttached += 1;
    }

    return {
      totalInput: rows.length,
      uniqueProcessed: seen.size,
      created,
      matched,
      logosAttached,
      totalBrands: await this.prisma.brand.count(),
    };
  }

  async create(data: any) {
    if (data?.name && !data?.slug) {
      data = { ...data, slug: await this.uniqueSlug(slugifyBrand(data.name)) };
    }
    if (data?.name && !data?.initial) {
      data = { ...data, initial: String(data.name).trim().charAt(0).toUpperCase() };
    }
    const row = await this.prisma.brand.create({ data });
    return this.findOne(row.id);
  }

  async update(id: string, data: any) {
    await this.ensureExists(id);
    await this.prisma.brand.update({ where: { id }, data });
    return this.findOne(id);
  }

  private async uniqueSlug(base: string) {
    let slug = base || `brand-${Date.now()}`;
    let i = 2;
    while (await this.prisma.brand.findUnique({ where: { slug } })) {
      slug = `${base}-${i}`.slice(0, 80);
      i += 1;
    }
    return slug;
  }

  private async attachLogoIfNeeded(
    brandId: string,
    url?: string,
    logoIsProductImage = false,
    hasLogo = false,
  ) {
    const clean = String(url || "").trim();
    if (!clean) return false;
    // بدون شعار: أي صورة. مع شعار موجود: نرفع فقط شعاراً حقيقياً (ليس صورة منتج).
    if (hasLogo && logoIsProductImage) return false;
    try {
      await this.attachLogoFromUrl(brandId, clean);
      return true;
    } catch {
      return false;
    }
  }

  private async attachLogoFromUrl(brandId: string, url: string) {
    const media = await this.media.uploadFromUrl(url, MediaPurpose.BRAND, "brand-logo");
    await this.prisma.brand.update({
      where: { id: brandId },
      data: { logoId: media.id },
    });
    return media;
  }

  async remove(id: string, opts?: { reassignToBrandId?: string }) {
    await this.ensureExists(id);
    const productCount = await this.prisma.product.count({ where: { brandId: id } });
    const reassignTo = String(opts?.reassignToBrandId || "").trim();

    if (productCount > 0) {
      if (!reassignTo) {
        throw new BadRequestException(
          `لا يمكن حذف البراند — مرتبط بـ ${productCount} منتج. اختر برانداً لنقل المنتجات إليه.`,
        );
      }
      if (reassignTo === id) {
        throw new BadRequestException("اختر برانداً مختلفاً لنقل المنتجات إليه");
      }
      await this.ensureExists(reassignTo);
      await this.prisma.product.updateMany({
        where: { brandId: id },
        data: { brandId: reassignTo },
      });
    }

    try {
      await this.prisma.brand.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new BadRequestException(
          "لا يمكن حذف البراند — ما زال مرتبطاً ببيانات أخرى في المتجر.",
        );
      }
      throw error;
    }
    return {
      success: true,
      reassignedProducts: productCount > 0 ? productCount : 0,
      reassignToBrandId: productCount > 0 ? reassignTo : undefined,
    };
  }

  async listCollectionsBySlugOrId(idOrSlug: string, all = false) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return this.listCollections(brand.id, all);
  }

  async createCollectionForBrand(idOrSlug: string, data: any) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return this.createCollection(brand.id, data);
  }

  listCollections(brandId: string, all = false) {
    return this.prisma.brandCollection.findMany({
      where: {
        brandId,
        isActive: all ? undefined : true,
      },
      orderBy: { position: "asc" },
    });
  }

  async createCollection(brandId: string, data: any) {
    await this.ensureExists(brandId);
    return this.prisma.brandCollection.create({
      data: {
        brandId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCollection(id: string, data: any) {
    await this.ensureCollection(id);
    return this.prisma.brandCollection.update({ where: { id }, data });
  }

  async removeCollection(id: string) {
    await this.ensureCollection(id);
    await this.prisma.brandCollection.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const b = await this.prisma.brand.findUnique({ where: { id } });
    if (!b) throw new NotFoundException("Brand not found");
  }

  private async ensureCollection(id: string) {
    const c = await this.prisma.brandCollection.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Brand collection not found");
  }
}

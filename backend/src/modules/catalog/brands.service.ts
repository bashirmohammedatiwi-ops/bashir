import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

function mapBrand(b: any) {
  return {
    ...b,
    productCount: b._count?.products ?? 0,
    collections: b.collections,
  };
}

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(data: any) {
    const row = await this.prisma.brand.create({ data });
    return this.findOne(row.id);
  }

  async update(id: string, data: any) {
    await this.ensureExists(id);
    await this.prisma.brand.update({ where: { id }, data });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.brand.delete({ where: { id } });
    return { success: true };
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

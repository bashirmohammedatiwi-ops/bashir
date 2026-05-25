import { Injectable, NotFoundException } from "@nestjs/common";
import { PackageKind, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `package-${Date.now()}`;
}

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true, kind?: PackageKind) {
    const where: Prisma.PackageWhereInput = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(kind ? { kind } : {}),
    };
    return this.prisma.package.findMany({
      where,
      orderBy: { position: "asc" },
      include: {
        coverImage: true,
        items: {
          orderBy: { position: "asc" },
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" }, include: { media: true } } },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const pack = await this.prisma.package.findUnique({
      where: { id },
      include: {
        coverImage: true,
        items: {
          orderBy: { position: "asc" },
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" }, include: { media: true } } },
            },
          },
        },
      },
    });
    if (!pack) throw new NotFoundException("Package not found");
    return pack;
  }

  async findBySlug(slug: string) {
    const pack = await this.prisma.package.findFirst({
      where: { OR: [{ slug }, { id: slug }], isActive: true },
      include: {
        coverImage: true,
        items: {
          orderBy: { position: "asc" },
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" }, include: { media: true } } },
            },
          },
        },
      },
    });
    if (!pack) throw new NotFoundException("Package not found");
    return pack;
  }

  async create(data: any) {
    const { productIds = [], slug, kind, ...rest } = data;
    const finalSlug = slug?.trim() || slugify(rest.name);
    return this.prisma.package.create({
      data: {
        ...rest,
        slug: finalSlug,
        kind: kind ?? PackageKind.GENERAL,
        items: { create: productIds.map((pid: string, i: number) => ({ productId: pid, position: i })) },
      },
      include: { items: true },
    });
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    const { productIds, slug, kind, ...rest } = data;
    return this.prisma.$transaction(async (tx) => {
      if (productIds) {
        await tx.packageItem.deleteMany({ where: { packageId: id } });
        await tx.packageItem.createMany({
          data: productIds.map((pid: string, i: number) => ({
            packageId: id,
            productId: pid,
            position: i,
          })),
        });
      }
      return tx.package.update({
        where: { id },
        data: {
          ...rest,
          slug: slug?.trim() || undefined,
          kind: kind ?? undefined,
        },
        include: { items: true },
      });
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.package.delete({ where: { id } });
    return { success: true };
  }

  private async ensure(id: string) {
    const p = await this.prisma.package.findUnique({ where: { id } });
    if (!p) throw new NotFoundException("Package not found");
  }
}

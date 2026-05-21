import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.package.findMany({
      where: activeOnly ? { isActive: true } : undefined,
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

  async create(data: any) {
    const { productIds = [], ...rest } = data;
    return this.prisma.package.create({
      data: {
        ...rest,
        items: { create: productIds.map((pid: string, i: number) => ({ productId: pid, position: i })) },
      },
      include: { items: true },
    });
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    const { productIds, ...rest } = data;
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
      return tx.package.update({ where: { id }, data: rest, include: { items: true } });
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

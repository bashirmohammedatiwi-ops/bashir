import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = false) {
    return this.prisma.banner.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
      include: { image: true },
    });
  }

  create(data: any) {
    return this.prisma.banner.create({ data });
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }

  private async ensure(id: string) {
    const b = await this.prisma.banner.findUnique({ where: { id } });
    if (!b) throw new NotFoundException("Banner not found");
  }
}

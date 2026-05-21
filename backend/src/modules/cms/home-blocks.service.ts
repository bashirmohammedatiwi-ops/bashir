import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class HomeBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.homeBlock.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
    });
  }

  create(data: any) {
    return this.prisma.homeBlock.create({ data });
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    return this.prisma.homeBlock.update({ where: { id }, data });
  }

  async reorder(ids: string[]) {
    return this.prisma.$transaction(
      ids.map((id, position) => this.prisma.homeBlock.update({ where: { id }, data: { position } })),
    );
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.homeBlock.delete({ where: { id } });
    return { success: true };
  }

  private async ensure(id: string) {
    const b = await this.prisma.homeBlock.findUnique({ where: { id } });
    if (!b) throw new NotFoundException("HomeBlock not found");
  }
}

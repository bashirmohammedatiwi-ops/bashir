import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  validate(code: string) {
    return this.prisma.coupon.findFirst({
      where: {
        code,
        isActive: true,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    });
  }

  create(data: any) {
    return this.prisma.coupon.create({ data });
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  private async ensure(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Coupon not found");
  }
}

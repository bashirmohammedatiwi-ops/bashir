import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { QueryUsersDto, UpdateUserDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {
      role: q.role,
      isActive: q.isActive,
      OR: q.search
        ? [
            { name: { contains: q.search } },
            { email: { contains: q.search } },
            { phone: { contains: q.search } },
          ]
        : undefined,
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.limit,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          isActive: true,
          loyaltyPoints: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return paginate(items, total, q.page, q.limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
        lastLoginAt: true,
        createdAt: true,
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
        },
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensure(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive,
        loyaltyPoints: dto.loyaltyPoints,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
      },
    });
  }

  private async ensure(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException("User not found");
  }
}

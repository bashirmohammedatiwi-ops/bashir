import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, page = 1, limit = 20) {
    const where = { OR: [{ userId }, { userId: null }] };
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);
    return paginate(
      items.map((n) => ({
        ...n,
        isRead: !!n.readAt,
        time: n.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, OR: [{ userId }, { userId: null }] },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  create(data: {
    userId?: string;
    type?: NotificationType;
    title: string;
    body: string;
    data?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type ?? NotificationType.OFFER,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });
  }

  async adminList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.notification.count(),
      this.prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);
    return paginate(items, total, page, limit);
  }

  remove(id: string) {
    return this.prisma.notification.delete({ where: { id } }).then(() => ({ success: true }));
  }
}

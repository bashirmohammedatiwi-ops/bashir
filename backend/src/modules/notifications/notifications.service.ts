import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  NotificationLinkType,
  NotificationPushStatus,
  NotificationTargetType,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { mediaRecordToUrl } from "../../common/media-url.util";
import { SendNotificationDto } from "./dto/notification.dto";
import { PushService } from "./push.service";

/** إشعارات النظام التلقائية — لا تُعرض في قائمة التطبيق */
const AUTOMATIC_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.ORDER,
  NotificationType.RESTOCK,
  NotificationType.LOW_STOCK,
];

type LinkMeta = {
  linkType: NotificationLinkType;
  linkId: string | null;
  linkSlug: string | null;
  linkLabel: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async listForUser(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const where: Prisma.NotificationWhereInput = {
      type: { notIn: AUTOMATIC_NOTIFICATION_TYPES },
      OR: [
        { userId },
        {
          userId: null,
          targetType: NotificationTargetType.ALL,
          createdAt: { gte: user.createdAt },
        },
      ],
    };
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

    const broadcastIds = items.filter((n) => n.userId === null).map((n) => n.id);
    const readRows = broadcastIds.length
      ? await this.prisma.notificationRead.findMany({
          where: { userId, notificationId: { in: broadcastIds } },
          select: { notificationId: true },
        })
      : [];
    const readSet = new Set(readRows.map((r) => r.notificationId));

    return paginate(
      items.map((n) => ({
        ...n,
        isRead: n.userId === userId ? !!n.readAt : readSet.has(n.id),
        time: n.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, OR: [{ userId }, { userId: null, targetType: NotificationTargetType.ALL }] },
    });
    if (!notification) throw new NotFoundException("Notification not found");

    if (notification.userId === userId) {
      await this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    } else {
      await this.prisma.notificationRead.upsert({
        where: { notificationId_userId: { notificationId: id, userId } },
        create: { notificationId: id, userId },
        update: { readAt: new Date() },
      });
    }
    return { success: true };
  }

  async markAllRead(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const now = new Date();
    const broadcasts = await this.prisma.notification.findMany({
      where: {
        userId: null,
        targetType: NotificationTargetType.ALL,
        createdAt: { gte: user.createdAt },
        type: { notIn: AUTOMATIC_NOTIFICATION_TYPES },
      },
      select: { id: true },
    });

    if (broadcasts.length) {
      await this.prisma.notificationRead.createMany({
        data: broadcasts.map((n) => ({ notificationId: n.id, userId, readAt: now })),
        skipDuplicates: true,
      });
    }

    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });

    return { success: true };
  }

  /** تسجيل جهاز بدون حساب — لاستقبال Push العام لكل من ثبّت التطبيق */
  async registerGuestDevice(token: string, platform = "android") {
    const clean = token.trim();
    if (!clean) throw new BadRequestException("Device token is required");

    const existing = await this.prisma.deviceToken.findUnique({ where: { token: clean } });
    if (existing) {
      return this.prisma.deviceToken.update({
        where: { token: clean },
        data: { platform, isActive: true, lastUsedAt: new Date() },
      });
    }

    return this.prisma.deviceToken.create({
      data: { token: clean, platform, isActive: true },
    });
  }

  async registerDevice(userId: string, token: string, platform = "android") {
    const clean = token.trim();
    if (!clean) throw new BadRequestException("Device token is required");

    const existing = await this.prisma.deviceToken.findUnique({ where: { token: clean } });
    if (existing) {
      return this.prisma.deviceToken.update({
        where: { token: clean },
        data: { userId, platform, isActive: true, lastUsedAt: new Date() },
      });
    }

    return this.prisma.deviceToken.create({
      data: { userId, token: clean, platform, isActive: true },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    const clean = token.trim();
    await this.prisma.deviceToken.updateMany({
      where: { token: clean, userId },
      data: { isActive: false },
    });
    return { success: true };
  }

  create(data: {
    userId?: string;
    type?: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
    linkType?: NotificationLinkType;
    linkId?: string;
    linkSlug?: string;
    linkLabel?: string;
    imageUrl?: string;
    sendPush?: boolean;
  }) {
    const extra =
      data.data && typeof data.data === "object" && !Array.isArray(data.data)
        ? (data.data as Record<string, string>)
        : undefined;

    const orderId = extra?.orderId;
    const isOrder = (data.type as string) === "ORDER" || !!orderId;

    return this.send({
      type: data.type,
      title: data.title,
      body: data.body,
      targetType: data.userId ? NotificationTargetType.USER : NotificationTargetType.ALL,
      userId: data.userId,
      linkType: isOrder
        ? NotificationLinkType.ORDER
        : (data.linkType ?? NotificationLinkType.NONE),
      linkId: data.linkId ?? orderId,
      externalUrl: undefined,
      imageUrl: data.imageUrl,
      scheduledAt: undefined,
      sendPush: data.sendPush ?? !!data.userId,
      data: extra,
    });
  }

  async send(dto: SendNotificationDto) {
    const targetType = dto.targetType ?? NotificationTargetType.ALL;
    if (targetType === NotificationTargetType.USER && !dto.userId) {
      throw new BadRequestException("userId is required when targetType is USER");
    }

    const link = await this.resolveLink(dto);
    const imageUrl = dto.imageUrl?.trim() || link.imageUrl || null;
    const dataPayload = {
      ...this.buildDataPayload(link, imageUrl),
      ...(dto.data ?? {}),
    };

    const notification = await this.prisma.notification.create({
      data: {
        userId: targetType === NotificationTargetType.USER ? dto.userId : null,
        type: dto.type ?? NotificationType.OFFER,
        title: dto.title.trim(),
        body: dto.body.trim(),
        data: dataPayload,
        linkType: link.linkType,
        linkId: link.linkId,
        linkSlug: link.linkSlug,
        linkLabel: link.linkLabel,
        externalUrl: link.externalUrl,
        imageUrl,
        targetType,
        pushStatus: NotificationPushStatus.PENDING,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const shouldPush = dto.sendPush !== false;
    if (!shouldPush) {
      return this.prisma.notification.update({
        where: { id: notification.id },
        data: { pushStatus: NotificationPushStatus.SKIPPED, sentAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return this.dispatchPush(notification.id);
  }

  async resend(id: string) {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Notification not found");
    await this.prisma.notification.update({
      where: { id },
      data: { pushStatus: NotificationPushStatus.PENDING, sentCount: 0, failedCount: 0 },
    });
    return this.dispatchPush(id);
  }

  private async dispatchPush(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!notification) throw new NotFoundException("Notification not found");

    const tokenWhere =
      notification.targetType === NotificationTargetType.USER && notification.userId
        ? { userId: notification.userId, isActive: true }
        : { isActive: true };

    const devices = await this.prisma.deviceToken.findMany({
      where: tokenWhere,
      select: { token: true },
    });
    const tokens = devices.map((d) => d.token);

    const dataPayload = (notification.data as Record<string, string>) ?? {};
    const pushResult = await this.push.sendToTokens(tokens, {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
      data: {
        ...dataPayload,
        notificationId: notification.id,
        type: notification.type,
        linkType: notification.linkType,
        ...(notification.linkId ? { linkId: notification.linkId } : {}),
        ...(notification.linkSlug ? { linkSlug: notification.linkSlug } : {}),
        ...(notification.linkLabel ? { linkLabel: notification.linkLabel } : {}),
        ...(notification.externalUrl ? { externalUrl: notification.externalUrl } : {}),
        ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
      },
    });

    if (pushResult.invalidTokens.length) {
      await this.prisma.deviceToken.updateMany({
        where: { token: { in: pushResult.invalidTokens } },
        data: { isActive: false },
      });
    }

    let pushStatus: NotificationPushStatus;
    if (pushResult.skipped) {
      pushStatus = NotificationPushStatus.SKIPPED;
    } else if (pushResult.sent === 0 && pushResult.failed > 0) {
      pushStatus = NotificationPushStatus.FAILED;
    } else if (pushResult.failed > 0) {
      pushStatus = NotificationPushStatus.PARTIAL;
    } else {
      pushStatus = NotificationPushStatus.SENT;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        pushStatus,
        sentCount: pushResult.sent,
        failedCount: pushResult.failed,
        sentAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  private buildDataPayload(link: LinkMeta, imageUrl?: string | null): Record<string, string> {
    const payload: Record<string, string> = { linkType: link.linkType };
    if (link.linkId) payload.linkId = link.linkId;
    if (link.linkSlug) payload.linkSlug = link.linkSlug;
    if (link.linkLabel) payload.linkLabel = link.linkLabel;
    if (link.externalUrl) payload.externalUrl = link.externalUrl;
    if (imageUrl) payload.imageUrl = imageUrl;
    return payload;
  }

  private async resolveLink(dto: SendNotificationDto): Promise<LinkMeta> {
    const linkType = dto.linkType ?? NotificationLinkType.NONE;

    if (linkType === NotificationLinkType.NONE) {
      return {
        linkType,
        linkId: null,
        linkSlug: null,
        linkLabel: null,
        externalUrl: null,
        imageUrl: null,
      };
    }

    if (linkType === NotificationLinkType.OFFERS) {
      return {
        linkType,
        linkId: null,
        linkSlug: "offers",
        linkLabel: "العروض",
        externalUrl: null,
        imageUrl: null,
      };
    }

    if (linkType === NotificationLinkType.EXTERNAL_URL) {
      const url = dto.externalUrl?.trim();
      if (!url) throw new BadRequestException("externalUrl is required for EXTERNAL_URL link");
      return {
        linkType,
        linkId: null,
        linkSlug: null,
        linkLabel: url,
        externalUrl: url,
        imageUrl: null,
      };
    }

    if (linkType === NotificationLinkType.ORDER) {
      if (!dto.linkId) throw new BadRequestException("linkId is required for ORDER link");
      const order = await this.prisma.order.findUnique({
        where: { id: dto.linkId },
        select: { id: true, orderNumber: true },
      });
      if (!order) throw new BadRequestException("Order not found");
      return {
        linkType,
        linkId: order.id,
        linkSlug: order.orderNumber,
        linkLabel: `طلب ${order.orderNumber}`,
        externalUrl: null,
        imageUrl: null,
      };
    }

    if (!dto.linkId) throw new BadRequestException("linkId is required for this link type");

    switch (linkType) {
      case NotificationLinkType.PRODUCT: {
        const product = await this.prisma.product.findUnique({
          where: { id: dto.linkId },
          select: {
            id: true,
            name: true,
            slug: true,
            images: { take: 1, orderBy: { position: "asc" }, include: { media: true } },
          },
        });
        if (!product) throw new BadRequestException("Product not found");
        return {
          linkType,
          linkId: product.id,
          linkSlug: product.slug,
          linkLabel: product.name,
          externalUrl: null,
          imageUrl: mediaRecordToUrl(product.images[0]?.media ?? null, true),
        };
      }
      case NotificationLinkType.CATEGORY: {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.linkId },
          select: { id: true, name: true, slug: true, image: true },
        });
        if (!category) throw new BadRequestException("Category not found");
        return {
          linkType,
          linkId: category.id,
          linkSlug: category.slug,
          linkLabel: category.name,
          externalUrl: null,
          imageUrl: mediaRecordToUrl(category.image, true),
        };
      }
      case NotificationLinkType.BRAND: {
        const brand = await this.prisma.brand.findUnique({
          where: { id: dto.linkId },
          select: { id: true, name: true, slug: true, logo: true },
        });
        if (!brand) throw new BadRequestException("Brand not found");
        return {
          linkType,
          linkId: brand.id,
          linkSlug: brand.slug,
          linkLabel: brand.name,
          externalUrl: null,
          imageUrl: mediaRecordToUrl(brand.logo, true),
        };
      }
      case NotificationLinkType.PACKAGE: {
        const pkg = await this.prisma.package.findFirst({
          where: { OR: [{ id: dto.linkId }, { slug: dto.linkId }] },
          select: { id: true, name: true, slug: true, coverImage: true },
        });
        if (!pkg) throw new BadRequestException("Package not found");
        return {
          linkType,
          linkId: pkg.id,
          linkSlug: pkg.slug ?? pkg.id,
          linkLabel: pkg.name,
          externalUrl: null,
          imageUrl: mediaRecordToUrl(pkg.coverImage, true),
        };
      }
      default:
        return {
          linkType: NotificationLinkType.NONE,
          linkId: null,
          linkSlug: null,
          linkLabel: null,
          externalUrl: null,
          imageUrl: null,
        };
    }
  }

  async adminList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.notification.count(),
      this.prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      }),
    ]);
    return paginate(items, total, page, limit);
  }

  async stats() {
    const [total, sent, skipped, failed, devices] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { pushStatus: NotificationPushStatus.SENT } }),
      this.prisma.notification.count({ where: { pushStatus: NotificationPushStatus.SKIPPED } }),
      this.prisma.notification.count({
        where: { pushStatus: { in: [NotificationPushStatus.FAILED, NotificationPushStatus.PARTIAL] } },
      }),
      this.prisma.deviceToken.count({ where: { isActive: true } }),
    ]);
    return {
      total,
      pushSent: sent,
      pushSkipped: skipped,
      pushFailed: failed,
      activeDevices: devices,
      fcmEnabled: this.push.isEnabled(),
    };
  }

  remove(id: string) {
    return this.prisma.notification.delete({ where: { id } }).then(() => ({ success: true }));
  }
}

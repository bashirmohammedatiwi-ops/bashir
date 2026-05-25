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
import { SendNotificationDto } from "./dto/notification.dto";
import { PushService } from "./push.service";

type LinkMeta = {
  linkType: NotificationLinkType;
  linkId: string | null;
  linkSlug: string | null;
  linkLabel: string | null;
  externalUrl: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async listForUser(userId: string, page = 1, limit = 20) {
    const where = { OR: [{ userId }, { userId: null, targetType: NotificationTargetType.ALL }] };
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
    sendPush?: boolean;
  }) {
    const extra =
      data.data && typeof data.data === "object" && !Array.isArray(data.data)
        ? (data.data as Record<string, string>)
        : undefined;

    return this.send({
      type: data.type,
      title: data.title,
      body: data.body,
      targetType: data.userId ? NotificationTargetType.USER : NotificationTargetType.ALL,
      userId: data.userId,
      linkType: data.linkType ?? NotificationLinkType.NONE,
      linkId: data.linkId,
      externalUrl: undefined,
      imageUrl: undefined,
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
    const dataPayload = {
      ...this.buildDataPayload(link),
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
        imageUrl: dto.imageUrl?.trim() || null,
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
        ...(notification.externalUrl ? { externalUrl: notification.externalUrl } : {}),
      },
    });

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

  private buildDataPayload(link: LinkMeta): Record<string, string> {
    const payload: Record<string, string> = { linkType: link.linkType };
    if (link.linkId) payload.linkId = link.linkId;
    if (link.linkSlug) payload.linkSlug = link.linkSlug;
    if (link.linkLabel) payload.linkLabel = link.linkLabel;
    if (link.externalUrl) payload.externalUrl = link.externalUrl;
    return payload;
  }

  private async resolveLink(dto: SendNotificationDto): Promise<LinkMeta> {
    const linkType = dto.linkType ?? NotificationLinkType.NONE;

    if (linkType === NotificationLinkType.NONE) {
      return { linkType, linkId: null, linkSlug: null, linkLabel: null, externalUrl: null };
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
      };
    }

    if (!dto.linkId) throw new BadRequestException("linkId is required for this link type");

    switch (linkType) {
      case NotificationLinkType.PRODUCT: {
        const product = await this.prisma.product.findUnique({
          where: { id: dto.linkId },
          select: { id: true, name: true, slug: true },
        });
        if (!product) throw new BadRequestException("Product not found");
        return {
          linkType,
          linkId: product.id,
          linkSlug: product.slug,
          linkLabel: product.name,
          externalUrl: null,
        };
      }
      case NotificationLinkType.CATEGORY: {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.linkId },
          select: { id: true, name: true, slug: true },
        });
        if (!category) throw new BadRequestException("Category not found");
        return {
          linkType,
          linkId: category.id,
          linkSlug: category.slug,
          linkLabel: category.name,
          externalUrl: null,
        };
      }
      case NotificationLinkType.BRAND: {
        const brand = await this.prisma.brand.findUnique({
          where: { id: dto.linkId },
          select: { id: true, name: true, slug: true },
        });
        if (!brand) throw new BadRequestException("Brand not found");
        return {
          linkType,
          linkId: brand.id,
          linkSlug: brand.slug,
          linkLabel: brand.name,
          externalUrl: null,
        };
      }
      case NotificationLinkType.PACKAGE: {
        if (!dto.linkId) throw new BadRequestException("linkId is required for PACKAGE link");
        const pkg = await this.prisma.package.findFirst({
          where: { OR: [{ id: dto.linkId }, { slug: dto.linkId }] },
          select: { id: true, name: true, slug: true },
        });
        if (!pkg) throw new BadRequestException("Package not found");
        return {
          linkType,
          linkId: pkg.id,
          linkSlug: pkg.slug ?? pkg.id,
          linkLabel: pkg.name,
          externalUrl: null,
        };
      }
      default:
        return { linkType: NotificationLinkType.NONE, linkId: null, linkSlug: null, linkLabel: null, externalUrl: null };
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

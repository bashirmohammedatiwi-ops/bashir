import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DeliveryOption, DiscountType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { ShippingService } from "../shipping/shipping.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { NotificationsService } from "../notifications/notifications.service";
import { paginate } from "../../common/dto/pagination.dto";
import {
  CreateOrderDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
} from "./dto/order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly shipping: ShippingService,
    private readonly loyalty: LoyaltyService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(q: QueryOrdersDto) {
    const where = {
      status: q.status,
      paymentStatus: q.paymentStatus,
      userId: q.userId,
    };
    const lite = q.lite !== false;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.limit,
        include: lite
          ? {
              user: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { items: true } },
            }
          : {
              user: { select: { id: true, name: true, email: true, phone: true } },
              items: true,
              address: true,
            },
      }),
    ]);
    return paginate(items, total, q.page, q.limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: { include: { product: { include: { images: { include: { media: true } } } } } },
        coupon: true,
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items.length) throw new BadRequestException("Empty order");

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const itemsData = dto.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) throw new BadRequestException(`Product ${it.productId} not found`);
      if (p.stock < it.quantity) throw new BadRequestException(`Out of stock: ${p.name}`);
      const unit = p.price;
      const total = unit * it.quantity;
      subtotal += total;
      return {
        productId: p.id,
        variantId: it.variantId,
        shadeId: it.shadeId,
        quantity: it.quantity,
        unitPrice: unit,
        totalPrice: total,
        productName: p.name,
        productSku: p.sku,
      };
    });

    let discountTotal = 0;
    let couponId: string | undefined;
    let freeShipping = false;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.couponCode } });
      if (!coupon || !coupon.isActive) throw new BadRequestException("Invalid coupon");
      if (coupon.minOrder && subtotal < coupon.minOrder)
        throw new BadRequestException("Minimum order not met");
      if (coupon.type === DiscountType.FIRST_ORDER) {
        const prevOrders = await this.prisma.order.count({
          where: { userId, status: { not: OrderStatus.CANCELLED } },
        });
        if (prevOrders > 0) throw new BadRequestException("Coupon valid for first order only");
        discountTotal = Math.round((subtotal * coupon.value) / 100);
      } else if (coupon.type === DiscountType.FREE_SHIPPING) {
        freeShipping = true;
      } else {
        discountTotal = coupon.type === DiscountType.PERCENT
          ? Math.round((subtotal * coupon.value) / 100)
          : coupon.value;
      }
      couponId = coupon.id;
    }

    const delivery = dto.deliveryOption ?? DeliveryOption.STANDARD;
    let shippingTotal = 0;

    if (delivery === DeliveryOption.PICKUP) {
      const storeSettings = await this.settings.getAll();
      if (storeSettings.pickupEnabled === false) {
        throw new BadRequestException("استلام من الفرع غير متاح حالياً");
      }
      shippingTotal = 0;
    } else {
      const address = dto.addressId
        ? await this.prisma.address.findUnique({ where: { id: dto.addressId } })
        : null;
      shippingTotal = await this.shipping.calculateOrderShipping({
        governorate: address?.governorate,
        area: address?.area,
        deliveryOption: delivery,
        subtotal,
        freeShipping,
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const maxLoyalty = user?.loyaltyPoints ?? 0;
    const loyaltyPointsRequested = dto.loyaltySpent ?? 0;
    const loyaltyPointsUsed = Math.min(loyaltyPointsRequested, maxLoyalty);
    const loyaltyDiscount = Math.floor(loyaltyPointsUsed / 100) * 1000;
    const total = Math.max(0, subtotal - discountTotal + shippingTotal - loyaltyDiscount);
    const loyaltyEarned = Math.floor(total / 1000);

    const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase() +
      randomBytes(2).toString("hex").toUpperCase();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod ?? PaymentMethod.COD,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discountTotal,
          shippingTotal,
          total,
          loyaltyEarned,
          loyaltySpent: loyaltyPointsUsed,
          deliveryOption: delivery,
          notes: dto.notes,
          couponId,
          items: { create: itemsData },
        },
        include: { items: true },
      });

      for (const it of itemsData) {
        await tx.product.update({
          where: { id: it.productId },
          data: {
            stock: { decrement: it.quantity },
            soldCount: { increment: it.quantity },
          },
        });
      }

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { redeemedCount: { increment: 1 } },
        });
      }

      return created;
    });

    if (loyaltyPointsUsed > 0) {
      await this.loyalty.redeemPoints(userId, loyaltyPointsUsed, "استخدام نقاط في الطلب", order.id);
    }
    if (loyaltyEarned > 0) {
      await this.loyalty.addPoints(userId, loyaltyEarned, "نقاط من الطلب", order.id);
    }
    const prevOrders = await this.prisma.order.count({
      where: { userId, id: { not: order.id }, status: { not: OrderStatus.CANCELLED } },
    });
    if (prevOrders === 0) {
      await this.loyalty.addPoints(userId, 50, "مكافأة أول طلب", order.id);
    }

    await this.notifications.create({
      userId,
      type: "ORDER" as any,
      title: "تم استلام طلبك",
      body: `طلبك ${order.orderNumber} قيد المراجعة`,
      data: { orderId: order.id },
    });

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId?: string) {
    const order = await this.findOne(id);
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status, paymentStatus: dto.paymentStatus },
    });
    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: "ORDER_STATUS_UPDATE",
          entity: "Order",
          entityId: id,
          meta: { status: dto.status, orderTotal: order.total, orderNumber: order.orderNumber },
        },
      });
    }
    await this.notifications.create({
      userId: order.userId,
      type: "ORDER" as any,
      title: "تحديث حالة الطلب",
      body: `طلب ${order.orderNumber}: ${dto.status}`,
      data: { orderId: id, status: dto.status },
    });
    return updated;
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.CANCELLED) return order;
    return this.prisma.$transaction(async (tx) => {
      for (const it of order.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: {
            stock: { increment: it.quantity },
            soldCount: { decrement: it.quantity },
          },
        });
      }
      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }

  private async ensure(id: string) {
    const exists = await this.prisma.order.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Order not found");
  }
}

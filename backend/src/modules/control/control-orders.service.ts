import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { controlMediaUrls } from "./control-media.util";
import { ControlOrdersQueryDto, ControlOrderStatusDto } from "./dto/control.dto";

const OPEN: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED];
/** المبيعات الفعلية: كل طلب لم يُلغَ ولم يُسترد. */
const SOLD: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

const itemProductSelect = {
  id: true,
  name: true,
  nameAr: true,
  barcode: true,
  sku: true,
  images: { take: 1, orderBy: { position: "asc" as const }, include: { media: true } },
} satisfies Prisma.ProductSelect;

/** الطلبات والمبيعات لتطبيق المدير — أشكال خفيفة جاهزة للعرض (روابط صور مكتملة، اسم التدرج...). */
@Injectable()
export class ControlOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  async list(q: ControlOrdersQueryDto) {
    const where: Prisma.OrderWhereInput = {};
    if (q.status === "open") where.status = { in: OPEN };
    else if (q.status) where.status = q.status as OrderStatus;
    const text = q.q?.trim();
    if (text) {
      where.OR = [
        { orderNumber: { contains: text, mode: "insensitive" } },
        { user: { name: { contains: text, mode: "insensitive" } } },
        { user: { phone: { contains: text } } },
        { address: { fullName: { contains: text, mode: "insensitive" } } },
        { address: { phone: { contains: text } } },
      ];
    }
    const limit = q.limit ?? 30;
    const page = q.page ?? 1;
    const [total, rows, counts] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, phone: true } },
          address: { select: { fullName: true, phone: true, city: true, governorate: true, area: true } },
          _count: { select: { items: true } },
          items: {
            take: 4,
            orderBy: { id: "asc" },
            select: { shadeId: true, quantity: true, product: { select: itemProductSelect } },
          },
        },
      }),
      this.statusCounts(),
    ]);
    const shadeImages = await this.shadeImages(rows.flatMap((o) => o.items.map((i) => i.shadeId)));
    return {
      data: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        deliveryOption: o.deliveryOption,
        total: o.total,
        itemsCount: o._count.items,
        quantity: o.items.reduce((n, i) => n + i.quantity, 0),
        createdAt: o.createdAt,
        customer: o.address?.fullName || o.user?.name || "زبونة",
        phone: o.address?.phone || o.user?.phone || null,
        place: [o.address?.governorate, o.address?.city, o.address?.area].filter(Boolean).join(" · ") || null,
        thumbs: o.items
          .map((i) => (i.shadeId ? shadeImages.get(i.shadeId) : null) ?? this.productThumb(i.product))
          .filter(Boolean),
      })),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page * limit < total },
      counts,
    };
  }

  async statusCounts() {
    const rows = await this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
    const counts: Record<string, number> = Object.fromEntries(Object.values(OrderStatus).map((s) => [s, 0]));
    for (const r of rows) counts[r.status] = r._count._all;
    counts.open = OPEN.reduce((n, s) => n + (counts[s] ?? 0), 0);
    return counts;
  }

  /** نبضة خفيفة يستدعيها التطبيق كل دقيقة — لتنبيه الطلبات الجديدة. */
  async pulse() {
    const [pending, latest] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, createdAt: true, total: true } }),
    ]);
    return { pending, latest };
  }

  async detail(id: string) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, createdAt: true, _count: { select: { orders: true } } } },
        address: true,
        coupon: { select: { code: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 3, select: { status: true, amount: true, refundedAmount: true, maskedPan: true, canceled: true, createdAt: true } },
        items: { orderBy: { id: "asc" }, include: { product: { select: itemProductSelect } } },
      },
    });
    if (!o) throw new NotFoundException("الطلب غير موجود");
    const shadeIds = o.items.map((i) => i.shadeId).filter((x): x is string => !!x);
    const shades = shadeIds.length
      ? await this.prisma.productShade.findMany({
          where: { id: { in: shadeIds } },
          select: { id: true, name: true, barcode: true, colorHex: true, colorHexEnd: true, isActive: true, image: true },
        })
      : [];
    const shadeById = new Map(shades.map((s) => [s.id, s]));
    const history = await this.prisma.auditLog.findMany({
      where: { entity: "Order", entityId: id },
      orderBy: { createdAt: "asc" },
      include: { actor: { select: { name: true, email: true } } },
    });
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      deliveryOption: o.deliveryOption,
      deliveryDate: o.deliveryDate,
      notes: o.notes,
      subtotal: o.subtotal,
      discountTotal: o.discountTotal,
      shippingTotal: o.shippingTotal,
      total: o.total,
      loyaltySpent: o.loyaltySpent,
      coupon: o.coupon?.code ?? null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      customer: {
        id: o.user?.id,
        name: o.address?.fullName || o.user?.name || "زبونة",
        phone: o.address?.phone || o.user?.phone || null,
        accountPhone: o.user?.phone ?? null,
        email: o.user?.email ?? null,
        ordersCount: o.user?._count.orders ?? 0,
        since: o.user?.createdAt ?? null,
      },
      address: o.address
        ? {
            fullName: o.address.fullName,
            phone: o.address.phone,
            governorate: o.address.governorate,
            city: o.address.city,
            area: o.address.area,
            street: o.address.street,
            house: o.address.house,
            notes: o.address.notes,
          }
        : null,
      payments: o.payments,
      items: o.items.map((i) => {
        const shade = i.shadeId ? shadeById.get(i.shadeId) : undefined;
        return {
          id: i.id,
          productId: i.productId,
          name: i.product?.nameAr || i.productName,
          sku: i.productSku,
          barcode: shade?.barcode ?? i.product?.barcode ?? null,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          shade: shade ? { id: shade.id, name: shade.name, colorHex: shade.colorHex, colorHexEnd: shade.colorHexEnd, isActive: shade.isActive } : null,
          thumb: (shade?.image ? controlMediaUrls(shade.image).thumb : null) ?? this.productThumb(i.product),
        };
      }),
      history: history.map((h) => ({
        action: h.action,
        status: (h.meta as Record<string, unknown> | null)?.status ?? null,
        actor: h.actor?.name || h.actor?.email || null,
        at: h.createdAt,
      })),
    };
  }

  async setStatus(id: string, dto: ControlOrderStatusDto, actorId?: string) {
    await this.orders.updateStatus(
      id,
      { status: dto.status as OrderStatus, paymentStatus: dto.paymentStatus as PaymentStatus | undefined },
      actorId,
    );
    return this.detail(id);
  }

  /** مبيعات للمدير: اليوم، أمس، 7 و30 يوماً، رسم 14 يوماً، الأكثر مبيعاً فعلياً، والحالات. */
  async sales() {
    // منتصف ليل بغداد (UTC+3 بلا توقيت صيفي) — مهما كانت منطقة السيرفر.
    const BAGHDAD = 3 * 3_600_000;
    const startOf = (daysAgo: number) => {
      const local = new Date(Date.now() + BAGHDAD);
      local.setUTCHours(0, 0, 0, 0);
      local.setUTCDate(local.getUTCDate() - daysAgo);
      return new Date(local.getTime() - BAGHDAD);
    };
    const sum = async (from: Date, to?: Date) => {
      const r = await this.prisma.order.aggregate({
        where: { status: { in: SOLD }, createdAt: { gte: from, ...(to ? { lt: to } : {}) } },
        _sum: { total: true },
        _count: { _all: true },
      });
      return { revenue: r._sum.total ?? 0, orders: r._count._all };
    };
    const since14 = startOf(13);
    const since30 = startOf(29);
    const [today, yesterday, week, month, byDay, top, customers, counts] = await Promise.all([
      sum(startOf(0)),
      sum(startOf(1), startOf(0)),
      sum(startOf(6)),
      sum(since30),
      this.prisma.$queryRaw<Array<{ day: string; amount: number; n: number }>>`
        SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baghdad'), 'YYYY-MM-DD') AS day,
               COALESCE(SUM(total), 0)::int AS amount, COUNT(*)::int AS n
        FROM "Order"
        WHERE "createdAt" >= ${since14} AND status::text IN (${Prisma.join(SOLD)})
        GROUP BY 1 ORDER BY 1`,
      this.prisma.$queryRaw<Array<{ productId: string; qty: number; revenue: number }>>`
        SELECT i."productId", SUM(i.quantity)::int AS qty, SUM(i."totalPrice")::int AS revenue
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
        WHERE o."createdAt" >= ${since30} AND o.status::text IN (${Prisma.join(SOLD)})
        GROUP BY 1 ORDER BY qty DESC LIMIT 10`,
      this.prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOf(6) } } }),
      this.statusCounts(),
    ]);
    const products = top.length
      ? await this.prisma.product.findMany({ where: { id: { in: top.map((t) => t.productId) } }, select: itemProductSelect })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const dayMap = new Map(byDay.map((r) => [r.day, r]));
    const days: { day: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const key = new Date(startOf(i).getTime() + BAGHDAD).toISOString().slice(0, 10);
      const r = dayMap.get(key);
      days.push({ day: key, revenue: Number(r?.amount ?? 0), orders: Number(r?.n ?? 0) });
    }
    return {
      today,
      yesterday,
      week,
      month,
      averageOrder: month.orders ? Math.round(month.revenue / month.orders) : 0,
      newCustomersWeek: customers,
      days,
      counts,
      top: top.map((t) => {
        const p = byId.get(t.productId);
        return { productId: t.productId, name: p?.nameAr || p?.name || "منتج محذوف", qty: Number(t.qty), revenue: Number(t.revenue), thumb: this.productThumb(p) };
      }),
    };
  }

  private productThumb(p?: { images?: Array<{ media: Parameters<typeof controlMediaUrls>[0] & { hash?: string; storagePath?: string } }> } | null) {
    const m = p?.images?.[0]?.media;
    if (!m || m.storagePath === "placeholder") return null;
    return controlMediaUrls(m).thumb;
  }

  private async shadeImages(ids: Array<string | null>) {
    const clean = [...new Set(ids.filter((x): x is string => !!x))];
    if (!clean.length) return new Map<string, string | null>();
    const rows = await this.prisma.productShade.findMany({ where: { id: { in: clean } }, select: { id: true, image: true } });
    return new Map(rows.map((r) => [r.id, r.image ? controlMediaUrls(r.image).thumb : null]));
  }
}

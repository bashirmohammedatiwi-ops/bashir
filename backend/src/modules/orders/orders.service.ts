import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DeliveryOption, DiscountType, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService, giftWrapFeeOf } from "../settings/settings.service";
import { ShippingService } from "../shipping/shipping.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { LOYALTY_REDEEM_TITLE, loyaltyRules, pointsForAmount, redeemablePoints } from "../loyalty/loyalty.rules";
import { paginate } from "../../common/dto/pagination.dto";
import { OrderEvents } from "./order-events";
import { QiGatewayService } from "../payments/qi-gateway.service";
import {
  CreateOrderDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
} from "./dto/order.dto";

/** من يلغي الطلب: الزبونة (طلبها قبل بدء التجهيز فقط) أو الإدارة والنظام (أي طلب لم يُلغَ). */
export interface CancelActor {
  id?: string;
  staff: boolean;
}

/** إلغاء من النظام نفسه (مثل انتهاء مهلة الدفع بالبطاقة) — بصلاحية الإدارة. */
const SYSTEM_ACTOR: CancelActor = { staff: true };

/** الحالات التي تلغي فيها الزبونة طلبها بنفسها — بعدها يكون الطلب قيد التجهيز أو الشحن. */
const CUSTOMER_CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

type ShadeRow = {
  id: string;
  name: string;
  barcode: string | null;
  price: number | null;
  stock: number;
  isActive: boolean;
};

type ShipSnapshot = {
  shipFullName?: string | null;
  shipPhone?: string | null;
  shipGovernorate?: string | null;
  shipArea?: string | null;
  shipStreet?: string | null;
  shipHouse?: string | null;
  shipNotes?: string | null;
  address?: object | null;
};

/**
 * عنوان الطلب كما كان وقت الطلب: لقطة الطلب تُعرض في كائن «address» نفسه (فلا يتغير شيء في التطبيقات)،
 * فتعديل دفتر العناوين أو حذف العنوان لاحقاً لا يغيّر الطلبات السابقة.
 * الطلبات الأقدم (بلا لقطة) والاستجابات التي لا تتضمن العنوان تبقى كما هي.
 */
export function withShipSnapshot<T extends ShipSnapshot>(order: T): T {
  if (!("address" in order) || (order.shipFullName == null && order.shipPhone == null)) return order;
  const current = (order.address ?? {}) as Record<string, unknown>;
  return {
    ...order,
    address: {
      ...current,
      fullName: order.shipFullName ?? current.fullName ?? "",
      phone: order.shipPhone ?? current.phone ?? "",
      city: order.shipGovernorate ?? current.city ?? "",
      governorate: order.shipGovernorate ?? null,
      area: order.shipArea ?? null,
      street: order.shipStreet ?? null,
      house: order.shipHouse ?? null,
      notes: order.shipNotes ?? null,
    },
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly shipping: ShippingService,
    private readonly loyalty: LoyaltyService,
    private readonly events: OrderEvents,
  ) {}

  async list(q: QueryOrdersDto) {
    const search = q.search?.trim();
    const where = {
      status: q.status,
      paymentStatus: q.paymentStatus,
      userId: q.userId,
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" as const } },
              { user: { name: { contains: search, mode: "insensitive" as const } } },
              { user: { email: { contains: search, mode: "insensitive" as const } } },
              { user: { phone: { contains: search } } },
              // المستلمة كما في لقطة الطلب (هدية أو عنوان عُدّل لاحقاً).
              { shipFullName: { contains: search, mode: "insensitive" as const } },
              { shipPhone: { contains: search } },
            ],
          }
        : {}),
    };
    const preview = q.preview === true;
    const lite = !preview && q.lite !== false;

    const itemPreviewInclude = {
      take: 6,
      orderBy: { id: "asc" as const },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { position: "asc" as const },
              include: { media: true },
            },
            shades: { include: { image: true } },
            variants: true,
          },
        },
      },
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.limit,
        include: preview
          ? {
              user: { select: { id: true, name: true, email: true, phone: true } },
              address: {
                select: { city: true, governorate: true, area: true, fullName: true, phone: true },
              },
              coupon: { select: { id: true, code: true, type: true, value: true } },
              _count: { select: { items: true } },
              items: itemPreviewInclude,
            }
          : lite
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
    return paginate(items.map(withShipSnapshot), total, q.page, q.limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: {
          orderBy: { id: "asc" },
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" }, include: { media: true } },
                shades: { include: { image: true } },
                variants: true,
              },
            },
          },
        },
        coupon: true,
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return withShipSnapshot(order);
  }

  /** طلب أنشأته المحاولة نفسها من قبل — بنفس شكل استجابة الإنشاء. */
  private findByClientRef(userId: string, clientRef: string) {
    return this.prisma.order.findFirst({
      where: { userId, clientRef },
      include: { items: true },
    });
  }

  /**
   * تدرج السطر: المختار إن أُرسل (يتبع المنتج نفسه وشغال)، وإلا التدرج المعروض الوحيد للمنتج.
   * منتج بأكثر من تدرج معروض (شغال وله باركود) بلا اختيار = سطر لا يمكن تجهيزه، فيُرفض.
   */
  private lineShade(p: { name: string; shades: ShadeRow[] }, shadeId?: string): ShadeRow | undefined {
    if (!shadeId) {
      const listed = p.shades.filter((s) => s.isActive && !!s.barcode?.trim());
      if (listed.length > 1) throw new BadRequestException(`Shade required: ${p.name}`);
      return listed[0];
    }
    const shade = p.shades.find((s) => s.id === shadeId);
    if (!shade) throw new BadRequestException(`اللون المختار لـ«${p.name}» لم يعد متوفراً — احذفيه من السلة`);
    // تدرج أوقفه المدير بعد أن أضافته الزبونة للسلة — لا يُطلب.
    if (!shade.isActive) throw new BadRequestException(`اللون «${shade.name}» غير متوفر حالياً — احذفيه من السلة`);
    return shade;
  }

  /**
   * توفير الباقات: لكل نسخة مكتملة من باقة صالحة في الطلب، التوفير = (سعر قطعها في الطلب − سعر الباقة).
   * القطع تُؤخذ سطراً سطراً بسعر سطرها (تدرجان بسعرين للمنتج نفسه لا يختلطان)، من آخر سطر أولاً —
   * فتطابق حساب التطبيق (سعر آخر سطر للمنتج) في الحالة المعتادة. القطعة لا تُحسب لباقتين، والباقة الناقصة بلا توفير.
   */
  private async packageSavings(
    dto: CreateOrderDto,
    itemsData: { productId: string; quantity: number; unitPrice: number }[],
  ) {
    const wanted = (dto.packages ?? []).filter((p) => p.packageId && p.quantity > 0).slice(0, 20);
    if (!wanted.length) return 0;
    const packs = await this.prisma.package.findMany({
      where: { id: { in: wanted.map((p) => p.packageId) }, isActive: true },
      include: { items: true },
    });
    const now = new Date();
    // ما بقي متاحاً للباقات من كل سطر.
    const lines = new Map<string, { unitPrice: number; left: number }[]>();
    for (const it of itemsData) {
      const list = lines.get(it.productId) ?? [];
      list.push({ unitPrice: it.unitPrice, left: it.quantity });
      lines.set(it.productId, list);
    }
    const available = (productId: string) => (lines.get(productId) ?? []).reduce((s, l) => s + l.left, 0);
    // سعر need قطعة من آخر الأسطر؛ take يحجزها للباقة.
    const pick = (productId: string, need: number, take: boolean) => {
      const list = lines.get(productId) ?? [];
      let cost = 0;
      for (let i = list.length - 1; i >= 0 && need > 0; i--) {
        const n = Math.min(list[i].left, need);
        cost += n * list[i].unitPrice;
        need -= n;
        if (take) list[i].left -= n;
      }
      return cost;
    };
    let saving = 0;
    for (const w of wanted) {
      const pack = packs.find((p) => p.id === w.packageId);
      if (!pack || !pack.items.length || (pack.endsAt && pack.endsAt <= now)) continue;
      for (let set = 0; set < w.quantity; set++) {
        if (pack.items.some((pi) => available(pi.productId) < Math.max(1, pi.quantity))) break;
        const itemsTotal = pack.items.reduce((s, pi) => s + pick(pi.productId, Math.max(1, pi.quantity), false), 0);
        const perSet = itemsTotal - pack.price;
        if (perSet <= 0) break;
        for (const pi of pack.items) pick(pi.productId, Math.max(1, pi.quantity), true);
        saving += perSet;
      }
    }
    return saving;
  }

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items.length) throw new BadRequestException("Empty order");
    // المحاولة نفسها أُعيد إرسالها (انقطع الاتصال قبل وصول الرد): نعيد الطلب الذي أُنشئ بدل طلب ثانٍ.
    // قبل أي تحقق — فالطلب الأول قد يكون استهلك المخزون أو الكوبون أو النقاط.
    const clientRef = dto.clientRef?.trim() || undefined;
    if (clientRef) {
      const existing = await this.findByClientRef(userId, clientRef);
      if (existing) return existing;
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        shades: { select: { id: true, name: true, barcode: true, price: true, stock: true, isActive: true } },
      },
    });

    // السعر والمخزون من التدرج المختار فعلاً (سعر المنتج سعر تدرجه الأبرز، ومخزونه مجموع تدرجاته) —
    // نفس ما عرضه التطبيق في السلة والدفع، وعليه تُبنى الباقات والكوبون والنقاط وحد الشحن المجاني.
    let subtotal = 0;
    // «المنتج — التدرج» لرسالة نفاد المخزون.
    const shadeLabels = new Map<string, string>();
    const itemsData = dto.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) throw new BadRequestException(`Product ${it.productId} not found`);
      // منتج أوقفه المدير بعد إضافته للسلة — لا يُطلب.
      if (!p.isActive) throw new BadRequestException(`«${p.name}» غير متوفر حالياً — احذفيه من السلة`);
      const shade = this.lineShade(p, it.shadeId);
      const label = shade ? `${p.name} — ${shade.name}` : p.name;
      if (shade) shadeLabels.set(shade.id, label);
      if (p.stock < it.quantity || (shade && shade.stock < it.quantity)) {
        throw new BadRequestException(`Out of stock: ${label}`);
      }
      const unit = shade?.price ?? p.price;
      const total = unit * it.quantity;
      subtotal += total;
      return {
        productId: p.id,
        variantId: it.variantId,
        shadeId: shade?.id,
        quantity: it.quantity,
        unitPrice: unit,
        totalPrice: total,
        productName: p.name,
        productSku: p.sku,
      };
    });

    // الباقات: توفير = مجموع منتجاتها − سعر الباقة، لكل باقة مكتملة في الطلب.
    const packageDiscount = await this.packageSavings(dto, itemsData);
    // الكوبون يُحسب على المجموع بعد توفير الباقات.
    const couponBase = Math.max(0, subtotal - packageDiscount);

    let discountTotal = 0;
    let couponId: string | undefined;
    let freeShipping = false;
    if (dto.couponCode) {
      // الكود بأي حالة أحرف («sale20» = «SALE20»).
      const coupon = await this.prisma.coupon.findFirst({
        where: { code: { equals: dto.couponCode.trim(), mode: "insensitive" } },
      });
      if (!coupon || !coupon.isActive) throw new BadRequestException("Invalid coupon");
      // المدة والعدد المسموح: كوبون منتهٍ أو مستنفد لا يُقبل عند إنشاء الطلب.
      const now = new Date();
      if ((coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt <= now)) {
        throw new BadRequestException("انتهت صلاحية الكوبون");
      }
      if (coupon.maxRedemptions != null && coupon.redeemedCount >= coupon.maxRedemptions) {
        throw new BadRequestException("نفد استخدام هذا الكوبون");
      }
      if (coupon.perUserLimit != null) {
        const mine = await this.prisma.order.count({
          where: { userId, couponId: coupon.id, status: { not: OrderStatus.CANCELLED } },
        });
        if (mine >= coupon.perUserLimit) throw new BadRequestException("استخدمتِ هذا الكوبون مسبقاً");
      }
      if (coupon.minOrder && couponBase < coupon.minOrder)
        throw new BadRequestException("Minimum order not met");
      if (coupon.type === DiscountType.FIRST_ORDER) {
        const prevOrders = await this.prisma.order.count({
          where: { userId, status: { not: OrderStatus.CANCELLED } },
        });
        if (prevOrders > 0) throw new BadRequestException("Coupon valid for first order only");
        discountTotal = Math.round((couponBase * coupon.value) / 100);
      } else if (coupon.type === DiscountType.FREE_SHIPPING) {
        freeShipping = true;
      } else {
        discountTotal = coupon.type === DiscountType.PERCENT
          ? Math.round((couponBase * coupon.value) / 100)
          : coupon.value;
      }
      // سقف الخصم (للنسبة المئوية)، ولا يتجاوز الخصم قيمة الطلب.
      if (coupon.maxDiscount != null && coupon.maxDiscount > 0) discountTotal = Math.min(discountTotal, coupon.maxDiscount);
      discountTotal = Math.min(discountTotal, couponBase);
      couponId = coupon.id;
    }
    discountTotal += packageDiscount;

    // عنوان الزبونة نفسها فقط — لا يُربط الطلب (ولا تُكشف بياناته في تفاصيله) بعنوان حساب آخر.
    const address = dto.addressId
      ? await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } })
      : null;
    if (dto.addressId && !address) {
      throw new BadRequestException("عنوان التوصيل غير موجود — اختاري عنواناً آخر");
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
    if (loyaltyPointsRequested > maxLoyalty) {
      throw new BadRequestException("رصيد نقاط الولاء غير كافٍ");
    }
    // تغليف الهدية: رسوم ثابتة من الإعدادات تُضاف للطلب (لا يشملها خصم الكوبون).
    const giftWrapFee = dto.isGift === true ? giftWrapFeeOf((await this.settings.getAll()) as Record<string, unknown>) : 0;
    const orderBeforeLoyalty = Math.max(0, subtotal - discountTotal + shippingTotal + giftWrapFee);
    // كل نقطة = 1 د.ع، بمضاعفات 250 (الإصدارات القديمة ترسل مضاعفات 100: تُقرّب للأسفل بدل الرفض).
    const rules = loyaltyRules((await this.settings.getAll()) as Record<string, unknown>);
    const loyaltyPointsUsed = redeemablePoints(loyaltyPointsRequested, maxLoyalty, orderBeforeLoyalty, rules);
    const loyaltyDiscount = Math.floor(loyaltyPointsUsed * rules.pointValue);
    const total = Math.max(0, subtotal - discountTotal + shippingTotal + giftWrapFee - loyaltyDiscount);
    const loyaltyEarned = pointsForAmount(total, rules);

    // طلب مغطّى بالكامل (نقاط أو كوبون): لا مبلغ يُدفع — لا جلسة بطاقة، ولا يلغيه انتهاء مهلة الدفع.
    const covered = total === 0;
    const paymentMethod = covered ? PaymentMethod.COD : (dto.paymentMethod ?? PaymentMethod.COD);
    if (!covered) await this.assertPaymentMethodAvailable(userId, paymentMethod);

    const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase() +
      randomBytes(2).toString("hex").toUpperCase();

    let order: Prisma.OrderGetPayload<{ include: { items: true } }>;
    try {
      order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: address?.id ?? null,
            paymentMethod,
            status: OrderStatus.PENDING,
            paymentStatus: covered ? PaymentStatus.PAID : PaymentStatus.PENDING,
            subtotal,
            discountTotal,
            packageDiscount,
            shippingTotal,
            total,
            loyaltyEarned,
            loyaltySpent: loyaltyPointsUsed,
            loyaltyDiscount,
            deliveryOption: delivery,
            notes: dto.notes,
            // هدية: الرسالة تُطبع على البطاقة (300 حرف كحد أقصى).
            isGift: dto.isGift === true,
            giftMessage: dto.isGift ? dto.giftMessage?.trim().slice(0, 300) || null : null,
            giftHidePrices: dto.isGift === true && dto.giftHidePrices === true,
            giftWrapFee,
            couponId,
            clientRef,
            shipFullName: address?.fullName ?? null,
            shipPhone: address?.phone ?? null,
            shipGovernorate: address ? (address.governorate ?? address.city) : null,
            shipArea: address?.area ?? null,
            shipStreet: address?.street ?? null,
            shipHouse: address?.house ?? null,
            shipNotes: address?.notes ?? null,
            shadeStockHeld: true,
            items: { create: itemsData },
          },
          include: { items: true },
        });

        // The stock check above runs before the transaction, so concurrent orders can all pass it.
        // Only a conditional decrement is safe against overselling.
        for (const it of itemsData) {
          // مخزون التدرج المختار أولاً — مخزون المنتج مجموع كل تدرجاته فلا يكفي وحده.
          if (it.shadeId) {
            const { count } = await tx.productShade.updateMany({
              where: { id: it.shadeId, isActive: true, stock: { gte: it.quantity } },
              data: { stock: { decrement: it.quantity } },
            });
            if (count === 0) {
              throw new BadRequestException(`Out of stock: ${shadeLabels.get(it.shadeId) ?? it.productName}`);
            }
          }
          const { count } = await tx.product.updateMany({
            where: { id: it.productId, stock: { gte: it.quantity } },
            data: {
              stock: { decrement: it.quantity },
              soldCount: { increment: it.quantity },
            },
          });
          if (count === 0) throw new BadRequestException(`Out of stock: ${it.productName}`);
        }

        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { redeemedCount: { increment: 1 } },
          });
        }

        // النقاط تُخصم داخل المعاملة نفسها وبشرط الرصيد: طلبان متزامنان (التطبيق والموقع) لا ينالان
        // الخصم نفسه برصيد واحد، ولا يُثبت طلب «مدفوع بالنقاط» لم تُخصم نقاطه.
        if (loyaltyPointsUsed > 0) {
          const { count } = await tx.user.updateMany({
            where: { id: userId, loyaltyPoints: { gte: loyaltyPointsUsed } },
            data: { loyaltyPoints: { decrement: loyaltyPointsUsed } },
          });
          if (count === 0) throw new BadRequestException("رصيد نقاط الولاء غير كافٍ");
          await tx.loyaltyHistory.create({
            data: {
              userId,
              title: LOYALTY_REDEEM_TITLE,
              points: -loyaltyPointsUsed,
              isEarned: false,
              orderId: created.id,
            },
          });
        }

        return created;
      });
    } catch (e) {
      // طلبان بالمفتاح نفسه في اللحظة نفسها: الثاني ينتظر الأول ثم يصطدم بالقيد الفريد — يعيد الأول.
      if (clientRef && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const existing = await this.findByClientRef(userId, clientRef);
        if (existing) return existing;
      }
      throw e;
    }

    // النقاط المكتسبة (ومكافأة أول طلب) لا تُضاف هنا: تُضاف عند التسليم (updateStatus)،
    // فلا تُصرف على طلب ثانٍ ثم يُلغى الأول فيبقى خصمها على المتجر.
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId?: string) {
    const order = await this.findOne(id);
    // طلب ملغى أعاد مخزونه وكوبونه ونقاطه — إعادته لحالة نشطة بلا حجزها من جديد تضخم المخزون،
    // وإلغاؤه ثانيةً يعيدها مرتين. يُنشأ طلب جديد بدلاً من ذلك.
    if (order.status === OrderStatus.CANCELLED && dto.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException("لا يمكن إعادة تفعيل طلب ملغى — أنشئي طلباً جديداً");
    }
    // التسليم يثبت الطلب: الآن تُضاف نقاطه المكتسبة ومكافأة أول طلب، مع تغيير الحالة في معاملة واحدة
    // مشروطة بالحالة — فنقرتا «سُلّم» متزامنتان لا تضيفان النقاط مرتين، وتعذّر الإضافة يُبقي الطلب كما هو.
    if (dto.status === OrderStatus.DELIVERED && order.status !== OrderStatus.DELIVERED) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.order.updateMany({
          where: { id, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } },
          data: { status: OrderStatus.DELIVERED },
        });
        if (count > 0) await this.loyalty.creditDeliveredOrder(tx, order);
      });
    }
    // الإلغاء من لوحة التحكم يمر بنفس مسار الإلغاء: إعادة المخزون والنقاط والكوبون،
    // وعكس الدفعة الإلكترونية (عبر الحدث).
    if (dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      await this.cancel(id, { id: actorId, staff: true });
    }
    // مشروط أيضاً: طلب أُلغي (مهلة الدفع، الزبونة) بين القراءة والكتابة لا يعود نشطاً.
    const { count } = await this.prisma.order.updateMany({
      where: dto.status === OrderStatus.CANCELLED ? { id } : { id, status: { not: OrderStatus.CANCELLED } },
      data: { status: dto.status, paymentStatus: dto.paymentStatus },
    });
    if (count === 0) throw new BadRequestException("لا يمكن إعادة تفعيل طلب ملغى — أنشئي طلباً جديداً");
    const updated = await this.prisma.order.findUniqueOrThrow({ where: { id } });
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
    return updated;
  }

  /**
   * إلغاء ذرّي: الحالة تُشترط داخل التحديث نفسه، فلا يعيد إلغاءان متزامنان (نقرتان، التطبيق والموقع)
   * المخزون والكوبون مرتين، ولا تلغي الزبونة من شاشة قديمة طلباً بدأ تجهيزه أو شُحن (فيُسترجع مبلغ البطاقة خطأً).
   * الإدارة والنظام يلغيان أي طلب لم يُلغَ بعد.
   */
  async cancel(id: string, actor: CancelActor = SYSTEM_ACTOR) {
    // شرط الملكية لا يسقط أبداً (userId فارغ في Prisma = بلا شرط).
    if (!actor.staff && !actor.id) throw new ForbiddenException("Unauthenticated");
    const order = await this.findOne(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: actor.staff
          ? { id, status: { not: OrderStatus.CANCELLED } }
          : { id, userId: actor.id, status: { in: CUSTOMER_CANCELLABLE } },
        data: { status: OrderStatus.CANCELLED },
      });
      if (count === 0) return null;
      for (const it of order.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: {
            stock: { increment: it.quantity },
            soldCount: { decrement: it.quantity },
          },
        });
        // التدرج يُعاد فقط إن خُصم عند الطلب (الطلبات الأقدم خصمت مخزون المنتج وحده).
        if (it.shadeId && order.shadeStockHeld) {
          await tx.productShade.updateMany({
            where: { id: it.shadeId },
            data: { stock: { increment: it.quantity } },
          });
        }
      }
      // الكوبون يعود متاحاً (لا يُحسب استخدام طلب أُلغي).
      if (order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, redeemedCount: { gt: 0 } },
          data: { redeemedCount: { decrement: 1 } },
        });
      }
      return tx.order.findUniqueOrThrow({ where: { id } });
    });

    if (!updated) {
      const fresh = await this.findOne(id);
      // أُلغي من قبل (نقرة ثانية أو جهاز آخر)، أو طلب الإدارة على حاله: لا أثر جديد.
      if (actor.staff || fresh.status === OrderStatus.CANCELLED) return fresh;
      throw new BadRequestException("لا يمكن إلغاء الطلب بعد بدء تجهيزه — تواصلي معنا");
    }

    await this.loyalty.reverseForCancelledOrder(order.userId, order.id);
    this.events.emitCancelled({ orderId: order.id, actorId: actor.id });
    return updated;
  }

  private async assertPaymentMethodAvailable(userId: string, method: PaymentMethod) {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    if (method === PaymentMethod.CARD) {
      const qi = new QiGatewayService();
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true, phone: true },
      });
      if (s.cardPaymentEnabled === false || !qi.isConfigured || !qi.allowsUser(user)) {
        throw new BadRequestException("الدفع بالبطاقة غير متاح حالياً");
      }
    } else if (method === PaymentMethod.WALLET) {
      throw new BadRequestException("طريقة الدفع غير مدعومة");
    }
  }

  private async ensure(id: string) {
    const exists = await this.prisma.order.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Order not found");
  }
}

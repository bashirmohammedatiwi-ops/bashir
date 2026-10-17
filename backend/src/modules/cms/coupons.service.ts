import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Coupon, DiscountType, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";

const THEMES = ["rose", "gold", "violet", "midnight", "mint", "coral"];

/** ما يراه التطبيق من الكوبون — بلا عدّادات داخلية زائدة. */
export function publicCoupon(c: Coupon) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    description: c.description,
    title: c.title,
    subtitle: c.subtitle,
    minOrder: c.minOrder,
    maxDiscount: c.maxDiscount,
    perUserLimit: c.perUserLimit,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    theme: c.theme,
    isActive: c.isActive,
    // كم بقي من الاستخدامات (لعبارة «باقي 12 فقط») — فقط إن كان له حد.
    remaining: c.maxRedemptions != null ? Math.max(0, c.maxRedemptions - c.redeemedCount) : null,
  };
}

/** صالح الآن؟ مفعّل، ضمن المدة، ولم يُستنفد. */
export function isCouponLive(c: Coupon, now = new Date()) {
  if (!c.isActive) return false;
  if (c.startsAt && c.startsAt > now) return false;
  if (c.endsAt && c.endsAt <= now) return false;
  if (c.maxRedemptions != null && c.redeemedCount >= c.maxRedemptions) return false;
  return true;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** للوحة التحكم: كل الكوبونات مع إحصاءاتها (طلبات، مجموع الخصم، المبيعات). */
  async list() {
    const coupons = await this.prisma.coupon.findMany({ orderBy: [{ showOnHome: "desc" }, { homePosition: "asc" }, { createdAt: "desc" }] });
    const stats = await this.prisma.order.groupBy({
      by: ["couponId"],
      where: { couponId: { not: null }, status: { not: OrderStatus.CANCELLED } },
      _count: { _all: true },
      _sum: { discountTotal: true, total: true },
    });
    const by = new Map(stats.map((s) => [s.couponId, s]));
    const now = new Date();
    return coupons.map((c) => ({
      ...c,
      live: isCouponLive(c, now),
      stats: {
        orders: by.get(c.id)?._count._all ?? 0,
        discountGiven: by.get(c.id)?._sum.discountTotal ?? 0,
        sales: by.get(c.id)?._sum.total ?? 0,
      },
    }));
  }

  /** كوبونات الصفحة الرئيسية للتطبيق: الظاهرة والصالحة الآن، لعالم معيّن أو للكل. */
  async featured(world?: string, userId?: string) {
    const now = new Date();
    const rows = await this.prisma.coupon.findMany({
      where: { showOnHome: true, isActive: true },
      orderBy: [{ homePosition: "asc" }, { createdAt: "desc" }],
      take: 20,
    });
    let list = rows.filter((c) => isCouponLive(c, now) && (!world || !c.worldSlugs.length || c.worldSlugs.includes(world)));
    // الزبونة استنفدت حصتها من كوبون؟ لا نعرضه لها.
    if (userId && list.some((c) => c.perUserLimit != null || c.type === DiscountType.FIRST_ORDER)) {
      const used = await this.usageByUser(userId, list.map((c) => c.id));
      const ordered = await this.prisma.order.count({ where: { userId, status: { not: OrderStatus.CANCELLED } } });
      list = list.filter(
        (c) => (c.perUserLimit == null || (used.get(c.id) ?? 0) < c.perUserLimit) && (c.type !== DiscountType.FIRST_ORDER || ordered === 0),
      );
    }
    return list.slice(0, 8).map(publicCoupon);
  }

  /** التحقق من كود (أي حالة أحرف) — الشكل العام أو null. */
  async validate(code: string, userId?: string) {
    const c = await this.findByCode(code);
    if (!c || !isCouponLive(c)) return null;
    if (userId) {
      const reason = await this.userBlockReason(c, userId);
      if (reason) return null;
    }
    return publicCoupon(c);
  }

  /** مثل validate لكن يشرح سبب الرفض (للتطبيق الجديد). */
  async check(code: string, userId?: string) {
    const c = await this.findByCode(code);
    if (!c || !c.isActive) return { ok: false, reason: "الكود غير صحيح" };
    const now = new Date();
    if (c.startsAt && c.startsAt > now) return { ok: false, reason: "الكود لم يبدأ بعد" };
    if (c.endsAt && c.endsAt <= now) return { ok: false, reason: "انتهت صلاحية الكود" };
    if (c.maxRedemptions != null && c.redeemedCount >= c.maxRedemptions) return { ok: false, reason: "نفد استخدام هذا الكود" };
    if (userId) {
      const reason = await this.userBlockReason(c, userId);
      if (reason) return { ok: false, reason };
    }
    return { ok: true, coupon: publicCoupon(c) };
  }

  findByCode(code: string) {
    const trimmed = (code ?? "").trim();
    if (!trimmed) return Promise.resolve(null);
    return this.prisma.coupon.findFirst({ where: { code: { equals: trimmed, mode: "insensitive" } } });
  }

  /** حصة الزبونة: حد الاستخدام لكل زبونة، وكوبون أول طلب. */
  async userBlockReason(c: Coupon, userId: string): Promise<string | null> {
    if (c.type === DiscountType.FIRST_ORDER) {
      const prev = await this.prisma.order.count({ where: { userId, status: { not: OrderStatus.CANCELLED } } });
      if (prev > 0) return "هذا الكود لأول طلب فقط";
    }
    if (c.perUserLimit != null) {
      const used = (await this.usageByUser(userId, [c.id])).get(c.id) ?? 0;
      if (used >= c.perUserLimit) return c.perUserLimit === 1 ? "استخدمتِ هذا الكود مسبقاً" : `استخدمتِ هذا الكود ${used} مرات (الحد ${c.perUserLimit})`;
    }
    return null;
  }

  private async usageByUser(userId: string, couponIds: string[]) {
    const rows = await this.prisma.order.groupBy({
      by: ["couponId"],
      where: { userId, couponId: { in: couponIds }, status: { not: OrderStatus.CANCELLED } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.couponId!, r._count._all]));
  }

  create(data: Record<string, unknown>) {
    return this.prisma.coupon.create({ data: this.clean(data, true) as Prisma.CouponCreateInput });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.ensure(id);
    return this.prisma.coupon.update({ where: { id }, data: this.clean(data, false) });
  }

  async remove(id: string) {
    await this.ensure(id);
    // كوبون استُخدم بطلبات: نوقفه بدل حذفه (سجل الطلبات يبقى سليماً).
    const used = await this.prisma.order.count({ where: { couponId: id } });
    if (used > 0) {
      await this.prisma.coupon.update({ where: { id }, data: { isActive: false, showOnHome: false } });
      return { success: true, archived: true };
    }
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  /** حقول مسموحة فقط، بأنواع صحيحة. */
  private clean(raw: Record<string, unknown>, creating: boolean): Prisma.CouponUpdateInput {
    const out: Record<string, unknown> = {};
    const int = (v: unknown) => (v === null || v === "" || v === undefined ? null : Math.max(0, Math.round(Number(v))));
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? null : String(v));
    if ("code" in raw) {
      const code = String(raw.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new BadRequestException("الكود: 3–32 حرفاً إنجليزياً أو رقماً بلا فراغات");
      out.code = code;
    } else if (creating) throw new BadRequestException("الكود مطلوب");
    if ("type" in raw) {
      if (!Object.values(DiscountType).includes(raw.type as DiscountType)) throw new BadRequestException("نوع غير معروف");
      out.type = raw.type;
    }
    if ("value" in raw) out.value = int(raw.value) ?? 0;
    if ("description" in raw) out.description = str(raw.description) ?? "";
    if ("minOrder" in raw) out.minOrder = int(raw.minOrder) ?? 0;
    for (const k of ["maxRedemptions", "maxDiscount", "perUserLimit"]) if (k in raw) out[k] = int(raw[k]) || null;
    for (const k of ["startsAt", "endsAt"]) {
      if (k in raw) out[k] = raw[k] ? new Date(String(raw[k])) : null;
    }
    for (const k of ["isActive", "showOnHome"]) if (k in raw) out[k] = Boolean(raw[k]);
    if ("homePosition" in raw) out.homePosition = int(raw.homePosition) ?? 0;
    for (const k of ["title", "subtitle"]) if (k in raw) out[k] = str(raw[k]) || null;
    if ("theme" in raw) out.theme = THEMES.includes(String(raw.theme)) ? String(raw.theme) : "rose";
    if ("worldSlugs" in raw) out.worldSlugs = Array.isArray(raw.worldSlugs) ? raw.worldSlugs.map(String).filter(Boolean) : [];
    if (out.type === DiscountType.PERCENT || out.type === DiscountType.FIRST_ORDER) {
      if ((out.value as number) > 100) throw new BadRequestException("النسبة لا تتجاوز 100%");
    }
    if (out.startsAt && out.endsAt && (out.startsAt as Date) >= (out.endsAt as Date)) {
      throw new BadRequestException("تاريخ النهاية يجب أن يكون بعد البداية");
    }
    return out as Prisma.CouponUpdateInput;
  }

  private async ensure(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Coupon not found");
  }
}

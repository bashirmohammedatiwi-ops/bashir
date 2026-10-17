import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { InventorySyncService } from "../sync/inventory-sync.service";
import { controlMediaUrls } from "./control-media.util";
import { ControlService } from "./control.service";

const SOLD: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

type MediaRow = Parameters<typeof controlMediaUrls>[0] & { storagePath?: string };
const thumbOf = (m?: MediaRow | null) => (m && m.storagePath !== "placeholder" ? controlMediaUrls(m).thumb : null);

/** جرد المخزون، طلب الزبائن، التقارير، والموظفون — لتطبيق المدير. */
@Injectable()
export class ControlInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventorySyncService,
    private readonly control: ControlService,
  ) {}

  // ================================================================ stock counts

  async counts() {
    const rows = await this.prisma.stockCount.findMany({
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: { _count: { select: { lines: true } } },
    });
    const sums = rows.length
      ? await this.prisma.stockCountLine.groupBy({ by: ["countId"], where: { countId: { in: rows.map((r) => r.id) } }, _sum: { counted: true } })
      : [];
    const units = new Map(sums.map((s) => [s.countId, s._sum.counted ?? 0]));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt,
      closedAt: r.closedAt,
      lines: r._count.lines,
      units: units.get(r.id) ?? 0,
    }));
  }

  async createCount(name: string, note: string | undefined, actorId?: string) {
    const n = name.trim() || `جرد ${new Date().toLocaleDateString("en-GB")}`;
    const c = await this.prisma.stockCount.create({ data: { name: n, note: note?.trim() || null, createdById: actorId ?? null } });
    return this.count(c.id);
  }

  /** الجلسة مع كل سطر: المعدود، المتوقع من الكاشير (أو التطبيق)، والفرق. */
  async count(id: string) {
    const c = await this.prisma.stockCount.findUnique({ where: { id }, include: { lines: { orderBy: { updatedAt: "desc" } } } });
    if (!c) throw new NotFoundException("الجرد غير موجود");
    const snaps = await this.inventory.getSnapshotsMapForBarcodes(c.lines.map((l) => l.barcode)).catch(() => new Map());
    const productIds = [...new Set(c.lines.map((l) => l.productId).filter((x): x is string => !!x))];
    const shadeIds = [...new Set(c.lines.map((l) => l.shadeId).filter((x): x is string => !!x))];
    const [products, shades] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true, images: { take: 1, orderBy: { position: "asc" }, include: { media: true } } },
      }),
      this.prisma.productShade.findMany({ where: { id: { in: shadeIds } }, select: { id: true, stock: true, image: true } }),
    ]);
    const pBy = new Map(products.map((p) => [p.id, p]));
    const sBy = new Map(shades.map((s) => [s.id, s]));
    const lines = c.lines.map((l) => {
      const snap = barcodeLookupCandidates(l.barcode).map((k) => snaps.get(k)).find(Boolean) as { stock: number } | undefined;
      const shade = l.shadeId ? sBy.get(l.shadeId) : undefined;
      const product = l.productId ? pBy.get(l.productId) : undefined;
      const expected = snap?.stock ?? shade?.stock ?? product?.stock ?? null;
      return {
        id: l.id,
        barcode: l.barcode,
        name: l.name,
        productId: l.productId,
        shadeId: l.shadeId,
        counted: l.counted,
        expected,
        source: snap ? "pos" : expected != null ? "app" : null,
        diff: expected == null ? null : l.counted - expected,
        thumb: (shade?.image ? thumbOf(shade.image) : null) ?? thumbOf(product?.images[0]?.media),
        updatedAt: l.updatedAt,
      };
    });
    return {
      id: c.id,
      name: c.name,
      note: c.note,
      status: c.status,
      createdAt: c.createdAt,
      closedAt: c.closedAt,
      lines,
      summary: {
        lines: lines.length,
        units: lines.reduce((n, l) => n + l.counted, 0),
        matched: lines.filter((l) => l.diff === 0).length,
        short: lines.filter((l) => (l.diff ?? 0) < 0).length,
        over: lines.filter((l) => (l.diff ?? 0) > 0).length,
        unknown: lines.filter((l) => l.diff == null).length,
      },
    };
  }

  /** مسح قطعة: +1 (أو كمية) على سطرها؛ يُنشأ السطر عند أول مسح مع اسم المنتج. */
  async scan(id: string, rawCode: string, qty = 1) {
    const c = await this.ensureOpen(id);
    const barcode = normalizeBarcode(rawCode);
    if (!barcode) throw new BadRequestException("الباركود فارغ");
    if (!Number.isInteger(qty) || qty === 0 || Math.abs(qty) > 10000) throw new BadRequestException("كمية غير صالحة");
    const codes = barcodeLookupCandidates(barcode);
    const existing = await this.prisma.stockCountLine.findFirst({ where: { countId: c.id, barcode: { in: codes } } });
    let lineId: string;
    if (existing) {
      const counted = Math.max(0, existing.counted + qty);
      await this.prisma.stockCountLine.update({ where: { id: existing.id }, data: { counted } });
      lineId = existing.id;
    } else {
      const shade = await this.prisma.productShade.findFirst({
        where: { barcode: { in: codes } },
        select: { id: true, name: true, product: { select: { id: true, name: true, nameAr: true } } },
      });
      const product = shade
        ? null
        : await this.prisma.product.findFirst({ where: { OR: [{ barcode: { in: codes } }, { sku: { in: codes } }] }, select: { id: true, name: true, nameAr: true } });
      const pos = shade || product ? null : await this.inventory.getSnapshotForBarcodes([barcode]).catch(() => null);
      const name = shade ? `${shade.product.nameAr || shade.product.name} — ${shade.name}` : product ? product.nameAr || product.name : pos?.name ?? null;
      const line = await this.prisma.stockCountLine.create({
        data: { countId: c.id, barcode, productId: shade?.product.id ?? product?.id ?? null, shadeId: shade?.id ?? null, name, counted: Math.max(0, qty) },
      });
      lineId = line.id;
    }
    await this.prisma.stockCount.update({ where: { id: c.id }, data: { updatedAt: new Date() } });
    const full = await this.count(c.id);
    return { line: full.lines.find((l) => l.id === lineId), summary: full.summary };
  }

  async setLine(id: string, lineId: string, counted: number) {
    await this.ensureOpen(id);
    if (!Number.isInteger(counted) || counted < 0) throw new BadRequestException("كمية غير صالحة");
    const res = await this.prisma.stockCountLine.updateMany({ where: { id: lineId, countId: id }, data: { counted } });
    if (!res.count) throw new NotFoundException("السطر غير موجود");
    return this.count(id);
  }

  async deleteLine(id: string, lineId: string) {
    await this.ensureOpen(id);
    await this.prisma.stockCountLine.deleteMany({ where: { id: lineId, countId: id } });
    return this.count(id);
  }

  async closeCount(id: string, reopen = false, actorId?: string) {
    const c = await this.prisma.stockCount.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("الجرد غير موجود");
    await this.prisma.stockCount.update({ where: { id }, data: { status: reopen ? "OPEN" : "CLOSED", closedAt: reopen ? null : new Date() } });
    await this.control.audit(actorId, reopen ? "count.reopen" : "count.close", "StockCount", id, { name: c.name });
    return this.count(id);
  }

  async deleteCount(id: string) {
    await this.prisma.stockCount.delete({ where: { id } }).catch(() => {
      throw new NotFoundException("الجرد غير موجود");
    });
    return { success: true };
  }

  private async ensureOpen(id: string) {
    const c = await this.prisma.stockCount.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!c) throw new NotFoundException("الجرد غير موجود");
    if (c.status !== "OPEN") throw new BadRequestException("الجرد مغلق — أعد فتحه للتعديل");
    return c;
  }

  // ================================================================ demand

  /** ما يطلبه الزبائن: منتظرات عودة المخزون، مفضلة لمنتجات نافدة/موقوفة، وأسئلة لم تفهمها ديما. */
  async demand() {
    const restock = await this.prisma.$queryRaw<Array<{ productId: string; waiting: bigint; since: Date }>>`
      SELECT "productId", COUNT(*)::bigint AS waiting, MIN("createdAt") AS since
      FROM "ProductAlert" WHERE type = 'RESTOCK' AND "notifiedAt" IS NULL
      GROUP BY "productId" ORDER BY waiting DESC LIMIT 40`;
    const wished = await this.prisma.$queryRaw<Array<{ productId: string; wishes: bigint }>>`
      SELECT w."productId", COUNT(*)::bigint AS wishes
      FROM "Wishlist" w JOIN "Product" p ON p.id = w."productId"
      WHERE p.stock <= 0 OR NOT p."isActive"
      GROUP BY w."productId" ORDER BY wishes DESC LIMIT 40`;
    const ids = [...new Set([...restock.map((r) => r.productId), ...wished.map((w) => w.productId)])];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        nameAr: true,
        stock: true,
        isActive: true,
        barcode: true,
        brand: { select: { name: true } },
        images: { take: 1, orderBy: { position: "asc" }, include: { media: true } },
      },
    });
    const by = new Map(products.map((p) => [p.id, p]));
    const card = (id: string) => {
      const p = by.get(id);
      return p
        ? { id: p.id, name: p.nameAr || p.name, brand: p.brand?.name ?? null, stock: p.stock, isActive: p.isActive, barcode: p.barcode, thumb: thumbOf(p.images[0]?.media) }
        : null;
    };
    const questions = await this.prisma.advisorQueryLog
      .findMany({ where: { resolved: false }, orderBy: [{ count: "desc" }, { lastAt: "desc" }], take: 30 })
      .catch(() => []);
    return {
      restock: restock.map((r) => ({ product: card(r.productId), waiting: Number(r.waiting), since: r.since })).filter((r) => r.product),
      wishlisted: wished.map((w) => ({ product: card(w.productId), wishes: Number(w.wishes) })).filter((w) => w.product),
      questions: questions.map((q) => ({ text: q.sample || q.text, count: q.count, lastAt: q.lastAt })),
    };
  }

  // ================================================================ reports

  /** تقرير مبيعات لفترة: حسب البراند، القسم، المحافظة، طريقة الدفع، ساعة اليوم ويوم الأسبوع. */
  async report(days: number) {
    const d = Math.min(Math.max(Math.round(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 86_400_000);
    const sold = Prisma.join(SOLD);
    const [totals, byBrand, byCategory, byGov, byPay, byHour, byWeekday, cancelled] = await Promise.all([
      this.prisma.$queryRaw<[{ revenue: number; orders: number; units: number; discount: number; shipping: number }]>`
        SELECT COALESCE(SUM(o.total),0)::int AS revenue, COUNT(*)::int AS orders,
               COALESCE((SELECT SUM(i.quantity) FROM "OrderItem" i JOIN "Order" x ON x.id = i."orderId" WHERE x."createdAt" >= ${since} AND x.status::text IN (${sold})),0)::int AS units,
               COALESCE(SUM(o."discountTotal"),0)::int AS discount, COALESCE(SUM(o."shippingTotal"),0)::int AS shipping
        FROM "Order" o WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold})`,
      this.prisma.$queryRaw<Array<{ name: string; revenue: number; units: number }>>`
        SELECT b.name, SUM(i."totalPrice")::int AS revenue, SUM(i.quantity)::int AS units
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId" JOIN "Product" p ON p.id = i."productId" JOIN "Brand" b ON b.id = p."brandId"
        WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold})
        GROUP BY b.name ORDER BY revenue DESC LIMIT 15`,
      this.prisma.$queryRaw<Array<{ name: string; revenue: number; units: number }>>`
        SELECT COALESCE(c."nameAr", c.name, 'بلا قسم') AS name, SUM(i."totalPrice")::int AS revenue, SUM(i.quantity)::int AS units
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId" JOIN "Product" p ON p.id = i."productId" LEFT JOIN "Category" c ON c.id = p."categoryId"
        WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold})
        GROUP BY 1 ORDER BY revenue DESC LIMIT 12`,
      this.prisma.$queryRaw<Array<{ name: string; revenue: number; orders: number }>>`
        SELECT COALESCE(a.governorate, a.city, 'غير محدد') AS name, SUM(o.total)::int AS revenue, COUNT(*)::int AS orders
        FROM "Order" o LEFT JOIN "Address" a ON a.id = o."addressId"
        WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold})
        GROUP BY 1 ORDER BY revenue DESC LIMIT 12`,
      this.prisma.$queryRaw<Array<{ name: string; revenue: number; orders: number }>>`
        SELECT o."paymentMethod"::text AS name, SUM(o.total)::int AS revenue, COUNT(*)::int AS orders
        FROM "Order" o WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold})
        GROUP BY 1 ORDER BY revenue DESC`,
      this.prisma.$queryRaw<Array<{ h: number; orders: number }>>`
        SELECT EXTRACT(HOUR FROM (o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baghdad'))::int AS h, COUNT(*)::int AS orders
        FROM "Order" o WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold}) GROUP BY 1`,
      this.prisma.$queryRaw<Array<{ d: number; orders: number; revenue: number }>>`
        SELECT EXTRACT(DOW FROM (o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baghdad'))::int AS d, COUNT(*)::int AS orders, SUM(o.total)::int AS revenue
        FROM "Order" o WHERE o."createdAt" >= ${since} AND o.status::text IN (${sold}) GROUP BY 1`,
      this.prisma.order.count({ where: { createdAt: { gte: since }, status: OrderStatus.CANCELLED } }),
    ]);
    const t = totals[0];
    const hours = Array.from({ length: 24 }, (_, h) => byHour.find((r) => r.h === h)?.orders ?? 0);
    const weekdays = Array.from({ length: 7 }, (_, i) => {
      const r = byWeekday.find((x) => x.d === i);
      return { orders: r?.orders ?? 0, revenue: r?.revenue ?? 0 };
    });
    return {
      days: d,
      totals: { ...t, cancelled, averageOrder: t.orders ? Math.round(t.revenue / t.orders) : 0 },
      byBrand,
      byCategory,
      byGovernorate: byGov,
      byPayment: byPay,
      hours,
      weekdays,
    };
  }

  // ================================================================ staff

  async staff() {
    const users = await this.prisma.user.findMany({
      where: { role: { in: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] }, deletedAt: null },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    const since = new Date(Date.now() - 7 * 86_400_000);
    const acts = await this.prisma.auditLog.groupBy({
      by: ["actorId"],
      where: { actorId: { in: users.map((u) => u.id) }, createdAt: { gte: since } },
      _count: { _all: true },
      _max: { createdAt: true },
    });
    const by = new Map(acts.map((a) => [a.actorId, a]));
    return users.map((u) => ({ ...u, actions7d: by.get(u.id)?._count._all ?? 0, lastActionAt: by.get(u.id)?._max.createdAt ?? null }));
  }

  async staffActivity(userId: string) {
    const rows = await this.prisma.auditLog.findMany({ where: { actorId: userId }, orderBy: { createdAt: "desc" }, take: 80 });
    return rows.map((r) => ({ id: r.id, action: r.action.replace(/^control\./, ""), entity: r.entity, entityId: r.entityId, meta: r.meta, createdAt: r.createdAt }));
  }

  // ================================================================ banners

  /** بنرات الرئيسية مع صورة مصغّرة — التعديل يمر عبر /banners لتحديث كاش الرئيسية. */
  async banners() {
    const rows = await this.prisma.banner.findMany({ orderBy: { position: "asc" }, include: { image: true } });
    const now = Date.now();
    return rows.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      tag: b.tag,
      isActive: b.isActive,
      position: b.position,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      expired: b.endsAt ? b.endsAt.getTime() < now : false,
      scheduled: b.startsAt ? b.startsAt.getTime() > now : false,
      link: b.linkType ? `${b.linkType}:${b.linkValue ?? ""}` : b.link,
      thumb: b.image ? (controlMediaUrls(b.image).large ?? null) : null,
    }));
  }

  /** إيقاف/تشغيل حساب موظف — لا يمس حسابات المدراء ولا حسابك أنت. */
  async setStaffActive(userId: string, isActive: boolean, actorId?: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!u) throw new NotFoundException("الحساب غير موجود");
    if (u.role !== Role.STAFF) throw new ForbiddenException("يمكن إيقاف حسابات الموظفين فقط");
    if (userId === actorId) throw new ForbiddenException("لا يمكنك إيقاف حسابك");
    await this.prisma.user.update({ where: { id: userId }, data: { isActive } });
    if (!isActive) await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.control.audit(actorId, isActive ? "staff.enable" : "staff.disable", "User", userId);
    return this.staff();
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode } from "../../common/barcode.util";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";

/** كل كم يُراجَع بدء العروض وانتهاؤها (وأي سعر غيّره شيء آخر أثناء العرض). */
const RECONCILE_EVERY_MS = 2 * 60_000;

export type ProductOfferInput = {
  name?: string;
  discountPercent?: number;
  startsAt?: string | Date;
  endsAt?: string | Date;
  isActive?: boolean;
  barcodes?: string[];
};

type PricedProduct = {
  id: string;
  barcode: string | null;
  sku: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  isPromo: boolean;
  offerId: string | null;
};

type LiveOffer = { id: string; discountPercent: number; endsAt: Date };

const PRODUCT_SELECT = {
  id: true,
  barcode: true,
  sku: true,
  price: true,
  originalPrice: true,
  discountPercent: true,
  isPromo: true,
  offerId: true,
} as const;

/**
 * عروض خصم من لوحة التحكم. الـ POS يكتب السعر في كل رفع، فالعرض يُعاد تطبيقه بعد كل رفع
 * وكل دقيقتين، ويُرجَع السعر (من لقطة الـ POS أو من السعر المحفوظ قبل العرض) حين ينتهي أو يُوقف.
 */
@Injectable()
export class ProductOffersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductOffersService.name);
  private timer?: NodeJS.Timeout;
  private running: Promise<unknown> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  onModuleInit() {
    const run = () =>
      this.reconcile().catch((e) => this.logger.warn(`reconcile: ${e instanceof Error ? e.message : e}`));
    setTimeout(run, 15_000).unref?.();
    this.timer = setInterval(run, RECONCILE_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------- لوحة التحكم ----------

  async list() {
    const offers = await this.prisma.productOffer.findMany({ orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }] });
    const now = new Date();
    return Promise.all(
      offers.map(async (o) => {
        const products = await this.matchProducts(o.barcodes);
        return {
          ...o,
          status: this.statusOf(o, now),
          matchedProducts: products.length,
          activeProducts: products.filter((p) => p.isActive).length,
          appliedProducts: products.filter((p) => p.offerId === o.id).length,
        };
      }),
    );
  }

  /** المنتجات المطابقة لعرض: السعر الآن وسعر العرض، والباركودات غير الموجودة في المتجر. */
  async detail(id: string) {
    const offer = await this.prisma.productOffer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException("Offer not found");
    const products = await this.matchProducts(offer.barcodes);
    const found = new Set<string>();
    for (const p of products) for (const code of [p.barcode, p.sku]) for (const k of barcodeLookupCandidates(code)) found.add(k);
    const missingBarcodes = offer.barcodes.filter((b) => !barcodeLookupCandidates(b).some((k) => found.has(k)));
    return {
      ...offer,
      status: this.statusOf(offer, new Date()),
      missingBarcodes,
      products: products.map((p) => ({
        id: p.id,
        name: p.nameAr || p.name,
        slug: p.slug,
        barcode: p.barcode,
        isActive: p.isActive,
        stock: p.stock,
        price: p.price,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        applied: p.offerId === offer.id,
        offerId: p.offerId,
      })),
    };
  }

  async create(input: ProductOfferInput) {
    const data = this.clean(input, true);
    const offer = await this.prisma.productOffer.create({ data: data as Prisma.ProductOfferCreateInput });
    await this.reconcile();
    return offer;
  }

  async update(id: string, input: ProductOfferInput) {
    const prev = await this.prisma.productOffer.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException("Offer not found");
    const data = this.clean({ ...prev, ...input }, false);
    const offer = await this.prisma.productOffer.update({ where: { id }, data });
    await this.reconcile();
    return offer;
  }

  async remove(id: string) {
    const prev = await this.prisma.productOffer.findUnique({ where: { id } });
    if (!prev) throw new NotFoundException("Offer not found");
    // نوقفه أولاً ليرجع سعر منتجاته، ثم نحذفه.
    await this.prisma.productOffer.update({ where: { id }, data: { isActive: false } });
    await this.reconcile();
    await this.prisma.productOffer.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- التطبيق ----------

  /**
   * يطبّق العروض السارية ويرجع أسعار المنتجات التي انتهى عرضها.
   * productIds: لمنتجات حدّثها الـ POS للتو فقط (بعد كل رفع)؛ بدونه = كل المنتجات المعنية.
   */
  async reconcile(productIds?: string[]) {
    // تشغيلة واحدة في كل مرة — الرفع من الـ POS والمؤقت قد يتزامنان.
    while (this.running) await this.running.catch(() => undefined);
    const job = this.doReconcile(productIds);
    this.running = job;
    try {
      return await job;
    } finally {
      this.running = null;
    }
  }

  private async doReconcile(productIds?: string[]) {
    if (productIds && !productIds.length) return { applied: 0, restored: 0 };
    const now = new Date();
    const offers = await this.prisma.productOffer.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gt: now } },
      select: { id: true, discountPercent: true, endsAt: true, barcodes: true },
    });

    // أفضل عرض لكل باركود (إن تداخل عرضان على منتج يُطبّق الأكبر).
    const best = new Map<string, LiveOffer>();
    for (const o of offers) {
      for (const raw of o.barcodes) {
        for (const key of barcodeLookupCandidates(raw)) {
          const cur = best.get(key);
          if (!cur || o.discountPercent > cur.discountPercent) best.set(key, o);
        }
      }
    }
    const codes = [...best.keys()];
    const scope = productIds ? { id: { in: productIds } } : {};
    const targets: PricedProduct[] = await this.prisma.product.findMany({
      where: {
        ...scope,
        OR: [
          ...(codes.length ? [{ barcode: { in: codes } }, { sku: { in: codes } }] : []),
          { offerId: { not: null } },
        ],
      },
      select: PRODUCT_SELECT,
    });
    if (!targets.length) return { applied: 0, restored: 0 };

    const snapshots = await this.snapshotsFor(targets);
    let applied = 0;
    let restored = 0;
    for (const p of targets) {
      const offer = this.offerFor(p, best);
      const snap = this.snapshotOf(p, snapshots);
      try {
        if (offer) applied += (await this.apply(p, offer, snap)) ? 1 : 0;
        else if (p.offerId) restored += (await this.restore(p, snap)) ? 1 : 0;
      } catch (e) {
        this.logger.warn(`offer price ${p.id}: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (applied || restored) {
      this.logger.log(`Product offers: applied=${applied} restored=${restored}`);
      await this.homeFeedCache.invalidateAll().catch(() => undefined);
    }
    return { applied, restored };
  }

  private offerFor(p: PricedProduct, best: Map<string, LiveOffer>): LiveOffer | null {
    let hit: LiveOffer | null = null;
    for (const code of [p.barcode, p.sku]) {
      for (const key of barcodeLookupCandidates(code)) {
        const o = best.get(key);
        if (o && (!hit || o.discountPercent > hit.discountPercent)) hit = o;
      }
    }
    return hit;
  }

  /** يكتب سعر العرض على المنتج إن اختلف. يعيد true إن تغيّر شيء. */
  private async apply(p: PricedProduct, offer: LiveOffer, snap: Snapshot | null) {
    const prev = await this.rememberPrevious(p, offer.id);
    // السعر العادي: من الـ POS إن وُجد، وإلا ما كان عليه المنتج قبل العرض.
    const regular = snap ? snap.price : prev.prevPrice;
    const base = snap ? Math.max(snap.originalPrice, snap.price) : Math.max(prev.prevOriginalPrice, prev.prevPrice);
    if (base <= 0) return false;
    // لا نرفع السعر أبداً: إن كان خصم الـ POS أكبر يبقى.
    const price = Math.min(regular, Math.round((base * (100 - offer.discountPercent)) / 100));
    const discountPercent = Math.round((1 - price / base) * 100);
    const next = { price, originalPrice: base, discountPercent, isPromo: discountPercent > 0, offerId: offer.id };
    if (
      p.price === next.price &&
      p.originalPrice === next.originalPrice &&
      p.discountPercent === next.discountPercent &&
      p.isPromo === next.isPromo &&
      p.offerId === next.offerId
    )
      return false;
    await this.prisma.product.update({ where: { id: p.id }, data: next });
    return true;
  }

  /** يرجع سعر الـ POS (أو السعر قبل العرض) ويفك ارتباط المنتج بالعرض. */
  private async restore(p: PricedProduct, snap: Snapshot | null) {
    const item = p.offerId
      ? await this.prisma.productOfferItem.findUnique({ where: { offerId_productId: { offerId: p.offerId, productId: p.id } } })
      : null;
    const back = snap
      ? {
          price: snap.price,
          originalPrice: snap.originalPrice,
          discountPercent: snap.discountPercent,
          isPromo: snap.discountPercent > 0,
        }
      : item
        ? {
            price: item.prevPrice,
            originalPrice: item.prevOriginalPrice,
            discountPercent: item.prevDiscountPercent,
            isPromo: item.prevIsPromo,
          }
        : // لا لقطة ولا سعر محفوظ: نرجع السعر الأصلي كسعر عادي.
          {
            price: Math.max(p.originalPrice, p.price),
            originalPrice: 0,
            discountPercent: 0,
            isPromo: false,
          };
    await this.prisma.product.update({ where: { id: p.id }, data: { ...back, offerId: null } });
    return true;
  }

  /** يحفظ سعر المنتج قبل أول تطبيق لهذا العرض عليه (أو ينقله من عرض سابق ما زال مطبّقاً). */
  private async rememberPrevious(p: PricedProduct, offerId: string) {
    const existing = await this.prisma.productOfferItem.findUnique({
      where: { offerId_productId: { offerId, productId: p.id } },
    });
    if (existing) return existing;
    const fromOther = p.offerId
      ? await this.prisma.productOfferItem.findUnique({
          where: { offerId_productId: { offerId: p.offerId, productId: p.id } },
        })
      : null;
    return this.prisma.productOfferItem.create({
      data: {
        offerId,
        productId: p.id,
        prevPrice: fromOther?.prevPrice ?? p.price,
        prevOriginalPrice: fromOther?.prevOriginalPrice ?? p.originalPrice,
        prevDiscountPercent: fromOther?.prevDiscountPercent ?? p.discountPercent,
        prevIsPromo: fromOther?.prevIsPromo ?? p.isPromo,
      },
    });
  }

  private async snapshotsFor(products: PricedProduct[]) {
    const codes = [...new Set(products.flatMap((p) => barcodeLookupCandidates(p.barcode)))];
    const map = new Map<string, Snapshot>();
    if (!codes.length) return map;
    const rows = await this.prisma.inventorySyncSnapshot.findMany({
      where: { OR: [{ barcode: { in: codes } }, { productNum: { in: codes } }] },
      select: { barcode: true, productNum: true, price: true, originalPrice: true, discountPercent: true },
    });
    for (const r of rows) {
      for (const code of [r.barcode, r.productNum]) for (const key of barcodeLookupCandidates(code)) if (!map.has(key)) map.set(key, r);
    }
    return map;
  }

  private snapshotOf(p: PricedProduct, map: Map<string, Snapshot>) {
    for (const key of barcodeLookupCandidates(p.barcode)) {
      const s = map.get(key);
      if (s && s.price > 0) return s;
    }
    return null;
  }

  private matchProducts(barcodes: string[]) {
    const codes = [...new Set(barcodes.flatMap((b) => barcodeLookupCandidates(b)))];
    if (!codes.length) return Promise.resolve([]);
    return this.prisma.product.findMany({
      where: { OR: [{ barcode: { in: codes } }, { sku: { in: codes } }] },
      select: { ...PRODUCT_SELECT, name: true, nameAr: true, slug: true, isActive: true, stock: true },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
  }

  private statusOf(o: { isActive: boolean; startsAt: Date; endsAt: Date }, now: Date) {
    if (!o.isActive) return "paused";
    if (o.startsAt > now) return "scheduled";
    if (o.endsAt <= now) return "ended";
    return "live";
  }

  private clean(input: ProductOfferInput, creating: boolean) {
    const name = input.name?.trim();
    const discountPercent = Math.round(Number(input.discountPercent));
    const startsAt = input.startsAt ? new Date(input.startsAt) : null;
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (!name) throw new BadRequestException("اسم العرض مطلوب");
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 90)
      throw new BadRequestException("نسبة الخصم بين 1 و90");
    if (!startsAt || Number.isNaN(startsAt.getTime()) || !endsAt || Number.isNaN(endsAt.getTime()))
      throw new BadRequestException("تاريخ البداية والنهاية مطلوبان");
    if (endsAt <= startsAt) throw new BadRequestException("النهاية يجب أن تكون بعد البداية");
    const barcodes = [...new Set((input.barcodes ?? []).map((b) => normalizeBarcode(String(b))).filter(Boolean))] as string[];
    if (creating && !barcodes.length) throw new BadRequestException("أضيفي باركود منتج واحد على الأقل");
    return { name, discountPercent, startsAt, endsAt, isActive: input.isActive ?? true, barcodes };
  }
}

type Snapshot = { barcode: string; productNum: string | null; price: number; originalPrice: number; discountPercent: number };

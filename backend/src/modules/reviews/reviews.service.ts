import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { QueryReviewsDto, UpdateReviewDto, CreateReviewDto } from "./dto/review.dto";

/** ما يظهر للعامة من التقييم — بلا بريد الزبونة ولا معرّفها. */
const PUBLIC_REVIEW_SELECT = {
  id: true,
  userId: true,
  userName: true,
  rating: true,
  comment: true,
  createdAt: true,
  approved: true,
} satisfies Prisma.ReviewSelect;

type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof PUBLIC_REVIEW_SELECT }>;

/** الأحدث (الافتراضي)، الأعلى تقييماً، الأقل تقييماً — وأسماء الموقع القديمة new/high/low. */
function reviewOrder(sort?: string): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case "highest":
    case "high":
      return [{ rating: "desc" }, { createdAt: "desc" }];
    case "lowest":
    case "low":
      return [{ rating: "asc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** قائمة الإدارة: كل التقييمات مع المنتج وحساب الزبونة. */
  async list(q: QueryReviewsDto) {
    const where = {
      productId: q.productId,
      approved: q.approved,
    };
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * تقييمات المنتج للعامة: تقييم واحد لكل زبونة (الأحدث)، بلا بريد ولا معرّفات.
   * بلا page = الشكل القديم {data, meta} (التطبيقات القديمة والموقع)؛
   * مع page = {items, data, meta, mine} حيث mine تقييم الزبونة نفسها إن سجّلت الدخول (لتعديله).
   */
  async listPublic(
    productId: string,
    opts: { page?: number; limit?: number; sort?: string; paged: boolean },
    viewerId?: string,
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const ids = await this.visibleIds(productId);
    const total = ids.length;
    const rows = total
      ? await this.prisma.review.findMany({
          where: { id: { in: ids } },
          orderBy: reviewOrder(opts.sort),
          skip: (page - 1) * limit,
          take: limit,
          select: PUBLIC_REVIEW_SELECT,
        })
      : [];
    const mineRow = opts.paged && viewerId ? await this.latestOf(viewerId, productId) : null;
    const buyers = await this.verifiedBuyers(
      productId,
      [...rows, ...(mineRow ? [mineRow] : [])].map((r) => r.userId),
    );
    const items = rows.map((r) => this.toPublic(r, buyers));
    if (!opts.paged) return paginate(items, total, page, limit);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      // نفس القائمة باسم «data» أيضاً — فيقرأها محلّل الصفحات المعتاد (Paginated.fromJson) كما هو.
      data: items,
      meta: { page, limit, total, totalPages, hasNext: page < totalPages },
      mine: mineRow ? { ...this.toPublic(mineRow, buyers), approved: mineRow.approved } : null,
    };
  }

  /**
   * تقييم واحد لكل زبونة ومنتج: التقييم الثاني يعدّل الأول (القيد يُفرض هنا لأن تكرارات قديمة محفوظة).
   * قفل قصير على (الزبونة، المنتج) يمنع نقرتين متزامنتين من إنشاء تقييمين.
   */
  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException("Product not found");
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const userName = user?.name?.trim() || "زبونة";
    // نجوم كاملة أو نصف نجمة فقط.
    const rating = Math.round(dto.rating * 2) / 2;
    const comment = dto.comment.trim();

    const review = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`review:${userId}:${dto.productId}`}))`;
      const existing = await tx.review.findFirst({
        where: { userId, productId: dto.productId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      // التعديل لا يغيّر حالة الاعتماد: تقييم أخفته الإدارة لا يعود بالتعديل.
      if (existing) {
        return tx.review.update({
          where: { id: existing.id },
          data: { userName, rating, comment },
        });
      }
      return tx.review.create({
        data: {
          productId: dto.productId,
          userId,
          userName,
          rating,
          comment,
          approved: true,
        },
      });
    });
    await this.recalcProductRating(dto.productId);
    return review;
  }

  async update(id: string, dto: UpdateReviewDto) {
    await this.ensure(id);
    const review = await this.prisma.review.update({
      where: { id },
      data: { approved: dto.approved },
      include: { product: { select: { id: true, name: true } } },
    });
    await this.recalcProductRating(review.productId);
    return review;
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException("Review not found");
    await this.prisma.review.delete({ where: { id } });
    await this.recalcProductRating(review.productId);
    return { success: true };
  }

  /**
   * التقييمات المعروضة للمنتج: لكل زبونة أحدث تقييم لها فقط وإن كان معتمداً
   * (التكرارات القديمة محفوظة لكنها لا تُعرض ولا تدخل في المعدل). التقييم بلا حساب يُعدّ وحده.
   */
  private async visibleIds(productId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM (
        SELECT DISTINCT ON (COALESCE("userId", "id")) "id", "approved"
        FROM "Review"
        WHERE "productId" = ${productId}
        ORDER BY COALESCE("userId", "id"), "createdAt" DESC, "id" DESC
      ) latest
      WHERE "approved" = true`;
    return rows.map((r) => r.id);
  }

  private latestOf(userId: string, productId: string) {
    return this.prisma.review.findFirst({
      where: { userId, productId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: PUBLIC_REVIEW_SELECT,
    });
  }

  /** من استلمت طلباً فيه المنتج — شارة «مشترية موثّقة». */
  private async verifiedBuyers(productId: string, userIds: (string | null)[]): Promise<Set<string>> {
    const ids = [...new Set(userIds.filter((id): id is string => !!id))];
    if (!ids.length) return new Set();
    const orders = await this.prisma.order.findMany({
      where: { userId: { in: ids }, status: OrderStatus.DELIVERED, items: { some: { productId } } },
      select: { userId: true },
      distinct: ["userId"],
    });
    return new Set(orders.map((o) => o.userId));
  }

  /** «user.name» يبقى لواجهة الموقع الحالية — من الاسم المحفوظ مع التقييم، لا من الحساب. */
  private toPublic(r: ReviewRow, buyers: Set<string>) {
    return {
      id: r.id,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      verified: !!r.userId && buyers.has(r.userId),
      user: { name: r.userName },
    };
  }

  private async recalcProductRating(productId: string) {
    const ids = await this.visibleIds(productId);
    const agg = ids.length
      ? await this.prisma.review.aggregate({
          where: { id: { in: ids } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : null;
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg?._avg.rating ?? 0,
        reviewCount: agg?._count.rating ?? 0,
      },
    });
  }

  private async ensure(id: string) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new NotFoundException("Review not found");
  }
}

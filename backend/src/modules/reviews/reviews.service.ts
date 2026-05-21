import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { QueryReviewsDto, UpdateReviewDto, CreateReviewDto } from "./dto/review.dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException("Product not found");
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const review = await this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        userName: dto.userName ?? user?.name ?? "عميل",
        rating: dto.rating,
        comment: dto.comment,
        approved: false,
      },
    });
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

  private async recalcProductRating(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, approved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }

  private async ensure(id: string) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new NotFoundException("Review not found");
  }
}

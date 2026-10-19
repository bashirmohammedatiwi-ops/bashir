import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { OptionalJwtGuard } from "../advisor/optional-jwt.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateReviewDto, QueryReviewsDto, UpdateReviewDto } from "./dto/review.dto";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  list(@Query() q: QueryReviewsDto) {
    return this.reviews.list(q);
  }

  /**
   * تقييمات المنتج للعامة (بلا بريد أو معرّفات). «page» يطلب الشكل الجديد مع تقييم الزبونة نفسها؛
   * بدونه يبقى الشكل القديم. الرمز اختياري: إن أُرسل نعرف «mine».
   */
  @Public()
  @UseGuards(OptionalJwtGuard)
  @Get("product/:productId")
  listForProduct(
    @Param("productId") productId: string,
    @Query() q: QueryReviewsDto,
    @Query("page") rawPage?: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.reviews.listPublic(
      productId,
      { page: q.page, limit: q.limit, sort: q.sort, paged: rawPage !== undefined },
      user?.id,
    );
  }

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @Patch(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  update(@Param("id") id: string, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.reviews.remove(id);
  }
}

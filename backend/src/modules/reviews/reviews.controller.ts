import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
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

  @Public()
  @Get("product/:productId")
  listForProduct(@Param("productId") productId: string, @Query() q: QueryReviewsDto) {
    return this.reviews.list({ ...q, productId, approved: true } as QueryReviewsDto);
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

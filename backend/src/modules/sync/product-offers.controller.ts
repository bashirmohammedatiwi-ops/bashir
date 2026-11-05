import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateProductOfferDto, UpdateProductOfferDto } from "./dto/product-offer.dto";
import { ProductOffersService } from "./product-offers.service";

/** عروض الخصم من لوحة التحكم (خصم مؤقت على منتجات بالباركود يبقى فوق أسعار الـ POS). */
@ApiTags("product-offers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller("admin/product-offers")
export class ProductOffersController {
  constructor(private readonly offers: ProductOffersService) {}

  @Get() list() {
    return this.offers.list();
  }

  @Get(":id") detail(@Param("id") id: string) {
    return this.offers.detail(id);
  }

  @Post() create(@Body() dto: CreateProductOfferDto) {
    return this.offers.create(dto);
  }

  @Patch(":id") update(@Param("id") id: string, @Body() dto: UpdateProductOfferDto) {
    return this.offers.update(id, dto);
  }

  @Delete(":id") remove(@Param("id") id: string) {
    return this.offers.remove(id);
  }

  /** تطبيق فوري (بدل انتظار المراجعة الدورية كل دقيقتين). */
  @Post("reconcile") reconcile() {
    return this.offers.reconcile();
  }
}

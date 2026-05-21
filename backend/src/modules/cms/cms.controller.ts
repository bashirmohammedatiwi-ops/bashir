import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { BannersService } from "./banners.service";
import { CouponsService } from "./coupons.service";
import { HomeBlocksService } from "./home-blocks.service";
import { PackagesService } from "./packages.service";
import { CreateBannerDto, UpdateBannerDto } from "./dto/banner.dto";
import { CreatePackageDto, UpdatePackageDto } from "./dto/package.dto";

@ApiTags("cms")
@Controller()
export class CmsController {
  constructor(
    private readonly banners: BannersService,
    private readonly packages: PackagesService,
    private readonly coupons: CouponsService,
    private readonly home: HomeBlocksService,
  ) {}

  // ---- Banners ----
  @Public() @Get("banners") listBanners(@Query("active") active?: string) {
    return this.banners.list(active === "1");
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("banners") createBanner(@Body() data: CreateBannerDto) {
    return this.banners.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("banners/:id") updateBanner(@Param("id") id: string, @Body() data: UpdateBannerDto) {
    return this.banners.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN)
  @Delete("banners/:id") removeBanner(@Param("id") id: string) {
    return this.banners.remove(id);
  }

  // ---- Packages ----
  @Public() @Get("packages") listPackages(@Query("all") all?: string) {
    return this.packages.list(all !== "1");
  }

  @Public() @Get("packages/:id") packageOne(@Param("id") id: string) {
    return this.packages.findOne(id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("packages") createPackage(@Body() data: CreatePackageDto) {
    return this.packages.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("packages/:id") updatePackage(@Param("id") id: string, @Body() data: UpdatePackageDto) {
    return this.packages.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN)
  @Delete("packages/:id") removePackage(@Param("id") id: string) {
    return this.packages.remove(id);
  }

  // ---- Coupons ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get("coupons") listCoupons() {
    return this.coupons.list();
  }

  @Public() @Get("coupons/validate/:code") validate(@Param("code") code: string) {
    return this.coupons.validate(code);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("coupons") createCoupon(@Body() data: any) {
    return this.coupons.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("coupons/:id") updateCoupon(@Param("id") id: string, @Body() data: any) {
    return this.coupons.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN)
  @Delete("coupons/:id") removeCoupon(@Param("id") id: string) {
    return this.coupons.remove(id);
  }

  // ---- Home Blocks ----
  @Public() @Get("home-blocks") listHome(@Query("active") active?: string) {
    return this.home.list(active !== "0");
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("home-blocks") createHome(@Body() data: any) {
    return this.home.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("home-blocks/:id") updateHome(@Param("id") id: string, @Body() data: any) {
    return this.home.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("home-blocks/reorder") reorder(@Body() body: { ids: string[] }) {
    return this.home.reorder(body.ids);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN)
  @Delete("home-blocks/:id") removeHome(@Param("id") id: string) {
    return this.home.remove(id);
  }
}

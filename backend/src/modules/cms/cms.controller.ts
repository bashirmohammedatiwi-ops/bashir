import { OptionalJwtGuard } from "../advisor/optional-jwt.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
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
import { Role, CmsPageKey } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { BannersService } from "./banners.service";
import { CouponsService } from "./coupons.service";
import { HomeBlocksService } from "./home-blocks.service";
import { PackagesService } from "./packages.service";
import { ShowcaseService } from "./showcase.service";
import { SkinConcernsService } from "./skin-concerns.service";
import { CreateBannerDto, UpdateBannerDto } from "./dto/banner.dto";

const STAFF: string[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

@ApiTags("cms")
@Controller()
export class CmsController {
  constructor(
    private readonly banners: BannersService,
    private readonly packages: PackagesService,
    private readonly coupons: CouponsService,
    private readonly home: HomeBlocksService,
    private readonly skinConcerns: SkinConcernsService,
    private readonly showcase: ShowcaseService,
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

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("banners/:id") removeBanner(@Param("id") id: string) {
    return this.banners.remove(id);
  }

  // ---- Packages ----
  /**
   * لوحة التحكم (all=1 مع حساب موظف): كل الباقات بما فيها الموقوفة.
   * التطبيق: الباقات الصالحة الآن لعالم/نوع/مشكلة — بأسعار وتوفير محسوبين.
   */
  @Public() @UseGuards(OptionalJwtGuard) @Get("packages") listPackages(
    @CurrentUser() user?: { id: string; role: string },
    @Query("all") all?: string,
    @Query("kind") kind?: string,
    @Query("lite") lite?: string,
    @Query("world") world?: string,
    @Query("concern") concern?: string,
    @Query("skinType") skinType?: string,
  ) {
    if (all === "1" && user && STAFF.includes(user.role)) {
      return this.packages.list(false, (kind as any) || undefined, lite === "1");
    }
    return this.packages.listPublic({ world: world || undefined, kind: kind || undefined, concern: concern || undefined, skinType: skinType || undefined });
  }

  @Public() @Get("packages/slug/:slug") packageBySlug(@Param("slug") slug: string) {
    return this.packages.findPublic(slug);
  }

  /** للوحة التحكم: الباقة كاملة (حتى الموقوفة) لتعديلها. */
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("packages/:id/admin") packageAdmin(@Param("id") id: string) {
    return this.packages.findOne(id);
  }

  @Public() @Get("packages/:id") packageOne(@Param("id") id: string) {
    return this.packages.findPublic(id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("packages") createPackage(@Body() data: Record<string, unknown>) {
    return this.packages.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("packages/:id") updatePackage(@Param("id") id: string, @Body() data: Record<string, unknown>) {
    return this.packages.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("packages/:id") removePackage(@Param("id") id: string) {
    return this.packages.remove(id);
  }

  // ---- العرض في رئيسية كل عالم (دليل البشرة / روتين البشرة / الباقات) ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("showcase/:kind") showcaseOverview(@Param("kind") kind: string) {
    return this.showcase.overview(kind);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("showcase/:kind/:worldId") showcaseSave(
    @Param("kind") kind: string,
    @Param("worldId") worldId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.showcase.save(kind, worldId, {
      shown: body.shown as boolean | undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
      display: typeof body.display === "string" ? body.display : undefined,
      afterBlockId: body.afterBlockId === undefined ? undefined : (body.afterBlockId as string | null),
    });
  }

  // ---- Coupons ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get("coupons") listCoupons() {
    return this.coupons.list();
  }

  @Public() @UseGuards(OptionalJwtGuard) @Get("coupons/validate/:code")
  validate(@Param("code") code: string, @CurrentUser() user?: { id: string }) {
    return this.coupons.validate(code, user?.id);
  }

  /** مثل validate مع سبب الرفض («انتهت صلاحية الكود»، «لأول طلب فقط»…). */
  @Public() @UseGuards(OptionalJwtGuard) @Get("coupons/check/:code")
  checkCoupon(@Param("code") code: string, @CurrentUser() user?: { id: string }) {
    return this.coupons.check(code, user?.id);
  }

  /** كوبونات الصفحة الرئيسية للتطبيق (الظاهرة والصالحة الآن). */
  @Public() @UseGuards(OptionalJwtGuard) @Get("coupons/featured")
  featuredCoupons(@Query("world") world?: string, @CurrentUser() user?: { id: string }) {
    return this.coupons.featured(world || undefined, user?.id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("coupons") createCoupon(@Body() data: any) {
    return this.coupons.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("coupons/:id") updateCoupon(@Param("id") id: string, @Body() data: any) {
    return this.coupons.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("coupons/:id") removeCoupon(@Param("id") id: string) {
    return this.coupons.remove(id);
  }

  // ---- Home Blocks ----
  @Public() @Get("home-blocks") listHome(
    @Query("active") active?: string,
    @Query("page") page?: string,
    @Query("worldId") worldId?: string,
  ) {
    const pageKey = page?.toLowerCase() === "offers" ? CmsPageKey.OFFERS : CmsPageKey.HOME;
    return this.home.list(active !== "0", pageKey, worldId);
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

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("home-blocks/:id") removeHome(@Param("id") id: string) {
    return this.home.remove(id);
  }

  // ---- Skin Concerns (دليل البشرة) ----
  @Public() @Get("skin-concerns") listSkinConcerns(@Query("all") all?: string, @Query("world") world?: string) {
    return this.skinConcerns.list(all !== "1", true, world || undefined);
  }

  /** نتيجة اختبار البشرة: روتين صباحي ومسائي + منتجات كل مشكلة. */
  @Public() @Get("skin-guide/match") skinMatch(
    @Query("skinType") skinType?: string,
    @Query("concerns") concerns?: string,
    @Query("world") world?: string,
  ) {
    return this.skinConcerns.match({
      skinType: skinType || undefined,
      concerns: (concerns ?? "").split(",").map((x) => x.trim()).filter(Boolean),
      world: world || undefined,
    });
  }

  /** صفحة الدليل لمشكلة: المحتوى + المنتجات + الروتينات المناسبة. */
  @Public() @Get("skin-guide/:slug") skinGuide(@Param("slug") slug: string, @Query("world") world?: string) {
    return this.skinConcerns.guide(slug, world || undefined);
  }

  @Public() @Get("skin-concerns/:slug/products") skinConcernProducts(
    @Param("slug") slug: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.skinConcerns.findBySlug(slug, Number(page) || 1, Number(limit) || 20);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("skin-concerns/:id/admin-products") skinConcernAdminProducts(@Param("id") id: string) {
    return this.skinConcerns.adminProducts(id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("skin-concerns") createSkinConcern(@Body() data: Record<string, unknown>) {
    return this.skinConcerns.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("skin-concerns/:id") updateSkinConcern(@Param("id") id: string, @Body() data: Record<string, unknown>) {
    return this.skinConcerns.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("skin-concerns/:id") removeSkinConcern(@Param("id") id: string) {
    return this.skinConcerns.remove(id);
  }
}

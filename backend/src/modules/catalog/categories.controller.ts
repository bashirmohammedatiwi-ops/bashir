import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { isAdminViewRequest } from "../../common/admin-view.util";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { CacheResponse, ResponseCacheInterceptor } from "../../common/interceptors/response-cache.interceptor";
import { RedisCacheService } from "../../common/redis-cache.service";
import { UseInterceptors } from "@nestjs/common";

const CACHE_PREFIX = "rc:catalog:tree";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(
    private readonly service: CategoriesService,
    private readonly cache: RedisCacheService,
  ) {}

  @Public() @Get() @UseInterceptors(ResponseCacheInterceptor) @CacheResponse(60, CACHE_PREFIX) list(
    @Req() req: any,
    @Query("all") all?: string,
    @Query("minimal") minimal?: string,
  ) {
    return this.service.list(all === "1", minimal === "1", !isAdminViewRequest(req));
  }

  @Public() @Get(":idOrSlug/subcategories")
  subcategories(@Param("idOrSlug") idOrSlug: string, @Query("all") all?: string) {
    return this.service.listSubcategories(idOrSlug, all === "1");
  }

  @Public() @Get(":idOrSlug")
  one(@Param("idOrSlug") id: string) {
    return this.service.findOne(id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post() async create(@Body() data: CreateCategoryDto) {
    const created = await this.service.create(data);
    void this.cache.invalidatePrefix(CACHE_PREFIX);
    return created;
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(":id") async update(@Param("id") id: string, @Body() data: UpdateCategoryDto) {
    const updated = await this.service.update(id, data);
    void this.cache.invalidatePrefix(CACHE_PREFIX);
    return updated;
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(":id") async remove(@Param("id") id: string) {
    const removed = await this.service.remove(id);
    void this.cache.invalidatePrefix(CACHE_PREFIX);
    return removed;
  }
}

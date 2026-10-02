import {
  Body,
  Controller,
  UseInterceptors,
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
import { CategoriesService } from "./categories.service";
import { CreateSubcategoryDto, UpdateSubcategoryDto } from "./dto/category.dto";
import { CacheResponse, ResponseCacheInterceptor } from "../../common/interceptors/response-cache.interceptor";
import { RedisCacheService } from "../../common/redis-cache.service";

@ApiTags("subcategories")
@Controller("subcategories")
export class SubcategoriesController {
  constructor(
    private readonly service: CategoriesService,
    private readonly cache: RedisCacheService,
  ) {}

  @Public()
  @Get()
  @UseInterceptors(ResponseCacheInterceptor)
  @CacheResponse(60, "rc:catalog:sub")
  list(
    @Query("parentId") parentId?: string,
    @Query("all") all?: string,
    @Query("search") search?: string,
  ) {
    return this.service.listSecondarySections({
      parentId,
      all: all === "1",
      search,
    });
  }

  @Public()
  @Get(":idOrSlug")
  one(@Param("idOrSlug") idOrSlug: string) {
    return this.service.findSubcategory(idOrSlug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  async create(@Body() data: CreateSubcategoryDto) {
    const result = await this.service.createSubcategory(data);
    void this.cache.invalidatePrefix("rc:catalog:sub");
    void this.cache.invalidatePrefix("rc:catalog:tree");
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(":id")
  async update(@Param("id") id: string, @Body() data: UpdateSubcategoryDto) {
    const result = await this.service.updateSubcategory(id, data);
    void this.cache.invalidatePrefix("rc:catalog:sub");
    void this.cache.invalidatePrefix("rc:catalog:tree");
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    const result = await this.service.remove(id);
    void this.cache.invalidatePrefix("rc:catalog:sub");
    void this.cache.invalidatePrefix("rc:catalog:tree");
    return result;
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public() @Get() list(@Query("all") all?: string, @Query("minimal") minimal?: string) {
    return this.service.list(all === "1", minimal === "1");
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
  @Post() create(@Body() data: CreateCategoryDto) {
    return this.service.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(":id") update(@Param("id") id: string, @Body() data: UpdateCategoryDto) {
    return this.service.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(":id") remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}

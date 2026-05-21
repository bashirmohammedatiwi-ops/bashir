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
import { CategoriesService } from "./categories.service";
import { CreateSubcategoryDto, UpdateSubcategoryDto } from "./dto/category.dto";

@ApiTags("subcategories")
@Controller("subcategories")
export class SubcategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public()
  @Get()
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
  create(@Body() data: CreateSubcategoryDto) {
    return this.service.createSubcategory(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() data: UpdateSubcategoryDto) {
    return this.service.updateSubcategory(id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}

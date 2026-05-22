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
import { BrandsService } from "./brands.service";

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Public() @Get() list(@Query("featured") featured?: string, @Query("all") all?: string) {
    return this.service.list({ featuredOnly: featured === "1", all: all === "1" });
  }

  @Public() @Get(":idOrSlug/collections")
  collections(@Param("idOrSlug") idOrSlug: string, @Query("all") all?: string) {
    return this.service.listCollectionsBySlugOrId(idOrSlug, all === "1");
  }

  @Public() @Get(":idOrSlug")
  one(@Param("idOrSlug") id: string) {
    return this.service.findOne(id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post() create(@Body() data: any) {
    return this.service.create(data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post(":idOrSlug/collections")
  createCollection(@Param("idOrSlug") idOrSlug: string, @Body() data: any) {
    return this.service.createCollectionForBrand(idOrSlug, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("collections/:collectionId")
  updateCollection(@Param("collectionId") collectionId: string, @Body() data: any) {
    return this.service.updateCollection(collectionId, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("collections/:collectionId")
  removeCollection(@Param("collectionId") collectionId: string) {
    return this.service.removeCollection(collectionId);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(":id") update(@Param("id") id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(":id") remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}

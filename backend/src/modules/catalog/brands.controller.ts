import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { isAdminViewRequest } from "../../common/admin-view.util";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { BrandsService } from "./brands.service";

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Public() @Get() list(
    @Req() req: any,
    @Query("featured") featured?: string,
    @Query("all") all?: string,
  ) {
    return this.service.list({
      featuredOnly: featured === "1",
      all: all === "1",
      storefront: !isAdminViewRequest(req),
    });
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

  /** مطابقة براند أو إنشاؤه إن لم يوجد (لاستيراد الكتالوج) */
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("resolve")
  resolve(
    @Body()
    body: {
      brandAr?: string;
      brandEn?: string;
      name?: string;
      logoUrl?: string;
      logoIsProductImage?: boolean;
      createIfMissing?: boolean;
    },
  ) {
    return this.service.resolve(body);
  }

  /** مزامنة براندات الكتالوج (المتاجر الأربعة) مع إزالة التكرار */
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("sync-from-catalog")
  syncFromCatalog(
    @Body()
    body: {
      brands?: Array<{
        name?: string;
        nameAr?: string;
        nameEn?: string;
        logoUrl?: string;
        logoIsProductImage?: boolean;
      }>;
      attachLogos?: boolean;
    },
  ) {
    return this.service.syncFromCatalog(body);
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
  @Delete(":id")
  remove(@Param("id") id: string, @Query("reassignTo") reassignTo?: string) {
    return this.service.remove(id, { reassignToBrandId: reassignTo });
  }
}

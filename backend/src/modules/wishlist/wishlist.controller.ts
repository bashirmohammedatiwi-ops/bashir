import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { WishlistService } from "./wishlist.service";

@ApiTags("wishlist")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.wishlist.list(user.id);
  }

  @Post(":productId")
  add(@CurrentUser() user: any, @Param("productId") productId: string) {
    return this.wishlist.add(user.id, productId);
  }

  @Post(":productId/toggle")
  toggle(@CurrentUser() user: any, @Param("productId") productId: string) {
    return this.wishlist.toggle(user.id, productId);
  }

  @Delete(":productId")
  remove(@CurrentUser() user: any, @Param("productId") productId: string) {
    return this.wishlist.remove(user.id, productId);
  }
}

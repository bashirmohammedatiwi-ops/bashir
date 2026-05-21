import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AddressesService } from "./addresses.service";

@ApiTags("addresses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("addresses")
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  list(@CurrentUser() user: any, @Query("userId") userId?: string) {
    const uid = [Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF].includes(user.role)
      ? (userId ?? user.id)
      : user.id;
    return this.addresses.listForUser(uid);
  }

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@CurrentUser() user: any, @Body() data: any) {
    return this.addresses.create(user.id, data);
  }

  @Patch(":id")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  update(@CurrentUser() user: any, @Param("id") id: string, @Body() data: any) {
    return this.addresses.update(user.id, id, data);
  }

  @Delete(":id")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.addresses.remove(user.id, id);
  }
}

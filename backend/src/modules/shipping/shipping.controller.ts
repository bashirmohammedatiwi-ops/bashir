import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  CreateShippingAreaDto,
  CreateShippingZoneDto,
  ShippingQuoteDto,
  UpdateShippingAreaDto,
  UpdateShippingZoneDto,
} from "./dto/shipping.dto";
import { ShippingService } from "./shipping.service";

@ApiTags("shipping")
@Controller("shipping")
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Public()
  @Get("zones")
  listPublic() {
    return this.shipping.list(true);
  }

  @Public()
  @Get("quote")
  quote(@Query() q: ShippingQuoteDto) {
    return this.shipping.quote(q);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("zones/all")
  listAll() {
    return this.shipping.list(false);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("zones")
  create(@Body() dto: CreateShippingZoneDto) {
    return this.shipping.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("zones/:id")
  update(@Param("id") id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.shipping.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("zones/:id")
  remove(@Param("id") id: string) {
    return this.shipping.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("areas")
  createArea(@Body() dto: CreateShippingAreaDto) {
    return this.shipping.createArea(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch("areas/:id")
  updateArea(@Param("id") id: string, @Body() dto: UpdateShippingAreaDto) {
    return this.shipping.updateArea(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("areas/:id")
  removeArea(@Param("id") id: string) {
    return this.shipping.removeArea(id);
  }
}

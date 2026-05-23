import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  BulkInventorySyncDto,
  InventorySyncItemDto,
} from "./dto/inventory-sync.dto";
import { InventorySyncService } from "./inventory-sync.service";

@ApiTags("sync")
@Controller("sync/inventory")
export class InventorySyncController {
  constructor(private readonly sync: InventorySyncService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("by-barcode/:barcode")
  findByBarcode(@Param("barcode") barcode: string) {
    return this.sync.findByBarcode(barcode);
  }

  @Public()
  @Post()
  syncOne(@Body() dto: InventorySyncItemDto) {
    return this.sync.syncOne(dto);
  }

  @Public()
  @Post("bulk")
  syncBulk(@Body() dto: BulkInventorySyncDto) {
    return this.sync.syncMany(dto.items);
  }
}

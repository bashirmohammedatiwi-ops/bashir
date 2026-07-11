import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  QueryPosSyncRunsDto,
  QueryStockAlertsDto,
  RecordPosSyncRunDto,
  SendStockAlertDto,
} from "./dto/inventory-admin.dto";
import {
  BulkInventorySyncDto,
  InventorySyncItemDto,
  LookupBarcodesDto,
} from "./dto/inventory-sync.dto";
import { InventoryAdminService } from "./inventory-admin.service";
import { InventorySyncService } from "./inventory-sync.service";
import { StockAlertService } from "./stock-alert.service";

@ApiTags("sync")
@Controller("sync/inventory")
export class InventorySyncController {
  constructor(
    private readonly sync: InventorySyncService,
    private readonly admin: InventoryAdminService,
    private readonly stockAlerts: StockAlertService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("overview")
  overview() {
    return this.admin.getOverview();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("stock-alerts")
  listStockAlerts(@Query() q: QueryStockAlertsDto) {
    return this.admin.listStockAlerts({
      page: q.page,
      limit: q.limit,
      status: q.status,
      search: q.search,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("runs")
  runs(@Query() q: QueryPosSyncRunsDto) {
    return this.admin.listRuns(q.page ?? 1, q.limit ?? 20);
  }

  @Public()
  @SkipThrottle()
  @Post("runs")
  recordRun(@Body() dto: RecordPosSyncRunDto) {
    return this.admin.recordRun(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Post("stock-alerts/send")
  sendStockAlert(@Body() dto: SendStockAlertDto) {
    return this.stockAlerts.sendManualAlert(dto.barcode, dto.alertType);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("by-barcode/:barcode")
  findByBarcode(@Param("barcode") barcode: string) {
    return this.sync.findByBarcode(barcode);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Post("lookup-barcodes")
  lookupBarcodes(@Body() dto: LookupBarcodesDto) {
    return this.sync.lookupBarcodes(dto.barcodes);
  }

  @Public()
  @SkipThrottle()
  @Post()
  syncOne(@Body() dto: InventorySyncItemDto) {
    return this.sync.syncOne(dto);
  }

  @Public()
  @SkipThrottle()
  @Post("bulk")
  syncBulk(@Body() dto: BulkInventorySyncDto) {
    return this.sync.syncMany(dto.items);
  }
}

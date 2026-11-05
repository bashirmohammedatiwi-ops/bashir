import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { InventoryAdminService } from "./inventory-admin.service";
import { InventorySyncController } from "./inventory-sync.controller";
import { InventorySyncService } from "./inventory-sync.service";
import { ProductOffersController } from "./product-offers.controller";
import { ProductOffersService } from "./product-offers.service";
import { QamarCatalogNotifierService } from "./qamar-catalog-notifier.service";
import { StockAlertService } from "./stock-alert.service";

@Module({
  imports: [SettingsModule],
  controllers: [InventorySyncController, ProductOffersController],
  providers: [
    InventorySyncService,
    ProductOffersService,
    InventoryAdminService,
    StockAlertService,
    QamarCatalogNotifierService,
  ],
  exports: [InventorySyncService, QamarCatalogNotifierService],
})
export class SyncModule {}

import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { SettingsModule } from "../settings/settings.module";
import { InventoryAdminService } from "./inventory-admin.service";
import { InventorySyncController } from "./inventory-sync.controller";
import { InventorySyncService } from "./inventory-sync.service";
import { StockAlertService } from "./stock-alert.service";

@Module({
  imports: [NotificationsModule, SettingsModule],
  controllers: [InventorySyncController],
  providers: [InventorySyncService, InventoryAdminService, StockAlertService],
  exports: [InventorySyncService],
})
export class SyncModule {}

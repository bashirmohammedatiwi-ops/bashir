import { Module } from "@nestjs/common";
import { InventorySyncController } from "./inventory-sync.controller";
import { InventorySyncService } from "./inventory-sync.service";

@Module({
  controllers: [InventorySyncController],
  providers: [InventorySyncService],
  exports: [InventorySyncService],
})
export class SyncModule {}

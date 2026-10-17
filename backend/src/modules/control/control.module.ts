import { Module } from "@nestjs/common";
import { AdvisorModule } from "../advisor/advisor.module";
import { CatalogModule } from "../catalog/catalog.module";
import { MediaModule } from "../media/media.module";
import { SyncModule } from "../sync/sync.module";
import { OrdersModule } from "../orders/orders.module";
import { ControlCatalogService } from "./control-catalog.service";
import { ControlCustomersService } from "./control-customers.service";
import { ControlInsightsService } from "./control-insights.service";
import { ControlOrdersService } from "./control-orders.service";
import { BarcodeDraftsService } from "./barcode-drafts.service";
import { ControlImagesService } from "./control-images.service";
import { ControlController } from "./control.controller";
import { ControlService } from "./control.service";

@Module({
  imports: [CatalogModule, MediaModule, SyncModule, AdvisorModule, OrdersModule],
  controllers: [ControlController],
  providers: [ControlService, ControlImagesService, BarcodeDraftsService, ControlCatalogService, ControlOrdersService, ControlCustomersService, ControlInsightsService],
})
export class ControlModule {}

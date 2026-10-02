import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma.module";
import { CatalogModule } from "../catalog/catalog.module";
import { MediaModule } from "../media/media.module";
import { AiProductController } from "./ai-product.controller";
import { AiProductService } from "./ai-product.service";
import { AiQuickImportService } from "./ai-quick-import.service";
import { CursorNamingClient } from "./cursor-naming.client";
import { GlobalBarcodeEnrichmentService } from "./global-barcode-enrichment.service";
import { GoogleImagesService } from "./google-images.service";

@Module({
  imports: [PrismaModule, CatalogModule, MediaModule],
  controllers: [AiProductController],
  providers: [
    AiProductService,
    AiQuickImportService,
    GoogleImagesService,
    CursorNamingClient,
    GlobalBarcodeEnrichmentService,
  ],
})
export class AiProductModule {}

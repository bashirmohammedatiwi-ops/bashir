import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma.module";
import { AiProductController } from "./ai-product.controller";
import { AiProductService } from "./ai-product.service";
import { CursorNamingClient } from "./cursor-naming.client";
import { GlobalBarcodeEnrichmentService } from "./global-barcode-enrichment.service";
import { GoogleImagesService } from "./google-images.service";

@Module({
  imports: [PrismaModule],
  controllers: [AiProductController],
  providers: [AiProductService, GoogleImagesService, CursorNamingClient, GlobalBarcodeEnrichmentService],
})
export class AiProductModule {}

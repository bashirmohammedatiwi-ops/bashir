import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { HomeController } from "./home.controller";
import { OffersController } from "./offers.controller";
import { HomeService } from "./home.service";
import { HomeSectionResolver } from "./home-section.resolver";

@Module({
  imports: [CatalogModule],
  controllers: [HomeController, OffersController],
  providers: [HomeService, HomeSectionResolver],
})
export class HomeModule {}

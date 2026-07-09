import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { CategoriesController } from "./categories.controller";
import { SubcategoriesController } from "./subcategories.controller";
import { TertiarySectionsController } from "./tertiary-sections.controller";
import { CategoriesService } from "./categories.service";
import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";
import { SyncModule } from "../sync/sync.module";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [SyncModule, MediaModule],
  controllers: [ProductsController, CategoriesController, SubcategoriesController, TertiarySectionsController, BrandsController],
  providers: [ProductsService, CategoriesService, BrandsService],
  exports: [ProductsService, CategoriesService, BrandsService],
})
export class CatalogModule {}

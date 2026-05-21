import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { CategoriesController } from "./categories.controller";
import { SubcategoriesController } from "./subcategories.controller";
import { CategoriesService } from "./categories.service";
import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";

@Module({
  controllers: [ProductsController, CategoriesController, SubcategoriesController, BrandsController],
  providers: [ProductsService, CategoriesService, BrandsService],
  exports: [ProductsService, CategoriesService, BrandsService],
})
export class CatalogModule {}

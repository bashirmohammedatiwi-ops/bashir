import { Module } from "@nestjs/common";
import { CmsController } from "./cms.controller";
import { BannersService } from "./banners.service";
import { PackagesService } from "./packages.service";
import { CouponsService } from "./coupons.service";
import { HomeBlocksService } from "./home-blocks.service";
import { SkinConcernsService } from "./skin-concerns.service";

@Module({
  controllers: [CmsController],
  providers: [BannersService, PackagesService, CouponsService, HomeBlocksService, SkinConcernsService],
  exports: [BannersService, PackagesService, CouponsService, HomeBlocksService, SkinConcernsService],
})
export class CmsModule {}

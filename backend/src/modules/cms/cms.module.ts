import { Module } from "@nestjs/common";
import { CmsController } from "./cms.controller";
import { BannersService } from "./banners.service";
import { PackagesService } from "./packages.service";
import { CouponsService } from "./coupons.service";
import { HomeBlocksService } from "./home-blocks.service";

@Module({
  controllers: [CmsController],
  providers: [BannersService, PackagesService, CouponsService, HomeBlocksService],
  exports: [BannersService, PackagesService, CouponsService, HomeBlocksService],
})
export class CmsModule {}

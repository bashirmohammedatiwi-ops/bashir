import { Module } from "@nestjs/common";
import { AlertsModule } from "../alerts/alerts.module";
import { WishlistController } from "./wishlist.controller";
import { WishlistService } from "./wishlist.service";

@Module({
  imports: [AlertsModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}

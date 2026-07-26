import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { ShippingModule } from "../shipping/shipping.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [LoyaltyModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { ShippingModule } from "../shipping/shipping.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrderEvents } from "./order-events";

@Module({
  imports: [LoyaltyModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEvents],
  exports: [OrdersService, OrderEvents],
})
export class OrdersModule {}

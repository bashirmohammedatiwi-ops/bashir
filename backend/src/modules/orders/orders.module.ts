import { Module } from "@nestjs/common";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [LoyaltyModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

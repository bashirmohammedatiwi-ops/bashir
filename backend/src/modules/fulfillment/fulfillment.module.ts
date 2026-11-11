import { Module } from "@nestjs/common";
import { OrderNotifyService } from "../delivery/order-notify.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { FulfillmentController } from "./fulfillment.controller";
import { FulfillmentService } from "./fulfillment.service";
import { OrderTimelineService } from "./order-timeline.service";

/** تجهيز طلبات التطبيق بالمسح، والخط الزمني للطلب، وإشعارات مراحله للعميل. */
@Module({
  imports: [NotificationsModule],
  controllers: [FulfillmentController],
  providers: [FulfillmentService, OrderTimelineService, OrderNotifyService],
  exports: [FulfillmentService, OrderTimelineService, OrderNotifyService],
})
export class FulfillmentModule {}

import { Module } from "@nestjs/common";
import { FulfillmentController } from "./fulfillment.controller";
import { FulfillmentService } from "./fulfillment.service";
import { OrderTimelineService } from "./order-timeline.service";

/** تجهيز طلبات التطبيق بالمسح، والخط الزمني للطلب. */
@Module({
  controllers: [FulfillmentController],
  providers: [FulfillmentService, OrderTimelineService],
  exports: [FulfillmentService, OrderTimelineService],
})
export class FulfillmentModule {}

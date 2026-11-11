import { Module } from "@nestjs/common";
import { FulfillmentModule } from "../fulfillment/fulfillment.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { CouriersController, HiExpressWebhookController, PosLinkController } from "./delivery.controllers";
import { HiExpressClient } from "./hi-express.client";
import { PosLinkService } from "./pos-link.service";
import { ShipmentsService } from "./shipments.service";

/** الشحن مع هاي إكسبريس، ربط كاشير الطلبات، وإشعارات مراحل الطلب للعميل. */
@Module({
  imports: [FulfillmentModule, NotificationsModule, OrdersModule, PaymentsModule],
  controllers: [PosLinkController, HiExpressWebhookController, CouriersController],
  providers: [HiExpressClient, ShipmentsService, PosLinkService],
  exports: [ShipmentsService],
})
export class DeliveryModule {}

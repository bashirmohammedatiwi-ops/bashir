import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { OrdersModule } from "../orders/orders.module";
import { SettingsModule } from "../settings/settings.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { QiGatewayService } from "./qi-gateway.service";

@Module({
  imports: [OrdersModule, SettingsModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, QiGatewayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

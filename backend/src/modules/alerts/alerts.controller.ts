import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AlertsService } from "./alerts.service";

@ApiTags("alerts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get("mine")
  mine(@CurrentUser() user: any) {
    return this.alerts.mine(user.id);
  }

  @Post("restock/:productId")
  watch(@Param("productId") productId: string, @CurrentUser() user: any) {
    return this.alerts.watchRestock(user.id, productId);
  }

  @Delete("restock/:productId")
  unwatch(@Param("productId") productId: string, @CurrentUser() user: any) {
    return this.alerts.unwatchRestock(user.id, productId);
  }
}

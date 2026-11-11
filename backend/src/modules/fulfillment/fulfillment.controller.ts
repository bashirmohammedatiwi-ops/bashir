import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  PickExtraDto,
  PickFinishDto,
  PickLinePatchDto,
  PickReopenDto,
  PickScanDto,
  PickStartDto,
} from "./dto/fulfillment.dto";
import { Actor, FulfillmentService } from "./fulfillment.service";

type JwtUser = { id?: string; sub?: string; role?: Role } | undefined;
const actorOf = (u: JwtUser): Actor => ({ id: (u?.id ?? u?.sub)!, role: u?.role ?? Role.STAFF });

/**
 * تجهيز طلبات التطبيق — تطبيق التجهيز، تطبيق المدير، ولوحة الإدارة.
 * تحت /control مثل باقي مسارات الموظفين.
 */
@ApiTags("fulfillment")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@Controller("control/orders")
export class FulfillmentController {
  constructor(private readonly fulfillment: FulfillmentService) {}

  /** فتح الطلب من مسح QR قائمة التجهيز. */
  @Get("by-code/:code")
  byCode(@Param("code") code: string) {
    return this.fulfillment.byCode(code);
  }

  @Get(":id/pick")
  pick(@Param("id") id: string) {
    return this.fulfillment.view(id);
  }

  @Post(":id/pick/start")
  start(@Param("id") id: string, @Body() dto: PickStartDto, @CurrentUser() user: JwtUser) {
    return this.fulfillment.start(id, actorOf(user), dto);
  }

  @Post(":id/pick/scan")
  scan(@Param("id") id: string, @Body() dto: PickScanDto, @CurrentUser() user: JwtUser) {
    return this.fulfillment.scan(id, actorOf(user), dto);
  }

  @Post(":id/pick/extra")
  extra(@Param("id") id: string, @Body() dto: PickExtraDto, @CurrentUser() user: JwtUser) {
    return this.fulfillment.addExtra(id, actorOf(user), dto);
  }

  @Patch(":id/pick/lines/:lineId")
  line(@Param("id") id: string, @Param("lineId") lineId: string, @Body() dto: PickLinePatchDto, @CurrentUser() user: JwtUser) {
    return this.fulfillment.patchLine(id, lineId, actorOf(user), dto);
  }

  @Post(":id/pick/finish")
  finish(@Param("id") id: string, @Body() dto: PickFinishDto, @CurrentUser() user: JwtUser) {
    return this.fulfillment.finish(id, actorOf(user), dto);
  }

  @Post(":id/pick/reopen")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  reopen(@Param("id") id: string, @Body() dto: PickReopenDto, @CurrentUser() user: JwtUser) {
    return this.fulfillment.reopen(id, actorOf(user), dto);
  }

  /** بيانات قائمة التجهيز المطبوعة (بلا أسعار). */
  @Get(":id/slip")
  slip(@Param("id") id: string) {
    return this.fulfillment.slip(id);
  }

  @Get(":id/timeline")
  timeline(@Param("id") id: string) {
    return this.fulfillment.timelineOf(id);
  }
}

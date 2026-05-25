import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  CreateNotificationDto,
  RegisterDeviceDto,
  SendNotificationDto,
  UnregisterDeviceDto,
} from "./dto/notification.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  list(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("admin") admin?: string,
  ) {
    if ([Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF].includes(user.role) && admin === "1") {
      return this.notifications.adminList(Number(page ?? 1), Number(limit ?? 20));
    }
    return this.notifications.listForUser(
      user.id,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
  }

  @Get("stats")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  stats() {
    return this.notifications.stats();
  }

  @Patch("read-all")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(":id/read")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  markRead(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("devices")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  registerDevice(@CurrentUser() user: any, @Body() dto: RegisterDeviceDto) {
    return this.notifications.registerDevice(user.id, dto.token, dto.platform ?? "android");
  }

  @Delete("devices")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  unregisterDevice(@CurrentUser() user: any, @Body() dto: UnregisterDeviceDto) {
    return this.notifications.unregisterDevice(user.id, dto.token);
  }

  @Post("send")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  send(@Body() dto: SendNotificationDto) {
    return this.notifications.send(dto);
  }

  @Post(":id/resend")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  resend(@Param("id") id: string) {
    return this.notifications.resend(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.send(dto);
  }

  @Delete(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.notifications.remove(id);
  }
}

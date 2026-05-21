import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { LoyaltyService } from "./loyalty.service";

@ApiTags("loyalty")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("loyalty")
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  me(@CurrentUser() user: any) {
    return this.loyalty.summary(user.id);
  }

  @Get("users/:userId")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  forUser(@Param("userId") userId: string) {
    return this.loyalty.summary(userId);
  }

  @Get("users/:userId/history")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  history(@Param("userId") userId: string) {
    return this.loyalty.adminHistory(userId);
  }
}

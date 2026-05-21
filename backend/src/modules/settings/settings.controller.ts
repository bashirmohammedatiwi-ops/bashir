import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  @Patch()
  update(@Body() data: Record<string, unknown>) {
    return this.settings.update(data);
  }
}

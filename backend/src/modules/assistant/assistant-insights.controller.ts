import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AssistantInsightsService } from "./assistant-insights.service";

@ApiTags("assistant")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
@Controller("assistant/insights")
export class AssistantInsightsController {
  constructor(private readonly insights: AssistantInsightsService) {}

  @Get()
  overview(@Query("days") days?: string) {
    const parsed = Number(days);
    return this.insights.overview(Number.isFinite(parsed) && parsed > 0 ? parsed : 30);
  }
}

import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller("admin/cache")
export class AdminCacheController {
  constructor(private readonly homeFeedCache: HomeFeedCacheService) {}

  @Post("invalidate")
  async invalidate(@Body() body: { keys?: string[] }) {
    const keys = body?.keys?.length ? body.keys : ["home"];
    let cleared = 0;
    if (keys.includes("home")) {
      cleared += await this.homeFeedCache.invalidateAll();
    }
    return { success: true, cleared, keys };
  }
}

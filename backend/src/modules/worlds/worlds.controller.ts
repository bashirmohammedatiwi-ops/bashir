import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UpdateWorldDto } from "./dto/update-world.dto";
import { WorldsService } from "./worlds.service";

@ApiTags("worlds")
@Controller("worlds")
export class WorldsController {
  constructor(private readonly worlds: WorldsService) {}

  @Public()
  @Get()
  list() {
    return this.worlds.list(false);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("manage")
  manage() {
    return this.worlds.list(true);
  }

  @Public()
  @Get(":slug")
  one(@Param("slug") slug: string) {
    return this.worlds.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWorldDto) {
    return this.worlds.update(id, dto);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AssistantGuidesService } from "./assistant-guides.service";

class AssistantGuideBody {
  @IsIn(["promote", "hide", "note"])
  type!: "promote" | "hide" | "note";

  @IsOptional()
  @IsString()
  @MaxLength(40)
  concern?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags("assistant")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
@Controller("assistant/guides")
export class AssistantGuidesController {
  constructor(private readonly guides: AssistantGuidesService) {}

  @Get()
  list() {
    return this.guides.list();
  }

  @Post()
  create(@Body() body: AssistantGuideBody) {
    return this.guides.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Partial<AssistantGuideBody>) {
    return this.guides.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guides.remove(id);
  }
}

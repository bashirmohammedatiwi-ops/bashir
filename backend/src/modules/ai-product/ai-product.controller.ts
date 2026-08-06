import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AiProductService } from "./ai-product.service";
import { AiAutofillDto } from "./dto/ai-autofill.dto";

@ApiTags("ai-product")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@Controller("ai-product")
export class AiProductController {
  constructor(private readonly ai: AiProductService) {}

  @Post("autofill")
  autofill(@Body() dto: AiAutofillDto) {
    return this.ai.autofill(dto.barcode, dto.hint);
  }
}

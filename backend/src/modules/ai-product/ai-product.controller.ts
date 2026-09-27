import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AiProductService } from "./ai-product.service";
import { AiAutofillDto, AiImagesDto, AiReviewExistingDto } from "./dto/ai-autofill.dto";

@ApiTags("ai-product")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@Controller("ai-product")
export class AiProductController {
  constructor(private readonly ai: AiProductService) {}

  @Get("models")
  models() {
    return this.ai.listModels();
  }

  @Post("autofill")
  autofill(@Body() dto: AiAutofillDto) {
    return this.ai.autofill(dto.barcode, dto.hint, dto.model, Boolean(dto.force));
  }

  /** مراجعة منتج موجود بالباركود — AI + ملاحظات جودة + اقتراحات تصحيح */
  @Post("review-existing")
  reviewExisting(@Body() dto: AiReviewExistingDto) {
    return this.ai.reviewExisting(dto.barcode, dto.hint, dto.model);
  }

  /** Barcode image search only — no AI tokens. */
  @Post("images")
  images(@Body() dto: AiImagesDto) {
    return this.ai.searchImages(dto.barcode, dto.nameHint, dto.mode ?? "barcode", dto.query);
  }
}

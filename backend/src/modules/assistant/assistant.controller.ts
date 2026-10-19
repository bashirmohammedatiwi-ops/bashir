import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AssistantInsightsService } from "./assistant-insights.service";
import { AssistantProfileService, SKIN_TYPES } from "./assistant-profile.service";
import { AssistantService } from "./assistant.service";
import { AssistantChatDto, AssistantFeedbackDto, AssistantTapDto } from "./dto/assistant-chat.dto";
import { SkinType } from "./intelligence/profile";

/** ملف البشرة من التطبيق (اختبار البشرة) — كل حقل اختياري؛ skinType = null أو "" يمسحه. */
export class UpdateAssistantProfileDto {
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsIn(SKIN_TYPES)
  skinType?: SkinType | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  sensitivities?: string[];
}

function readVoiceField(fields: Record<string, unknown> | undefined, key: string): string | undefined {
  const raw = fields?.[key];
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "value" in raw) return String((raw as { value: unknown }).value);
  return undefined;
}

@ApiTags("assistant")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
@Controller("assistant")
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly insights: AssistantInsightsService,
    private readonly profiles: AssistantProfileService,
  ) {}

  /** ملفها المحفوظ على الحساب (نوع البشرة، الحساسيات…) — لاستعادته بعد تسجيل الدخول على جهاز جديد. */
  @Get("profile")
  profile(@CurrentUser() user: { id: string }) {
    return this.profiles.publicProfile(user.id);
  }

  /** حفظ نتيجة اختبار البشرة على الحساب. */
  @Patch("profile")
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateAssistantProfileDto) {
    return this.profiles.update(user.id, { skinType: dto.skinType, sensitivities: dto.sensitivities });
  }

  @Post("chat")
  chat(@CurrentUser() user: { id: string }, @Body() dto: AssistantChatDto) {
    return this.assistant.chat(user.id, dto);
  }

  @Post("turns/:id/feedback")
  feedback(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: AssistantFeedbackDto) {
    return this.insights.feedback(user.id, id, dto.rating, dto.note);
  }

  @Post("turns/:id/tap")
  tap(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: AssistantTapDto) {
    return this.insights.tap(user.id, id, dto.productId);
  }

  @Post("turns/:id/cart")
  cart(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: AssistantTapDto) {
    return this.insights.cart(user.id, id, dto.productId);
  }

  @Post("voice")
  async voice(@CurrentUser() user: { id: string }, @Req() req: any) {
    if (!req.isMultipart?.()) throw new BadRequestException("أرسل ملف صوت");
    const part = await req.file();
    if (!part) throw new BadRequestException("ماكو تسجيل");
    const audio = await part.toBuffer();
    if (!audio?.length || audio.length < 400) throw new BadRequestException("التسجيل قصير");
    const langValue = readVoiceField(part.fields, "lang") ?? "ar";
    return this.assistant.voice(user.id, audio, part.mimetype || "audio/mp4", langValue === "en" ? "en" : "ar");
  }
}

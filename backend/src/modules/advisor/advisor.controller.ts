import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { OptionalJwtGuard } from "./optional-jwt.guard";
import { AdvisorService } from "./advisor.service";
import { AdvisorState, Profile } from "./engine/types";

class AdvisorChatDto {
  @IsOptional() @IsString() @MaxLength(600) message?: string;
  @IsOptional() @IsString() @MaxLength(600) action?: string;
  @IsOptional() @IsObject() state?: AdvisorState;
  @IsOptional() @IsString() @MaxLength(40) firstName?: string;
  @IsOptional() @IsObject() profile?: Profile;
  @IsOptional() @IsString() @MaxLength(64) productId?: string;
}

class AdvisorFeedbackDto {
  @IsOptional() @IsString() @MaxLength(64) productId?: string;
  @IsIn(["click", "cart", "like", "dislike"]) type!: string;
  @IsOptional() @IsString() @MaxLength(60) sig?: string;
}

class AdvisorWelcomeDto {
  @IsOptional() @IsString() @MaxLength(40) firstName?: string;
}

/** المستشارة متاحة للجميع (حتى قبل تسجيل الدخول) — الحالة يحملها التطبيق. */
@ApiTags("advisor")
@Controller("advisor")
export class AdvisorController {
  constructor(private readonly advisor: AdvisorService) {}

  @Public()
  @Get("welcome")
  welcome(@Query("name") name?: string) {
    return this.advisor.welcome(name?.slice(0, 40));
  }

  /** نفس الترحيب، والاسم في جسم الطلب لا في الرابط (لا يُسجَّل في سجلات الخادم). */
  @Public()
  @UseGuards(OptionalJwtGuard)
  @Post("welcome")
  welcomePost(@Body() dto: AdvisorWelcomeDto, @CurrentUser() user?: { id: string }) {
    return this.advisor.welcome(dto.firstName?.slice(0, 40), user?.id);
  }

  @Public()
  @UseGuards(OptionalJwtGuard)
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @Post("chat")
  chat(@Body() dto: AdvisorChatDto, @CurrentUser() user?: { id: string }) {
    return this.advisor.chat({ ...dto, userId: user?.id });
  }

  /** إشارات التعلّم — مجهولة الهوية تماماً. */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post("feedback")
  feedback(@Body() dto: AdvisorFeedbackDto) {
    return this.advisor.feedback(dto);
  }
}

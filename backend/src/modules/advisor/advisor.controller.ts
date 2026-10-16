import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { Public } from "../../common/decorators/public.decorator";
import { AdvisorService } from "./advisor.service";
import { AdvisorState } from "./engine/types";

class AdvisorChatDto {
  @IsOptional() @IsString() @MaxLength(600) message?: string;
  @IsOptional() @IsString() @MaxLength(600) action?: string;
  @IsOptional() @IsObject() state?: AdvisorState;
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

  @Public()
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @Post("chat")
  chat(@Body() dto: AdvisorChatDto) {
    return this.advisor.chat(dto);
  }
}

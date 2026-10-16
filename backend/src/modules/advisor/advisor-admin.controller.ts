import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AdvisorTrainingService } from "./advisor-training.service";
import { AdvisorService } from "./advisor.service";

class TrainingSettingsDto {
  @IsOptional() @IsBoolean() running?: boolean;
  @IsOptional() @IsBoolean() liveAi?: boolean;
  @IsOptional() @IsBoolean() autoNew?: boolean;
}

class TryDto {
  @IsString() message!: string;
}

/** لوحة «تدريب ديما» — للإدارة فقط. */
@ApiTags("advisor-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller("advisor/admin")
export class AdvisorAdminController {
  constructor(
    private readonly training: AdvisorTrainingService,
    private readonly advisor: AdvisorService,
  ) {}

  @Get("training")
  status() {
    return this.training.status();
  }

  @Patch("training")
  update(@Body() dto: TrainingSettingsDto) {
    return this.training.update(dto);
  }

  @Post("training/start")
  start() {
    return this.training.update({ running: true });
  }

  @Post("training/stop")
  stop() {
    return this.training.update({ running: false });
  }

  /** تدريب الآن (في الخلفية — النتيجة تظهر في الحالة خلال دقائق). */
  @Post("training/run")
  run() {
    void this.training.train("admin");
    return { started: true };
  }

  @Get("phrases")
  phrases(@Query("source") source?: string, @Query("q") q?: string) {
    return this.training.phrases(source || undefined, q || undefined);
  }

  @Delete("phrases/:id")
  deletePhrase(@Param("id") id: string) {
    return this.training.deletePhrase(id);
  }

  @Post("try")
  tryMessage(@Body() body: TryDto) {
    return this.training.tryMessage(body.message);
  }

  @Get("questions")
  questions() {
    return this.training.questions();
  }

  /** إعادة بناء فهرس «ديما» الآن (بعد تعديلات كثيرة مثلاً). */
  @Post("rebuild")
  async rebuild() {
    const idx = await this.advisor.rebuild();
    return { products: idx.products.length, brands: idx.brands.length };
  }
}

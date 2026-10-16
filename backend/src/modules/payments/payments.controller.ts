import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import type { FastifyReply } from "fastify";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PaymentsService } from "./payments.service";

class AbandonDto {
  @IsOptional() @IsString() transactionId?: string;
}

class RefundDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) amount?: number;
  @IsOptional() @IsString() @MaxLength(200) reason?: string;
}

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ------------------------------------------------------------ عام

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("methods")
  methods(@CurrentUser() user: any) {
    return this.payments.methods(user?.id);
  }

  /** إشعارات بوابة كي كارد — يجب أن ترد 200 دائماً وإلا تكرر البوابة الإرسال. */
  @Public()
  @Post("qi/webhook")
  @HttpCode(200)
  webhook(@Body() body: Record<string, unknown>, @Headers("x-signature") signature?: string) {
    return this.payments.handleWebhook(body ?? {}, signature);
  }

  /** صفحة الإنهاء (finishPaymentUrl) — للمتصفح فقط؛ التأكيد الحقيقي عبر الإشعار. */
  @Public()
  @Get("qi/finish")
  finish(@Res() reply: FastifyReply) {
    reply.type("text/html; charset=utf-8").send(FINISH_HTML);
  }

  // ------------------------------------------------------------ الزبونة

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  @Post("orders/:orderId/start")
  start(@Param("orderId") orderId: string, @CurrentUser() user: any) {
    return this.payments.startForOrder(user.id, orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  @Post("orders/:orderId/confirm")
  confirm(@Param("orderId") orderId: string, @CurrentUser() user: any) {
    return this.payments.confirmForOrder(user.id, orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  @Post("orders/:orderId/abandon")
  abandon(
    @Param("orderId") orderId: string,
    @Body() dto: AbandonDto,
    @CurrentUser() user: any,
  ) {
    return this.payments.abandon(user.id, orderId, dto.transactionId);
  }

  // ------------------------------------------------------------ الإدارة

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get("admin/orders/:orderId")
  adminDetails(@Param("orderId") orderId: string) {
    return this.payments.adminDetails(orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Post("admin/orders/:orderId/sync")
  adminSync(@Param("orderId") orderId: string) {
    return this.payments.adminSync(orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("admin/orders/:orderId/refund")
  adminRefund(
    @Param("orderId") orderId: string,
    @Body() dto: RefundDto,
    @CurrentUser() user: any,
  ) {
    return this.payments.adminRefund(orderId, user.id, dto.amount, dto.reason);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("admin/orders/:orderId/cancel")
  adminCancel(@Param("orderId") orderId: string, @CurrentUser() user: any) {
    return this.payments.adminCancel(orderId, user.id);
  }
}

const FINISH_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ديما الحياة — الدفع</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#FFFAFB;color:#3B2650;font-family:-apple-system,"Segoe UI",Tahoma,sans-serif}
  .card{max-width:360px;margin:24px;padding:32px 24px;text-align:center;background:#fff;
    border-radius:24px;box-shadow:0 18px 40px rgba(138,85,201,.14)}
  .dot{width:64px;height:64px;margin:0 auto 18px;border-radius:50%;
    background:linear-gradient(135deg,#8A55C9,#C2508A)}
  h1{font-size:20px;margin:0 0 8px} p{margin:0;color:#6b5a7a;line-height:1.7;font-size:15px}
</style>
</head>
<body><div class="card"><div class="dot"></div>
<h1>انتهت عملية الدفع</h1>
<p>يمكنك العودة إلى تطبيق ديما الحياة لمتابعة طلبك.<br>ستصلك رسالة تأكيد فور اعتماد الدفعة.</p>
</div></body></html>`;

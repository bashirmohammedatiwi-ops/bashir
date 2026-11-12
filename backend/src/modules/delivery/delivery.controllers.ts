import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CourierAreaDto, LinkCodeDto, LinkEditDto, LinkInvoiceDto, LinkQueueDto, LinkReturnDto, ShipmentDecisionDto } from "./dto/delivery.dto";
import { OrdersLinkGuard } from "./orders-link.guard";
import { PosLinkService } from "./pos-link.service";
import { ShipmentsService } from "./shipments.service";

type JwtUser = { id?: string; sub?: string } | undefined;
const uid = (u: JwtUser) => (u?.id ?? u?.sub)!;

/** كاشير الطلبات (FOT POS) عبر سيرفر المحل — طلبات موقّعة فقط، كلها POST. */
@ApiTags("pos-link")
@Public()
@SkipThrottle()
@UseGuards(OrdersLinkGuard)
@Controller("pos-link")
export class PosLinkController {
  constructor(private readonly link: PosLinkService) {}

  @Post("ping")
  @HttpCode(200)
  ping() {
    return this.link.ping();
  }

  @Post("orders/queue")
  @HttpCode(200)
  queue(@Body() _dto: LinkQueueDto) {
    return this.link.queue();
  }

  @Post("orders/lookup")
  @HttpCode(200)
  lookup(@Body() dto: LinkCodeDto) {
    return this.link.lookup(dto.code);
  }

  /** إضافة صنف بالباركود أو تغيير كمية سطر من الكاشير — يرد بالطلب محدّثاً (نفس شكل lookup). */
  @Post("orders/edit")
  @HttpCode(200)
  edit(@Body() dto: LinkEditDto) {
    return this.link.edit(dto.code, dto);
  }

  /** ملصق هاي إكسبريس نفسه (PDF base64) — كاشير الطلبات يطبعه على طابعة الملصقات. */
  @Post("orders/label")
  @HttpCode(200)
  label(@Body() dto: LinkCodeDto) {
    return this.link.label(dto.code);
  }

  @Post("orders/invoice")
  @HttpCode(200)
  invoice(@Body() dto: LinkInvoiceDto) {
    return this.link.invoice(dto.code, dto);
  }

  @Post("orders/print-data")
  @HttpCode(200)
  printData(@Body() dto: LinkCodeDto) {
    return this.link.printData(dto.code);
  }

  @Post("orders/pickup-handover")
  @HttpCode(200)
  pickup(@Body() dto: LinkInvoiceDto) {
    return this.link.pickupHandover(dto.code, dto);
  }

  @Post("orders/return")
  @HttpCode(200)
  returnReceipt(@Body() dto: LinkReturnDto) {
    return this.link.returnReceipt(dto.code, dto);
  }
}

/** استقبال حالات هاي إكسبريس. الرابط يحمل كلمة سر؛ الرسالة تُتحقق بسؤالهم قبل أي تغيير. */
@ApiTags("webhooks")
@Public()
@SkipThrottle()
@Controller("webhooks/hi-express")
export class HiExpressWebhookController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Post(":secret")
  @HttpCode(200)
  receive(@Param("secret") secret: string, @Body() body: Record<string, unknown>) {
    if (!this.shipments.checkSecret(secret)) throw new NotFoundException();
    // نرد فوراً ونعالج في الخلفية (هم يعيدون الإرسال عند التأخر).
    setImmediate(() => void this.shipments.handleWebhook(body));
    return { ok: true };
  }
}

/** إدارة الشحن من لوحة الإدارة وتطبيق المدير. */
@ApiTags("couriers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@Controller("control")
export class CouriersController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get("orders/:id/shipment")
  shipment(@Param("id") id: string) {
    return this.shipments.forOrder(id);
  }

  @Get("orders/:id/shipment/label")
  label(@Param("id") id: string) {
    return this.shipments.label(id);
  }

  @Post("orders/:id/shipment/refresh")
  refresh(@Param("id") id: string) {
    return this.shipments.refreshOrder(id);
  }

  @Post("orders/:id/shipment/retry")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  retry(@Param("id") id: string, @CurrentUser() u: JwtUser) {
    return this.shipments.retry(id, uid(u));
  }

  @Post("orders/:id/shipment/cancel")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  cancel(@Param("id") id: string, @CurrentUser() u: JwtUser) {
    return this.shipments.cancelShipment(id, uid(u));
  }

  @Post("orders/:id/shipment/decision")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  decision(@Param("id") id: string, @Body() dto: ShipmentDecisionDto, @CurrentUser() u: JwtUser) {
    return this.shipments.decision(id, uid(u), dto.decision, dto.note);
  }

  @Get("couriers/hi-express/areas")
  areas() {
    return this.shipments.areas();
  }

  @Put("couriers/hi-express/areas")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  setArea(@Body() dto: CourierAreaDto) {
    return this.shipments.setArea(dto.governorate, dto.governanceId ?? null, dto.area ?? "", dto.cityId ?? null);
  }

  @Get("couriers/hi-express/health")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  health() {
    return this.shipments.health();
  }

  @Post("couriers/hi-express/webhook/register")
  @Roles(Role.SUPER_ADMIN)
  registerWebhook() {
    return this.shipments.registerWebhook(process.env.PUBLIC_API_BASE_URL || "https://deemaalhayat.com/api/v1");
  }

  @Post("couriers/hi-express/poll")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async poll() {
    await this.shipments.poll();
    return this.shipments.health();
  }
}

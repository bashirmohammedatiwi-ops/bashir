import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { BarcodeDraftsService } from "./barcode-drafts.service";
import { ControlCatalogService } from "./control-catalog.service";
import { ControlCustomersService } from "./control-customers.service";
import { ControlInsightsService } from "./control-insights.service";
import { ControlOrdersService } from "./control-orders.service";
import { ControlImagesService } from "./control-images.service";
import { ControlService } from "./control.service";
import {
  ControlAddShadeDto,
  CustomerActiveDto,
  StockCountCreateDto,
  StockCountLineDto,
  StockCountScanDto,
  CustomerPointsDto,
  CustomersQueryDto,
  ControlCreateProductDto,
  ControlImagesAddDto,
  ControlOrdersQueryDto,
  ControlOrderStatusDto,
  PosMissingQueryDto,
  ProductsBulkDto,
  ControlImagesSetDto,
  ControlProductPatchDto,
  ControlSearchDto,
  ControlShadePatchDto,
  ControlShadesBulkDto,
  DraftDto,
  DraftGroupDto,
  DraftsDeleteDto,
  DraftsMoveDto,
  DraftsQueryDto,
  ImageEditDto,
  ImagesBatchFrameDto,
  VisualSearchDto,
} from "./dto/control.dto";
import { ControlWebService } from "./control-web.service";

type Actor = { id?: string; sub?: string } | undefined;
const actorId = (u: Actor) => u?.id ?? u?.sub;

/** تطبيق المدير + «مركز التحكم» في لوحة التحكم — كل المسارات للموظفين فقط. */
@ApiTags("control")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@Controller("control")
export class ControlController {
  constructor(
    private readonly control: ControlService,
    private readonly images: ControlImagesService,
    private readonly drafts: BarcodeDraftsService,
    private readonly catalog: ControlCatalogService,
    private readonly ordersSvc: ControlOrdersService,
    private readonly customers: ControlCustomersService,
    private readonly insights: ControlInsightsService,
    private readonly web: ControlWebService,
  ) {}

  // ---------------- web images & visual search

  /** صور من الويب مثل Google Images — صفحات متتالية بلا حد. */
  @Get("web-images")
  webImages(@Query("q") q?: string, @Query("page") page?: string) {
    return this.web.images(q ?? "", Number(page) || 0);
  }

  /** صوّر المنتج: نتعرف عليه، نبحث عنه في المتجر، ونجلب صوره من الويب. */
  @Post("visual-search")
  visualSearch(@Body() dto: VisualSearchDto) {
    return this.web.visual(dto.image, dto.hint);
  }

  // ---------------- stock counts (جرد)

  @Get("counts")
  counts() {
    return this.insights.counts();
  }

  @Post("counts")
  createCount(@Body() dto: StockCountCreateDto, @CurrentUser() user: Actor) {
    return this.insights.createCount(dto, actorId(user));
  }

  @Get("counts/:id")
  count(@Param("id") id: string) {
    return this.insights.count(id);
  }

  @Post("counts/:id/scan")
  countScan(@Param("id") id: string, @Body() dto: StockCountScanDto) {
    return this.insights.scan(id, dto.barcode, dto.qty ?? 1);
  }

  @Patch("counts/:id/lines/:lineId")
  countLine(@Param("id") id: string, @Param("lineId") lineId: string, @Body() dto: StockCountLineDto) {
    return this.insights.setLine(id, lineId, dto.counted);
  }

  @Delete("counts/:id/lines/:lineId")
  countLineDelete(@Param("id") id: string, @Param("lineId") lineId: string) {
    return this.insights.deleteLine(id, lineId);
  }

  @Post("counts/:id/close")
  countClose(@Param("id") id: string, @Body() body: { reopen?: boolean }, @CurrentUser() user: Actor) {
    return this.insights.closeCount(id, body?.reopen === true, actorId(user));
  }

  @Delete("counts/:id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  countDelete(@Param("id") id: string) {
    return this.insights.deleteCount(id);
  }

  // ---------------- demand, reports, staff

  @Get("demand")
  demand() {
    return this.insights.demand();
  }

  @Get("reports")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  report(@Query("days") days?: string) {
    return this.insights.report(Number(days) || 30);
  }

  @Get("banners")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  banners() {
    return this.insights.banners();
  }

  @Get("staff")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  staff() {
    return this.insights.staff();
  }

  @Get("staff/:id/activity")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  staffActivity(@Param("id") id: string) {
    return this.insights.staffActivity(id);
  }

  @Patch("staff/:id/active")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  staffActive(@Param("id") id: string, @Body() dto: CustomerActiveDto, @CurrentUser() user: Actor) {
    return this.insights.setStaffActive(id, dto.isActive, actorId(user));
  }

  // ---------------- customers & store health

  @Get("health")
  health() {
    return this.customers.health();
  }

  @Get("customers")
  customersList(@Query() q: CustomersQueryDto) {
    return this.customers.list(q);
  }

  @Get("customers/:id")
  customer(@Param("id") id: string) {
    return this.customers.detail(id);
  }

  /** الحظر وتعديل النقاط للمدير فقط. */
  @Patch("customers/:id/active")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  customerActive(@Param("id") id: string, @Body() dto: CustomerActiveDto, @CurrentUser() user: Actor) {
    return this.customers.setActive(id, dto.isActive, actorId(user));
  }

  @Post("customers/:id/points")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  customerPoints(@Param("id") id: string, @Body() dto: CustomerPointsDto, @CurrentUser() user: Actor) {
    return this.customers.adjustPoints(id, dto.points, dto.reason ?? "", actorId(user));
  }

  // ---------------- orders & sales

  @Get("orders")
  orders(@Query() q: ControlOrdersQueryDto) {
    return this.ordersSvc.list(q);
  }

  @Get("orders/pulse")
  pulse() {
    return this.ordersSvc.pulse();
  }

  @Get("orders/:id")
  order(@Param("id") id: string) {
    return this.ordersSvc.detail(id);
  }

  @Patch("orders/:id/status")
  orderStatus(@Param("id") id: string, @Body() dto: ControlOrderStatusDto, @CurrentUser() user: Actor) {
    return this.ordersSvc.setStatus(id, dto, actorId(user));
  }

  /** الأرقام المالية للمدير فقط (لا الموظف). */
  @Get("sales")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  sales() {
    return this.ordersSvc.sales();
  }

  // ---------------- catalog

  @Get("categories")
  categories() {
    return this.catalog.categories();
  }

  @Get("pos-missing")
  posMissing(@Query() q: PosMissingQueryDto) {
    return this.catalog.posMissing(q);
  }

  @Post("products")
  createProduct(@Body() dto: ControlCreateProductDto, @CurrentUser() user: Actor) {
    return this.catalog.createProduct(dto, actorId(user));
  }

  @Post("products/bulk")
  bulkProducts(@Body() dto: ProductsBulkDto, @CurrentUser() user: Actor) {
    return this.catalog.bulkProducts(dto.ids, dto.isActive ?? true, actorId(user));
  }

  @Post("products/:id/shades")
  addShade(@Param("id") id: string, @Body() dto: ControlAddShadeDto, @CurrentUser() user: Actor) {
    return this.catalog.addShade(id, dto, actorId(user));
  }

  @Delete("shades/:id")
  deleteShade(@Param("id") id: string, @CurrentUser() user: Actor) {
    return this.catalog.deleteShade(id, actorId(user));
  }

  @Get("stats")
  stats() {
    return this.control.stats();
  }

  @Get("brands")
  brands() {
    return this.control.brands();
  }

  @Get("activity")
  activity(@Query("limit") limit?: string) {
    return this.control.activity(Number(limit) || 40);
  }

  @Get("search")
  search(@Query() q: ControlSearchDto) {
    return this.control.search(q);
  }

  @Get("lookup")
  lookup(@Query("code") code: string) {
    return this.control.lookup(code ?? "");
  }

  // ---------------- products & shades

  @Get("products/:id")
  product(@Param("id") id: string) {
    return this.control.detail(id);
  }

  @Patch("products/:id")
  patchProduct(@Param("id") id: string, @Body() dto: ControlProductPatchDto, @CurrentUser() user: Actor) {
    return this.control.patchProduct(id, dto, actorId(user));
  }

  @Patch("shades/:id")
  patchShade(@Param("id") id: string, @Body() dto: ControlShadePatchDto, @CurrentUser() user: Actor) {
    return this.control.patchShade(id, dto, actorId(user));
  }

  @Post("products/:id/shades/bulk")
  bulkShades(@Param("id") id: string, @Body() dto: ControlShadesBulkDto, @CurrentUser() user: Actor) {
    return this.control.bulkShades(id, dto, actorId(user));
  }

  // ---------------- images

  @Post("products/:id/images")
  addImages(@Param("id") id: string, @Body() dto: ControlImagesAddDto, @CurrentUser() user: Actor) {
    return this.images.add(id, dto.mediaIds, dto.at, actorId(user));
  }

  @Put("products/:id/images")
  setImages(@Param("id") id: string, @Body() dto: ControlImagesSetDto, @CurrentUser() user: Actor) {
    return this.images.set(id, dto.mediaIds, actorId(user));
  }

  @Delete("products/:id/images/:mediaId")
  removeImage(@Param("id") id: string, @Param("mediaId") mediaId: string, @CurrentUser() user: Actor) {
    return this.images.remove(id, mediaId, actorId(user));
  }

  @Post("products/:id/images/replace")
  replaceImage(@Param("id") id: string, @Body() body: { from: string; to: string }, @CurrentUser() user: Actor) {
    return this.images.replace(id, String(body?.from ?? ""), String(body?.to ?? ""), actorId(user));
  }

  @Post("products/:id/images/frame")
  frameAll(@Param("id") id: string, @Body() dto: ImagesBatchFrameDto, @CurrentUser() user: Actor) {
    return this.images.batchFrame(id, dto, actorId(user));
  }

  @Post("media/:mediaId/edit")
  editImage(@Param("mediaId") mediaId: string, @Body() dto: ImageEditDto, @CurrentUser() user: Actor) {
    return this.images.edit(mediaId, dto, actorId(user));
  }

  // ---------------- barcode drafts

  @Get("draft-groups")
  groups(@Query("archived") archived?: string) {
    return this.drafts.groups(archived === "1" || archived === "true");
  }

  @Post("draft-groups")
  createGroup(@Body() dto: DraftGroupDto, @CurrentUser() user: Actor) {
    return this.drafts.createGroup(dto, actorId(user));
  }

  @Post("draft-groups/reorder")
  reorderGroups(@Body() body: { ids: string[] }) {
    return this.drafts.reorderGroups(Array.isArray(body?.ids) ? body.ids.map(String) : []);
  }

  @Patch("draft-groups/:id")
  updateGroup(@Param("id") id: string, @Body() dto: DraftGroupDto) {
    return this.drafts.updateGroup(id, dto);
  }

  @Delete("draft-groups/:id")
  deleteGroup(@Param("id") id: string) {
    return this.drafts.deleteGroup(id);
  }

  @Get("drafts")
  listDrafts(@Query() q: DraftsQueryDto) {
    return this.drafts.list(q);
  }

  @Post("drafts")
  createDraft(@Body() dto: DraftDto, @CurrentUser() user: Actor) {
    return this.drafts.create(dto, actorId(user));
  }

  @Post("drafts/move")
  moveDrafts(@Body() dto: DraftsMoveDto) {
    return this.drafts.move(dto.ids, dto.groupId);
  }

  @Post("drafts/delete")
  deleteDrafts(@Body() dto: DraftsDeleteDto) {
    return this.drafts.remove(dto.ids);
  }

  @Get("drafts/:id")
  draft(@Param("id") id: string) {
    return this.drafts.one(id);
  }

  @Patch("drafts/:id")
  updateDraft(@Param("id") id: string, @Body() dto: DraftDto) {
    return this.drafts.update(id, dto);
  }

  @Delete("drafts/:id")
  deleteDraft(@Param("id") id: string) {
    return this.drafts.remove([id]);
  }
}

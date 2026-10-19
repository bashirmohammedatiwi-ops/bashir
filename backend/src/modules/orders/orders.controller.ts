import {
  Body,
  NotFoundException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from "./dto/order.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.CUSTOMER)
  list(@Query() q: QueryOrdersDto, @CurrentUser() user: any) {
    if (!isStaff(user)) {
      q.userId = user.id;
    }
    return this.orders.list(q);
  }

  @Get(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.CUSTOMER)
  async one(@Param("id") id: string, @CurrentUser() user: any) {
    const order = await this.orders.findOne(id);
    assertOwnerOrStaff(order.userId, user);
    return order;
  }

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.orders.create(user.id, dto);
  }

  @Patch(":id/status")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  update(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: any) {
    return this.orders.updateStatus(id, dto, user.id);
  }

  @Patch(":id/cancel")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CUSTOMER)
  async cancel(@Param("id") id: string, @CurrentUser() user: any) {
    const order = await this.orders.findOne(id);
    assertOwnerOrStaff(order.userId, user);
    // الزبونة تلغي قبل بدء التجهيز فقط؛ الإدارة تلغي أي طلب لم يُلغَ.
    return this.orders.cancel(id, { id: user.id, staff: isStaff(user) });
  }
}

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

function isStaff(user: any): boolean {
  return STAFF_ROLES.includes(user?.role);
}

/** الزبونة ترى وتلغي طلباتها فقط؛ الإدارة ترى الكل. */
function assertOwnerOrStaff(ownerId: string, user: any) {
  if (!isStaff(user) && ownerId !== user?.id) throw new NotFoundException("Order not found");
}

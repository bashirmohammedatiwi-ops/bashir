import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateStaffDto, QueryUsersDto, SetPasswordDto, UpdateUserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() q: QueryUsersDto) {
    return this.users.list(q);
  }

  /** إنشاء حساب موظف (تطبيق تجهيز الطلبات / تطبيق المدير). */
  @Post("staff")
  createStaff(@Body() dto: CreateStaffDto, @CurrentUser() me: { id: string; role: Role }) {
    return this.users.createStaff(dto, me);
  }

  @Post(":id/password")
  setPassword(@Param("id") id: string, @Body() dto: SetPasswordDto, @CurrentUser() me: { id: string; role: Role }) {
    return this.users.setPassword(id, dto, me);
  }

  @Get(":id")
  one(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }
}

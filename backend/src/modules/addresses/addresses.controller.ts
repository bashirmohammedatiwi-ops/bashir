import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AddressesService } from "./addresses.service";

/**
 * عنوان من التطبيق أو الموقع. عند التعديل: الحقل الغائب يبقى كما هو،
 * و null صراحةً يمسح الحقول الاختيارية (المنطقة، الشارع، الدار، الملاحظات) — IsOptional يقبل null.
 * كل مفتاح يرسله أي تطبيق مُعرَّف هنا: الحقل غير المعرّف يُرفض (forbidNonWhitelisted).
 */
export class AddressInputDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string | null;
  /** اسم قديم لـ fullName. */
  @IsOptional() @IsString() @MaxLength(120) name?: string | null;
  @IsOptional() @IsString() @MaxLength(40) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(120) city?: string | null;
  @IsOptional() @IsString() @MaxLength(120) governorate?: string | null;
  @IsOptional() @IsString() @MaxLength(120) area?: string | null;
  @IsOptional() @IsString() @MaxLength(500) street?: string | null;
  @IsOptional() @IsString() @MaxLength(120) house?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string | null;
  /** يرسله التطبيق مع التعديل (null غالباً) — لا عمود له: الشارع يحمل أقرب نقطة دالة. */
  @IsOptional() @IsString() @MaxLength(500) landmark?: string | null;
  @IsOptional() @IsBoolean() isDefault?: boolean | null;
}

@ApiTags("addresses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("addresses")
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  list(@CurrentUser() user: any, @Query("userId") userId?: string) {
    const uid = [Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF].includes(user.role)
      ? (userId ?? user.id)
      : user.id;
    return this.addresses.listForUser(uid);
  }

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@CurrentUser() user: any, @Body() data: AddressInputDto) {
    return this.addresses.create(user.id, data);
  }

  @Patch(":id")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  update(@CurrentUser() user: any, @Param("id") id: string, @Body() data: AddressInputDto) {
    return this.addresses.update(user.id, id, data);
  }

  @Delete(":id")
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.addresses.remove(user.id, id);
  }
}

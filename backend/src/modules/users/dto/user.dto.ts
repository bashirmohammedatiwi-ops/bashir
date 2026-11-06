import { Type, Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from "class-validator";
import { Role } from "@prisma/client";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { IraqiPhoneConstraint } from "../../auth/dto/auth.dto";

export class QueryUsersDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : value))
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) loyaltyPoints?: number;
}

/** حساب موظف تنشئه الإدارة مباشرة (تطبيق تجهيز الطلبات / تطبيق المدير). */
export class CreateStaffDto {
  @IsString({ message: "الاسم مطلوب" })
  @MinLength(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
  @MaxLength(80)
  name: string;

  @IsString({ message: "رقم الهاتف مطلوب" })
  @Validate(IraqiPhoneConstraint)
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: "أدخل بريداً إلكترونياً صحيحاً" })
  email?: string;

  @IsString({ message: "كلمة المرور مطلوبة" })
  @MinLength(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsIn([Role.STAFF, Role.ADMIN], { message: "الدور يجب أن يكون موظفاً أو مديراً" })
  role?: Role;
}

export class SetPasswordDto {
  @IsString({ message: "كلمة المرور مطلوبة" })
  @MinLength(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
  @MaxLength(72)
  password: string;
}

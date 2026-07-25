import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isValidIraqiPhone } from "../../../common/phone.util";

@ValidatorConstraint({ name: "iraqiPhone", async: false })
class IraqiPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return typeof value === "string" && isValidIraqiPhone(value);
  }

  defaultMessage() {
    return "أدخل رقماً عراقياً صحيحاً (مثال: 07701234567)";
  }
}

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: "أدخل بريداً إلكترونياً صحيحاً" })
  email?: string;

  @IsString({ message: "الاسم مطلوب" })
  @MinLength(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
  name: string;

  @IsString({ message: "كلمة المرور مطلوبة" })
  @MinLength(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
  password: string;

  @IsString({ message: "رقم الهاتف مطلوب" })
  @Validate(IraqiPhoneConstraint)
  phone: string;
}

export class LoginDto {
  @ValidateIf((o: LoginDto) => !o.phone?.trim())
  @IsEmail({}, { message: "أدخل بريداً إلكترونياً صحيحاً" })
  email?: string;

  @ValidateIf((o: LoginDto) => !o.email?.trim())
  @IsString({ message: "رقم الهاتف مطلوب" })
  @Validate(IraqiPhoneConstraint)
  phone?: string;

  @IsString({ message: "كلمة المرور مطلوبة" })
  @MinLength(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
  password: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() birthday?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

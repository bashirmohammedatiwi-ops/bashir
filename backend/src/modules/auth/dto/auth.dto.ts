import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "أدخل بريداً إلكترونياً صحيحاً" })
  email: string;

  @IsString({ message: "الاسم مطلوب" })
  @MinLength(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
  name: string;

  @IsString({ message: "كلمة المرور مطلوبة" })
  @MinLength(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
  password: string;

  @IsOptional()
  @IsString({ message: "رقم الهاتف غير صالح" })
  phone?: string;
}

export class LoginDto {
  @IsEmail({}, { message: "أدخل بريداً إلكترونياً صحيحاً" })
  email: string;

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

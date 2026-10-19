import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class QueryReviewsDto extends PaginationDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : value))
  @IsBoolean()
  approved?: boolean;
}

export class UpdateReviewDto {
  @IsBoolean() approved: boolean;
}

/**
 * تقييم الزبونة: نجوم من 1 إلى 5 (التطبيق يسمح بنصف نجمة فتُقبل الخطوة 0.5)،
 * والاسم المعروض دائماً اسم حسابها — لا يُقبل اسم يرسله العميل.
 */
export class CreateReviewDto {
  @IsString() productId: string;
  @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(1) @Max(5) rating: number;
  @IsString() @MaxLength(1000) comment: string;
}

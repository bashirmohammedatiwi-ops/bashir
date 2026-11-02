import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

/** مفاتيح الرفوف الشخصية في واجهة العالم — نفس أسماء HomeSlotKind في التطبيق. */
export const HOME_SHELF_KEYS = [
  "cart",
  "coupons",
  "buyAgain",
  "continueShopping",
  "needs",
  "routine",
  "wishlist",
  "brands",
  "budget",
  "promise",
  "gift",
] as const;
export type HomeShelfKey = (typeof HOME_SHELF_KEYS)[number];

/** إعداد الرفوف الشخصية: إخفاء بعضها، وبعد كم قسم تبدأ، وكل كم قسم رفّ. */
export class HomeShelvesDto {
  @IsOptional() @IsArray() @IsIn(HOME_SHELF_KEYS, { each: true }) hide?: HomeShelfKey[];
  @IsOptional() @IsInt() @Min(0) @Max(30) startAfter?: number;
  @IsOptional() @IsInt() @Min(1) @Max(6) every?: number;
}

export class UpdateWorldDto {
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() taglineAr?: string;
  @IsOptional() @IsString() taglineEn?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsString() canvasColor?: string;
  @IsOptional() @IsString() inkColor?: string;
  @IsOptional() @IsString() surfaceColor?: string;
  @IsOptional() @IsInt() position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() coverImageId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) bannerIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) galleryMediaIds?: string[];
  /** نطاقات «تسوّقي حسب ميزانيتكِ» لهذا العالم (حتى 4) — مصفوفة فارغة تعيد الافتراضي. */
  @IsOptional() @IsArray() budgetTiers?: { min?: number | null; max?: number | null }[];
  /** الرفوف الشخصية في واجهة العالم — null أو {} يعيد الافتراضي. */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HomeShelvesDto)
  homeShelves?: HomeShelvesDto | null;
}

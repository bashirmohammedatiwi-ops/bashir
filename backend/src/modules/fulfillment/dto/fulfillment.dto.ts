import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class PickStartDto {
  /** نقل التجهيز من موظف آخر — للمدير فقط. */
  @IsOptional() @IsBoolean() takeover?: boolean;
}

export class PickScanDto {
  @IsString() @MaxLength(80) barcode: string;
  /** +1 مسحة، −1 حذف قطعة. */
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([1, -1]) qty?: number;
  /** معرّف فريد من الجهاز: إعادة الإرسال بعد انقطاع لا تُحسب مرتين. */
  @IsOptional() @IsString() @MaxLength(64) clientScanId?: string;
  @IsOptional() @IsString() @MaxLength(80) device?: string;
}

export class PickExtraDto {
  @IsString() @MaxLength(80) barcode: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) qty?: number;
  @IsIn(["PAID", "FREE"]) charge: "PAID" | "FREE";
  /** بديل لصنف ناقص، طلب العميل هاتفياً، هدية، عينة... */
  @IsOptional() @IsString() @MaxLength(200) reason?: string;
  /** سطر الطلب الناقص الذي يحل محله. */
  @IsOptional() @IsString() @MaxLength(64) substituteForLineId?: string;
  @IsOptional() @IsString() @MaxLength(64) clientScanId?: string;
  @IsOptional() @IsString() @MaxLength(80) device?: string;
}

export class PickLinePatchDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500) pickedQty?: number;
  @IsOptional() @IsString() @MaxLength(200) reason?: string;
  @IsOptional() @IsIn(["PAID", "FREE"]) charge?: "PAID" | "FREE";
  /** أُكّد بلا مسح (منتج بلا باركود): يعتبر السطر مكتملاً. */
  @IsOptional() @IsBoolean() manualConfirm?: boolean;
  @IsOptional() @IsString() @MaxLength(64) substituteForLineId?: string | null;
}

export class PickShortReasonDto {
  @IsString() @MaxLength(64) lineId: string;
  @IsString() @MaxLength(200) reason: string;
}

export class PickFinishDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) parcelCount?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => PickShortReasonDto)
  reasons?: PickShortReasonDto[];
}

export class PickReopenDto {
  @IsString() @MaxLength(300) reason: string;
}

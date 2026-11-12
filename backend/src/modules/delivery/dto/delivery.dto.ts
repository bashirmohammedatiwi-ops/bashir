import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";

export class LinkCodeDto {
  /** رمز الطلب (ORD-…) أو معرّفه. */
  @IsString() @MaxLength(80) code: string;
}

export class LinkQueueDto {
  @IsOptional() @IsString() @MaxLength(40) scope?: string;
}

export class LinkInvoiceDto {
  @IsString() @MaxLength(80) code: string;
  @IsString() @MaxLength(80) clientReceiptId: string;
  @IsString() @MaxLength(60) receiptNumber: string;
  @IsString() @MaxLength(80) cashierName: string;
  @IsOptional() @IsString() @MaxLength(64) cashierId?: string;
  @IsOptional() @IsString() @MaxLength(80) terminal?: string;
  /** مجموع الإيصال كما طُبع — يجب أن يساوي مبلغ الطلب النهائي. */
  @Type(() => Number) @IsNumber() total: number;
}

export class LinkReturnLineDto {
  @IsString() @MaxLength(80) barcode: string;
  @Type(() => Number) @IsInt() @Min(1) qty: number;
}

export class LinkReturnDto {
  @IsString() @MaxLength(80) code: string;
  @IsString() @MaxLength(80) clientReceiptId: string;
  @IsString() @MaxLength(60) receiptNumber: string;
  @IsString() @MaxLength(80) cashierName: string;
  @IsOptional() @IsString() @MaxLength(64) cashierId?: string;
  @IsOptional() @IsString() @MaxLength(80) terminal?: string;
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => LinkReturnLineDto) lines: LinkReturnLineDto[];
}

/** «كاشير الطلبات» يضيف صنفاً بالباركود أو يغيّر كمية سطر قبل الفوترة. */
export class LinkEditDto {
  @IsString() @MaxLength(80) code: string;
  @IsIn(["add", "set", "discount"]) op: "add" | "set" | "discount";
  /** discount: الخصم اليدوي بالدينار (0 = إلغاء). */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) amount?: number;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) qty?: number;
  @IsOptional() @IsIn(["PAID", "FREE"]) charge?: "PAID" | "FREE";
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
  @IsOptional() @IsString() @MaxLength(200) posName?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) posPrice?: number;
  @IsOptional() @IsString() @MaxLength(64) lineId?: string;
  @IsOptional() @IsString() @MaxLength(80) clientEditId?: string;
  @IsString() @MaxLength(80) cashierName: string;
  @IsOptional() @IsString() @MaxLength(64) cashierId?: string;
  @IsOptional() @IsBoolean() allowInvoiced?: boolean;
}

/** خيارات التوصيل للطلب من الكاشير (نوع الشحنة عند هاي إكسبريس، الطرود، ملاحظة، هاتف ثانٍ). */
export class LinkCourierOptionsDto {
  @IsString() @MaxLength(80) code: string;
  /** null = الافتراضي من الإعدادات، 0 = بلا نوع، 1–4 أنواع هاي إكسبريس. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) typeId?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) parcelCount?: number | null;
  @IsOptional() @IsString() @MaxLength(300) note?: string | null;
  @IsOptional() @IsString() @MaxLength(40) phone2?: string | null;
  @IsString() @MaxLength(80) cashierName: string;
  @IsOptional() @IsString() @MaxLength(64) cashierId?: string;
}

export class ShipmentDecisionDto {
  @IsIn(["resend", "approve", "return"]) decision: "resend" | "approve" | "return";
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class CourierAreaDto {
  @IsString() @MaxLength(80) governorate: string;
  @IsOptional() @Type(() => Number) @IsInt() governanceId?: number | null;
  @IsOptional() @IsString() @MaxLength(80) area?: string;
  @IsOptional() @Type(() => Number) @IsInt() cityId?: number | null;
}

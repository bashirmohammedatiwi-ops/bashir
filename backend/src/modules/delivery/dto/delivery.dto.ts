import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";

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

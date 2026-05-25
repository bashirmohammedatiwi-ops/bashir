import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateShippingZoneDto {
  @IsString() @IsNotEmpty() governorate: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) standardFee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateShippingZoneDto extends CreateShippingZoneDto {}

export class CreateShippingAreaDto {
  @IsUUID() zoneId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) fee?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateShippingAreaDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) fee?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ShippingQuoteDto {
  @IsOptional() @IsString() governorate?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) subtotal?: number;
  @IsOptional() @IsString() deliveryOption?: string;
}

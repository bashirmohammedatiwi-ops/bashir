import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateShippingZoneDto {
  @IsString() @IsNotEmpty() governorate: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) standardFee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) expressFee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateShippingZoneDto extends CreateShippingZoneDto {}

export class ShippingQuoteDto {
  @IsOptional() @IsString() governorate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) subtotal?: number;
  @IsOptional() @IsString() deliveryOption?: string;
}

import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateProductOfferDto {
  @IsString() @MaxLength(200) name!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(90) discountPercent!: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsArray() @ArrayMaxSize(5000) @IsString({ each: true }) barcodes!: string[];
}

export class UpdateProductOfferDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(90) discountPercent?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(5000) @IsString({ each: true }) barcodes?: string[];
}

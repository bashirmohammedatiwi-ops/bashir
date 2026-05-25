import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PackageKind } from "@prisma/client";

export class CreatePackageDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsEnum(PackageKind) kind?: PackageKind;
  @IsOptional() @IsString() subtitle?: string;
  @Type(() => Number) @IsInt() @Min(0) price: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) originalPrice?: number;
  @IsOptional() @IsString() badge?: string;
  @IsOptional() @IsString() coverImageId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) productIds?: string[];
}

export class UpdatePackageDto extends CreatePackageDto {}

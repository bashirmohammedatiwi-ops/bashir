import { Type, Transform } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class ProductShadeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() colorHex: string;
  @IsOptional() @IsString() colorHexEnd?: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class ProductVariantDto {
  @IsString() @IsNotEmpty() label: string;
  @IsOptional() @IsString() sizeLabel?: string;
  @IsOptional() @Type(() => Number) @IsInt() priceDelta?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class CreateProductDto {
  @IsString() @IsNotEmpty() sku: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() slug: string;
  @IsString() @IsNotEmpty() brandId: string;
  @IsString() @IsNotEmpty() categoryId: string;

  @IsOptional() @IsString() subcategoryId?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() ingredients?: string;
  @IsOptional() @IsString() howToUse?: string;

  @Type(() => Number) @IsInt() @Min(0) price: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) originalPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) discountPercent?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) pointsEarned?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5) rating?: number;

  @IsOptional() @IsBoolean() isNew?: boolean;
  @IsOptional() @IsBoolean() isBestSeller?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isPromo?: boolean;
  @IsOptional() @IsBoolean() isBogo?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) skinType?: string[];

  @IsOptional() @IsArray() @IsString({ each: true }) imageIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductShadeDto)
  shades?: ProductShadeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto extends CreateProductDto {}

export class QueryProductsDto extends PaginationDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subcategoryId?: string;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isNew?: boolean;
  @IsOptional() @IsBoolean() isBestSeller?: boolean;
  @IsOptional() @IsBoolean() isPromo?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) minRating?: number;
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  inStock?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  lite?: boolean;
}

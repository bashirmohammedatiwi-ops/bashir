import { Type, Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class AiQuickImportShadeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^#?[0-9A-Fa-f]{3,8}$/)
  colorHex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[0-9A-Za-z\-]+$/)
  barcode?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}

/**
 * One-shot product create for bots / scripts.
 * Accepts public image URLs (product + shades); server uploads them then creates the product.
 * Defaults to isActive=false so items stay off the storefront until review.
 */
export class AiQuickImportDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/^[0-9A-Za-z\-]+$/)
  barcode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  brandId?: string;

  /** Match existing brand by Arabic/English name when brandId omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tertiaryCategoryIds?: string[];

  /** Comma/Arabic-comma separated labels when IDs unknown. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subcategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tertiary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descriptionEn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map((v: unknown) => String(v ?? "").trim()).filter(Boolean))]
      : [],
  )
  @IsArray()
  @ArrayMaxSize(12)
  @IsUrl({ require_tld: false }, { each: true })
  imageUrls!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => AiQuickImportShadeDto)
  shades?: AiQuickImportShadeDto[];

  /** Default false — keep off storefront. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === 1 || value === "1")
  @IsBoolean()
  isActive?: boolean;
}

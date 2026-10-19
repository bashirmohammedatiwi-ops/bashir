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
  MaxLength,
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
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) originalPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) discountPercent?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  /** فارغ = يبقى كما كان (يُطابق بالباركود ثم الاسم) — الواجهات القديمة لا تُعيد تشغيل تدرج موقوف. */
  @IsOptional() @IsBoolean() isActive?: boolean;
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
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsString() @IsNotEmpty() slug: string;
  @IsString() @IsNotEmpty() brandId: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional() @IsString() subcategoryId?: string;
  @IsOptional() @IsString() tertiaryCategoryId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) subcategoryIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tertiaryCategoryIds?: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionAr?: string;
  @IsOptional() @IsString() descriptionEn?: string;
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
  @IsOptional() @IsArray() @IsString({ each: true }) concernIds?: string[];

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

export class UpdateProductDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional() @IsString() subcategoryId?: string;
  @IsOptional() @IsString() tertiaryCategoryId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) subcategoryIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tertiaryCategoryIds?: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionAr?: string;
  @IsOptional() @IsString() descriptionEn?: string;
  @IsOptional() @IsString() ingredients?: string;
  @IsOptional() @IsString() howToUse?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
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
  @IsOptional() @IsArray() @IsString({ each: true }) concernIds?: string[];

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

export class QueryProductsDto extends PaginationDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subcategoryId?: string;
  @IsOptional() @IsString() tertiaryCategoryId?: string;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() concernId?: string;
  @IsOptional() @IsString() concernSlug?: string;
  /** نوع البشرة (dry | oily | combination | normal | sensitive، أو اسمه العربي «جافة»…) — منتجات وُسمت به. */
  @IsOptional() @IsString() skinType?: string;
  @IsOptional() @IsString() status?: string;

  /** نطاق «عالم» بالـ slug: منتجات أقسامه المرتبطة فقط (كما تظهر في رئيسية العالم). */
  @IsOptional() @IsString() @MaxLength(80) world?: string;
  /** اسم بديل لـ `world`. */
  @IsOptional() @IsString() @MaxLength(80) worldSlug?: string;

  /**
   * منتجات بعينها: معرّفات مفصولة بفواصل (يُؤخذ أول 50) — لرفوف «مختاراتنا» و«تابعي التسوق».
   * المعرّفات تحدد المجموعة، فتُهمَل معها شارات التسويق (isBestSeller…) والعالم، وتبقى فلاتر التنقية
   * (السعر، البراند، المتوفر…) وقواعد ظهور المتجر. الترتيب الافتراضي بترتيب المعرّفات نفسه.
   */
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value.join(",") : value))
  @IsString()
  @MaxLength(4000)
  ids?: string;

  /** خصم لا يقل عن هذه النسبة (شرائح العروض: 10% / 30% / 50%…). 0 أو فارغ = شريحة «الكل» بلا تضييق. */
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === "0" || value === 0 ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  minDiscount?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  isFeatured?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  isNew?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  isBestSeller?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  isPromo?: boolean;

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

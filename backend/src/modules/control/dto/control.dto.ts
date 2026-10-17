import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === "true" || value === "1" ? true : value === false || value === "false" || value === "0" ? false : value;

export class ControlSearchDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  /** all | active | inactive */
  @IsOptional() @IsIn(["all", "active", "inactive"]) status?: "all" | "active" | "inactive";
  /** فلاتر سريعة: بلا صور، فيه تدرج موقوف، نافد، بلا باركود */
  @IsOptional() @IsIn(["noImages", "shadesOff", "outOfStock", "noBarcode", "lowStock", "hasStock", "ready", "noCategory", "noDescription"]) filter?: string;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) limit: number = 30;
}

export class ControlProductPatchDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(300) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(300) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(20000) descriptionAr?: string;
  @IsOptional() @IsString() @MaxLength(20000) descriptionEn?: string;
  @IsOptional() @IsString() @MaxLength(20000) howToUse?: string;
  @IsOptional() @IsString() @MaxLength(20000) ingredients?: string;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
  @IsOptional() @IsBoolean() isNew?: boolean;
  @IsOptional() @IsBoolean() isBestSeller?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) subcategoryIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tertiaryCategoryIds?: string[];
}

export class ControlShadePatchDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(9) colorHex?: string;
  /** "" أو null لإزالة الصورة */
  @IsOptional() @IsString() imageMediaId?: string | null;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
}

export class ControlShadesBulkDto {
  @IsBoolean() isActive: boolean;
  /** فارغ = كل تدرجات المنتج */
  @IsOptional() @IsArray() @ArrayMaxSize(500) @IsString({ each: true }) ids?: string[];
}

export class ControlImagesSetDto {
  /** الترتيب الكامل الجديد — الأولى غلاف. ما لا يرد هنا يُفصل عن المنتج. */
  @IsArray() @ArrayMaxSize(60) @IsString({ each: true }) mediaIds: string[];
}

export class ControlImagesAddDto {
  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) mediaIds: string[];
  /** start = تصبح الغلاف */
  @IsOptional() @IsIn(["start", "end"]) at?: "start" | "end";
}

export class CropRectDto {
  @Type(() => Number) @IsNumber() @Min(0) @Max(1) x: number;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1) y: number;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(1) w: number;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(1) h: number;
}

export class ImageEditDto {
  /** crop = قص يدوي، trim = إزالة الحواف الفارغة، square = إطار مربع أبيض حول المنتج */
  @IsIn(["crop", "trim", "square", "trimSquare"]) mode: "crop" | "trim" | "square" | "trimSquare";
  @IsOptional() @ValidateNested() @Type(() => CropRectDto) rect?: CropRectDto;
  @IsOptional() @Type(() => Number) @IsIn([0, 90, 180, 270]) rotate?: number;
  @IsOptional() @Transform(toBool) @IsBoolean() flipH?: boolean;
  /** هامش الإطار كنسبة من الضلع (0–0.3) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(0.3) padding?: number;
  /** نسبة المخرج بعد القص اليدوي: free | 1:1 | 4:5 | 3:4 — تُطبق كإطار أبيض إن لزم */
  @IsOptional() @IsIn(["free", "1:1", "4:5", "3:4"]) aspect?: string;
  /** استبدال الصورة في هذا المنتج (نفس الموضع) */
  @IsOptional() @IsString() productId?: string;
  /** أو استبدال صورة هذا التدرج */
  @IsOptional() @IsString() shadeId?: string;
}

export class ImagesBatchFrameDto {
  @IsIn(["trim", "square", "trimSquare"]) mode: "trim" | "square" | "trimSquare";
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(0.3) padding?: number;
  /** يشمل صور التدرجات أيضاً */
  @IsOptional() @IsBoolean() includeShades?: boolean;
}

export class DraftGroupDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsIn(["rose", "violet", "gold", "mint", "sky", "coral", "slate"]) color?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsBoolean() isArchived?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class DraftDto {
  @IsOptional() @IsString() groupId?: string;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
  @IsOptional() @IsString() @MaxLength(300) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) imageIds?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) quantity?: number | null;
}

export class DraftsQueryDto {
  @IsOptional() @IsString() groupId?: string;
  /** pending | added | all */
  @IsOptional() @IsIn(["pending", "added", "all"]) status?: "pending" | "added" | "all";
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit: number = 60;
}

export class DraftsMoveDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true }) ids: string[];
  @IsString() groupId: string;
}

export class DraftsDeleteDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true }) ids: string[];
}

export class ControlCreateProductDto {
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
  @IsOptional() @IsString() @MaxLength(300) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(300) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(20000) descriptionAr?: string;
  @IsOptional() @IsString() @MaxLength(20000) descriptionEn?: string;
  /** براند موجود، أو اسم براند جديد يُنشأ تلقائياً */
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() @MaxLength(120) brandName?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) subcategoryIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tertiaryCategoryIds?: string[];
  /** صور مرفوعة مسبقاً (من الهاتف أو من المسودة) */
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) imageIds?: string[];
  /** روابط صور من الويب/المتاجر — يرفعها السيرفر */
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) imageUrls?: string[];
  /** السعر إن لم يكن الباركود في الكاشير */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  /** المسودة التي جاء منها (تُعلَّم «أُضيف» فوراً) */
  @IsOptional() @IsString() draftId?: string;
}

export class ControlAddShadeDto {
  @IsString() @MaxLength(160) name: string;
  @IsOptional() @IsString() @MaxLength(9) colorHex?: string;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
  @IsOptional() @IsString() imageMediaId?: string;
  @IsOptional() @IsString() @MaxLength(2000) imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ControlOrdersQueryDto {
  @IsOptional() @IsIn(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "open"]) status?: string;
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) limit: number = 30;
}

export class ControlOrderStatusDto {
  @IsIn(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]) status: string;
  @IsOptional() @IsIn(["PENDING", "PAID", "FAILED", "REFUNDED"]) paymentStatus?: string;
}

export class PosMissingQueryDto {
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  /** hide = إخفاء المحفوظ في مسودة */
  @IsOptional() @IsIn(["all", "unsaved"]) saved?: "all" | "unsaved";
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 40;
}

export class ProductsBulkDto {
  @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) ids: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CustomersQueryDto {
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  @IsOptional() @IsIn(["recent", "spent", "orders"]) sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) limit: number = 30;
}

export class CustomerPointsDto {
  @Type(() => Number) @IsInt() @Min(-1000000) @Max(1000000) points: number;
  @IsOptional() @IsString() @MaxLength(120) reason?: string;
}

export class CustomerActiveDto {
  @IsBoolean() isActive: boolean;
}

export class StockCountCreateDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsString() @MaxLength(64) brandId?: string;
  @IsOptional() @IsString() @MaxLength(64) categoryId?: string;
}

export class StockCountScanDto {
  @IsString() @MaxLength(80) barcode: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(-10000) @Max(10000) qty?: number;
}

export class StockCountLineDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) counted: number;
}

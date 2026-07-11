import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

function roundInt({ value }: { value: unknown }) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : value;
}

export class InventorySyncItemDto {
  @IsString()
  @IsNotEmpty()
  barcode!: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  productNum?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @Transform(roundInt)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Transform(roundInt)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice!: number;

  @IsOptional()
  @Transform(roundInt)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @Transform(roundInt)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  offerName?: string;
}

export class BulkInventorySyncDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventorySyncItemDto)
  items!: InventorySyncItemDto[];
}

export class LookupBarcodesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  barcodes!: string[];
}

import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class RecordPosSyncRunDto {
  @IsOptional() @Type(() => Boolean) @IsBoolean() manual?: boolean;
  @IsOptional() @Type(() => Boolean) @IsBoolean() ok?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) totalItems?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) changedItems?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) syncedItems?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) failedItems?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skippedItems?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationMs?: number;
  @IsOptional() @IsString() errorMessage?: string;
  @IsOptional() @IsString() sourceHost?: string;
}

export class QueryStockAlertsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
  @IsOptional() @IsString() status?: "low" | "out" | "all";
  @IsOptional() @IsString() search?: string;
}

export class QueryPosSyncRunsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class SendStockAlertDto {
  @IsString() @IsNotEmpty() barcode!: string;
  @IsString() alertType!: "RESTOCK" | "LOW_STOCK";
}

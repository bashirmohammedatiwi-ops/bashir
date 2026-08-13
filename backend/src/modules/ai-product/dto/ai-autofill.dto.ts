import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

/** Client-facing model ids. Add-app uses Composer 2.5 (Cursor API) for bilingual names only. */
export const AI_MODEL_CHOICES = [
  "composer-2.5-low",
  "composer-2.5-fast",
  "composer-2.5",
  "gpt-5.6-luna-low",
  "gpt-5.6-luna-medium",
  "gpt-5.4-nano",
  "gpt-5.4-mini",
] as const;

export type AiModelChoice = (typeof AI_MODEL_CHOICES)[number];

export class AiAutofillDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/^[0-9A-Za-z\-]+$/)
  barcode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn([
    ...AI_MODEL_CHOICES,
    "luna-low",
    "luna-medium",
    "luna-med",
    "composer-low",
    "composer-fast",
  ])
  model?: string;

  /** When true, run AI even if barcode already exists (correction / review mode). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === 1 || value === "1")
  @IsBoolean()
  force?: boolean;
}

export class AiImagesDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/^[0-9A-Za-z\-]+$/)
  barcode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  nameHint?: string;

  /** barcode = بحث بالباركود ، name = بحث بالاسم مثل Google */
  @IsOptional()
  @IsString()
  @IsIn(["barcode", "name"])
  mode?: "barcode" | "name";

  @IsOptional()
  @IsString()
  @MaxLength(240)
  query?: string;
}

/** Identify a makeup shade family from multiple scanned EANs. */
export class AiShadeFamilyDto {
  @Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map((v: unknown) => String(v ?? "").trim()).filter(Boolean))]
      : [],
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @Matches(/^[0-9A-Za-z\-]{6,32}$/, { each: true })
  barcodes!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn([
    ...AI_MODEL_CHOICES,
    "luna-low",
    "luna-medium",
    "luna-med",
    "composer-low",
    "composer-fast",
  ])
  model?: string;
}

export class AiGlobalShadeEnrichDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MinLength(6, { each: true })
  @MaxLength(32, { each: true })
  @Matches(/^[0-9A-Za-z\-]{6,32}$/, { each: true })
  barcodes!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hint?: string;
}

export class AiReviewExistingDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/^[0-9A-Za-z\-]+$/)
  barcode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn([
    ...AI_MODEL_CHOICES,
    "luna-low",
    "luna-medium",
    "luna-med",
    "composer-low",
    "composer-fast",
  ])
  model?: string;
}

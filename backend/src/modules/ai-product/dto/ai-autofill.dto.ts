import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

/** Client-facing model ids (Cursor-style). Server maps them to OpenAI API models. */
export const AI_MODEL_CHOICES = [
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
  @IsIn([...AI_MODEL_CHOICES, "luna-low", "luna-medium", "luna-med"])
  model?: string;
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
}

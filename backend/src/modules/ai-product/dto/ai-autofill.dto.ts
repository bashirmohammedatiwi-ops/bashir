import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

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
}

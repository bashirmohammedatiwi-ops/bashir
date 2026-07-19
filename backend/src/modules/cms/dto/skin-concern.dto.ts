import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateSkinConcernDto {
  @IsString() @IsNotEmpty() slug: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateSkinConcernDto extends CreateSkinConcernDto {}

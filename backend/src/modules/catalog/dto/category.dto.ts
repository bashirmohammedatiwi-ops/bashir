import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() slug: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCategoryDto extends CreateCategoryDto {}

export class CreateSubcategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() slug: string;
  @IsString() @IsNotEmpty() parentId: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateSubcategoryDto extends CreateSubcategoryDto {}

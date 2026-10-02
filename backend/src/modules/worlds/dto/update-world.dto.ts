import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateWorldDto {
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() taglineAr?: string;
  @IsOptional() @IsString() taglineEn?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsString() canvasColor?: string;
  @IsOptional() @IsString() inkColor?: string;
  @IsOptional() @IsString() surfaceColor?: string;
  @IsOptional() @IsInt() position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() coverImageId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) bannerIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) galleryMediaIds?: string[];
}

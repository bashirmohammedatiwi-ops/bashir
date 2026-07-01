import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateBannerDto {
  @IsString() @IsNotEmpty() title: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() ctaLabel?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsString() linkType?: string;
  @IsOptional() @IsString() linkValue?: string;
  @IsOptional() @IsString() discountText?: string;
  @IsOptional() @IsString() backgroundColor?: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

export class UpdateBannerDto extends CreateBannerDto {}

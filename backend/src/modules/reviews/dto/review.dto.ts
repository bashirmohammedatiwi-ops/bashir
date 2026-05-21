import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class QueryReviewsDto extends PaginationDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : value))
  @IsBoolean()
  approved?: boolean;
}

export class UpdateReviewDto {
  @IsBoolean() approved: boolean;
}

export class CreateReviewDto {
  @IsString() productId: string;
  @IsNumber() rating: number;
  @IsString() comment: string;
  @IsOptional() @IsString() userName?: string;
}

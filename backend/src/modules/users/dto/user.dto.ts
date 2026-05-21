import { Type, Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Role } from "@prisma/client";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class QueryUsersDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : value))
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) loyaltyPoints?: number;
}

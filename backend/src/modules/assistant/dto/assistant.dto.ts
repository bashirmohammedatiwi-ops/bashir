import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class ScreenContextDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;
}

export class CartItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  shadeId?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class ChatRequestDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsString()
  @Length(1, 2000)
  message!: string;

  /** Anonymous device key generated client-side (uuid) for guest continuity. */
  @IsOptional()
  @IsString()
  @Length(8, 64)
  guestKey?: string;

  @IsOptional()
  @IsBoolean()
  debug?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScreenContextDto)
  screen?: ScreenContextDto;

  /** Client cart snapshot — context for suggestions, never mutated. */
  @IsOptional()
  @ValidateNested()
  @Type(() => CartItemDto)
  cart?: CartItemDto[];
}

export class FeedbackRequestDto {
  @IsInt()
  @IsIn([1, -1])
  value!: number;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  note?: string;
}

import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { OrderStatus, PaymentMethod, PaymentStatus, DeliveryOption } from "@prisma/client";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class OrderItemInputDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsOptional() @IsString() variantId?: string;
  @IsOptional() @IsString() shadeId?: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
}

export class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @IsOptional() @IsEnum(DeliveryOption) deliveryOption?: DeliveryOption;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) loyaltySpent?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
}

export class QueryOrdersDto extends PaginationDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() lite?: boolean;
  @IsOptional() @Type(() => Boolean) @IsBoolean() preview?: boolean;
}

import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
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

/** باقة في السلة: سعرها الخاص يُطبَّق إن وُجدت كل منتجاتها بالكمية الكافية. */
export class OrderPackageInputDto {
  @IsString() @IsNotEmpty() packageId: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
}

export class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OrderPackageInputDto)
  packages?: OrderPackageInputDto[];

  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isGift?: boolean;
  @IsOptional() @IsString() giftMessage?: string;
  @IsOptional() @IsBoolean() giftHidePrices?: boolean;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @IsOptional() @IsEnum(DeliveryOption) deliveryOption?: DeliveryOption;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) loyaltySpent?: number;
  /** مفتاح محاولة الإتمام من التطبيق: نفس المفتاح بعد انقطاع الاتصال يعيد الطلب نفسه بدل إنشاء طلب ثانٍ. */
  @IsOptional() @IsString() @MaxLength(64) clientRef?: string;
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

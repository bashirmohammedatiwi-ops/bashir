import { NotificationLinkType, NotificationTargetType, NotificationType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator";

export class RegisterDeviceDto {
  @IsString() @IsNotEmpty() token: string;
  @IsOptional() @IsString() platform?: string;
}

export class UnregisterDeviceDto {
  @IsString() @IsNotEmpty() token: string;
}

export class SendNotificationDto {
  @IsOptional() @IsEnum(NotificationType) type?: NotificationType;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() body: string;

  @IsOptional() @IsEnum(NotificationTargetType) targetType?: NotificationTargetType;
  @ValidateIf((o) => o.targetType === NotificationTargetType.USER)
  @IsUUID() userId?: string;

  @IsOptional() @IsEnum(NotificationLinkType) linkType?: NotificationLinkType;
  @ValidateIf((o) => o.linkType && o.linkType !== NotificationLinkType.NONE && o.linkType !== NotificationLinkType.EXTERNAL_URL)
  @IsUUID() linkId?: string;
  @ValidateIf((o) => o.linkType === NotificationLinkType.EXTERNAL_URL)
  @IsString() externalUrl?: string;

  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() sendPush?: boolean;
  @IsOptional() data?: Record<string, string>;
}

export class CreateNotificationDto extends SendNotificationDto {}

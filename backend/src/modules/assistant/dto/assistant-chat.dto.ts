import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class AssistantHistoryItemDto {
  @IsIn(["user", "assistant"])
  role!: "user" | "assistant";

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class AssistantChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsIn(["ar", "en"])
  lang?: "ar" | "en";

  @IsOptional()
  @IsBoolean()
  voice?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => AssistantHistoryItemDto)
  history?: AssistantHistoryItemDto[];
}

export class AssistantFeedbackDto {
  @IsIn([1, -1])
  rating!: 1 | -1;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class AssistantTapDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  productId!: string;
}

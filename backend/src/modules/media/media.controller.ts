import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MediaPurpose, Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { MediaService } from "./media.service";

function readField(fields: Record<string, unknown> | undefined, key: string): string | undefined {
  const raw = fields?.[key];
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    return String((raw as { value: unknown }).value);
  }
  return undefined;
}

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(@Query() q: PaginationDto, @Query("purpose") purpose?: MediaPurpose) {
    return this.media.list(q, purpose);
  }

  @Get(":id")
  one(@Param("id") id: string) {
    return this.media.findOne(id);
  }

  @Post("upload")
  async upload(@Req() req: any, @Body() body: any) {
    if (req.isMultipart?.()) {
      const part = await req.file();
      if (!part) throw new BadRequestException("No file uploaded");
      const buffer = await part.toBuffer();
      const purpose =
        readField(part.fields, "purpose") ??
        readField(body, "purpose");
      const alt = readField(part.fields, "alt") ?? body?.alt;
      return this.media.upload({
        buffer,
        filename: part.filename,
        mime: part.mimetype,
        purpose: (purpose as MediaPurpose) ?? undefined,
        alt,
      });
    }

    if (body?.base64 && body?.mime && body?.filename) {
      const buffer = Buffer.from(body.base64, "base64");
      return this.media.upload({
        buffer,
        filename: body.filename,
        mime: body.mime,
        purpose: body.purpose,
        alt: body.alt,
      });
    }

    throw new BadRequestException("Invalid upload payload");
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.media.remove(id);
  }
}

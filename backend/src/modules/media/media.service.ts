import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import * as path from "path";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import { MediaPurpose, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate, PaginationDto } from "../../common/dto/pagination.dto";
import { IMAGE_VARIANTS, VariantsRecord } from "./media.constants";
import { generateMediaVariants } from "./media-variants.helper";
import { optimizeForStorage } from "./media-optimize.helper";

interface UploadInput {
  buffer: Buffer;
  filename: string;
  mime: string;
  purpose?: MediaPurpose;
  alt?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @InjectQueue("media") private readonly mediaQueue: Queue,
  ) {}

  get mediaRoot(): string {
    return path.resolve(process.env.MEDIA_ROOT ?? "./uploads");
  }

  get publicPrefix(): string {
    return process.env.MEDIA_PUBLIC_PREFIX ?? "/media";
  }

  get publicBaseUrl(): string {
    return process.env.MEDIA_PUBLIC_BASE_URL ?? "/media";
  }

  async list(q: PaginationDto, purpose?: MediaPurpose) {
    const where: Prisma.MediaWhereInput = { purpose };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.media.count({ where }),
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.limit,
      }),
    ]);
    return paginate(items, total, q.page, q.limit);
  }

  async findOne(id: string) {
    const m = await this.prisma.media.findUnique({ where: { id } });
    if (!m) throw new NotFoundException("Media not found");
    return m;
  }

  async upload(input: UploadInput) {
    try {
      let optimized;
      try {
        optimized = await optimizeForStorage(input.buffer);
      } catch (e: any) {
        if (e?.message === "UNREADABLE") {
          throw new BadRequestException("تعذر قراءة ملف الصورة");
        }
        if (e?.message === "CORRUPT") {
          throw new BadRequestException("ملف الصورة تالف أو غير مدعوم");
        }
        throw new BadRequestException("تعذر معالجة الصورة. جرّب حفظها كـ JPG أو PNG");
      }

      const maxMb = Number(process.env.MEDIA_MAX_FILE_SIZE_MB ?? 15);
      if (input.buffer.byteLength > maxMb * 1024 * 1024) {
        throw new BadRequestException(`حجم الملف كبير جداً (الحد ${maxMb}MB)`);
      }

      const hash = crypto
        .createHash("sha1")
        .update(optimized.webpBuffer)
        .update(optimized.jpegBuffer)
        .digest("hex");

      const existing = await this.prisma.media.findUnique({ where: { hash } });
      if (existing) return existing;

      const now = new Date();
      const yyyy = now.getFullYear().toString();
      const mm = (now.getMonth() + 1).toString().padStart(2, "0");
      const purposeDir = (input.purpose ?? MediaPurpose.GENERAL).toLowerCase();
      const subdir = path.join(purposeDir, yyyy, mm);
      const absDir = path.join(this.mediaRoot, subdir);
      await fs.mkdir(absDir, { recursive: true });

      const baseName = hash.slice(0, 16);
      const webpPath = path.join(absDir, `${baseName}.webp`);
      const jpgPath = path.join(absDir, `${baseName}.jpg`);

      await Promise.all([
        fs.writeFile(webpPath, optimized.webpBuffer),
        fs.writeFile(jpgPath, optimized.jpegBuffer),
      ]);

      const publicUrlBase = `${this.publicBaseUrl}/${subdir.replace(/\\/g, "/")}`;
      const initialVariants: Partial<VariantsRecord> = {};
      for (const v of IMAGE_VARIANTS) {
        initialVariants[v.name] = {
          width: v.width,
          formats: {
            webp: `${publicUrlBase}/${baseName}_${v.name}.webp`,
            jpg: `${publicUrlBase}/${baseName}_${v.name}.jpg`,
          },
        };
      }

      const savedBytes = optimized.webpBuffer.byteLength + optimized.jpegBuffer.byteLength;
      this.logger.log(
        `Compressed ${input.filename}: ${(input.buffer.byteLength / 1024).toFixed(0)}KB → ${(savedBytes / 1024).toFixed(0)}KB`,
      );

      const media = await this.prisma.media.create({
        data: {
          purpose: input.purpose ?? MediaPurpose.GENERAL,
          filename: baseName,
          originalName: input.filename,
          mime: "image/webp",
          bytes: savedBytes,
          width: optimized.width,
          height: optimized.height,
          hash,
          storagePath: subdir.replace(/\\/g, "/"),
          publicUrlBase,
          variants: initialVariants as any,
          alt: input.alt,
        },
      });

      const variantJob = {
        mediaId: media.id,
        originalPath: webpPath,
        absDir,
        baseName,
      };

      if (process.env.REDIS_DISABLED === "1") {
        setImmediate(() => {
          generateMediaVariants(this.prisma, variantJob).catch((err) =>
            this.logger.warn(`Variant generation failed for ${media.id}: ${err.message}`),
          );
        });
      } else {
        await this.mediaQueue.add("generate-variants", variantJob, {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        });
      }

      return {
        ...media,
        originalUrl: `${publicUrlBase}/${baseName}.webp`,
        originalUrlJpg: `${publicUrlBase}/${baseName}.jpg`,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Upload failed for ${input.filename}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException("فشل رفع الصورة. تأكد أن الملف صورة صالحة (JPG/PNG/WebP)");
    }
  }

  async remove(id: string) {
    const media = await this.findOne(id);
    const absDir = path.join(this.mediaRoot, media.storagePath);
    try {
      const files = await fs.readdir(absDir);
      await Promise.all(
        files
          .filter((f) => f.startsWith(media.filename))
          .map((f) => fs.unlink(path.join(absDir, f))),
      );
    } catch {
      /* ignore */
    }
    await this.prisma.media.delete({ where: { id } });
    return { success: true };
  }
}

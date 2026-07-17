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
import { VariantsRecord } from "./media.constants";
import { AVIF_VARIANT_NAMES } from "./media-optimize.helper";
import { generateMediaVariants } from "./media-variants.helper";
import { optimizeForStorage } from "./media-optimize.helper";
import { assertSafeRemoteUrl } from "./media-url.helper";

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
      const maxMb = Number(process.env.MEDIA_MAX_FILE_SIZE_MB ?? 15);
      if (input.buffer.byteLength > maxMb * 1024 * 1024) {
        throw new BadRequestException(`حجم الملف كبير جداً (الحد ${maxMb}MB)`);
      }

      let optimized;
      try {
        optimized = await optimizeForStorage(input.buffer);
      } catch (e: any) {
        if (e?.message === "UNREADABLE") {
          throw new BadRequestException(
            "تعذر قراءة ملف الصورة. الصيغ المدعومة: JPG, PNG, WebP, AVIF, HEIC",
          );
        }
        if (e?.message === "CORRUPT") {
          throw new BadRequestException("ملف الصورة تالف أو غير مدعوم");
        }
        throw new BadRequestException(
          "تعذر معالجة الصورة. جرّب حفظها كـ JPG أو PNG (صور iPhone بصيغة HEIC مدعومة إن أمكن)",
        );
      }

      const hash = crypto
        .createHash("sha1")
        .update(optimized.webpBuffer)
        .update(optimized.jpegBuffer)
        .digest("hex");

      const existing = await this.prisma.media.findUnique({ where: { hash } });
      if (existing) {
        return {
          ...existing,
          originalUrl: `${existing.publicUrlBase}/${existing.filename}.webp`,
          originalUrlJpg: `${existing.publicUrlBase}/${existing.filename}.jpg`,
        };
      }

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
      const thumbWebpPath = path.join(absDir, `${baseName}_thumb.webp`);
      const thumbAvifPath = path.join(absDir, `${baseName}_thumb.avif`);

      // Write originals + thumb immediately so admin/mobile never hit missing URLs
      const writes: Promise<void>[] = [
        fs.writeFile(webpPath, optimized.webpBuffer),
        fs.writeFile(jpgPath, optimized.jpegBuffer),
        fs.writeFile(thumbWebpPath, optimized.thumbWebpBuffer),
      ];
      if (optimized.thumbAvifBuffer.byteLength > 0) {
        writes.push(fs.writeFile(thumbAvifPath, optimized.thumbAvifBuffer));
      }
      await Promise.all(writes);

      const publicUrlBase = `${this.publicBaseUrl}/${subdir.replace(/\\/g, "/")}`;
      // Only advertise variants that already exist on disk (thumb). Rest filled async.
      const thumbFormats: Record<string, string> = {
        webp: `${publicUrlBase}/${baseName}_thumb.webp`,
      };
      if (optimized.thumbAvifBuffer.byteLength > 0 && AVIF_VARIANT_NAMES.has("thumb")) {
        thumbFormats.avif = `${publicUrlBase}/${baseName}_thumb.avif`;
      }
      const initialVariants: Partial<VariantsRecord> = {
        thumb: { width: 320, formats: thumbFormats },
      };

      const savedBytes =
        optimized.webpBuffer.byteLength +
        optimized.jpegBuffer.byteLength +
        optimized.thumbWebpBuffer.byteLength +
        optimized.thumbAvifBuffer.byteLength;
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
        // Generate variants from JPEG to avoid WebP→WebP double compression
        originalPath: jpgPath,
        absDir,
        baseName,
        skipThumb: true,
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

  /** Fetch a remote catalog image, then store with the same compression pipeline as multipart upload. */
  async uploadFromUrl(url: string, purpose?: MediaPurpose, alt?: string) {
    const safeUrl = assertSafeRemoteUrl(url);
    const timeoutMs = Number(process.env.MEDIA_FETCH_TIMEOUT_MS ?? 90_000);
    const maxBytes = Number(process.env.MEDIA_MAX_FILE_SIZE_MB ?? 15) * 1024 * 1024;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(safeUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent": "Alhayaa-MediaFetcher/1.0",
        },
      });

      if (!res.ok) {
        throw new BadRequestException(`تعذّر تحميل الصورة (${res.status})`);
      }

      const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
      if (!contentType.startsWith("image/")) {
        throw new BadRequestException("الرابط لا يشير إلى صورة صالحة");
      }

      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength > maxBytes) {
        throw new BadRequestException(
          `حجم الصورة كبير جداً (الحد ${process.env.MEDIA_MAX_FILE_SIZE_MB ?? 15}MB)`,
        );
      }
      if (arrayBuffer.byteLength < 64) {
        throw new BadRequestException("ملف الصورة فارغ أو تالف");
      }

      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : contentType.includes("gif")
            ? "gif"
            : "jpg";

      return this.upload({
        buffer: Buffer.from(arrayBuffer),
        filename: `catalog-import-${Date.now()}.${ext}`,
        mime: contentType,
        purpose: purpose ?? MediaPurpose.PRODUCT,
        alt,
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const name = error instanceof Error ? error.name : "";
      if (name === "AbortError") {
        throw new BadRequestException("انتهت مهلة تحميل الصورة من الكتالوج");
      }
      this.logger.warn(`uploadFromUrl failed for ${safeUrl}: ${error instanceof Error ? error.message : error}`);
      throw new BadRequestException("تعذّر تحميل الصورة من الكتالوج");
    } finally {
      clearTimeout(timer);
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

import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
import { isPlaceholderMedia } from "../../common/product-placeholder.util";
import { PrismaService } from "../../common/prisma.service";
import { MediaService } from "../media/media.service";
import { ControlService } from "./control.service";
import { ImageEditDto, ImagesBatchFrameDto } from "./dto/control.dto";

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 255, g: 255, b: 255, alpha: 0 };
const ASPECTS: Record<string, number> = { "1:1": 1, "4:5": 4 / 5, "3:4": 3 / 4 };

type EditMode = ImageEditDto["mode"];

@Injectable()
export class ControlImagesService {
  private readonly logger = new Logger(ControlImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly control: ControlService,
  ) {}

  // ------------------------------------------------------------ product gallery

  /** إضافة صور (مرفوعة مسبقاً عبر /media/upload). at=start تجعل الأولى غلافاً. */
  async add(productId: string, mediaIds: string[], at: "start" | "end" = "end", actorId?: string) {
    const current = await this.galleryIds(productId);
    const fresh = await this.existingMediaIds(mediaIds);
    const merged = at === "start" ? [...fresh, ...current] : [...current, ...fresh];
    await this.writeGallery(productId, merged);
    await this.control.touched(productId);
    await this.control.audit(actorId, "images.add", "Product", productId, { mediaIds: fresh, at });
    return this.control.detail(productId);
  }

  /** الترتيب الكامل — الأولى غلاف، وما لا يرد يُفصل عن المنتج. */
  async set(productId: string, mediaIds: string[], actorId?: string) {
    await this.ensureProduct(productId);
    const ids = await this.existingMediaIds(mediaIds);
    await this.writeGallery(productId, ids);
    await this.control.touched(productId);
    await this.control.audit(actorId, "images.set", "Product", productId, { count: ids.length });
    return this.control.detail(productId);
  }

  async remove(productId: string, mediaId: string, actorId?: string) {
    const current = await this.galleryIds(productId);
    if (!current.includes(mediaId)) throw new NotFoundException("الصورة ليست ضمن صور المنتج");
    await this.writeGallery(productId, current.filter((id) => id !== mediaId));
    await this.control.touched(productId);
    await this.control.audit(actorId, "images.remove", "Product", productId, { mediaId });
    return this.control.detail(productId);
  }

  /** استبدال صورة بأخرى في نفس الموضع (التراجع عن القص يستخدم هذا أيضاً). */
  async replace(productId: string, from: string, to: string, actorId?: string) {
    await this.ensureProduct(productId);
    const [target] = await this.existingMediaIds([to]);
    if (!target) throw new BadRequestException("الصورة الجديدة غير موجودة");
    await this.swapInProduct(productId, from, target);
    await this.control.touched(productId);
    await this.control.audit(actorId, "images.replace", "Product", productId, { from, to });
    return this.control.detail(productId);
  }

  // ------------------------------------------------------------ editing

  /**
   * قص/تدوير/إطار على السيرفر من الملف الأصلي بدقته الكاملة، ثم تُحفظ صورة جديدة
   * وتستبدل القديمة في المنتج أو التدرج. القديمة تبقى في المكتبة (للتراجع).
   */
  async edit(mediaId: string, dto: ImageEditDto, actorId?: string) {
    const source = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!source || isPlaceholderMedia(source)) throw new NotFoundException("الصورة غير موجودة");
    if (dto.mode === "crop" && !dto.rect) throw new BadRequestException("حدد منطقة القص");

    const buffer = await this.render(source, dto);
    const created = await this.media.upload({
      buffer,
      filename: `edit-${source.originalName || source.filename}`.replace(/\.[a-z0-9]+$/i, "") + ".webp",
      mime: "image/webp",
      purpose: source.purpose,
      alt: source.alt ?? undefined,
    });
    const unchanged = created.id === source.id;

    let productId: string | undefined = dto.productId;
    if (!unchanged && dto.shadeId) {
      const shade = await this.prisma.productShade.findUnique({ where: { id: dto.shadeId }, select: { productId: true } });
      if (!shade) throw new NotFoundException("التدرج غير موجود");
      await this.prisma.productShade.update({ where: { id: dto.shadeId }, data: { imageId: created.id } });
      productId = shade.productId;
    } else if (!unchanged && dto.productId) {
      await this.swapInProduct(dto.productId, source.id, created.id);
    } else if (dto.shadeId && !productId) {
      productId = (await this.prisma.productShade.findUnique({ where: { id: dto.shadeId }, select: { productId: true } }))?.productId;
    }
    if (productId) {
      await this.control.touched(productId);
      await this.control.audit(actorId, "images.edit", "Product", productId, { from: source.id, to: created.id, mode: dto.mode, shadeId: dto.shadeId });
    }
    return {
      previousMediaId: source.id,
      mediaId: created.id,
      unchanged,
      product: productId ? await this.control.detail(productId) : null,
    };
  }

  /** إطار موحّد لكل صور المنتج دفعة واحدة (إزالة الحواف و/أو مربع أبيض). */
  async batchFrame(productId: string, dto: ImagesBatchFrameDto, actorId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { position: "asc" }, include: { media: true } },
        shades: { select: { id: true, imageId: true, image: true } },
      },
    });
    if (!product) throw new NotFoundException("المنتج غير موجود");
    const done: Array<{ from: string; to: string }> = [];
    let unchanged = 0;
    let failed = 0;
    const swaps = new Map<string, string>();

    const jobs = product.images.filter((img) => !isPlaceholderMedia(img.media)).map((img) => img.media);
    if (dto.includeShades) {
      for (const s of product.shades) if (s.image && !jobs.some((m) => m.id === s.image!.id)) jobs.push(s.image);
    }
    for (const source of jobs) {
      try {
        // صورة مؤطّرة مسبقاً بنفس الإعداد → لا نعيد ضغطها (يبقى الزر آمناً للتكرار)
        if (await this.alreadyFramed(source, dto.mode, dto.padding)) {
          unchanged += 1;
          continue;
        }
        const buffer = await this.render(source, { mode: dto.mode, padding: dto.padding });
        const created = await this.media.upload({
          buffer,
          filename: `frame-${source.originalName || source.filename}`.replace(/\.[a-z0-9]+$/i, "") + ".webp",
          mime: "image/webp",
          purpose: source.purpose,
        });
        if (created.id === source.id) {
          unchanged += 1;
          continue;
        }
        swaps.set(source.id, created.id);
        done.push({ from: source.id, to: created.id });
      } catch (err) {
        failed += 1;
        this.logger.warn(`batch frame failed for ${source.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
    for (const [from, to] of swaps) await this.swapInProduct(productId, from, to);
    if (done.length) {
      await this.control.touched(productId);
      await this.control.audit(actorId, "images.batchFrame", "Product", productId, { mode: dto.mode, count: done.length });
    }
    return { changed: done.length, unchanged, failed, swaps: done, product: await this.control.detail(productId) };
  }

  /** المخرج WebP بلا فقد — أصغر بكثير من PNG فلا يتجاوز حد الرفع، ثم يُضغط كالمعتاد عند الحفظ. */
  private async render(source: { storagePath: string; filename: string }, dto: Partial<ImageEditDto> & { mode: EditMode }) {
    const out = await this.renderPng(source, dto);
    return sharp(out).webp({ lossless: true, effort: 2 }).toBuffer();
  }

  private async renderPng(source: { storagePath: string; filename: string }, dto: Partial<ImageEditDto> & { mode: EditMode }) {
    const input = await this.readOriginal(source);
    let img = sharp(input, { failOn: "none" }).rotate(); // EXIF
    if (dto.rotate) img = img.rotate(dto.rotate);
    if (dto.flipH) img = img.flop();
    let buf = await img.png().toBuffer();
    let meta = await sharp(buf).metadata();
    const hasAlpha = !!meta.hasAlpha;
    const bg = hasAlpha ? CLEAR : WHITE;

    if (dto.mode === "crop" && dto.rect) {
      const W = meta.width ?? 0;
      const H = meta.height ?? 0;
      const left = clamp(Math.round(dto.rect.x * W), 0, W - 1);
      const top = clamp(Math.round(dto.rect.y * H), 0, H - 1);
      const width = clamp(Math.round(dto.rect.w * W), 1, W - left);
      const height = clamp(Math.round(dto.rect.h * H), 1, H - top);
      buf = await sharp(buf).extract({ left, top, width, height }).png().toBuffer();
      const ratio = dto.aspect ? ASPECTS[dto.aspect] : undefined;
      if (ratio) buf = await padToRatio(buf, ratio, 0, bg);
      return buf;
    }

    if (dto.mode === "trim" || dto.mode === "trimSquare") {
      buf = await trimBorders(buf);
      meta = await sharp(buf).metadata();
    }
    if (dto.mode === "square" || dto.mode === "trimSquare") {
      buf = await padToRatio(buf, 1, dto.padding ?? (dto.mode === "trimSquare" ? 0.06 : 0), bg);
    } else if (dto.padding) {
      buf = await padToRatio(buf, (meta.width ?? 1) / (meta.height ?? 1), dto.padding, bg);
    }
    return buf;
  }

  private async alreadyFramed(source: { storagePath: string; filename: string; width: number; height: number }, mode: EditMode, padding?: number) {
    const square = Math.abs(source.width - source.height) <= Math.max(2, source.width * 0.01);
    if ((mode === "square" || mode === "trimSquare") && !square) return false;
    try {
      const input = await this.readOriginal(source);
      const { info } = await sharp(input, { failOn: "none" }).trim({ threshold: 14 }).toBuffer({ resolveWithObject: true });
      const W = source.width;
      const H = source.height;
      const left = -(info.trimOffsetLeft ?? 0);
      const top = -(info.trimOffsetTop ?? 0);
      const right = W - left - info.width;
      const bottom = H - top - info.height;
      const minMargin = Math.min(left, top, right, bottom) / Math.max(W, H);
      if (mode === "trim") return minMargin <= 0.03;
      const want = padding ?? (mode === "trimSquare" ? 0.06 : 0);
      // الهامش الأصغر قريب من المطلوب (± 2.5%) = مؤطّرة مسبقاً
      return Math.abs(minMargin - want) <= 0.025;
    } catch {
      return false;
    }
  }

  private async readOriginal(source: { storagePath: string; filename: string }) {
    const dir = path.join(this.media.mediaRoot, source.storagePath);
    for (const ext of ["webp", "jpg", "png"]) {
      try {
        return await fs.readFile(path.join(dir, `${source.filename}.${ext}`));
      } catch {
        /* try next */
      }
    }
    throw new NotFoundException("ملف الصورة الأصلي غير موجود على السيرفر");
  }

  // ------------------------------------------------------------ internals

  private async ensureProduct(productId: string) {
    const p = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!p) throw new NotFoundException("المنتج غير موجود");
  }

  /** صور المنتج الحقيقية بالترتيب (بدون الصورة الافتراضية). */
  private async galleryIds(productId: string) {
    await this.ensureProduct(productId);
    const rows = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: "asc" },
      include: { media: { select: { id: true, hash: true, storagePath: true, originalName: true } } },
    });
    return rows.filter((r) => !isPlaceholderMedia(r.media)).map((r) => r.mediaId);
  }

  private async existingMediaIds(ids: string[]) {
    const unique = [...new Set(ids.map((id) => id?.trim()).filter(Boolean))];
    if (!unique.length) return [];
    const rows = await this.prisma.media.findMany({ where: { id: { in: unique } }, select: { id: true, hash: true, storagePath: true, originalName: true } });
    const ok = new Set(rows.filter((m) => !isPlaceholderMedia(m)).map((m) => m.id));
    return unique.filter((id) => ok.has(id));
  }

  private async writeGallery(productId: string, mediaIds: string[]) {
    const ids = [...new Set(mediaIds)];
    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { productId } }),
      this.prisma.productImage.createMany({
        data: ids.map((mediaId, position) => ({ productId, mediaId, position, isPrimary: position === 0 })),
      }),
    ]);
  }

  /** يبدّل صورة في معرض المنتج وفي أي تدرج للمنتج نفسه يستخدمها. */
  private async swapInProduct(productId: string, from: string, to: string) {
    if (from === to) return;
    const ids = await this.galleryIds(productId);
    if (ids.includes(from)) {
      const next = ids.includes(to) ? ids.filter((id) => id !== from) : ids.map((id) => (id === from ? to : id));
      await this.writeGallery(productId, next);
    }
    await this.prisma.productShade.updateMany({ where: { productId, imageId: from }, data: { imageId: to } });
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), Math.max(min, max));
}

/**
 * إزالة الحواف الفارغة (أبيض أو شفاف أو لون الخلفية الموحّد) مع هامش أمان صغير.
 * إن كانت الصورة كلها خلفية تقريباً نعيدها كما هي.
 */
async function trimBorders(buf: Buffer) {
  try {
    const { data, info } = await sharp(buf).trim({ threshold: 14 }).png().toBuffer({ resolveWithObject: true });
    const meta = await sharp(buf).metadata();
    if (!info.width || !info.height || info.width < 24 || info.height < 24) return buf;
    // هامش 1.5% حتى لا يلامس المنتج الحافة تماماً
    const pad = Math.round(Math.max(info.width, info.height) * 0.015);
    const keepAlpha = !!meta.hasAlpha;
    return sharp(data)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: keepAlpha ? CLEAR : WHITE })
      .png()
      .toBuffer();
  } catch {
    return buf;
  }
}

/** يوسّع اللوحة لنسبة معينة (المنتج في المنتصف) مع هامش اختياري. لا يقص شيئاً. */
async function padToRatio(buf: Buffer, ratio: number, padding: number, background: typeof WHITE) {
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const p = Math.min(Math.max(padding, 0), 0.3);
  // المحتوى يجب أن يتسع داخل (1-2p) من كل ضلع
  const innerW = w / (1 - 2 * p);
  const innerH = h / (1 - 2 * p);
  let outW = innerW;
  let outH = innerW / ratio;
  if (outH < innerH) {
    outH = innerH;
    outW = innerH * ratio;
  }
  outW = Math.round(outW);
  outH = Math.round(outH);
  const left = Math.floor((outW - w) / 2);
  const top = Math.floor((outH - h) / 2);
  if (left <= 0 && top <= 0) return buf;
  return sharp(buf)
    .extend({ left: Math.max(0, left), right: Math.max(0, outW - w - left), top: Math.max(0, top), bottom: Math.max(0, outH - h - top), background })
    .png()
    .toBuffer();
}

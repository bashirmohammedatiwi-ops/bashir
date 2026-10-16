import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/** ترويسة يرسلها تطبيق الهاتف — الموقع ولوحة التحكم والإصدارات القديمة لا تتأثر. */
export const MOBILE_CLIENT_HEADER = "x-client";
export const MOBILE_CLIENT_VALUE = "deema-app";

/** مسارات القوائم: المنتجات فيها بطاقات — صورة غلاف واحدة بلا أوصاف. */
const CARD_LIST_PATHS: RegExp[] = [
  /^\/api\/v1\/home\/?$/,
  /^\/api\/v1\/offers\/?$/,
  /^\/api\/v1\/products\/?$/,
  /^\/api\/v1\/products\/search\/?$/,
  /^\/api\/v1\/products\/[^/]+\/bought-together\/?$/,
  /^\/api\/v1\/wishlist\/?$/,
  /^\/api\/v1\/packages\/?$/,
];

/** حقول المنتج التي لا تُعرض في البطاقة (تُجلب كاملة في صفحة المنتج). */
const CARD_DROP_FIELDS = [
  "description",
  "descriptionAr",
  "descriptionEn",
  "howToUse",
  "howToUseAr",
  "howToUseEn",
  "ingredients",
  "ingredientsAr",
  "ingredientsEn",
  "seoTitle",
  "seoDescription",
  "metaTitle",
  "metaDescription",
  "subcategories",
  "tertiaryCategories",
];

/** بيانات ملف الصورة التي لا يستخدمها التطبيق. */
const MEDIA_DROP_FIELDS = [
  "hash",
  "bytes",
  "originalName",
  "mime",
  "storagePath",
  "purpose",
  "createdAt",
  "width",
  "height",
];

/**
 * يقلّص استجابات التطبيق: كانت الرئيسية لعالم واحد ~1.2MB لأن كل بطاقة تحمل
 * معرض صورها كاملاً بكل المقاسات والصيغ (jpg/webp/avif) وأوصافها.
 * التطبيق يعرض webp فقط وصورة الغلاف فقط في البطاقة.
 */
@Injectable()
export class MobilePayloadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const isMobile = String(req?.headers?.[MOBILE_CLIENT_HEADER] ?? "") === MOBILE_CLIENT_VALUE;
    if (!isMobile || req?.method !== "GET") return next.handle();
    const path = String(req?.url ?? "").split("?")[0];
    if (path.startsWith("/api/v1/admin") || path.startsWith("/api/v1/media")) return next.handle();
    const cards = CARD_LIST_PATHS.some((r) => r.test(path));
    return next.handle().pipe(map((data) => slim(data, cards, 0)));
  }
}

function isMedia(o: Record<string, unknown>) {
  return typeof o.variants === "object" && o.variants !== null && ("publicUrlBase" in o || "filename" in o);
}

function isProduct(o: Record<string, unknown>) {
  return "price" in o && "slug" in o && Array.isArray(o.images) && ("sku" in o || "stock" in o);
}

function slimMedia(o: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (MEDIA_DROP_FIELDS.includes(k)) continue;
    out[k] = v;
  }
  const variants = o.variants as Record<string, any>;
  const slimVariants: Record<string, unknown> = {};
  for (const [size, node] of Object.entries(variants)) {
    if (!node || typeof node !== "object") continue;
    const formats = node.formats && typeof node.formats === "object" ? node.formats : null;
    if (!formats) {
      slimVariants[size] = node;
      continue;
    }
    // نفس أولوية التطبيق: webp ثم jpg ثم avif — صيغة واحدة تكفي.
    const pick = formats.webp ? { webp: formats.webp } : formats.jpg ? { jpg: formats.jpg } : formats;
    slimVariants[size] = { width: node.width, formats: pick };
  }
  out.variants = slimVariants;
  return out;
}

/** حقول الدرجة التي لا تحتاجها البطاقة (نقاط اللون، العدد، الإضافة السريعة للسلة). */
const SHADE_DROP_FIELDS = ["barcode", "productId", "imageId", "createdAt", "updatedAt"];

/** في البطاقة: مقاس صغير يكفي (لا large 1600px). */
function keepVariants(media: unknown, sizes: string[]) {
  if (!media || typeof media !== "object") return media;
  const m = media as Record<string, any>;
  if (!m.variants || typeof m.variants !== "object") return media;
  const variants: Record<string, unknown> = {};
  for (const s of sizes) if (m.variants[s]) variants[s] = m.variants[s];
  return { ...m, variants: Object.keys(variants).length ? variants : m.variants };
}

function slimCardShade(shade: unknown, depth: number): unknown {
  if (!shade || typeof shade !== "object") return shade;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(shade as Record<string, unknown>)) {
    if (SHADE_DROP_FIELDS.includes(k)) continue;
    out[k] = k === "image" ? keepVariants(slim(v, true, depth + 1), ["thumb"]) : slim(v, true, depth + 1);
  }
  return out;
}

function slim(value: unknown, cards: boolean, depth: number): unknown {
  if (depth > 12 || value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((v) => slim(v, cards, depth + 1));

  const o = value as Record<string, unknown>;
  if (isMedia(o)) return slimMedia(o);

  const productCard = cards && isProduct(o);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (productCard && CARD_DROP_FIELDS.includes(k)) continue;
    if (productCard && k === "images" && Array.isArray(v)) {
      out.images = v.slice(0, 1).map((img) => {
        const slimmed = slim(img, cards, depth + 1) as Record<string, unknown>;
        return slimmed && typeof slimmed === "object" && slimmed.media
          ? { ...slimmed, media: keepVariants(slimmed.media, ["thumb", "small", "medium"]) }
          : slimmed;
      });
      continue;
    }
    if (productCard && k === "shades" && Array.isArray(v)) {
      out.shades = v.map((sh) => slimCardShade(sh, depth + 1));
      continue;
    }
    out[k] = slim(v, cards, depth + 1);
  }
  return out;
}

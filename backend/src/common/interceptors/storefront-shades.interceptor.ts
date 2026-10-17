import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { from, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { isAdminViewRequest } from "../admin-view.util";
import { PrismaService } from "../prisma.service";

/** مسارات الإدارة ترى كل التدرجات دائماً (لوحة التحكم + تطبيق المدير). */
const ADMIN_PREFIXES = ["/api/v1/admin", "/api/v1/control", "/api/v1/media", "/api/v1/ai-product", "/api/v1/sync"];

/**
 * التدرج الموقوف (isActive=false) لا يظهر للزبونة في أي استجابة:
 * المنتج، البطاقات، الرئيسية، المفضلة، الطلبات... — بدل تعديل كل استعلام على حدة.
 * طلبات الأدمن (توكن موظف) تمر كما هي.
 */
@Injectable()
export class StorefrontShadesInterceptor implements NestInterceptor {
  /** عدد التدرجات الموقوفة — صفر (الغالب) = لا نمشي على الاستجابة إطلاقاً. */
  private static inactiveCount: number | null = null;
  private static checkedAt = 0;

  /** يُستدعى بعد أي تشغيل/إيقاف حتى يظهر الأثر فوراً. */
  static invalidate() {
    StorefrontShadesInterceptor.checkedAt = 0;
  }

  constructor(private readonly prisma: PrismaService) {}

  private async hasInactiveShades(): Promise<boolean> {
    const now = Date.now();
    if (StorefrontShadesInterceptor.inactiveCount === null || now - StorefrontShadesInterceptor.checkedAt > 30_000) {
      try {
        StorefrontShadesInterceptor.inactiveCount = await this.prisma.productShade.count({ where: { isActive: false } });
      } catch {
        StorefrontShadesInterceptor.inactiveCount = 1; // عند الشك نفلتر
      }
      StorefrontShadesInterceptor.checkedAt = now;
    }
    return (StorefrontShadesInterceptor.inactiveCount ?? 1) > 0;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const path = String(req?.url ?? "").split("?")[0];
    if (ADMIN_PREFIXES.some((p) => path.startsWith(p))) return next.handle();
    if (isAdminViewRequest(req)) return next.handle();
    return next.handle().pipe(
      mergeMap((data) =>
        from(this.hasInactiveShades()).pipe(map((any) => (any ? stripInactiveShades(data, 0) : data))),
      ),
    );
  }
}

export function stripInactiveShades(node: unknown, depth: number): unknown {
  if (depth > 12 || node === null || typeof node !== "object") return node;
  if (Array.isArray(node)) {
    let changed = false;
    const out = node.map((item) => {
      const next = stripInactiveShades(item, depth + 1);
      if (next !== item) changed = true;
      return next;
    });
    return changed ? out : node;
  }
  if (node instanceof Date || Buffer.isBuffer(node)) return node;

  const obj = node as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || typeof value !== "object") continue;
    let next: unknown;
    if (key === "shades" && Array.isArray(value) && value.some(isInactiveShade)) {
      const kept = value.filter((s) => !isInactiveShade(s));
      next = kept.map((s) => stripInactiveShades(s, depth + 1));
      out ??= { ...obj };
      out[key] = next;
      const count = obj._count as Record<string, unknown> | undefined;
      if (count && typeof count.shades === "number") {
        out._count = { ...count, shades: Math.max(0, count.shades - (value.length - kept.length)) };
      }
      continue;
    }
    next = stripInactiveShades(value, depth + 1);
    if (next !== value) {
      out ??= { ...obj };
      out[key] = next;
    }
  }
  return out ?? obj;
}

function isInactiveShade(s: unknown): boolean {
  return !!s && typeof s === "object" && (s as Record<string, unknown>).isActive === false;
}

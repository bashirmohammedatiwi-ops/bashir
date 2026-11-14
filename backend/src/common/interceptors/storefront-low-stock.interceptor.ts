import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { from, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { isAdminViewRequest } from "../admin-view.util";
import { LowStockPolicy } from "../low-stock.policy";
import { PrismaService } from "../prisma.service";

/** مسارات الإدارة ترى المخزون الحقيقي دائماً (لوحة التحكم + تطبيق المدير + المزامنة). */
const ADMIN_PREFIXES = ["/api/v1/admin", "/api/v1/control", "/api/v1/media", "/api/v1/ai-product", "/api/v1/sync"];

/**
 * في الأقسام الرئيسية التي فعّل فيها المدير «إظهار المخزون القليل نافذاً»:
 * كل منتج/تدرج مخزونه ≤ الحد يصل للزبون بمخزون 0 — في كل استجابة (المنتج، البطاقات،
 * الرئيسية، البحث، المفضلة، الباقات...) بدل تعديل كل استعلام. طلبات الأدمن تمر كما هي.
 */
@Injectable()
export class StorefrontLowStockInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const path = String(req?.url ?? "").split("?")[0];
    if (ADMIN_PREFIXES.some((p) => path.startsWith(p))) return next.handle();
    // تطبيق المتجر والموقع (X-Client: deema-app) واجهة زبائن دائماً — حتى لو سجّل الدخول بحساب أدمن،
    // يرى ما تراه الزبونة. لوحة التحكم لا ترسل هذه الترويسة فترى المخزون الحقيقي بتوكنها.
    const storeClient = String(req?.headers?.["x-client"] ?? "") === "deema-app";
    if (!storeClient && isAdminViewRequest(req)) return next.handle();
    return next.handle().pipe(
      mergeMap((data) =>
        from(LowStockPolicy.load(this.prisma)).pipe(map((rules) => (rules.size ? applyLowStock(data, rules, 0) : data))),
      ),
    );
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** منتج = له مخزون رقمي وقسم رئيسي. */
function isProduct(o: Record<string, unknown>) {
  return typeof o.stock === "number" && typeof o.categoryId === "string";
}

export function applyLowStock(node: unknown, rules: Map<string, number>, depth: number): unknown {
  if (depth > 14 || node === null || typeof node !== "object") return node;
  if (Array.isArray(node)) {
    let changed = false;
    const out = node.map((item) => {
      const next = applyLowStock(item, rules, depth + 1);
      if (next !== item) changed = true;
      return next;
    });
    return changed ? out : node;
  }
  if (node instanceof Date || Buffer.isBuffer(node)) return node;

  const obj = node as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  const set = (k: string, v: unknown) => {
    out ??= { ...obj };
    out[k] = v;
  };

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || typeof value !== "object") continue;
    const next = applyLowStock(value, rules, depth + 1);
    if (next !== value) set(key, next);
  }

  // «العدد المحلي»: المدير أدخل العدد بنفسه، فيُعرض كما هو حتى في قسم مفعّلة فيه القاعدة.
  if (isProduct(obj) && rules.has(obj.categoryId as string) && !LowStockPolicy.isManual(obj.id as string)) {
    const cat = obj.categoryId as string;
    const cur = (out ?? obj) as Record<string, unknown>;
    let stock = LowStockPolicy.effective(rules, cat, obj.stock as number);
    const shades = cur.shades;
    if (Array.isArray(shades) && shades.length && shades.every((s) => isObj(s) && typeof s.stock === "number")) {
      const eff = shades.map((s) => {
        const sh = s as Record<string, unknown>;
        const st = LowStockPolicy.effective(rules, cat, sh.stock as number);
        return st === sh.stock ? sh : { ...sh, stock: st };
      });
      if (eff.some((s, i) => s !== shades[i])) set("shades", eff);
      // مخزون المنتج مجموع تدرجاته: تدرجات كلها «نافذة» = المنتج نافذ.
      const sum = eff.reduce((n, s) => n + Math.max(0, (s as Record<string, unknown>).stock as number), 0);
      stock = Math.min(stock, sum);
    }
    if (stock !== obj.stock) set("stock", stock);
  }

  // الباقة: متوفرة فقط إذا كل منتجاتها متوفرة بالكمية المطلوبة (بعد التعديل أعلاه).
  const cur = (out ?? obj) as Record<string, unknown>;
  if (typeof cur.inStock === "boolean" && Array.isArray(cur.items) && cur.items.length) {
    const ok = cur.items.every((it) => {
      if (!isObj(it) || !isObj(it.product) || typeof it.product.stock !== "number") return true;
      return (it.product.stock as number) >= Math.max(1, Number(it.quantity ?? 1));
    });
    if (cur.inStock && !ok) set("inStock", false);
  }
  return out ?? obj;
}

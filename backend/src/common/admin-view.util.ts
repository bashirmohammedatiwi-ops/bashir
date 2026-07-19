import * as jwt from "jsonwebtoken";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "STAFF"]);

/**
 * هل الطلب قادم من لوحة التحكم (توكن أدمن صالح)؟
 * تُستخدم لتجاوز فلاتر إخفاء واجهة المتجر في المسارات العامة،
 * حتى ترى لوحة التحكم كل البيانات دائماً.
 */
export function isAdminViewRequest(req: { headers?: Record<string, unknown> } | undefined): boolean {
  const header = String(req?.headers?.["authorization"] ?? "");
  if (!header.startsWith("Bearer ")) return false;
  try {
    const payload = jwt.verify(
      header.slice(7),
      process.env.JWT_ACCESS_SECRET ?? "access",
    ) as { role?: string };
    return ADMIN_ROLES.has(String(payload?.role ?? ""));
  } catch {
    return false;
  }
}

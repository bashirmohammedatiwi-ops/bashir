import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

const PRIVATE = /^(::ffff:)?(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)|^::1$/;

/**
 * حد الطلبات لكل عنوان — مع استثناء واحد: متجر الويب حين يرسم الصفحات على السيرفر
 * يطلب الـ API مباشرة من داخل شبكة Docker (كل زوار الموقع من عنوان واحد).
 * طلبات الإنترنت تمر دائماً بـ nginx الذي يضيف X-Forwarded-For، فلا يمكن انتحال هذا الاستثناء.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const h = req?.headers ?? {};
    const remote: string = req?.raw?.socket?.remoteAddress ?? req?.socket?.remoteAddress ?? "";
    if (h["x-ssr"] === "deema-web" && !h["x-forwarded-for"] && !h["x-real-ip"] && PRIVATE.test(remote)) return true;
    return super.shouldSkip(context);
  }
}

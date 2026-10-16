import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * تسجيل دخول اختياري: إن أرسل التطبيق رمزاً صالحاً نعرف الزبونة (لمشترياتها)،
 * وإلا تكمل «ديما» كزائرة — لا رفض أبداً.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard("jwt") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (!req.headers?.authorization) return true;
    try {
      await (super.canActivate(context) as Promise<boolean>);
    } catch {
      req.user = undefined;
    }
    return true;
  }

  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}

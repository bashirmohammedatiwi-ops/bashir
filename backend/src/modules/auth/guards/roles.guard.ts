import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../../../common/decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflectorRef: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflectorRef?.getAllAndOverride?.<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException("Unauthenticated");
    if (!required.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }
    return true;
  }
}

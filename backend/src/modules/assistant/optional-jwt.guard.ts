/**
 * Attaches the user when a valid Bearer token is present, and stays silent
 * otherwise — guests may chat; personalization needs an account.
 */

import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(_err: unknown, user: TUser | false | null): TUser | undefined {
    // Never throw for missing/invalid tokens — the assistant works for guests.
    if (!user || user === false) return undefined;
    return user;
  }
}

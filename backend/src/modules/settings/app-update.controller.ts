import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { SettingsService } from "./settings.service";

/** يقارن «1.2.10» بـ «1.2.9» رقماً رقماً. */
export function compareVersions(a: string, b: string) {
  const pa = String(a ?? "").split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  const pb = String(b ?? "").split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * تحديث التطبيق: التطبيق يرسل منصته وإصداره، والسيرفر يقرر —
 * force (أقدم من الحد الأدنى: لا يعمل التطبيق حتى يُحدَّث)، soft (يوجد أحدث: تنبيه لطيف)، أو none.
 */
@ApiTags("app")
@Controller("app")
export class AppUpdateController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get("update")
  async check(@Query("platform") platform?: string, @Query("version") version?: string) {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    const ios = String(platform ?? "").toLowerCase() === "ios";
    const latest = String((ios ? s.appLatestIos : s.appLatestAndroid) ?? "0.0.0");
    const min = String((ios ? s.appMinIos : s.appMinAndroid) ?? "0.0.0");
    const storeUrl = String((ios ? s.appStoreUrlIos : s.appStoreUrlAndroid) ?? "");
    const current = String(version ?? "0.0.0");
    let mode: "none" | "soft" | "force" = "none";
    if (s.appUpdateEnabled !== false && storeUrl) {
      if (compareVersions(current, min) < 0) mode = "force";
      else if (compareVersions(current, latest) < 0) mode = "soft";
    }
    return {
      mode,
      latest,
      min,
      storeUrl,
      message: String(s.appUpdateMessage ?? ""),
    };
  }
}

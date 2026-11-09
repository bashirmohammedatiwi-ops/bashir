import { createHash } from "node:crypto";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { rewriteMediaRecord } from "../../common/media-url.util";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "./settings.service";

type LaunchPopupConfig = {
  enabled?: boolean;
  title?: string | null;
  imageId?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
  link?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  frequency?: string | null;
};

const FREQUENCIES = new Set(["once", "daily", "always"]);

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** الإعلان الفعّال الآن من الإعدادات، أو null (موقوف / بلا صورة / خارج المدة). */
export function activeLaunchPopup(raw: unknown, now = new Date()) {
  const c = (raw && typeof raw === "object" ? raw : {}) as LaunchPopupConfig;
  if (!c.enabled || !c.imageId) return null;
  const startsAt = parseDate(c.startsAt);
  const endsAt = parseDate(c.endsAt);
  if (startsAt && now < startsAt) return null;
  if (endsAt && now > endsAt) return null;
  const frequency = FREQUENCIES.has(String(c.frequency)) ? String(c.frequency) : "daily";
  // المعرّف يتغيّر مع الصورة أو الرابط أو المدة → إعلان جديد يظهر حتى لمن أغلقت السابق.
  const id = createHash("sha1")
    .update([c.imageId, c.linkType, c.linkValue, c.link, c.startsAt, c.endsAt].map((x) => x ?? "").join("|"))
    .digest("hex")
    .slice(0, 16);
  return { id, config: c, frequency, endsAt };
}

/**
 * إعلان عند فتح التطبيق (Popup): التطبيق يطلبه عند الفتح ويعرضه بحسب «التكرار»
 * (مرة لكل إعلان / مرة يومياً / كل فتح) — العدّ على جهاز الزبونة.
 */
@ApiTags("app")
@Controller("app")
export class LaunchPopupController {
  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get("launch-popup")
  async get() {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    const active = activeLaunchPopup(s.launchPopup);
    if (!active) return { popup: null };
    const media = await this.prisma.media.findUnique({ where: { id: active.config.imageId! } });
    if (!media) return { popup: null };
    const c = active.config;
    return {
      popup: {
        id: active.id,
        title: c.title ?? "",
        linkType: c.linkType || null,
        linkValue: c.linkValue || null,
        link: c.link || null,
        frequency: active.frequency,
        endsAt: active.endsAt ? active.endsAt.toISOString() : null,
        image: rewriteMediaRecord(media as unknown as Record<string, unknown>),
      },
    };
  }
}

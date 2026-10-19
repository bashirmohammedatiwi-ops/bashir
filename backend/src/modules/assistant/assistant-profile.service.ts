import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { normalizeBrandKey } from "../catalog/brands.service";
import { CustomerProfile, emptyProfile, HairType, mergeProfile, ProfileFacts, SkinType } from "./intelligence/profile";

/** أنواع البشرة المعروفة (نفس مفاتيح التطبيق ولوحة التحكم). */
export const SKIN_TYPES: readonly SkinType[] = ["oily", "dry", "sensitive", "combination", "normal"];

/** شكل الملف المُرجَع للتطبيق. */
export interface PublicProfile {
  skinType: SkinType | null;
  hairType: HairType | null;
  sensitivities: string[];
  likedBrands: string[];
  avoidBrands: string[];
}

function toPublicProfile(p: CustomerProfile): PublicProfile {
  return {
    skinType: p.skinType ?? null,
    hairType: p.hairType ?? null,
    sensitivities: p.sensitivities,
    likedBrands: p.likedBrands,
    avoidBrands: p.avoidBrands,
  };
}

/** حساسيات نظيفة: مقصوصة، بلا تكرار، حتى 8 (نفس حد mergeProfile). اللاتيني بأحرف صغيرة («fragrance»). */
function cleanSensitivities(list: string[]): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const v = String(raw ?? "").trim();
    const key = /^[a-z\s_-]+$/i.test(v) ? v.toLowerCase() : v;
    if (key && !out.includes(key)) out.push(key);
  }
  return out.slice(0, 8);
}

@Injectable()
export class AssistantProfileService {
  private readonly logger = new Logger(AssistantProfileService.name);
  private readonly cache = new Map<string, { at: number; profile: CustomerProfile }>();
  private brands: { at: number; rows: Array<{ name: string; key: string }> } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<CustomerProfile> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.at < 60_000) return cached.profile;
    try {
      const row = await this.prisma.assistantProfile.findUnique({ where: { userId } });
      const profile: CustomerProfile = row
        ? {
            skinType: (row.skinType as SkinType | null) ?? undefined,
            hairType: (row.hairType as HairType | null) ?? undefined,
            sensitivities: row.sensitivities,
            likedBrands: row.likedBrands,
            avoidBrands: row.avoidBrands,
          }
        : emptyProfile();
      this.cache.set(userId, { at: Date.now(), profile });
      return profile;
    } catch (error) {
      this.logger.warn(`profile read skipped: ${error instanceof Error ? error.message : error}`);
      return emptyProfile();
    }
  }

  /** يحفظ الحقائق الجديدة ويرجع الشركات اللي انعرفت فعلاً من الكتالوج. */
  async learn(userId: string, profile: CustomerProfile, facts: ProfileFacts) {
    const liked = await this.resolveBrands(facts.likedBrandWords ?? []);
    const avoided = await this.resolveBrands(facts.avoidBrandWords ?? []);
    const next = mergeProfile(profile, facts, liked, avoided);
    const changed = JSON.stringify(next) !== JSON.stringify(profile);
    if (changed) {
      try {
        const data = {
          skinType: next.skinType ?? null,
          hairType: next.hairType ?? null,
          sensitivities: next.sensitivities,
          likedBrands: next.likedBrands,
          avoidBrands: next.avoidBrands,
        };
        await this.prisma.assistantProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
        this.cache.set(userId, { at: Date.now(), profile: next });
      } catch (error) {
        this.logger.warn(`profile save skipped: ${error instanceof Error ? error.message : error}`);
        return { profile, liked: [], avoided: [], changed: false };
      }
    }
    return { profile: next, liked, avoided, changed };
  }

  /** ملفها كما يراه التطبيق (GET /assistant/profile) — حقول غائبة = null. */
  async publicProfile(userId: string): Promise<PublicProfile> {
    return toPublicProfile(await this.get(userId));
  }

  /**
   * تعديل صريح من التطبيق (نتيجة اختبار البشرة): يُحفظ على الحساب فيبقى بعد إعادة التثبيت
   * وعلى أي جهاز. الحقل الغائب يبقى كما هو، و skinType = null يمسحه، والحساسيات تستبدل القائمة.
   */
  async update(userId: string, patch: { skinType?: SkinType | null; sensitivities?: string[] }): Promise<PublicProfile> {
    const data: { skinType?: string | null; sensitivities?: string[] } = {};
    if (patch.skinType !== undefined) data.skinType = patch.skinType;
    if (patch.sensitivities !== undefined) data.sensitivities = cleanSensitivities(patch.sensitivities);
    const row = await this.prisma.assistantProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    const profile: CustomerProfile = {
      skinType: (row.skinType as SkinType | null) ?? undefined,
      hairType: (row.hairType as HairType | null) ?? undefined,
      sensitivities: row.sensitivities,
      likedBrands: row.likedBrands,
      avoidBrands: row.avoidBrands,
    };
    this.cache.set(userId, { at: Date.now(), profile });
    return toPublicProfile(profile);
  }

  async forget(userId: string) {
    this.cache.delete(userId);
    await this.prisma.assistantProfile.deleteMany({ where: { userId } }).catch(() => undefined);
  }

  private async resolveBrands(words: string[]) {
    if (!words.length) return [];
    const brands = await this.brandKeys();
    const found = new Set<string>();
    for (const word of words) {
      const key = normalizeBrandKey(word);
      if (key.length < 3) continue;
      const hit = brands.find((brand) => brand.key === key)
        ?? brands.find((brand) => key.length >= 4 && brand.key.startsWith(key))
        ?? brands.find((brand) => brand.key.length >= 4 && key.includes(brand.key));
      if (hit) found.add(hit.name);
    }
    return [...found];
  }

  private async brandKeys() {
    if (this.brands && Date.now() - this.brands.at < 10 * 60_000) return this.brands.rows;
    const rows = await this.prisma.brand.findMany({ where: { isActive: true }, select: { name: true } }).catch(() => []);
    this.brands = { at: Date.now(), rows: rows.map((row) => ({ name: row.name, key: normalizeBrandKey(row.name) })).filter((row) => row.key) };
    return this.brands.rows;
  }
}

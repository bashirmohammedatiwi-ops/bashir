import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { normalizeBrandKey } from "../catalog/brands.service";
import { CustomerProfile, emptyProfile, HairType, mergeProfile, ProfileFacts, SkinType } from "./intelligence/profile";

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

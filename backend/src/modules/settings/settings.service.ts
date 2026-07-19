import { Injectable } from "@nestjs/common";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { getCached, setCached } from "../../common/memory-cache.util";
import { PrismaService } from "../../common/prisma.service";

export const DEFAULT_STORE_SETTINGS = {
  storeName: "الحياة",
  currency: "د.ع",
  whatsapp: "+9647700000000",
  supportPhone: "+9647700000000",
  taxPercent: 0,
  shippingFee: 5000,
  freeShippingThreshold: 50000,
  cashOnDelivery: true,
  emailOrders: "orders@alhayaa.com",
  flashSaleEndsAt: null as string | null,
  loyaltyTiers: {
    silver: 500,
    gold: 1500,
    platinum: 3000,
  },
  firstOrderBonusPoints: 50,
  pointsPer1000Iqd: 1,
  redeem100PointsValue: 1000,
  lowStockThreshold: 5,
  stockAlertPushEnabled: true,
  stockAlertCooldownHours: 24,
  pickupEnabled: true,
  pickupAddress: "فرع الكرادة — شارع أبو نؤاس، بغداد",
  pickupHours: "10:00 – 22:00 يومياً",
  // إعدادات ظهور واجهة المتجر (تطبيق الهاتف)
  hideEmptyBrands: false,
  hideEmptyCategories: false,
  hideEmptySubcategories: false,
  hideEmptyTertiary: false,
  hideOutOfStock: false,
  hideProductsWithoutImages: false,
};

const SETTINGS_KEY = "store";
const SETTINGS_CACHE_MS = 60_000;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  async getAll() {
    const cached = getCached<typeof DEFAULT_STORE_SETTINGS & Record<string, unknown>>(
      "settings:store",
    );
    if (cached) return cached;

    const row = await this.prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
    const merged = { ...DEFAULT_STORE_SETTINGS, ...(row?.value as object ?? {}) };
    setCached("settings:store", merged, SETTINGS_CACHE_MS);
    return merged;
  }

  async update(data: Record<string, unknown>) {
    const current = await this.getAll();
    const merged = { ...current, ...data };
    await this.prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: merged },
      update: { value: merged },
    });
    setCached("settings:store", merged, SETTINGS_CACHE_MS);
    await this.homeFeedCache.invalidateAll();
    return merged;
  }

  async getShipping(subtotal: number) {
    const s = await this.getAll();
    const fee = Number(s.shippingFee ?? DEFAULT_STORE_SETTINGS.shippingFee);
    const threshold = Number(s.freeShippingThreshold ?? DEFAULT_STORE_SETTINGS.freeShippingThreshold);
    return subtotal >= threshold ? 0 : fee;
  }
}

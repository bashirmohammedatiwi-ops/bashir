import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

export const DEFAULT_STORE_SETTINGS = {
  storeName: "الحياة",
  currency: "د.ع",
  whatsapp: "+9647700000000",
  supportPhone: "+9647700000000",
  taxPercent: 0,
  shippingFee: 5000,
  freeShippingThreshold: 50000,
  expressShippingFee: 5000,
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
};

const SETTINGS_KEY = "store";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const row = await this.prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
    return { ...DEFAULT_STORE_SETTINGS, ...(row?.value as object ?? {}) };
  }

  async update(data: Record<string, unknown>) {
    const current = await this.getAll();
    const merged = { ...current, ...data };
    await this.prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: merged },
      update: { value: merged },
    });
    return merged;
  }

  async getShipping(subtotal: number) {
    const s = await this.getAll();
    const fee = Number(s.shippingFee ?? DEFAULT_STORE_SETTINGS.shippingFee);
    const threshold = Number(s.freeShippingThreshold ?? DEFAULT_STORE_SETTINGS.freeShippingThreshold);
    return subtotal >= threshold ? 0 : fee;
  }
}

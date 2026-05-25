import { Injectable } from "@nestjs/common";
import { DeliveryOption } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  list(activeOnly = false) {
    return this.prisma.shippingZone.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
    });
  }

  create(data: {
    governorate: string;
    standardFee?: number;
    expressFee?: number;
    position?: number;
    isActive?: boolean;
  }) {
    return this.prisma.shippingZone.create({
      data: {
        governorate: data.governorate.trim(),
        standardFee: data.standardFee ?? 5000,
        expressFee: data.expressFee ?? 8000,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  update(
    id: string,
    data: {
      governorate?: string;
      standardFee?: number;
      expressFee?: number;
      position?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...data,
        governorate: data.governorate?.trim(),
      },
    });
  }

  remove(id: string) {
    return this.prisma.shippingZone.delete({ where: { id } }).then(() => ({ success: true }));
  }

  async quote(input: {
    governorate?: string;
    subtotal?: number;
    deliveryOption?: DeliveryOption | string;
    freeShipping?: boolean;
  }) {
    const settings = await this.settings.getAll();
    const subtotal = input.subtotal ?? 0;
    const option = (input.deliveryOption as DeliveryOption) ?? DeliveryOption.STANDARD;

    if (option === DeliveryOption.PICKUP) {
      return {
        deliveryOption: option,
        fee: 0,
        pickupEnabled: settings.pickupEnabled ?? true,
        pickupAddress: settings.pickupAddress ?? "",
        pickupHours: settings.pickupHours ?? "",
      };
    }

    const threshold = Number(settings.freeShippingThreshold ?? 50000);
    const zone = input.governorate
      ? await this.prisma.shippingZone.findFirst({
          where: { governorate: input.governorate.trim(), isActive: true },
        })
      : null;

    let fee = 0;
    if (option === DeliveryOption.EXPRESS) {
      fee = zone?.expressFee ?? Number(settings.expressShippingFee ?? 5000);
    } else {
      if (input.freeShipping || subtotal >= threshold) {
        fee = 0;
      } else if (zone) {
        fee = zone.standardFee;
      } else {
        fee = Number(settings.shippingFee ?? 5000);
      }
    }

    return {
      deliveryOption: option,
      fee,
      governorate: input.governorate ?? null,
      zoneId: zone?.id ?? null,
      freeShippingApplied: option === DeliveryOption.STANDARD && (input.freeShipping || subtotal >= threshold),
      pickupEnabled: settings.pickupEnabled ?? true,
      pickupAddress: settings.pickupAddress ?? "",
      pickupHours: settings.pickupHours ?? "",
    };
  }

  async calculateOrderShipping(input: {
    governorate?: string | null;
    deliveryOption: DeliveryOption;
    subtotal: number;
    freeShipping?: boolean;
  }) {
    const quote = await this.quote({
      governorate: input.governorate ?? undefined,
      subtotal: input.subtotal,
      deliveryOption: input.deliveryOption,
      freeShipping: input.freeShipping,
    });
    return quote.fee;
  }
}

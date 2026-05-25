import { Injectable } from "@nestjs/common";
import { DeliveryOption } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";

const zoneInclude = {
  areas: {
    where: { isActive: true },
    orderBy: { position: "asc" as const },
  },
};

const zoneIncludeAll = {
  areas: {
    orderBy: { position: "asc" as const },
  },
};

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  list(activeOnly = false) {
    return this.prisma.shippingZone.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: activeOnly ? zoneInclude : zoneIncludeAll,
      orderBy: { position: "asc" },
    });
  }

  create(data: {
    governorate: string;
    standardFee?: number;
    position?: number;
    isActive?: boolean;
  }) {
    return this.prisma.shippingZone.create({
      data: {
        governorate: data.governorate.trim(),
        standardFee: data.standardFee ?? 5000,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
      include: zoneIncludeAll,
    });
  }

  update(
    id: string,
    data: {
      governorate?: string;
      standardFee?: number;
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
      include: zoneIncludeAll,
    });
  }

  remove(id: string) {
    return this.prisma.shippingZone.delete({ where: { id } }).then(() => ({ success: true }));
  }

  createArea(data: {
    zoneId: string;
    name: string;
    fee?: number | null;
    position?: number;
    isActive?: boolean;
  }) {
    return this.prisma.shippingArea.create({
      data: {
        zoneId: data.zoneId,
        name: data.name.trim(),
        fee: data.fee ?? null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  updateArea(
    id: string,
    data: {
      name?: string;
      fee?: number | null;
      position?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.shippingArea.update({
      where: { id },
      data: {
        ...data,
        name: data.name?.trim(),
      },
    });
  }

  removeArea(id: string) {
    return this.prisma.shippingArea.delete({ where: { id } }).then(() => ({ success: true }));
  }

  async quote(input: {
    governorate?: string;
    area?: string;
    subtotal?: number;
    deliveryOption?: DeliveryOption | string;
    freeShipping?: boolean;
  }) {
    const settings = await this.settings.getAll();
    const subtotal = input.subtotal ?? 0;
    const rawOption = (input.deliveryOption as DeliveryOption) ?? DeliveryOption.STANDARD;
    const option =
      rawOption === DeliveryOption.EXPRESS ? DeliveryOption.STANDARD : rawOption;

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
          include: zoneInclude,
        })
      : null;

    const shippingArea =
      zone && input.area?.trim()
        ? zone.areas.find((a) => a.name === input.area!.trim()) ??
          (await this.prisma.shippingArea.findFirst({
            where: {
              zoneId: zone.id,
              name: input.area!.trim(),
              isActive: true,
            },
          }))
        : null;

    let fee = 0;
    if (input.freeShipping || subtotal >= threshold) {
      fee = 0;
    } else if (shippingArea?.fee != null) {
      fee = shippingArea.fee;
    } else if (zone) {
      fee = zone.standardFee;
    } else {
      fee = Number(settings.shippingFee ?? 5000);
    }

    return {
      deliveryOption: option,
      fee,
      governorate: input.governorate ?? null,
      area: input.area?.trim() ?? null,
      zoneId: zone?.id ?? null,
      areaId: shippingArea?.id ?? null,
      freeShippingApplied: input.freeShipping || subtotal >= threshold,
      pickupEnabled: settings.pickupEnabled ?? true,
      pickupAddress: settings.pickupAddress ?? "",
      pickupHours: settings.pickupHours ?? "",
    };
  }

  async calculateOrderShipping(input: {
    governorate?: string | null;
    area?: string | null;
    deliveryOption: DeliveryOption;
    subtotal: number;
    freeShipping?: boolean;
  }) {
    const quote = await this.quote({
      governorate: input.governorate ?? undefined,
      area: input.area ?? undefined,
      subtotal: input.subtotal,
      deliveryOption: input.deliveryOption,
      freeShipping: input.freeShipping,
    });
    return quote.fee;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

function mapAddress(a: any) {
  return {
    ...a,
    name: a.fullName,
    governorate: a.governorate ?? a.city,
  };
}

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }).then((rows) => rows.map(mapAddress));
  }

  async create(userId: string, data: any) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const row = await this.prisma.address.create({
      data: {
        userId,
        fullName: data.name ?? data.fullName,
        phone: data.phone,
        city: data.governorate ?? data.city,
        governorate: data.governorate ?? data.city,
        area: data.area,
        street: data.street,
        house: data.house,
        notes: data.notes,
        isDefault: data.isDefault ?? false,
      },
    });
    return mapAddress(row);
  }

  async update(userId: string, id: string, data: any) {
    await this.ensureOwned(userId, id);
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const row = await this.prisma.address.update({
      where: { id },
      data: {
        fullName: data.name ?? data.fullName,
        phone: data.phone,
        city: data.governorate ?? data.city,
        governorate: data.governorate ?? data.city,
        area: data.area,
        street: data.street,
        house: data.house,
        notes: data.notes,
        isDefault: data.isDefault,
      },
    });
    return mapAddress(row);
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.address.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const a = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!a) throw new NotFoundException("Address not found");
  }
}

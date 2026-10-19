import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import type { AddressInputDto } from "./addresses.controller";

function mapAddress(a: any) {
  return {
    ...a,
    name: a.fullName,
    governorate: a.governorate ?? a.city,
  };
}

/** نص مُشذَّب، والفارغ = لا قيمة. */
function clean(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/** المحافظة من حقلها، وإلا من «city» (الإصدارات القديمة ترسل المدينة وحدها). */
function governorateOf(data: AddressInputDto): string | null {
  return clean(data.governorate) ?? clean(data.city);
}

/** الحقول الاختيارية: الغائب يبقى كما هو، و null أو النص الفارغ يمسح القيمة. */
const OPTIONAL_FIELDS = ["area", "street", "house", "notes"] as const;

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }).then((rows) => rows.map(mapAddress));
  }

  async create(userId: string, data: AddressInputDto) {
    const fullName = clean(data.name) ?? clean(data.fullName);
    const phone = clean(data.phone);
    const governorate = governorateOf(data);
    if (!fullName || !phone || !governorate) {
      throw new BadRequestException("أكملي اسم المستلمة ورقم الهاتف والمحافظة");
    }
    const row = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId,
          fullName,
          phone,
          city: governorate,
          governorate,
          area: clean(data.area),
          street: clean(data.street),
          house: clean(data.house),
          notes: clean(data.notes),
          isDefault: data.isDefault ?? false,
        },
      });
    });
    return mapAddress(row);
  }

  /**
   * تعديل جزئي (PATCH): يُكتب الحقل فقط إن أُرسل. null يمسح الحقول الاختيارية —
   * فتغيير المحافظة يمسح منطقتها القديمة، ومسح الدار أو الملاحظات يُحفظ فعلاً.
   * الحقول الإلزامية (الاسم، الهاتف، المحافظة) لا تُمسح. «landmark» يُقبل ولا يُخزَّن: الشارع يحمل أقرب نقطة دالة.
   */
  async update(userId: string, id: string, data: AddressInputDto) {
    const current = await this.ensureOwned(userId, id);
    const patch: Prisma.AddressUpdateInput = {};
    const fullName = clean(data.name) ?? clean(data.fullName);
    if (fullName) patch.fullName = fullName;
    const phone = clean(data.phone);
    if (phone) patch.phone = phone;
    const governorate = governorateOf(data);
    if (governorate) {
      patch.city = governorate;
      patch.governorate = governorate;
      // محافظة أخرى بلا منطقة مرسلة: منطقة المحافظة السابقة لا تصلح لها
      // (الإصدارات القديمة والموقع يحذفان المنطقة الفارغة من الطلب بدل إرسال null).
      if (data.area === undefined && governorate !== (current.governorate ?? current.city)) patch.area = null;
    }
    for (const key of OPTIONAL_FIELDS) {
      if (data[key] !== undefined) patch[key] = clean(data[key]);
    }
    if (typeof data.isDefault === "boolean") patch.isDefault = data.isDefault;

    const row = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id }, data: patch });
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
    return a;
  }
}

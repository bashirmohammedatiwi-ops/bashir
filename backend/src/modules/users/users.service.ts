import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { normalizePhone } from "../../common/phone.util";
import { CreateStaffDto, QueryUsersDto, SetPasswordDto, UpdateUserDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {
      role: q.role,
      isActive: q.isActive,
      OR: q.search
        ? [
            { name: { contains: q.search } },
            { email: { contains: q.search } },
            { phone: { contains: q.search } },
          ]
        : undefined,
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: q.skip,
        take: q.limit,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          isActive: true,
          loyaltyPoints: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return paginate(items, total, q.page, q.limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
        lastLoginAt: true,
        createdAt: true,
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
        },
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensure(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive,
        loyaltyPoints: dto.loyaltyPoints,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
      },
    });
  }

  /**
   * إنشاء حساب موظف مباشرة من لوحة التحكم (بلا تسجيل من تطبيق المتجر).
   * المدير (ADMIN) ينشئ موظفين فقط؛ حساب «مدير» يحتاج مديراً عاماً.
   */
  async createStaff(dto: CreateStaffDto, actor: { id: string; role: Role }) {
    const role = dto.role ?? Role.STAFF;
    if (role === Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("إنشاء حساب مدير متاح للمدير العام فقط");
    }
    const phone = normalizePhone(dto.phone.trim());
    const email = dto.email?.trim().toLowerCase() || undefined;
    const byPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (byPhone && !byPhone.deletedAt) {
      throw new ConflictException(
        "رقم الهاتف مسجّل لحساب موجود — ابحث عنه في القائمة وغيّر دوره إلى «موظف» بدل إنشاء حساب جديد",
      );
    }
    if (email) {
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail && !byEmail.deletedAt) throw new ConflictException("هذا البريد الإلكتروني مسجّل لحساب آخر");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: { name: dto.name.trim(), phone, email, passwordHash, role, isActive: true },
        select: { id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
      });
      await this.prisma.auditLog
        .create({ data: { actorId: actor.id, action: "STAFF_CREATE", entity: "User", entityId: user.id, meta: { role, phone } } })
        .catch(() => undefined);
      return user;
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("رقم الهاتف أو البريد مستخدم في حساب آخر");
      throw err;
    }
  }

  /** تعيين كلمة مرور جديدة لموظف (نسيها أو تسليم جهاز) — تُسجَّل خروج كل أجهزته. */
  async setPassword(id: string, dto: SetPasswordDto, actor: { id: string; role: Role }) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u || u.deletedAt) throw new NotFoundException("User not found");
    if (u.role === Role.CUSTOMER) throw new ForbiddenException("تعيين كلمة المرور متاح لحسابات الموظفين فقط");
    if ((u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN) && actor.role !== Role.SUPER_ADMIN && u.id !== actor.id) {
      throw new ForbiddenException("تغيير كلمة مرور مدير متاح للمدير العام فقط");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.prisma.auditLog
      .create({ data: { actorId: actor.id, action: "STAFF_PASSWORD_SET", entity: "User", entityId: id, meta: {} } })
      .catch(() => undefined);
    return { success: true };
  }

  private async ensure(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException("User not found");
  }
}

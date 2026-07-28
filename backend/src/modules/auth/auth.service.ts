import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";
import { PrismaService } from "../../common/prisma.service";
import {
  ChangePasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { Role } from "@prisma/client";
import { normalizePhone } from "../../common/phone.util";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const phone = normalizePhone(dto.phone.trim());
    const phoneTaken = await this.prisma.user.findUnique({ where: { phone } });
    if (phoneTaken && !phoneTaken.deletedAt) {
      throw new ConflictException("رقم الهاتف مستخدم في حساب آخر");
    }

    const email = dto.email?.trim().toLowerCase();
    if (email) {
      const exists = await this.prisma.user.findUnique({ where: { email } });
      if (exists && !exists.deletedAt) {
        throw new ConflictException("هذا البريد الإلكتروني مسجّل مسبقاً");
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: email || undefined,
          name: dto.name.trim(),
          phone,
          passwordHash,
          role: Role.CUSTOMER,
        },
      });
      return this.issueTokens(user.id, user.role);
    } catch (err: any) {
      if (err?.code === "P2002") {
        const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : "";
        if (target.includes("phone")) {
          throw new ConflictException("رقم الهاتف مستخدم في حساب آخر");
        }
        throw new ConflictException("هذا البريد الإلكتروني مسجّل مسبقاً");
      }
      throw err;
    }
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }) {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim() ? normalizePhone(dto.phone.trim()) : undefined;

    const user = phone
      ? await this.prisma.user.findUnique({ where: { phone } })
      : email
        ? await this.prisma.user.findUnique({ where: { email } })
        : null;

    if (!user || !user.passwordHash || user.deletedAt) {
      throw new UnauthorizedException("رقم الهاتف أو كلمة المرور غير صحيحة");
    }
    if (!user.isActive) {
      throw new UnauthorizedException("تم تعطيل هذا الحساب");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("رقم الهاتف أو كلمة المرور غير صحيحة");
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.issueTokens(user.id, user.role, meta);
  }

  async refresh(dto: RefreshDto) {
    let payload: any;
    try {
      payload = this.jwt.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "refresh",
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const refreshHash = this.hashToken(dto.refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshHash, userId: payload.sub, revokedAt: null },
    });
    if (!session) throw new UnauthorizedException("Session not found");
    if (session.expiresAt < new Date()) throw new UnauthorizedException("Session expired");

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException("Session expired");
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(payload.sub, payload.role);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const refreshHash = this.hashToken(refreshToken);
      await this.prisma.session.updateMany({
        where: { userId, refreshHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        deletedAt: true,
        loyaltyPoints: true,
        birthday: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { orders: true, wishlist: true } },
      },
    });
    if (!user || user.deletedAt || !user.isActive) throw new UnauthorizedException();
    return {
      ...user,
      points: user.loyaltyPoints,
      orderCount: user._count.orders,
      wishlistCount: user._count.wishlist,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new BadRequestException("لا يمكن تغيير كلمة المرور لهذا الحساب");
    }
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException("كلمة المرور الحالية غير صحيحة");
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("اختر كلمة مرور جديدة مختلفة عن الحالية");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const phone = dto.phone?.trim() ? normalizePhone(dto.phone.trim()) : undefined;
    if (phone) {
      const taken = await this.prisma.user.findFirst({
        where: { phone, id: { not: userId }, deletedAt: null },
      });
      if (taken) {
        throw new ConflictException("رقم الهاتف مستخدم في حساب آخر");
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone,
        avatarUrl: dto.avatarUrl,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        loyaltyPoints: true,
        birthday: true,
        avatarUrl: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true, role: true },
    });
    if (!user || user.deletedAt) {
      throw new BadRequestException("الحساب غير موجود أو محذوف مسبقاً");
    }
    if (user.role !== Role.CUSTOMER) {
      throw new BadRequestException("لا يمكن حذف هذا النوع من الحسابات من التطبيق");
    }

    const tombstone = `deleted_${userId}`;
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.wishlist.deleteMany({ where: { userId } }),
      this.prisma.address.updateMany({
        where: { userId },
        data: {
          fullName: "محذوف",
          phone: tombstone,
          city: "—",
          governorate: null,
          area: null,
          street: null,
          house: null,
          notes: null,
        },
      }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.deviceToken.deleteMany({ where: { userId } }),
      this.prisma.loyaltyHistory.deleteMany({ where: { userId } }),
      this.prisma.review.updateMany({
        where: { userId },
        data: { userId: null, userName: "مستخدم محذوف" },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletedAt: now,
          name: null,
          email: `${tombstone}@deleted.local`,
          phone: tombstone,
          passwordHash: null,
          avatarUrl: null,
          birthday: null,
          loyaltyPoints: 0,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
        },
      }),
    ]);

    return { success: true, message: "تم حذف الحساب بنجاح" };
  }

  private async issueTokens(
    userId: string,
    role: Role,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
    const refreshTtl = Number(process.env.JWT_REFRESH_TTL ?? 60 * 60 * 24 * 30);
    const jti = randomBytes(12).toString("hex");

    const accessToken = this.jwt.sign(
      { sub: userId, role },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "access",
        expiresIn: accessTtl,
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, role, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? "refresh",
        expiresIn: refreshTtl,
      },
    );

    const refreshHash = this.hashToken(refreshToken);
    await this.prisma.session.create({
      data: {
        userId,
        refreshHash,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
      tokenType: "Bearer",
    };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

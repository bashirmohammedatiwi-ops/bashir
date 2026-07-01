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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: Role.CUSTOMER,
      },
    });
    return this.issueTokens(user.id, user.role);
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException("Invalid credentials");
    if (!user.isActive) throw new UnauthorizedException("Account disabled");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

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
        loyaltyPoints: true,
        birthday: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { orders: true, wishlist: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    const tier =
      user.loyaltyPoints >= 3000 ? "platinum"
      : user.loyaltyPoints >= 1500 ? "gold"
      : user.loyaltyPoints >= 500 ? "silver"
      : "normal";
    return {
      ...user,
      points: user.loyaltyPoints,
      tier,
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
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
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

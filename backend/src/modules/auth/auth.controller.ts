import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.auth.login(dto, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Public()
  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@CurrentUser() user: any, @Body() dto?: RefreshDto) {
    return this.auth.logout(user.id, dto?.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: any) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto);
  }
}

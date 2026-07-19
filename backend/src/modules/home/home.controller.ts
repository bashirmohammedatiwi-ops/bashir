import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { isAdminViewRequest } from "../../common/admin-view.util";
import { Public } from "../../common/decorators/public.decorator";
import { HomeService } from "./home.service";

@ApiTags("home")
@Controller("home")
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Public()
  @Get()
  feed(@Req() req: { headers?: Record<string, unknown> }) {
    return this.home.feed({ skipCache: isAdminViewRequest(req) });
  }
}
